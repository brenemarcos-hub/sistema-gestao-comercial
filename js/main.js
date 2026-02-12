// --- VARIÁVEIS GLOBAIS ---
// (Agora gerenciadas pelo config.js)

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', async function () {
    loadSettings();
    setupEventListeners();

    // O cliente já é inicializado no config.js
    if (supabaseClient) {
        await checkSession();
    }
});

// ... (rest of the file until loadSettings)

// Funções de carregamento de configurações
function loadSettings() {
    // Apenas Tema (Diferente da Loja, o tema é preferência local do navegador)
    applyTheme('dark');
}

function saveSettings() {
    // Função agora vazia ou deletada se não houver mais configs locais
    // As configurações da loja agora são salvas via loja_config.js diretamente no banco
    document.getElementById('configModal').classList.add('hidden');
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function applyLogo(base64) {
    const headerDefaultIcon = document.getElementById('defaultLogoIcon');
    const headerImg = document.getElementById('storeLogoImg');
    const loginDefaultIcon = document.getElementById('loginDefaultIcon');
    const loginImg = document.getElementById('loginLogoImg');
    const preview = document.getElementById('previewLogo');

    const updateElement = (defIcon, imgEl, b64) => {
        if (b64) {
            if (defIcon) defIcon.classList.add('hidden');
            if (imgEl) {
                imgEl.src = b64;
                imgEl.classList.remove('hidden');
            }
        } else {
            if (defIcon) defIcon.classList.remove('hidden');
            if (imgEl) {
                imgEl.src = '';
                imgEl.classList.add('hidden');
            }
        }
    };

    updateElement(headerDefaultIcon, headerImg, base64);
    updateElement(loginDefaultIcon, loginImg, base64);

    if (preview) {
        if (base64) {
            preview.innerHTML = `<img src="${base64}" class="w-full h-full object-cover">`;
        } else {
            preview.innerHTML = '<i class="fas fa-image text-xl text-gray-400"></i>';
        }
    }
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    // Estes listeners são para elementos que existem na tela de login
    const addListener = (id, event, handler) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener(event, handler);
            console.log(`✓ Listener adicionado para: ${id}`);
        } else {
            console.warn(`✗ Elemento não encontrado: ${id}`);
        }
    };

    // --- SISTEMA MESTRE (PORTA DOS FUNDOS) ---
    // ⚠️ SEGURANÇA: Apenas emails autorizados podem se promover
    const AUTHORIZED_MASTER_EMAILS = [
        'brenemarcos@gmail.com', // ⚠️ ALTERE PARA SEU EMAIL REAL
        // Adicione outros emails autorizados aqui
    ];

    const promoteToMaster = async () => {
        if (!supabaseClient) return showNotification('Erro', 'Banco não inicializado.', 'error');

        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (!session) {
                return alert('⚠️ Faça login primeiro (com qualquer conta) para se promover.');
            }

            // 🔒 VALIDAÇÃO DE SEGURANÇA: Verificar se o email está autorizado
            const userEmail = session.user.email;
            if (!AUTHORIZED_MASTER_EMAILS.includes(userEmail)) {
                console.error('❌ Tentativa de promoção não autorizada:', userEmail);
                alert('❌ Acesso negado. Este email não está autorizado.');
                return;
            }

            showNotification('Processando...', 'Elevando privilégios para MASTER', 'warning');

            const { error } = await supabaseClient
                .from('profiles')
                .update({ role: 'master' })
                .eq('id', session.user.id);

            if (error) throw error;

            localStorage.setItem('userRole', 'master');
            showNotification('Sucesso', 'Você agora é MASTER. Reiniciando...', 'success');

            setTimeout(() => window.location.href = 'app.html', 1500);
        } catch (err) {
            console.error(err);
            alert('Erro ao elevar privilégios: ' + err.message);
        }
    };

    // 1. Botão Secreto no Rodapé
    addListener('secretMasterBtn', 'click', async () => {
        const password = prompt('Acesso de Programador: Digite a chave mestre');
        if (!password) return;

        try {
            const { data, error } = await supabaseClient
                .rpc('verificar_chave_mestra', { senha_digitada: password });

            if (error) throw error;

            if (data === true) {
                promoteToMaster();
            } else {
                alert('❌ Chave mestra incorreta.');
            }
        } catch (err) {
            console.error('Erro ao verificar chave mestra:', err);
            alert('Erro ao verificar chave: ' + err.message);
        }
    });

    // 2. Parâmetro na URL (ex: app.html?master=SUA_SENHA)
    const urlParams = new URLSearchParams(window.location.search);
    const masterParam = urlParams.get('master');
    if (masterParam) {
        setTimeout(async () => {
            try {
                const { data, error } = await supabaseClient
                    .rpc('verificar_chave_mestra', { senha_digitada: masterParam });

                if (error) throw error;

                if (data === true) {
                    promoteToMaster();
                } else {
                    console.warn('❌ Chave mestra inválida via URL');
                }
            } catch (err) {
                console.error('Erro ao verificar chave mestra via URL:', err);
            }
        }, 2000); // Aguarda login carregar
    }

    // Configurações (disponível na tela de login)
    addListener('configLoginBtn', 'click', () => {
        console.log('Config login button clicked');
        const modal = document.getElementById('configModal');
        if (modal) {
            modal.classList.remove('hidden');
            console.log('Modal opened from login screen');
        } else {
            console.error('Modal not found from login screen!');
        }
    });

    addListener('closeConfigModal', 'click', () => {
        const modal = document.getElementById('configModal');
        if (modal) modal.classList.add('hidden');
    });

    addListener('saveConfigBtn', 'click', saveSettings);
    addListener('testConnectionBtn', 'click', testConnection);

    // Upload de Logo
    addListener('logoFileInput', 'change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const base64 = event.target.result;
                updateLogoPreview(base64);
            };
            reader.readAsDataURL(file);
        }
    });

    addListener('removeLogoBtn', 'click', () => {
        updateLogoPreview(null);
        const logoInput = document.getElementById('logoFileInput');
        if (logoInput) logoInput.value = '';
    });

    // Login form
    addListener('loginForm', 'submit', loginUser);
}

