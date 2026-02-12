// --- GRÁFICOS E RELATÓRIOS INTELIGENTES ---

// Instâncias dos Gráficos
let chartVendas = null;
let chartCategorias = null;
let chartSemana = null;

// Estado
let reportStartDate = null;
let reportEndDate = null;
let currentMeta = 10000;
let currentBreakEven = 5000;

// Função auxiliar global para formatar data local como YYYY-MM-DD
function formatLocalYMD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    if (document.getElementById('dateStart')) {
        document.getElementById('dateStart').value = formatLocalYMD(firstDay);
        document.getElementById('dateEnd').value = formatLocalYMD(today);

        // Listeners
        document.getElementById('applyDateBtn').addEventListener('click', () => {
            const sVal = document.getElementById('dateStart').value;
            const eVal = document.getElementById('dateEnd').value;
            if (sVal && eVal) {
                const sDate = new Date(sVal + 'T00:00:00');
                const eDate = new Date(eVal + 'T23:59:59');
                renderCharts(sDate, eDate);
            }
        });

        const btnExport = document.getElementById('btnExportReport');
        if (btnExport) btnExport.addEventListener('click', exportReportPDF);
    }

    // Carregar Metas e Pontos de Equilíbrio salvos
    const savedMeta = localStorage.getItem('metaMensal');
    if (savedMeta) {
        currentMeta = parseFloat(savedMeta);
        const metaInput = document.getElementById('inputMetaMensal');
        if (metaInput) metaInput.value = currentMeta;
    }

    const savedBreakEven = localStorage.getItem('breakEvenPoint');
    if (savedBreakEven) {
        currentBreakEven = parseFloat(savedBreakEven);
    }

    // Tentar carregar dados em cache para exibição imediata
    loadCachedReport();
});

function loadCachedReport() {
    const cached = localStorage.getItem('dashboardCacheVendas');
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.length > 0) {
                const today = new Date();
                const start = new Date(today.getFullYear(), today.getMonth(), 1);
                today.setHours(23, 59, 59, 999);
                start.setHours(0, 0, 0, 0);
                renderCharts(start, today, parsed);
            }
        } catch (e) {
            console.error('Erro ao ler cache de relatórios', e);
        }
    }
}

// Função Principal chamada pelo sistema ao abrir a aba
function renderCharts(startDate = null, endDate = null, customSalesList = null) {
    const sInput = document.getElementById('dateStart');
    const eInput = document.getElementById('dateEnd');

    if (!startDate || !endDate) {
        if (sInput && eInput && sInput.value && eInput.value) {
            startDate = new Date(sInput.value + 'T00:00:00');
            endDate = new Date(eInput.value + 'T23:59:59');
        } else {
            const today = new Date();
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
        }
    }

    reportStartDate = startDate;
    reportEndDate = endDate;

    const sourceData = customSalesList || vendas;

    if (!customSalesList && vendas && vendas.length > 0) {
        localStorage.setItem('dashboardCacheVendas', JSON.stringify(vendas));
    }

    const filteredSales = filterSalesByDate(sourceData, startDate, endDate);

    // 1. KPIs
    updateKPICards(filteredSales, startDate, endDate, sourceData);

    // 2. Gráfico de Vendas
    renderSalesTrendChart(filteredSales, startDate, endDate);

    // 3. Top Produtos
    renderTopProductsList(filteredSales);

    // 4. Categorias
    renderCategoryChart(filteredSales);

    // 5. Semanal
    renderWeeklyHeatmap(filteredSales);

    // 6. Meta
    updateMetaProgress(filteredSales, sourceData);
}

function filterSalesByDate(salesList, start, end) {
    const endAdjusted = new Date(end);
    endAdjusted.setHours(23, 59, 59, 999);
    return salesList.filter(v => {
        const d = new Date(v.criado_em);
        return d >= start && d <= endAdjusted;
    });
}

function getPreviousPeriod(start, end) {
    const duration = end - start;
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(start.getTime() - duration - 1);
    return { start: prevStart, end: prevEnd };
}

