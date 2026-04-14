// Carregar clientes do banco
async function loadClientes(forceRefresh = false) {
    if (!supabaseClient) return;

    const lojaId = await getUserLojaId();
    if (!lojaId) {
        console.warn('⚠️ Usuário sem loja vinculada');
        return;
    }

    // Tentar carregar do cache primeiro
    if (!forceRefresh) {
        const cached = typeof getFromCache === 'function' ? getFromCache(`clientes_${lojaId}`) : null;
        if (cached) {
            clientes = cached;
            renderClientesTable();
            updateSaleClienteDropdown();
            return;
        }
    }

    try {
        console.log('📡 Buscando clientes do banco de dados...');
        const { data, error } = await supabaseClient
            .from('clientes')
            .select('*')
            .eq('loja_id', lojaId)
            .order('nome', { ascending: true });

        if (error) throw error;
        clientes = data || [];
        
        // Salvar no cache
        if (typeof saveToCache === 'function') saveToCache(`clientes_${lojaId}`, clientes);

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
        tableBody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-500">Nenhum cliente encontrado</td></tr>';
        return;
    }
    filtered.forEach(cliente => {
        // Calcular Status Financeiro (Dívidas)
        const dividas = vendas.filter(v => (v.id_cliente === cliente.id || v.cliente_id === cliente.id) && v.status_pagamento === 'pendente');
        const totalDevendo = dividas.reduce((acc, v) => acc + (parseFloat(v.total) || 0), 0);
        const dataProximoPay = dividas.filter(v => v.data_proximo).sort((a,b) => new Date(a.data_proximo) - new Date(b.data_proximo))[0]?.data_proximo;

        const dataCadastro = new Date(cliente.criado_em).toLocaleDateString('pt-BR');
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors';
        row.innerHTML = `
            <td class="px-6 py-4" data-label="Cliente">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 hidden md:flex">
                        <i class="fas fa-user text-xs"></i>
                    </div>
                    <div>
                        <div class="text-sm font-bold text-gray-900 dark:text-white">${cliente.nome}</div>
                        <div class="text-[10px] text-gray-400 truncate max-w-[150px]">${cliente.endereco || 'Sem endereço'}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4" data-label="Financeiro">
                 ${totalDevendo > 0 ? `
                        <div class="flex flex-col">
                            <span class="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-200 inline-block">
                                R$ ${totalDevendo.toFixed(2).replace('.', ',')}
                            </span>
                            ${dataProximoPay ? `<span class="text-[9px] text-rose-500 font-bold mt-1">Vence: ${new Date(dataProximoPay + 'T12:00:00').toLocaleDateString('pt-BR')}</span>` : ''}
                        </div>
                    ` : `
                        <span class="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full">EM DIA</span>
                    `}
            </td>
            <td class="px-6 py-4" data-label="WhatsApp">
                <a href="https://wa.me/${cliente.whatsapp?.replace(/\D/g, '')}" target="_blank" class="text-sm text-gray-600 dark:text-gray-300 hover:text-green-500 flex items-center gap-1">
                    <i class="fab fa-whatsapp text-green-500"></i> ${cliente.whatsapp || '-'}
                </a>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300" data-label="Aniversário">
                ${cliente.data_aniversario ? `<span class="flex items-center gap-1"><i class="fas fa-birthday-cake text-amber-500"></i> ${cliente.data_aniversario}</span>` : '-'}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500" data-label="CPF/CNPJ">${cliente.cpf_cnpj || '-'}</td>
            <td class="px-6 py-4 text-sm text-gray-500" data-label="Cadastro">${dataCadastro}</td>
            <td class="px-6 py-4 text-sm font-medium" data-label="Ações">
                <div class="flex items-center gap-3">
                    <button onclick="openClientHistory('${cliente.id}')" class="text-amber-600 hover:text-amber-900" title="Histórico">
                        <i class="fas fa-history"></i>
                    </button>
                    <button onclick="editCliente('${cliente.id}')" class="text-indigo-600 hover:text-indigo-900" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteCliente('${cliente.id}')" class="text-rose-600 hover:text-rose-900" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
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
    const aniversario = document.getElementById('clientAniversario').value.trim();
    const cpf = document.getElementById('clientCpf').value.trim();
    const endereco = document.getElementById('clientEndereco').value.trim();

    if (!nome) return showNotification('Aviso', 'O nome do cliente é obrigatório.', 'warning');

    try {
        const clientData = { nome, whatsapp, data_aniversario: aniversario, cpf_cnpj: cpf, endereco };

        if (selectedClientId) {
            const { error } = await supabaseClient
                .from('clientes')
                .update(clientData)
                .eq('id', selectedClientId);
            if (error) throw error;
            showNotification('Sucesso', 'Cliente atualizado.', 'success');

            // Registrar Ação: Edição
            registrarAcao(null, null, 'editou_cliente', 'cliente', selectedClientId, { nome: nome });
        } else {
            const lojaId = await getUserLojaId();
            const { data: newC, error } = await supabaseClient
                .from('clientes')
                .insert({ ...clientData, loja_id: lojaId })
                .select()
                .single();
            if (error) throw error;
            showNotification('Sucesso', 'Cliente cadastrado com sucesso.', 'success');

            // Registrar Ação: Criação
            registrarAcao(null, null, 'criou_cliente', 'cliente', newC.id, { nome: nome });
        }

        closeSidebarCliente();
        loadClientes(true);
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
        capturarErro(error, { funcao: 'saveCliente', nome: nome });
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
    document.getElementById('clientAniversario').value = cliente.data_aniversario || '';
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
        
        // Registrar Ação: Exclusão
        registrarAcao(null, null, 'excluiu_cliente', 'cliente', id);

        loadClientes(true);
    } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        capturarErro(error, { funcao: 'deleteCliente', clienteId: id });
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

// Histórico de Compras do Cliente
function openClientHistory(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;

    const modal = document.getElementById('clientHistoryModal');
    const tableBody = document.getElementById('clientHistoryTableBody');
    const nameEl = document.getElementById('historyClientName');
    const summaryEl = document.getElementById('historyClientSummary');
    const totalEl = document.getElementById('historyClientTotal');

    if (!modal || !tableBody) return;

    nameEl.textContent = `Compras de ${cliente.nome}`;
    
    // Filtro flexível para evitar erros de tipo e nome de coluna
    const compras = vendas.filter(v => (v.id_cliente == id || v.cliente_id == id));
    let totalGeral = 0;

    tableBody.innerHTML = '';
    if (compras.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-gray-500">Nenhuma compra registrada para este cliente.</td></tr>';
    } else {
        compras.forEach(v => {
            const valorVenda = parseFloat(v.total) || 0;
            totalGeral += valorVenda;
            
            // Garantir que temos os dados do produto, mesmo que parciais
            const nomeProd = v.produtos?.nome || 'Produto Removido';
            const infoVar = `${v.variantes?.tamanho || '-'} / ${v.variantes?.cor || '-'}`;
            
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors';
            row.innerHTML = `
                <td class="p-4 text-sm text-gray-500">${new Date(v.criado_em).toLocaleDateString('pt-BR')}</td>
                <td class="p-4">
                    <div class="text-sm font-bold text-gray-900 dark:text-white">${nomeProd}</div>
                    <div class="text-[10px] text-gray-400 capitalize">${infoVar}</div>
                </td>
                <td class="p-4 text-sm">${v.quantidade}</td>
                <td class="p-4 text-sm font-bold text-indigo-600">R$ ${valorVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td class="p-4">
                    <span class="px-2 py-1 text-[10px] font-bold rounded-full 
                    ${v.status_pagamento === 'pago' ? 'bg-emerald-100 text-emerald-700' : 
                      v.status_pagamento === 'pago (atrasado)' ? 'bg-blue-100 text-blue-700' : 
                      'bg-amber-100 text-amber-700'} uppercase">
                        ${v.status_pagamento || 'pago'}
                    </span>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    summaryEl.textContent = `${compras.length} pedido(s) realizados desde o cadastro.`;
    totalEl.textContent = totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    modal.classList.remove('hidden');
}

window.openClientHistory = openClientHistory;

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
    const aniversarioInput = document.getElementById('clientAniversario');
    const cpfInput = document.getElementById('clientCpf');
    
    // Máscara Aniversário (DD/MM/AAAA)
    if (aniversarioInput) {
        aniversarioInput.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '').slice(0, 8);
            if (v.length >= 5) {
                v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
            } else if (v.length >= 3) {
                v = `${v.slice(0, 2)}/${v.slice(2)}`;
            }
            e.target.value = v;
        });
    }

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
