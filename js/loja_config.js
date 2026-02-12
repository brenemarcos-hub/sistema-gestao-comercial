// Gerenciamento de Configurações da Loja
document.addEventListener('DOMContentLoaded', () => {
    const btnOpen = document.getElementById('btnConfigLoja');
    const modal = document.getElementById('modalConfigLoja');
    const content = document.getElementById('configContent');
    const btnClose = document.getElementById('closeConfigModal');
    const btnSave = document.getElementById('saveConfigBtn');
    const btnCopy = document.getElementById('copyChaveBtn');

    if (!btnOpen) return;

    // Abrir Modal
    btnOpen.addEventListener('click', async () => {
        const lojaId = await getUserLojaId();
        if (!lojaId) return;

        // Buscar dados atuais da loja
        const { data: loja, error } = await supabaseClient
            .from('lojas')
            .select('*')
            .eq('id', lojaId)
            .single();

        if (error) {
            console.error('Erro ao buscar dados da loja:', error);
            return;
        }

        // Preencher campos
        document.getElementById('confNomeLoja').value = loja.nome;
        document.getElementById('confDescLoja').value = loja.descricao || '';
        document.getElementById('confChaveLoja').value = loja.chave_acesso;

        // Mostrar Modal
        modal.classList.replace('hidden', 'flex');
        setTimeout(() => {
            content.classList.replace('scale-95', 'scale-100');
            content.classList.replace('opacity-0', 'opacity-100');
        }, 10);
    });

    // Fechar Modal
    const closeModal = () => {
        content.classList.replace('scale-100', 'scale-95');
        content.classList.replace('opacity-100', 'opacity-0');
        setTimeout(() => modal.classList.replace('flex', 'hidden'), 300);
    };

    if (btnClose) btnClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // Copiar Chave
    if (btnCopy) {
        btnCopy.addEventListener('click', () => {
            const input = document.getElementById('confChaveLoja');
            navigator.clipboard.writeText(input.value);
            showNotification('Copiado!', 'Chave de acesso copiada para a área de transferência.', 'success');
        });
    }

    // Salvar Alterações
    if (btnSave) {
        btnSave.addEventListener('click', async () => {
            const nome = document.getElementById('confNomeLoja').value.trim();
            const desc = document.getElementById('confDescLoja').value.trim();

            if (!nome) return showNotification('Atenção', 'O nome da loja não pode ser vazio.', 'warning');

            btnSave.disabled = true;
            btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

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

            btnSave.disabled = false;
            btnSave.innerHTML = '<i class="fas fa-check"></i> Salvar Alterações';
        });
    }
});
