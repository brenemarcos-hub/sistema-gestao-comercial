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

    tableBody.innerHTML = '';

    if (despesas.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">Nenhuma despesa registrada</td></tr>';
        return;
    }

    despesas.forEach(item => {
        const dataVenc = item.data_vencimento ? new Date(item.data_vencimento).toLocaleDateString('pt-BR') : '-';
        const valorFormat = item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors';
        row.innerHTML = `
            <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">${item.descricao}</td>
            <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">${valorFormat}</td>
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
    const statusValue = document.getElementById('expenseStatus').value;
    const pago = statusValue === 'pago';

    if (!descricao || valor <= 0) return showNotification('Aviso', 'Preencha descrição e valor corretamente.', 'warning');

    try {
        const expenseData = { descricao, valor, data_vencimento, pago };

        if (selectedExpenseId) {
            const { error } = await supabaseClient.from('despesas').update(expenseData).eq('id', selectedExpenseId);
            if (error) throw error;
            showNotification('Sucesso', 'Despesa atualizada.', 'success');
        } else {
            const lojaId = await getUserLojaId();
            const { error } = await supabaseClient.from('despesas').insert({ ...expenseData, loja_id: lojaId });
            if (error) throw error;
            showNotification('Sucesso', 'Despesa registrada.', 'success');
        }

        closeSidebarExpense();
        loadExpenses();
    } catch (error) {
        console.error('Erro ao salvar despesa:', error);
        showNotification('Erro', 'Erro ao salvar despesa.', 'error');
    }
}

// selectedExpenseId centralizado no config.js

function editExpense(id) {
    const item = despesas.find(d => d.id === id);
    if (!item) return;

    selectedExpenseId = id;
    document.getElementById('expenseSidebarTitle').textContent = 'Editar Despesa';
    document.getElementById('expenseDesc').value = item.descricao;
    document.getElementById('expenseValor').value = item.valor;
    document.getElementById('expenseVencimento').value = item.data_vencimento || '';
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
    if (!vendas.length || !produtos.length) return;

    let receitaBruta = 0;
    let custoProdutos = 0;
    let totalDespesas = 0;

    // Cálculo de Receita e Custo de Produtos vendidos
    vendas.forEach(venda => {
        receitaBruta += venda.total;

        // Tentar encontrar o custo da variante no momento (ideal seria ter snapshotted na venda)
        const produto = produtos.find(p => p.id === venda.id_produto);
        if (produto) {
            const variante = produto.variantes.find(v => v.id === venda.id_variante);
            if (variante) {
                custoProdutos += (variante.custo_unitario || 0) * venda.quantidade;
            }
        }
    });

    // Cálculo de Despesas Fixas/Variáveis
    despesas.forEach(d => {
        totalDespesas += d.valor;
    });

    const lucroLiquido = receitaBruta - custoProdutos - totalDespesas;

    document.getElementById('finReceitaTotal').textContent = receitaBruta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('finDespesasTotal').textContent = (custoProdutos + totalDespesas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('finLucroLiquido').textContent = lucroLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Aplicar cor condicional ao lucro
    const lucroEl = document.getElementById('finLucroLiquido');
    if (lucroLiquido < 0) {
        lucroEl.className = 'text-2xl font-black text-rose-600';
    } else {
        lucroEl.className = 'text-2xl font-black text-emerald-600';
    }
}
