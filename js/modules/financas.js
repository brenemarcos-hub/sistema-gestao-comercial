// Instância do Gráfico de Finanças
let chartFinCategorias = null;

// Carregar despesas do banco
async function loadExpenses(forceRefresh = false) {
    if (!supabaseClient) return;

    const lojaId = await getUserLojaId();
    if (!lojaId) {
        console.warn('⚠️ Usuário sem loja vinculada');
        return;
    }

    // Tentar carregar do cache
    if (!forceRefresh) {
        const cached = typeof getFromCache === 'function' ? getFromCache(`despesas_${lojaId}`) : null;
        if (cached) {
            despesas = cached;
            renderExpensesTable();
            updateFinancialDashboard();
            return;
        }
    }

    try {
        console.log('📡 Buscando despesas do banco de dados...');
        const { data, error } = await supabaseClient
            .from('despesas')
            .select('*')
            .eq('loja_id', lojaId)
            .order('data_vencimento', { ascending: false });

        if (error) throw error;
        despesas = data || [];

        // Salvar no cache
        if (typeof saveToCache === 'function') saveToCache(`despesas_${lojaId}`, despesas);

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
            <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white" data-label="Descrição">${item.descricao}</td>
            <td class="px-6 py-4 text-sm text-gray-500 italic" data-label="Categoria">${item.categoria || 'Outros'}</td>
            <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-bold" data-label="Valor">${valorFormat}</td>
            <td class="px-6 py-4 text-sm text-gray-500" data-label="Vencimento">${dataVenc}</td>
            <td class="px-6 py-4" data-label="Status">
                <span class="px-2 py-1 text-[10px] font-bold rounded-full ${item.pago ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} uppercase">
                    ${item.pago ? 'PAGO' : 'PENDENTE'}
                </span>
            </td>
            <td class="px-6 py-4 text-sm font-medium" data-label="Ações">
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
        loadExpenses(true);
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
        loadExpenses(true);
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
    
    // Helper para obter data local YYYY-MM-DD
    const getLocalDateStr = (date) => {
        const d = new Date(date);
        return d.getFullYear() + '-' + 
               String(d.getMonth() + 1).padStart(2, '0') + '-' + 
               String(d.getDate()).padStart(2, '0');
    };

    const hojeStr = getLocalDateStr(agora);
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();

    // Filtro de Período Robusto
    const isNoPeriodo = (dataStr) => {
        const dataItem = new Date(dataStr);
        const itemDateStr = getLocalDateStr(dataItem);
        
        if (periodoFilter === 'hoje') return itemDateStr === hojeStr;
        
        if (periodoFilter === 'mes') {
            return dataItem.getMonth() === mesAtual && dataItem.getFullYear() === anoAtual;
        }
        
        const diffDias = (agora - dataItem) / (1000 * 60 * 60 * 24);
        if (periodoFilter === '7d') return diffDias <= 7;
        if (periodoFilter === '30d') return diffDias <= 30;
        
        return true;
    };

    let faturamentoTotal = 0;   // Valor total de todas as vendas (Empenhado)
    let recebidoTotal = 0;      // Dinheiro que já entrou (Pago)
    let aReceberTotal = 0;      // Dinheiro que vai entrar (Pendente)
    let custoTotalVendas = 0;   // CMV - Custo das Mercadorias Vendidas
    let totalDespesas = 0;      // Gastos fixos/variáveis
    const categoriasMapa = {};

    // 1. Processar Vendas
    vendas.forEach(v => {
        if (!isNoPeriodo(v.criado_em)) return;

        const totalVenda = parseFloat(v.total) || 0;
        faturamentoTotal += totalVenda;

        if (v.status_pagamento === 'pago' || v.status_pagamento === 'pago (atrasado)') {
            recebidoTotal += totalVenda;
        } else {
            aReceberTotal += totalVenda;
        }

        // Cálculo de Custo (CMV)
        const prod = produtos.find(p => p.id == v.id_produto);
        if (prod) {
            const variant = prod.variantes.find(varItem => varItem.id == v.id_variante);
            // Fallback: Se não tiver custo, assume 60% do preço de venda como custo estimado
            const custoUnitario = parseFloat(variant?.custo_unitario) || (parseFloat(v.preco_unitario || prod.preco_venda) * 0.6);
            custoTotalVendas += custoUnitario * v.quantidade;
        }
    });

    // 2. Processar Despesas
    despesas.forEach(d => {
        const dataReferencia = d.data_vencimento ? new Date(d.data_vencimento + 'T12:00:00') : new Date(d.criado_em);
        if (!isNoPeriodo(dataReferencia)) return;

        const valorD = parseFloat(d.valor) || 0;
        totalDespesas += valorD;
        
        const cat = d.categoria || 'Outros';
        categoriasMapa[cat] = (categoriasMapa[cat] || 0) + valorD;
    });

    // --- CÁLCULOS FINAIS ---
    const lucroLiquido = faturamentoTotal - custoTotalVendas - totalDespesas;
    const saldoCaixa = recebidoTotal - totalDespesas;

    // --- LEMBRETES DE COBRANÇA (Vendas a Prazo / Fiado) ---
    const listCobranca = document.getElementById('cobrancasList');
    const sectionCobranca = document.getElementById('cobrancasSection');
    
    let aReceberMes = 0;
    let aReceberFuturo = 0;

    const pendenteVendas = vendas.filter(v => v.status_pagamento === 'pendente');
    pendenteVendas.forEach(v => {
        const valorVenda = parseFloat(v.total) || 0;
        const vData = v.data_proximo ? new Date(v.data_proximo + 'T12:00:00') : agora;
        
        // Se a data de vencimento é este mês e este ano
        if (vData.getMonth() === mesAtual && vData.getFullYear() === anoAtual) {
            aReceberMes += valorVenda;
        } else if (vData > agora) {
            aReceberFuturo += valorVenda;
        }
    });

    if (listCobranca && sectionCobranca) {
        const proximasVendas = pendenteVendas.filter(v => 
            v.data_proximo && 
            new Date(v.data_proximo + 'T12:00:00') <= new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000) // Próximos 7 dias
        ).sort((a, b) => new Date(a.data_proximo) - new Date(b.data_proximo));

        if (proximasVendas.length > 0) {
            sectionCobranca.classList.remove('hidden');
            listCobranca.innerHTML = proximasVendas.map(v => {
                const cliente = clientes.find(c => c.id == (v.id_cliente || v.cliente_id));
                const valorParcela = parseFloat(v.total) / (v.parcelas_originais || v.parcelas || 1);
                
                return `
                    <div class="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                <i class="fas fa-user text-sm"></i>
                            </div>
                            <div>
                                <p class="text-sm font-black text-gray-900 dark:text-white">${cliente?.nome || 'Cliente não identificado'}</p>
                                <div class="flex items-center gap-2">
                                    <span class="text-[10px] text-gray-400 font-bold uppercase">Vence em: ${new Date(v.data_proximo + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                    <span class="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-100">${v.parcelas}x Restante</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="text-right">
                                <p class="text-[9px] text-gray-400 font-bold uppercase">Valor Parcela</p>
                                <p class="text-sm font-black text-indigo-600">R$ ${valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <button onclick="changeSaleStatus('${v.id}', 'pago')" 
                                    class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-black text-xs shadow-lg shadow-emerald-100 dark:shadow-none transition-all flex items-center gap-2">
                                <i class="fas fa-check"></i> RECEBER
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            sectionCobranca.classList.add('hidden');
        }
    }

    // Atualiza Widgets na tela
    const setElText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    const formatBRL = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    setElText('finFaturamentoTotal', formatBRL(faturamentoTotal));
    setElText('finRecebidoTotal', formatBRL(recebidoTotal));
    setElText('finAReceberTotal', formatBRL(aReceberMes + aReceberFuturo));
    setElText('finAReceberMes', formatBRL(aReceberMes));
    setElText('finAReceberFuturo', formatBRL(aReceberFuturo));
    
    setElText('finDespesasTotal', formatBRL(custoTotalVendas + totalDespesas)); 
    setElText('finLucroLiquido', formatBRL(lucroLiquido));
    setElText('finTotalExpensesFormatted', formatBRL(totalDespesas));
    
    const lucroEl = document.getElementById('finLucroLiquido');
    if (lucroEl) {
        lucroEl.className = `text-xl font-black ${lucroLiquido >= 0 ? 'text-emerald-600' : 'text-rose-600'}`;
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