function updateKPICards(sales, start, end, sourceData = null) {
    const fullSource = sourceData || vendas;
    const prevPeriod = getPreviousPeriod(start, end);
    const prevSales = filterSalesByDate(fullSource, prevPeriod.start, prevPeriod.end);

    const totalFaturamento = sales.reduce((acc, v) => acc + (parseFloat(v.total) || 0), 0);
    const prevFaturamento = prevSales.reduce((acc, v) => acc + (parseFloat(v.total) || 0), 0);
    updateCardValue('kpiFaturamento', totalFaturamento, 'currency');
    updateGrowthBadge('kpiFaturamentoComp', totalFaturamento, prevFaturamento);

    let totalCMV = 0;
    const missingCosts = new Set();
    sales.forEach(v => {
        const prod = produtos.find(p => p.id === v.id_produto);
        if (prod && prod.variantes) {
            const varnt = prod.variantes.find(vr => vr.id === v.id_variante);
            if (varnt && varnt.custo_unitario && parseFloat(varnt.custo_unitario) > 0) {
                totalCMV += (parseFloat(varnt.custo_unitario) * v.quantidade);
            } else {
                missingCosts.add(prod.nome);
            }
        } else {
            missingCosts.add("Produto Removido");
        }
    });

    updateCostWarning(missingCosts);

    const cmvFinal = totalCMV > 0 ? totalCMV : totalFaturamento * 0.4;
    updateCardValue('kpiCMV', cmvFinal, 'currency');

    const lucroBruto = totalFaturamento - cmvFinal;
    const margemBruta = totalFaturamento > 0 ? (lucroBruto / totalFaturamento) * 100 : 0;
    updateCardValue('kpiLucroBruto', lucroBruto, 'currency');
    if (document.getElementById('kpiLucroMargem')) {
        document.getElementById('kpiLucroMargem').textContent = `${margemBruta.toFixed(1)}%`;
    }

    const totalDespesas = despesas.filter(d => {
        const dDate = new Date(d.vencimento || d.criado_em);
        return dDate >= start && dDate <= end;
    }).reduce((acc, d) => acc + (parseFloat(d.valor) || 0), 0);
    updateCardValue('kpiDespesasTotal', totalDespesas, 'currency');

    const margemPercentual = totalFaturamento > 0 ? (lucroBruto / totalFaturamento) : 0.4;
    currentBreakEven = margemPercentual > 0 ? (totalDespesas / margemPercentual) : totalDespesas;

    const lucroLiquido = lucroBruto - totalDespesas;
    const margemLiquida = totalFaturamento > 0 ? (lucroLiquido / totalFaturamento) * 100 : 0;
    updateCardValue('kpiLucroLiquido', lucroLiquido, 'currency');
    if (document.getElementById('kpiLucroLiquidoMargem')) {
        document.getElementById('kpiLucroLiquidoMargem').textContent = `${margemLiquida.toFixed(1)}%`;
    }

    const ticketMedio = sales.length ? totalFaturamento / sales.length : 0;
    updateCardValue('kpiTicketMedio', ticketMedio, 'currency');
    updateCardValue('kpiPedidos', sales.length, 'number');

    let valorPatrimonio = 0;
    produtos.forEach(p => {
        if (p.variantes) {
            p.variantes.forEach(v => {
                valorPatrimonio += (parseFloat(v.custo_unitario || 0) * (parseInt(v.estoque_atual) || 0));
            });
        }
    });
    updateCardValue('kpiPatrimonioEstoque', valorPatrimonio, 'currency');

    updateDRETable(totalFaturamento, cmvFinal, lucroBruto, totalDespesas, lucroLiquido);
}

function updateCostWarning(missingSet) {
    const container = document.getElementById('costWarning');
    const list = document.getElementById('missingCostList');
    if (!container || !list) return;

    if (missingSet.size > 0) {
        container.classList.remove('hidden');
        list.innerHTML = Array.from(missingSet).map(name =>
            `<span class="bg-amber-200 text-amber-900 px-2 py-1 rounded text-[10px] font-bold shadow-sm">${name}</span>`
        ).join('');
    } else {
        container.classList.add('hidden');
    }
}

