/**
 * ASSISTENTE DE LUCRO REAL
 * Módulo de inteligência para precificação estratégica.
 */

function openPricingAssistant() {
    const modal = document.getElementById('pricingAssistantModal');
    const vendaInput = document.getElementById('preco_venda');
    const calcVendaInput = document.getElementById('calcVendaInput');
    
    // 1. Pegar custo médio das variantes
    const variantesCusto = Array.from(document.querySelectorAll('.variant-custo'))
        .map(input => parseFloat(input.value) || 0)
        .filter(v => v > 0);
    
    const custoMedio = variantesCusto.length > 0 
        ? variantesCusto.reduce((a, b) => a + b, 0) / variantesCusto.length 
        : 0;

    document.getElementById('calcCustoInput').value = custoMedio.toFixed(2);
    document.getElementById('calcCustoDisplay').textContent = `R$ ${custoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    
    // 2. Tentar calcular Despesa Operacional Real baseada no Financeiro
    try {
        if (typeof vendas !== 'undefined' && typeof despesas !== 'undefined' && vendas.length > 0) {
            const faturamentoTotal = vendas.reduce((acc, v) => acc + (parseFloat(v.total) || 0), 0);
            const despesasFixas = despesas.reduce((acc, d) => acc + (parseFloat(d.valor) || 0), 0);
            
            if (faturamentoTotal > 0) {
                const percReal = (despesasFixas / faturamentoTotal) * 100;
                if (percReal > 0 && percReal < 100) {
                    const fixoInput = document.getElementById('calcFixo');
                    fixoInput.value = percReal.toFixed(1);
                    // Adiciona uma dica visual
                    const helpText = document.getElementById('calcFixoHelp');
                    if (helpText) {
                        helpText.innerHTML = '<i class="fas fa-chart-line text-emerald-500 mr-1"></i> Calculado com base nos seus gastos reais de finanças.';
                        helpText.classList.remove('text-gray-400');
                        helpText.classList.add('text-emerald-500', 'font-black');
                    }
                    fixoInput.classList.add('border-emerald-500', 'dark:border-emerald-500');
                }
            }
        }
    } catch (e) { console.warn("Não foi possível calcular margem real das finanças:", e); }

    // 3. Sincronizar preço de venda atual
    calcVendaInput.value = vendaInput.value || (custoMedio * 2).toFixed(2);
    
    // 4. Abrir modal e calcular
    modal.classList.remove('hidden');
    updatePricingRealTime();
}

function closePricingAssistant() {
    document.getElementById('pricingAssistantModal').classList.add('hidden');
}

function updatePricingRealTime() {
    const custo = parseFloat(document.getElementById('calcCustoInput').value) || 0;
    const precoVenda = parseFloat(document.getElementById('calcVendaInput').value) || 0;
    const impostoP = parseFloat(document.getElementById('calcImposto').value) || 0;
    const taxaP = parseFloat(document.getElementById('calcTaxa').value) || 0;
    const fixoP = parseFloat(document.getElementById('calcFixo').value) || 0;

    // Cálculos
    const valorImposto = precoVenda * (impostoP / 100);
    const valorTaxa = precoVenda * (taxaP / 100);
    const valorFixo = precoVenda * (fixoP / 100);
    
    const lucroReal = precoVenda - custo - valorImposto - valorTaxa - valorFixo;
    const margemReal = precoVenda > 0 ? (lucroReal / precoVenda) * 100 : 0;

    // Atualizar UI
    const valorDisplay = document.getElementById('calcLucroRealValor');
    const porcentDisplay = document.getElementById('calcLucroRealPorcentagem');
    const insightDisplay = document.getElementById('calcInsightTexto');
    const card = document.getElementById('pricingResultCard');

    valorDisplay.textContent = `R$ ${lucroReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    porcentDisplay.textContent = `${margemReal.toFixed(1)}%`;

    // Feedback Visual Dinâmico
    if (margemReal <= 0) {
        card.style.borderColor = '#ef4444'; // Red
        porcentDisplay.className = 'px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-black tracking-widest border border-rose-500/20';
        insightDisplay.textContent = "Prejuízo Detectado!";
        insightDisplay.className = 'text-[10px] text-rose-400 font-bold uppercase tracking-widest';
    } else if (margemReal < 15) {
        card.style.borderColor = '#f59e0b'; // Amber
        porcentDisplay.className = 'px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black tracking-widest border border-amber-500/20';
        insightDisplay.textContent = "Margem Perigosa!";
        insightDisplay.className = 'text-[10px] text-amber-400 font-bold uppercase tracking-widest';
    } else {
        card.style.borderColor = '#10b981'; // Emerald
        porcentDisplay.className = 'px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black tracking-widest border border-emerald-500/20';
        insightDisplay.textContent = "Lucro Saudável!";
        insightDisplay.className = 'text-[10px] text-emerald-400 font-bold uppercase tracking-widest';
    }
}

function applyPricing() {
    const calcVendaInput = document.getElementById('calcVendaInput');
    const mainVendaInput = document.getElementById('preco_venda');
    
    mainVendaInput.value = calcVendaInput.value;
    
    // Pequeno feedback de sucesso no input principal
    mainVendaInput.classList.add('ring-2', 'ring-emerald-500');
    setTimeout(() => mainVendaInput.classList.remove('ring-2', 'ring-emerald-500'), 2000);
    
    closePricingAssistant();
    showNotification('Preço Aplicado', 'O preço de venda foi ajustado com base nos cálculos de lucro.', 'success');
}

// Globalizar funções
window.openPricingAssistant = openPricingAssistant;
window.closePricingAssistant = closePricingAssistant;
window.updatePricingRealTime = updatePricingRealTime;
window.applyPricing = applyPricing;