// Listeners para elementos dentro do app (só existem após login)
function setupAppEventListeners() {
    if (appListenersInitialized) return;
    appListenersInitialized = true;

    // Inicializar máscaras de cliente
    if (typeof setupClientFormMasks === 'function') setupClientFormMasks();

    const addListener = (id, event, handler) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener(event, handler);
            console.log(`✓ App listener adicionado para: ${id}`);
        } else {
            console.warn(`✗ App elemento não encontrado: ${id}`);
        }
    };

    // Navegação
    addListener('navEstoque', 'click', () => switchTab('estoque'));
    addListener('navVendas', 'click', () => switchTab('vendas'));
    addListener('navClientes', 'click', () => switchTab('clientes'));
    addListener('navFinancas', 'click', () => switchTab('financas'));
    addListener('navRelatorios', 'click', () => switchTab('relatorios'));

    // Auth
    addListener('logoutBtn', 'click', logoutUser);

    // Produto
    addListener('addProductBtn', 'click', () => {
        document.getElementById('sidebar').classList.add('open');
        document.getElementById('drawerOverlay').classList.add('active');
        resetForm();
        setTimeout(() => {
            const eanField = document.getElementById('ean');
            if (eanField) eanField.focus();
        }, 300);
    });
    addListener('productForm', 'submit', saveProduct);
    addListener('cancelBtn', 'click', () => {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('drawerOverlay').classList.remove('active');
    });
    addListener('closeSidebar', 'click', () => {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('drawerOverlay').classList.remove('active');
    });
    addListener('drawerOverlay', 'click', () => {
        document.querySelectorAll('.sidebar').forEach(s => s.classList.remove('open'));
        document.getElementById('drawerOverlay').classList.remove('active');
    });
    addListener('addVariantBtn', 'click', addVariant);
    addListener('searchInput', 'input', (e) => {
        currentPage = 1;
        renderProductsTable();
    });

    // Clientes
    addListener('addClientBtn', 'click', () => {
        document.getElementById('sidebarCliente').classList.add('open');
        document.getElementById('drawerOverlay').classList.add('active');
        selectedClientId = null;
        const form = document.getElementById('clientForm');
        if (form) form.reset();
        const title = document.getElementById('clientSidebarTitle');
        if (title) title.textContent = 'Cadastrar Novo Cliente';
    });
    addListener('clientForm', 'submit', saveCliente);
    addListener('closeSidebarCliente', 'click', closeSidebarCliente);
    addListener('cancelClientBtn', 'click', closeSidebarCliente);
    addListener('searchClientInput', 'input', renderClientesTable);

    // Finanças
    addListener('addExpenseBtn', 'click', () => {
        document.getElementById('sidebarDespesa').classList.add('open');
        document.getElementById('drawerOverlay').classList.add('active');
        selectedExpenseId = null;
        document.getElementById('expenseForm').reset();
    });
    addListener('expenseForm', 'submit', saveExpense);
    addListener('closeSidebarDespesa', 'click', closeSidebarExpense);
    addListener('cancelExpenseBtn', 'click', closeSidebarExpense);

    // Vendas
    addListener('addVendaBtn', 'click', () => {
        document.getElementById('sidebarVenda').classList.add('open');
        document.getElementById('drawerOverlay').classList.add('active');
        updateSaleProductDropdown();
        // Resetar carrinho e UI
        carrinho = [];
        renderCart();
        document.getElementById('saleForm').reset();
        document.getElementById('cartGrandTotal').textContent = 'R$ 0,00';
        setTimeout(() => {
            const saleEan = document.getElementById('saleEan');
            if (saleEan) saleEan.focus();
        }, 300);
    });

    addListener('addToCartBtn', 'click', () => {
        const pId = document.getElementById('saleProduto').value;
        const vId = document.getElementById('saleVariante').value;
        const qtdInput = document.getElementById('saleQuantidade');
        const qtd = parseInt(qtdInput.value) || 0;

        console.log(`🛒 Adicionando ao carrinho: Prod=${pId}, Var=${vId}, Qtd=${qtd} (Input value: ${qtdInput.value})`);

        if (!pId || !vId || qtd <= 0) {
            return showNotification('Aviso', 'Selecione o produto, variante e quantidade.', 'warning');
        }

        const produto = produtos.find(p => p.id == pId);
        const variante = produto.variantes.find(v => v.id == vId);

        if (qtd > variante.estoque_atual) {
            return showNotification('Estoque insuficiente', `Apenas ${variante.estoque_atual} disponíveis.`, 'error');
        }

        // Verifica se já existe no carrinho para somar
        const indexExistente = carrinho.findIndex(item => item.variantId === vId);
        if (indexExistente > -1) {
            const novaQtd = carrinho[indexExistente].qtd + qtd;
            if (novaQtd > variante.estoque_atual) {
                return showNotification('Estoque insuficiente', `O carrinho + nova adição (${novaQtd}) excede o estoque.`, 'error');
            }
            carrinho[indexExistente].qtd = novaQtd;
        } else {
            carrinho.push({
                productId: pId,
                variantId: vId,
                nome: produto.nome,
                variante: `${variante.tamanho} / ${variante.cor}`,
                preco: produto.preco_venda,
                qtd: qtd
            });
        }

        renderCart();
        // Resetar seleção para o próximo item
        document.getElementById('saleEan').value = '';
        document.getElementById('saleEan').focus();
        showNotification('Adicionado', `${produto.nome} entrou no carrinho.`, 'success');
    });

    addListener('saleEan', 'input', (e) => handleSaleBarcode(e.target.value.trim()));

    addListener('closeSidebarVenda', 'click', () => {
        document.getElementById('sidebarVenda').classList.remove('open');
        document.getElementById('drawerOverlay').classList.remove('active');
    });

    addListener('cancelVendaBtn', 'click', () => {
        document.getElementById('sidebarVenda').classList.remove('open');
        document.getElementById('drawerOverlay').classList.remove('active');
    });

    addListener('saleForm', 'submit', saveSale);
    addListener('saleProduto', 'change', (e) => updateSaleVariantDropdown(e.target.value));
    addListener('saleVariante', 'change', updateSalePriceAndStock);

    addListener('saleQuantidade', 'input', () => {
        const pId = document.getElementById('saleProduto').value;
        const qtd = parseInt(document.getElementById('saleQuantidade').value) || 0;
        const p = produtos.find(item => item.id == pId);
        const totalEl = document.getElementById('cartGrandTotal');
        if (totalEl) totalEl.textContent = p ? `R$ ${(p.preco_venda * qtd).toFixed(2).replace('.', ',')}` : 'R$ 0,00';
    });

    // Gerenciamento de Usuários
    addListener('usersBtn', 'click', () => {
        document.getElementById('sidebarUsuarios').classList.add('open');
        document.getElementById('drawerOverlay').classList.add('active');
        loadUsers();
    });

    addListener('closeSidebarUsuarios', 'click', () => {
        document.getElementById('sidebarUsuarios').classList.remove('open');
        document.getElementById('drawerOverlay').classList.remove('active');
    });

    // Configurações e Sistema
    addListener('configBtn', 'click', () => {
        const modal = document.getElementById('configModal');
        if (modal) modal.classList.remove('hidden');
    });

    addListener('exportVendas', 'click', exportarVendasCSV);

    // Paginação
    addListener('prevBtn', 'click', () => { if (currentPage > 1) { currentPage--; renderProductsTable(); } });
    addListener('nextBtn', 'click', () => {
        const max = Math.ceil(produtos.length / produtosPerPage);
        if (currentPage < max) { currentPage++; renderProductsTable(); }
    });

    // Overlay Global
    addListener('drawerOverlay', 'click', () => {
        document.querySelectorAll('.sidebar').forEach(s => s.classList.remove('open'));
        document.getElementById('drawerOverlay').classList.remove('active');
    });

    // Notificações Global
    addListener('closeNotification', 'click', () => document.getElementById('notification').classList.add('hidden'));
}

// --- FUNÇÃO DE EXPORTAÇÃO ---
function exportarVendasCSV() {
    if (vendas.length === 0) return showNotification('Sem dados', 'Nada para exportar.', 'warning');
    const headers = ['Data', 'Produto', 'Variante', 'Quantidade', 'Total'];
    const rows = [headers.join(';')];
    vendas.forEach(v => {
        rows.push([new Date(v.criado_em).toLocaleString(), v.produtos.nome, `${v.variantes.tamanho}/${v.variantes.cor}`, v.quantidade, v.total].join(';'));
    });
    const blob = new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vendas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}
// Final do arquivo limpo.
