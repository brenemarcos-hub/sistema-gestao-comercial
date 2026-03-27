// Instância do Gráfico de Finanças
let chartFinCategorias = null;

// Carregar despesas do banco
async function loadExpenses() {
    if (!supabaseClient) return;

    const lojaId = await getUserLojaId();
    if (!lojaId) {
        console.warn('⚠️ Usuário sem loja vinculada');
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('despesas')
            .select('*')
            .eq('loja_id', lojaId)
            .order('data_vencimento', { ascending: false });

        if (error) throw error;
        despesas = data || [];
        renderExpensesTable();
        updateFinancialDashboard();
    } catch (error) {
        console.error('Erro ao carregar despesas:', error);
    }
}

// Renderizar tabela de despesas
function renderExpensesTable() {
    const tableBody = document.getElementById('expensesTable');
    if (!tableBody) return;

    const statusFilter = document.getElementById('finStatusFilter')?.value || 'todos';
    const categoriaFilter = document.getElementById('finCategoriaFilter')?.value || 'todas';
    const periodoFilter = document.getElementById('finPeriodo')?.value || 'mes';

    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    
    let filtered = despesas.filter(item => {
        // Filtro de Status
        if (statusFilter !== 'todos' && (item.pago ? 'pago' : 'pendente') !== statusFilter) return false;
        
        // Filtro de Categoria
        if (categoriaFilter !== 'todas' && item.categoria !== categoriaFilter) return false;

        // Filtro de Período (Pela data de vencimento ou criação)
        const dataItem = item.data_vencimento ? new Date(item.data_vencimento) : new Date(item.criado_em);
        if (periodoFilter === 'hoje') {
            return dataItem.toDateString() === agora.toDateString();
        } else if (periodoFilter === 'mes') {
            return dataItem.getMonth() === agora.getMonth() && dataItem.getFullYear() === agora.getFullYear();
        } else if (periodoFilter === '7d') {
            const seteDias = new Date(hoje);
            seteDias.setDate(seteDias.getDate() - 7);
            return dataItem >= seteDias;
        } else if (periodoFilter === '30d') {
            const trintaDias = new Date(hoje);
            trintaDias.setDate(trintaDias.getDate() - 30);
            return dataItem >= trintaDias;
        }
        
        return true;
    });

    tableBody.innerHTML = '';

    if (filtered.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">Nenhuma despesa encontrada para estes filtros</td></tr>';
        return;
    }

    filtered.forEach(item => {
        const dataVenc = item.data_vencimento ? new Date(item.data_vencimento).toLocaleDateString('pt-BR') : '-';
        const valorFormat = item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors';
        row.innerHTML = `
            <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">${item.descricao}</td>
            <td class="px-6 py-4 text-sm text-gray-500 italic">${item.categoria || 'Outros'}</td>
            <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-bold">${valorFormat}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${dataVenc}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-[10px] font-bold rounded-full ${item.pago ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} uppercase">
                    ${item.pago ? 'PAGO' : 'PENDENTE'}
                </span>
            </td>
            <td class="px-6 py-4 text-sm font-medium">
                <button onclick="editExpense('${item.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3"><i class="fas fa-edit"></i></button>
                <button onclick="deleteExpense('${item.id}')" class="text-rose-600 hover:text-rose-900"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Salvar/Editar Despesa
async function saveExpense(e) {
    if (e) e.preventDefault();

    const descricao = document.getElementById('expenseDesc').value.trim();
    const valor = parseFloat(document.getElementById('expenseValor').value) || 0;
    const data_vencimento = document.getElementById('expenseVencimento').value || null;
    const categoria = document.getElementById('expenseCategoria').value;
    const statusValue = document.getElementById('expenseStatus').value;
    const pago = statusValue === 'pago';

    if (!descricao || valor <= 0 || !categoria) return showNotification('Aviso', 'Preencha descrição, valor e categoria.', 'warning');

    try {
        const lojaId = await getUserLojaId();
        const expenseData = { descricao, valor, data_vencimento, categoria, pago };

        if (selectedExpenseId) {
            const { error } = await supabaseClient.from('despesas').update(expenseData).eq('id', selectedExpenseId);
            if (error) throw error;
            showNotification('Sucesso', 'Despesa atualizada.', 'success');

            // Registrar Ação: Edição
            registrarAcao(null, null, 'editou_despesa', 'despesa', selectedExpenseId, { descricao: descricao });
        } else {
            const { data: newD, error } = await supabaseClient.from('despesas').insert({ ...expenseData, loja_id: lojaId }).select().single();
            if (error) throw error;
            showNotification('Sucesso', 'Despesa registrada.', 'success');

            // Registrar Ação: Criação
            registrarAcao(null, null, 'criou_despesa', 'despesa', newD.id, { descricao: descricao });
        }

        closeSidebarExpense();
        loadExpenses();
    } catch (error) {
        console.error('Erro ao salvar despesa:', error);
        capturarErro(error, { funcao: 'saveExpense', descricao: descricao });
        showNotification('Erro', 'Erro ao salvar despesa.', 'error');
    }
}

function editExpense(id) {
    const item = despesas.find(d => d.id === id);
    if (!item) return;

    selectedExpenseId = id;
    document.getElementById('expenseSidebarTitle').textContent = 'Editar Despesa';
    document.getElementById('expenseDesc').value = item.descricao;
    document.getElementById('expenseValor').value = item.valor;
    document.getElementById('expenseVencimento').value = item.data_vencimento || '';
    document.getElementById('expenseCategoria').value = item.categoria || '';
    document.getElementById('expenseStatus').value = item.pago ? 'pago' : 'pendente';

    document.getElementById('sidebarDespesa').classList.add('open');
    document.getElementById('drawerOverlay').classList.add('active');
}

async function deleteExpense(id) {
    if (!confirm('Excluir esta despesa?')) return;
    try {
        await supabaseClient.from('despesas').delete().eq('id', id);
        showNotification('Sucesso', 'Despesa excluída.', 'success');
        loadExpenses();
    } catch (error) {
        capturarErro(error, { funcao: 'deleteExpense', id: id });
        showNotification('Erro', 'Não foi possível excluir.', 'error');
    }
}

function closeSidebarExpense() {
    document.getElementById('sidebarDespesa').classList.remove('open');
    document.getElementById('drawerOverlay').classList.remove('active');
    document.getElementById('expenseForm').reset();
    selectedExpenseId = null;
    document.getElementById('expenseSidebarTitle').textContent = 'Lançar Nova Despesa';
}

// Atualizar Dashboard Financeiro
async function updateFinancialDashboard() {
    if (!vendas || !produtos) return;

    const periodoFilter = document.getElementById('finPeriodo')?.value || 'mes';
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

    // Função auxiliar para filtrar por período
    const isNoPeriodo = (dataStr) => {
        const data = new Date(dataStr);
        if (periodoFilter === 'hoje') return data.toDateString() === agora.toDateString();
        if (periodoFilter === 'mes') return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
        if (periodoFilter === '7d') {
            const limite = new Date(hoje);
            limite.setDate(limite.getDate() - 7);
            return data >= limite;
        }
        if (periodoFilter === '30d') {
            const limite = new Date(hoje);
            limite.setDate(limite.getDate() - 30);
            return data >= limite;
        }
        return true; // tudo
    };

    let receitaBruta = 0;
    let custoProdutos = 0;
    let totalDespesas = 0;
    const categoriasMapa = {};

    // 1. Receita e CMV (Cost of Goods Sold)
    vendas.forEach(v => {
        if (!isNoPeriodo(v.criado_em)) return;

        receitaBruta += parseFloat(v.total) || 0;

        const prod = produtos.find(p => p.id == v.id_produto);
        if (prod) {
            const variant = prod.variantes.find(varItem => varItem.id == v.id_variante);
            const custo = parseFloat(variant?.custo_unitario) || (parseFloat(prod.preco_venda) * 0.7);
            custoProdutos += custo * v.quantidade;
        }
    });

    // 2. Despesas Gerenciais
    despesas.forEach(d => {
        const dataItem = d.data_vencimento ? new Date(d.data_vencimento) : new Date(d.criado_em);
        if (!isNoPeriodo(dataItem)) return;

        totalDespesas += parseFloat(d.valor) || 0;
        
        // Mapa para o gráfico
        const cat = d.categoria || 'Outros';
        categoriasMapa[cat] = (categoriasMapa[cat] || 0) + parseFloat(d.valor);
    });

    const lucroLiquido = receitaBruta - custoProdutos - totalDespesas;

    // Atualiza Widgets
    const setElText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setElText('finReceitaTotal', receitaBruta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    setElText('finDespesasTotal', (custoProdutos + totalDespesas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    setElText('finLucroLiquido', lucroLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    setElText('finTotalExpensesFormatted', totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

    const lucroEl = document.getElementById('finLucroLiquido');
    if (lucroEl) {
        lucroEl.className = `text-2xl font-black ${lucroLiquido >= 0 ? 'text-emerald-600' : 'text-rose-600'}`;
    }

    renderFinanceCharts(categoriasMapa);
}

function renderFinanceCharts(categoriasMapa) {
    const ctx = document.getElementById('chartFinCategorias');
    if (!ctx) return;

    const labels = Object.keys(categoriasMapa);
    const values = Object.values(categoriasMapa);

    if (chartFinCategorias) chartFinCategorias.destroy();

    if (labels.length === 0) {
        // Se não houver dados, limpa o canvas (ou desenha algo vazio)
        return;
    }

    chartFinCategorias = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', 
                    '#ec4899', '#06b6d4', '#f97316', '#64748b'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { size: 11 }
                    }
                }
            },
            cutout: '70%'
        }
    });
}
