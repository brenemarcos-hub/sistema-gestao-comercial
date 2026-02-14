// Função Global para abrir o modal de configurações da loja
async function openStoreConfigModal() {
    const modal = document.getElementById('modalConfigLoja');
    const content = document.getElementById('configContent');

    if (!modal) return;

    try {
        const lojaId = await getUserLojaId();
        if (!lojaId) {
            showNotification('Erro', 'Não foi possível identificar sua loja.', 'error');
            return;
        }

        // Buscar dados atuais da loja
        const { data: loja, error } = await supabaseClient
            .from('lojas')
            .select('*')
            .eq('id', lojaId)
            .single();

        if (error) {
            console.error('Erro ao buscar dados da loja:', error);
            showNotification('Erro', 'Falha ao carregar dados da loja.', 'error');
            return;
        }

        // Preencher campos
        if (document.getElementById('confNomeLoja')) document.getElementById('confNomeLoja').value = loja.nome;
        if (document.getElementById('confDescLoja')) document.getElementById('confDescLoja').value = loja.descricao || '';
        if (document.getElementById('confChaveLoja')) document.getElementById('confChaveLoja').value = loja.chave_acesso;

        // Mostrar Modal
        modal.classList.replace('hidden', 'flex');
        setTimeout(() => {
            if (content) {
                content.classList.replace('scale-95', 'scale-100');
                content.classList.replace('opacity-0', 'opacity-100');
            }
        }, 10);
    } catch (err) {
        console.error('Erro ao abrir modal de config:', err);
    }
}

// Tornar global
window.openStoreConfigModal = openStoreConfigModal;

// Gerenciamento de Configurações da Loja
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modalConfigLoja');
    const content = document.getElementById('configContent');
    const btnClose = document.getElementById('closeConfigModal');
    const btnSave = document.getElementById('saveConfigBtn');
    const btnCopy = document.getElementById('copyChaveBtn');

    // Fechar Modal
    const closeModal = () => {
        if (!content || !modal) return;
        content.classList.replace('scale-100', 'scale-95');
        content.classList.replace('opacity-100', 'opacity-0');
        setTimeout(() => modal.classList.replace('flex', 'hidden'), 300);
    };

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // Copiar Chave
    if (btnCopy) {
        btnCopy.addEventListener('click', () => {
            const input = document.getElementById('confChaveLoja');
            if (input && input.value) {
                navigator.clipboard.writeText(input.value);
                showNotification('Copiado!', 'Chave de acesso copiada.', 'success');
            }
        });
    }

    // Salvar Alterações
    if (btnSave) {
        btnSave.addEventListener('click', async () => {
            const nomeEl = document.getElementById('confNomeLoja');
            const descEl = document.getElementById('confDescLoja');

            if (!nomeEl) return;
            const nome = nomeEl.value.trim();
            const desc = descEl ? descEl.value.trim() : '';

            if (!nome) return showNotification('Atenção', 'O nome da loja não pode ser vazio.', 'warning');

            btnSave.disabled = true;
            const originalHTML = btnSave.innerHTML;
            btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

            try {
                const lojaId = await getUserLojaId();
                const { error } = await supabaseClient
                    .from('lojas')
                    .update({ nome, descricao: desc })
                    .eq('id', lojaId);

                if (error) {
                    showNotification('Erro', 'Não foi possível salvar as alterações.', 'error');
                } else {
                    showNotification('Sucesso', 'Configurações da loja atualizadas!', 'success');
                    if (typeof updateStoreHeader === 'function') await updateStoreHeader();
                    closeModal();
                }
            } catch (err) {
                console.error(err);
                showNotification('Erro', 'Falha ao salvar.', 'error');
            } finally {
                btnSave.disabled = false;
                btnSave.innerHTML = originalHTML;
            }
        });
    }
});
