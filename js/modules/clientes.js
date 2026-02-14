// Carregar clientes do banco
async function loadClientes() {
    if (!supabaseClient) return;

    const lojaId = await getUserLojaId();
    if (!lojaId) {
        console.warn('⚠️ Usuário sem loja vinculada');
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('clientes')
            .select('*')
            .eq('loja_id', lojaId)
            .order('nome', { ascending: true });

        if (error) throw error;
        clientes = data || [];
        renderClientesTable();
        updateSaleClienteDropdown();
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        showNotification('Erro', 'Não foi possível carregar a base de clientes.', 'error');
    }
}

// Renderizar tabela de clientes
function renderClientesTable() {
    const tableBody = document.getElementById('clientesTable');
    if (!tableBody) return;

    const searchTerm = document.getElementById('searchClientInput').value.toLowerCase();
    const filtered = clientes.filter(c =>
        c.nome.toLowerCase().includes(searchTerm) ||
        (c.whatsapp && c.whatsapp.includes(searchTerm)) ||
        (c.cpf_cnpj && c.cpf_cnpj.includes(searchTerm))
    );

    tableBody.innerHTML = '';

    if (filtered.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">Nenhum cliente encontrado</td></tr>';
        return;
    }

    filtered.forEach(cliente => {
        const dataCadastro = new Date(cliente.criado_em).toLocaleDateString('pt-BR');
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors';
        row.innerHTML = `
            <td class="px-6 py-4">
                <div class="text-sm font-bold text-gray-900 dark:text-white">${cliente.nome}</div>
                <div class="text-[10px] text-gray-400 truncate max-w-xs">${cliente.endereco || 'Sem endereço'}</div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                <a href="https://wa.me/${cliente.whatsapp?.replace(/\D/g, '')}" target="_blank" class="hover:text-green-500 transition">
                    <i class="fab fa-whatsapp mr-1 text-green-500"></i> ${cliente.whatsapp || '-'}
                </a>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">${cliente.cpf_cnpj || '-'}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${dataCadastro}</td>
            <td class="px-6 py-4 text-sm font-medium">
                <button onclick="editCliente('${cliente.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteCliente('${cliente.id}')" class="text-rose-600 hover:text-rose-900" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Salvar/Editar Cliente
async function saveCliente(e) {
    if (e) e.preventDefault();

    const nome = document.getElementById('clientNome').value.trim();
    const whatsapp = document.getElementById('clientWhatsapp').value.trim();
    const cpf = document.getElementById('clientCpf').value.trim();
    const endereco = document.getElementById('clientEndereco').value.trim();

    if (!nome) return showNotification('Aviso', 'O nome do cliente é obrigatório.', 'warning');

    try {
        const clientData = { nome, whatsapp, cpf_cnpj: cpf, endereco };

        if (selectedClientId) {
            const { error } = await supabaseClient
                .from('clientes')
                .update(clientData)
                .eq('id', selectedClientId);
            if (error) throw error;
            showNotification('Sucesso', 'Cliente atualizado.', 'success');
        } else {
            const lojaId = await getUserLojaId();
            const { error } = await supabaseClient
                .from('clientes')
                .insert({ ...clientData, loja_id: lojaId });
            if (error) throw error;
            showNotification('Sucesso', 'Cliente cadastrado com sucesso.', 'success');
        }

        closeSidebarCliente();
        loadClientes();
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
        showNotification('Erro', 'Não foi possível salvar os dados do cliente.', 'error');
    }
}

// selectedClientId centralizado no config.js

function editCliente(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;

    selectedClientId = id;
    document.getElementById('clientSidebarTitle').textContent = 'Editar Cliente';
    document.getElementById('clientNome').value = cliente.nome;
    document.getElementById('clientWhatsapp').value = cliente.whatsapp || '';
    document.getElementById('clientCpf').value = cliente.cpf_cnpj || '';
    document.getElementById('clientEndereco').value = cliente.endereco || '';

    document.getElementById('sidebarCliente').classList.add('open');
    document.getElementById('drawerOverlay').classList.add('active');
}

async function deleteCliente(id) {
    if (!confirm('Tem certeza que deseja excluir este cliente? Isso não afetará o histórico de vendas já registradas.')) return;

    try {
        const { error } = await supabaseClient
            .from('clientes')
            .delete()
            .eq('id', id);

        if (error) throw error;
        showNotification('Excluído', 'Cliente removido da base.', 'success');
        loadClientes();
    } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        showNotification('Erro', 'Não foi possível excluir o cliente.', 'error');
    }
}

function closeSidebarCliente() {
    document.getElementById('sidebarCliente').classList.remove('open');
    document.getElementById('drawerOverlay').classList.remove('active');
    document.getElementById('clientForm').reset();
    selectedClientId = null;
    document.getElementById('clientSidebarTitle').textContent = 'Cadastrar Novo Cliente';
}

// Atualizar dropdown de clientes na venda
function updateSaleClienteDropdown() {
    const select = document.getElementById('saleCliente');
    if (!select) return;

    select.innerHTML = '<option value="">Venda Direta / Balcão</option>';
    clientes.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
    });
}

// --- MÁSCARAS E FORMATAÇÃO ---

function setupClientFormMasks() {
    const nomeInput = document.getElementById('clientNome');
    const whatsappInput = document.getElementById('clientWhatsapp');
    const cpfInput = document.getElementById('clientCpf');

    if (nomeInput) {
        nomeInput.addEventListener('input', (e) => {
            const cursorPosition = e.target.selectionStart;
            let value = e.target.value;
            value = value.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
            e.target.value = value;
            e.target.setSelectionRange(cursorPosition, cursorPosition);
        });
    }

    if (whatsappInput) {
        whatsappInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, "");
            if (value.length > 11) value = value.slice(0, 11);

            if (value.length > 10) {
                value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
            } else if (value.length > 6) {
                value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
            } else if (value.length > 2) {
                value = value.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
            } else if (value.length > 0) {
                value = value.replace(/^(\d*)/, "($1");
            }
            e.target.value = value;
        });
    }

    if (cpfInput) {
        cpfInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, "");
            if (value.length <= 11) {
                value = value.replace(/(\d{3})(\d)/, "$1.$2");
                value = value.replace(/(\d{3})(\d)/, "$1.$2");
                value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
            } else {
                if (value.length > 14) value = value.slice(0, 14);
                value = value.replace(/^(\d{2})(\d)/, "$1.$2");
                value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
                value = value.replace(/\.(\d{3})(\d)/, ".$1/$2");
                value = value.replace(/(\d{4})(\d)/, "$1-$2");
            }
            e.target.value = value;
        });
    }
}
