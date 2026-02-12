function updateDashboardMetrics() {
    if (!produtos || !vendas) return;

    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const trintaDiasAtras = new Date(hoje);
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    let dinheiroParado = 0, totalEstoqueCritico = 0, totalEstoqueParado = 0;
    const categoriasImpacto = {};

    produtos.forEach(p => {
        let valorProduto = 0, temEstoque = false;
        p.variantes.forEach(v => {
            const vVal = (Number(v.estoque_atual) || 0) * (Number(p.preco_venda) || 0);
            valorProduto += vVal;
            if (v.estoque_atual > 0) temEstoque = true;
            if (v.estoque_atual <= v.estoque_minimo && v.estoque_atual > 0) totalEstoqueCritico++;
        });
        dinheiroParado += valorProduto;
        const cat = p.categoria || 'Sem Categoria';
        categoriasImpacto[cat] = (categoriasImpacto[cat] || 0) + valorProduto;
        if (new Date(p.criado_em) < trintaDiasAtras && temEstoque) totalEstoqueParado++;
    });

    let faturamentoMes = 0, qtdVendasMes = 0;
    let faturamentoHoje = 0, faturamento7d = 0;

    const seteDiasAtras = new Date(hoje);
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    const hojeStr = agora.toISOString().split('T')[0];

    vendas.forEach(v => {
        const dataVenda = new Date(v.criado_em);
        const valor = Number(v.total) || 0;

        if (dataVenda >= inicioMes) {
            faturamentoMes += valor;
            qtdVendasMes++;
        }
        if (v.criado_em.startsWith(hojeStr)) {
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
}