function updateDRETable(receita, cmv, bruto, despesas, liquido) {
    const ids = {
        'dreReceita': receita,
        'dreCMV': cmv,
        'dreLucroBruto': bruto,
        'dreDespesas': despesas,
        'dreLucroLiquido': liquido
    };

    for (const [id, val] of Object.entries(ids)) {
        const el = document.getElementById(id);
        if (el) {
            const prefix = (id.includes('CMV') || id.includes('Despesas')) ? '- ' : '';
            el.textContent = prefix + val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
    }
}

function updateCardValue(id, value, type) {
    const el = document.getElementById(id);
    if (!el) return;
    if (type === 'currency') {
        el.textContent = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } else {
        el.textContent = value;
    }
}

function updateGrowthBadge(id, current, previous) {
    const el = document.getElementById(id);
    if (!el) return;

    if (previous === 0) {
        el.className = 'text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500 flex items-center gap-1';
        el.innerHTML = '<i class="fas fa-minus"></i> -';
        return;
    }

    const growth = ((current - previous) / previous) * 100;
    const isPositive = growth >= 0;

    if (isPositive) {
        el.className = 'text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 flex items-center gap-1';
        el.innerHTML = `<i class="fas fa-arrow-up"></i> ${growth.toFixed(1)}%`;
    } else {
        el.className = 'text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 flex items-center gap-1';
        el.innerHTML = `<i class="fas fa-arrow-down"></i> ${Math.abs(growth).toFixed(1)}%`;
    }
}

function renderSalesTrendChart(sales, start, end) {
    const ctx = document.getElementById('chartVendasPrincipal')?.getContext('2d');
    if (!ctx) return;
    if (chartVendas) chartVendas.destroy();

    const daysMap = new Map();
    let current = new Date(start);
    const stopAt = new Date(end);

    while (current <= stopAt) {
        daysMap.set(formatLocalYMD(current), 0);
        current.setDate(current.getDate() + 1);
    }

    sales.forEach(v => {
        const d = new Date(v.criado_em);
        const dateStr = formatLocalYMD(d);
        if (daysMap.has(dateStr)) {
            daysMap.set(dateStr, daysMap.get(dateStr) + parseFloat(v.total));
        }
    });

    const labels = Array.from(daysMap.keys()).map(d => {
        const parts = d.split('-');
        return `${parts[2]}/${parts[1]}`;
    });
    const data = Array.from(daysMap.values());

    const isDark = document.documentElement.classList.contains('dark');
    const color = '#4f46e5';

    chartVendas = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Faturamento',
                    data: data,
                    borderColor: color,
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                        gradient.addColorStop(0, 'rgba(79, 70, 229, 0.4)');
                        gradient.addColorStop(1, 'rgba(79, 70, 229, 0.0)');
                        return gradient;
                    },
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    zIndex: 2
                },
                {
                    label: 'Ponto de Equilíbrio (Diário)',
                    data: new Array(labels.length).fill(currentBreakEven / (labels.length || 1)),
                    borderColor: '#f43f5e',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    zIndex: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                        color: isDark ? '#f1f5f9' : '#1e293b',
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20,
                        font: { size: 10, weight: 'bold' }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    titleColor: isDark ? '#ffffff' : '#1e293b',
                    bodyColor: isDark ? '#cbd5e1' : '#64748b',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: (c) => ` ${c.dataset.label}: R$ ${c.raw.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
                    ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10 } }
                }
            }
        }
    });
}

function renderTopProductsList(sales) {
    const list = document.getElementById('listTopProdutos');
    if (!list) return;

    const prodMap = {};
    sales.forEach(v => {
        const key = v.id_produto;
        const nome = (v.produtos && v.produtos.nome) ? v.produtos.nome : 'Produto s/ Nome';
        if (!prodMap[key]) prodMap[key] = { nome: nome, total: 0, qtd: 0 };
        prodMap[key].total += parseFloat(v.total);
        prodMap[key].qtd += v.quantidade;
    });

    const sorted = Object.values(prodMap).sort((a, b) => b.total - a.total).slice(0, 5);
    const maxVal = sorted.length > 0 ? sorted[0].total : 1;

    list.innerHTML = sorted.map(data => {
        const percent = (data.total / maxVal) * 100;
        return `
        <div class="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-bold text-gray-700 dark:text-gray-200">${data.nome}</span>
                <span class="text-sm font-black text-indigo-600">R$ ${data.total.toLocaleString('pt-BR')}</span>
            </div>
            <div class="relative w-full">
                <div class="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div class="bg-indigo-500 h-1.5 rounded-full" style="width: ${percent}%"></div>
                </div>
                <div class="text-[10px] text-gray-400 mt-1">${data.qtd} unidades vendidas</div>
            </div>
        </div>
        `;
    }).join('');
}

function renderCategoryChart(sales) {
    const ctx = document.getElementById('chartCategorias')?.getContext('2d');
    if (!ctx) return;
    if (chartCategorias) chartCategorias.destroy();

    const catMap = {};
    sales.forEach(v => {
        const p = produtos.find(item => item.id == v.id_produto);
        const cat = p ? p.categoria : 'Outros';
        catMap[cat] = (catMap[cat] || 0) + parseFloat(v.total);
    });

    const labels = Object.keys(catMap);
    const data = Object.values(catMap);

    chartCategorias = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { size: 10 } } }
            }
        }
    });
}

function renderWeeklyHeatmap(sales) {
    const ctx = document.getElementById('chartSemana')?.getContext('2d');
    if (!ctx) return;
    if (chartSemana) chartSemana.destroy();

    const weekData = new Array(7).fill(0);
    sales.forEach(v => {
        const day = new Date(v.criado_em).getDay();
        weekData[day] += parseFloat(v.total);
    });

    const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const maxVal = Math.max(...weekData);

    const colors = weekData.map(val => {
        const opacity = maxVal > 0 ? (val / maxVal) : 0;
        return `rgba(16, 185, 129, ${0.3 + (opacity * 0.7)})`;
    });

    chartSemana = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Vendas Totais',
                data: weekData,
                backgroundColor: colors,
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { display: false },
                x: { grid: { display: false } }
            }
        }
    });
}

function updateMetaProgress(sales, sourceData = null) {
    const today = new Date();
    const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const fullSource = sourceData || vendas;
    const monthSales = filterSalesByDate(fullSource, startMonth, endMonth);
    const totalMonth = monthSales.reduce((acc, v) => acc + parseFloat(v.total), 0);

    const percent = Math.min((totalMonth / currentMeta) * 100, 100).toFixed(1);
    const remaining = Math.max(currentMeta - totalMonth, 0);

    const bar = document.getElementById('barraProgressoMeta');
    const badge = document.getElementById('metaPorcentagem');
    const text = document.getElementById('metaFaltante');
    const msg = document.getElementById('metaMensagem');

    if (bar) bar.style.width = `${percent}%`;
    if (badge) badge.textContent = `${percent}%`;
    if (text) text.textContent = remaining.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (msg) {
        if (percent >= 100) msg.textContent = "🚀 META ATINGIDA! VOCÊ É UMA MÁQUINA DE VENDAS!";
        else if (percent >= 75) msg.textContent = "🔥 Quase lá! Falta pouco para bater a meta!";
        else if (percent >= 50) msg.textContent = "👍 Metade do caminho já foi. Continue acelerando!";
        else msg.textContent = "💪 Começo de mês desafiador. Vamos buscar o resultado!";
    }
}

function saveFinancialGoals() {
    const metaInput = document.getElementById('inputMetaMensal');
    if (metaInput) {
        currentMeta = parseFloat(metaInput.value) || 0;
        localStorage.setItem('metaMensal', currentMeta);
    }
    renderCharts(reportStartDate, reportEndDate);
}

function updateChartPeriod(days) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const sInput = document.getElementById('dateStart');
    const eInput = document.getElementById('dateEnd');
    if (sInput) sInput.value = formatLocalYMD(start);
    if (eInput) eInput.value = formatLocalYMD(end);

    renderCharts(start, end);
}

function exportReportPDF() {
    alert('Funcionalidade de PDF seria implementada aqui com bibliotecas como html2pdf ou jsPDF. Por enquanto, use a função de imprimir do navegador (Ctrl+P) que já captura este layout bonito.');
    window.print();
}
