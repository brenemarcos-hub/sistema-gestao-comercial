function updateDashboardMetrics() {
    if (!produtos || !vendas) return;

    const agora = new Date();
    
    // Helper para obter data local YYYY-MM-DD (Evita bug de UTC)
    const getLocalDateStr = (date) => {
        const d = new Date(date);
        return d.getFullYear() + '-' + 
               String(d.getMonth() + 1).padStart(2, '0') + '-' + 
               String(d.getDate()).padStart(2, '0');
    };

    const hojeStr = getLocalDateStr(agora);
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();
    const seteDiasAtras = new Date(agora);
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    const trintaDiasAtras = new Date(agora);
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    const inicioMes = new Date(anoAtual, mesAtual, 1);

    let dinheiroParado = 0, totalEstoqueCritico = 0, totalEstoqueParado = 0;
    const categoriasImpacto = {};

    produtos.forEach(p => {
        let valorProduto = 0, temEstoque = false;
        p.variantes.forEach(v => {
            // Usa custo real ou estimativa de 60%
            const custoItem = parseFloat(v.custo_unitario) || (parseFloat(p.preco_venda) * 0.6);
            const vVal = (Number(v.estoque_atual) || 0) * custoItem;
            valorProduto += vVal;
            if (v.estoque_atual > 0) temEstoque = true;
            if (v.estoque_atual <= v.estoque_minimo && v.estoque_atual > 0) totalEstoqueCritico++;
        });
        dinheiroParado += valorProduto;
        const cat = p.categoria || 'Sem Categoria';
        categoriasImpacto[cat] = (categoriasImpacto[cat] || 0) + valorProduto;
        
        // Estoque parado: itens criados há mais de 30 dias que ainda tem estoque
        if (new Date(p.criado_em) < trintaDiasAtras && temEstoque) totalEstoqueParado++;
    });

    let faturamentoMes = 0, qtdVendasMes = 0;
    let faturamentoHoje = 0, faturamento7d = 0;

    vendas.forEach(v => {
        const dataVenda = new Date(v.criado_em);
        const itemDateStr = getLocalDateStr(dataVenda);
        const valor = Number(v.total) || 0;

        if (dataVenda >= inicioMes) {
            faturamentoMes += valor;
            qtdVendasMes++;
        }
        if (itemDateStr === hojeStr) {
            faturamentoHoje += valor;
        }
        if (dataVenda >= seteDiasAtras) {
            faturamento7d += valor;
        }
    });

    const setElText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setElText('dashDinheiroParado', `R$ ${dinheiroParado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    setElText('dashVendasMes', `R$ ${faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    setElText('dashVendasMesQtd', `${qtdVendasMes} pedidos realizados`);
    setElText('dashEstoqueCritico', totalEstoqueCritico);
    setElText('dashEstoqueParado', totalEstoqueParado);
    setElText('dashVendasHoje', `R$ ${faturamentoHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    setElText('dashVendas7d', `R$ ${faturamento7d.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);

    // --- Hover Insights ---
    const sortedCats = Object.entries(categoriasImpacto).sort((a, b) => b[1] - a[1]);
    setElText('insightDashDinheiroParado', sortedCats[0] ? `Top Categoria: ${sortedCats[0][0]}` : 'Sem dados');

    const diasMes = agora.getDate();
    const mediaDiaria = faturamentoMes / diasMes;
    setElText('insightDashVendasMes', `Média: R$ ${mediaDiaria.toFixed(2).replace('.', ',')}/dia`);

    const itensCriticos = produtos.filter(p => p.variantes.some(v => v.estoque_atual <= v.estoque_minimo && v.estoque_atual > 0))
        .map(p => p.nome).slice(0, 2).join(', ') + (totalEstoqueCritico > 2 ? '...' : '');
    setElText('insightDashEstoqueCritico', totalEstoqueCritico > 0 ? `Repor: ${itensCriticos}` : 'Estoque saudável');

    // Estimativa de valor parado (simplificada para o insight)
    let valorParadoTotal = 0;
    produtos.forEach(p => {
        if (new Date(p.criado_em) < trintaDiasAtras) {
            p.variantes.forEach(v => valorParadoTotal += Number(v.estoque_atual) * Number(p.preco_venda));
        }
    });
    setElText('insightDashEstoqueParado', `Perda Potencial: R$ ${valorParadoTotal.toLocaleString('pt-BR')}`);

    const catContainer = document.getElementById('dashCategoriasValor');
    if (catContainer) {
        catContainer.innerHTML = '';
        const topCats = sortedCats.slice(0, 5);

        if (sortedCats.length === 0) {
            catContainer.innerHTML = '<p class="text-sm text-gray-400 text-center py-4">Sem dados</p>';
        } else {
            const max = sortedCats[0][1];
            sortedCats.forEach(([name, val]) => {
                const percent = max > 0 ? (val / max) * 100 : 0;
                catContainer.innerHTML += `
                    <div class="mb-3">
                        <div class="flex justify-between text-xs mb-1"><span>${name}</span><span class="font-bold">R$ ${val.toLocaleString('pt-BR')}</span></div>
                        <div class="w-full bg-gray-100 rounded-full h-1.5"><div class="bg-indigo-500 h-1.5 rounded-full" style="width: ${percent}%"></div></div>
                    </div>`;
            });
        }
    }
    // --- CHECKLIST DE ONBOARDING ---
    updateOnboardingChecklist();

    // --- ANALISE ABC ---
    calculateABCAnalysis();

    // --- CRM: ANIVERSARIANTES ---
    checkBirthdays();
}

function checkBirthdays() {
    if (!clientes) return;

    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2, '0');
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const hojeShort = `${dia}/${mes}`; // Padrão dd/mm

    const aniversariantes = clientes.filter(c => {
        if (!c.data_aniversario) return false;
        return c.data_aniversario.startsWith(hojeShort);
    });

    const widget = document.getElementById('birthdayWidget');
    const list = document.getElementById('birthdayList');
    const msg = document.getElementById('birthdayMessage');

    if (aniversariantes.length > 0) {
        if (widget) widget.classList.remove('hidden');
        if (msg) msg.textContent = `${aniversariantes.length} cliente(s) celebrando hoje!`;
        
        if (list) {
            list.innerHTML = '';
            aniversariantes.slice(0, 5).forEach(c => {
                const init = c.nome.charAt(0);
                const zapUrl = `https://wa.me/55${c.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(`Parabéns, ${c.nome}! 🎂 Nós da Verum Gestão desejamos um dia incrível. Como presente, você tem 10% de desconto na sua próxima compra!`)}`;
                
                list.innerHTML += `
                    <a href="${zapUrl}" target="_blank" title="Mandar Parabéns para ${c.nome}" 
                       class="w-10 h-10 rounded-full bg-white border-2 border-amber-500 flex items-center justify-center text-amber-600 font-black text-sm hover:scale-110 transition-transform">
                        ${init}
                    </a>`;
            });
        }
    } else {
        if (widget) widget.classList.add('hidden');
    }
}

function calculateABCAnalysis() {
    if (!vendas || vendas.length === 0) return;

    // 1. Agrupar faturamento por produto
    const revenueByProduct = {};
    vendas.forEach(v => {
        const prodId = v.id_produto;
        revenueByProduct[prodId] = (revenueByProduct[prodId] || 0) + (Number(v.total) || 0);
    });

    // 2. Transformar em array e ordenar por faturamento (DESC)
    const sortedProducts = Object.entries(revenueByProduct)
        .map(([id, revenue]) => ({ id, revenue }))
        .sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = sortedProducts.reduce((acc, p) => acc + p.revenue, 0);

    // 3. Calcular classes
    let cumulativeRevenue = 0;
    const abc = { A: 0, B: 0, C: 0 };
    
    sortedProducts.forEach(p => {
        cumulativeRevenue += p.revenue;
        const percent = (cumulativeRevenue / totalRevenue) * 100;

        if (percent <= 80) abc.A++;
        else if (percent <= 95) abc.B++;
        else abc.C++;
    });

    // 4. Identificar Recompras Urgentes (Classe A com estoque baixo)
    let urgenciaRecompra = null;
    sortedProducts.filter(p => revenueByProduct[p.id] > (totalRevenue * 0.1)).forEach(pABC => {
        const prodReal = produtos.find(pr => pr.id == pABC.id);
        if (prodReal && prodReal.variantes.some(v => v.estoque_atual <= v.alerta_minimo)) {
            urgenciaRecompra = prodReal.nome;
        }
    });

    const aiEl = document.getElementById('aiSuggestion');
    if (aiEl && urgenciaRecompra) {
        aiEl.innerHTML = `<span class="text-rose-400 font-black"><i class="fas fa-exclamation-triangle"></i> URGENTE:</span> Seu produto Classe A <strong>"${urgenciaRecompra}"</strong> está acabando. Reponha agora para não perder faturamento!`;
    } else if (aiEl) {
        aiEl.textContent = '"Seu estoque da Classe A está saudável. Ótima gestão!"';
    }

    // 5. Atualizar UI
    const totalCount = sortedProducts.length || 1;
    const setPercent = (id, count) => {
        const el = document.getElementById(id);
        if (el) el.textContent = `${((count / totalCount) * 100).toFixed(0)}% dos itens`;
    };

    setPercent('abc-a-percent', abc.A);
    setPercent('abc-b-percent', abc.B);
    setPercent('abc-c-percent', abc.C);
}

function updateOnboardingChecklist() {
    const checklist = document.getElementById('onboardingChecklist');
    if (!checklist) return;

    // Verificar se despesas está disponível (global)
    const desp = (typeof despesas !== 'undefined') ? despesas : [];

    const steps = {
        product: produtos.length > 0,
        sale: vendas.length > 0,
        expense: desp.length > 0
    };

    // Atualizar UI dos passos
    const updateStepUI = (id, isDone) => {
        const el = document.getElementById(`step-${id}`);
        if (!el) return;
        if (isDone) {
            el.classList.add('bg-emerald-500/20', 'border-emerald-500/50');
            el.classList.remove('bg-white/10', 'border-white/10', 'text-white');
            el.classList.add('text-emerald-100');
            el.querySelector('i').className = 'fas fa-check-circle text-xl text-emerald-400';
        } else {
            el.classList.remove('bg-emerald-500/20', 'border-emerald-500/50', 'text-emerald-100');
            el.classList.add('bg-white/10', 'border-white/10', 'text-white');
            el.querySelector('i').className = 'far fa-circle text-xl opa-50';
        }
    };

    updateStepUI('product', steps.product);
    updateStepUI('sale', steps.sale);
    updateStepUI('expense', steps.expense);

    // Se todos os passos estiverem prontos, podemos esconder o checklist ou mostrar mensagem de sucesso
    const allDone = steps.product && steps.sale && steps.expense;
    
    // Mostra o checklist apenas se faltar algo OU se for uma conta zerada
    if (allDone) {
        // Se tudo estiver pronto, esconde o checklist após um tempo (ou mantém escondido se já estava)
        setTimeout(() => checklist.classList.add('hidden'), 5000);
    } else {
        checklist.classList.remove('hidden');
    }
}
