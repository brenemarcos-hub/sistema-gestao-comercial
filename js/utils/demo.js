/**
 * Utilitário para geração de dados de demonstração
 * Uso exclusivo para o Administrador Master
 */

async function populateStoreWithDemoData(lojaId) {
    if (!confirm('Deseja realmente gerar dados de demonstração para esta loja? Isso adicionará produtos, clientes, vendas e despesas fictícias.')) return;

    const db = window.supabaseClient;
    if (!db) return alert('Supabase não inicializado.');

    try {
        console.log('🚀 Iniciando geração de dados para loja:', lojaId);
        showNotification('Aguarde', 'Gerando produtos e variantes...', 'info');

        // 1. PRODUTOS
        const produtosDemo = [
            { nome: 'Tênis Nike Air Max 270', sku: 'NIKE-AM270', preco_venda: 899.90, categoria: 'Tênis', loja_id: lojaId, ativo: true },
            { nome: 'Camiseta Adidas Trefoil', sku: 'ADI-TRE', preco_venda: 149.90, categoria: 'Camisetas', loja_id: lojaId, ativo: true },
            { nome: 'Calça Jeans Levi\'s 501', sku: 'LEV-501', preco_venda: 359.90, categoria: 'Calças', loja_id: lojaId, ativo: true },
            { nome: 'Jaqueta Puffer North Face', sku: 'TNF-PUF', preco_venda: 1290.00, categoria: 'Jaquetas', loja_id: lojaId, ativo: true }
        ];

        const { data: prods, error: pErr } = await db.from('produtos').insert(produtosDemo).select();
        if (pErr) throw pErr;

        // 2. VARIANTES
        const variantes = [];
        prods.forEach(p => {
            if (p.categoria === 'Tênis') {
                variantes.push({ id_produto: p.id, cor: 'Preto/Branco', tamanho: '40', estoque_atual: 5, custo_unitario: 450, loja_id: lojaId });
                variantes.push({ id_produto: p.id, cor: 'Azul', tamanho: '42', estoque_atual: 3, custo_unitario: 450, loja_id: lojaId });
            } else if (p.categoria === 'Camisetas') {
                variantes.push({ id_produto: p.id, cor: 'Branca', tamanho: 'M', estoque_atual: 15, custo_unitario: 40, loja_id: lojaId });
                variantes.push({ id_produto: p.id, cor: 'Preta', tamanho: 'G', estoque_atual: 10, custo_unitario: 40, loja_id: lojaId });
            } else {
                variantes.push({ id_produto: p.id, cor: 'Padrão', tamanho: 'M', estoque_atual: 8, custo_unitario: p.preco_venda * 0.4, loja_id: lojaId });
            }
        });
        await db.from('variantes').insert(variantes);

        // 3. CLIENTES
        showNotification('Progresso', 'Cadastrando clientes...', 'info');
        const clientesDemo = [
            { nome: 'Marcos Oliveira', whatsapp: '11988887777', cpf_cnpj: '123.456.789-00', loja_id: lojaId },
            { nome: 'Fernanda Souza', whatsapp: '11977776666', cpf_cnpj: '987.654.321-11', loja_id: lojaId },
            { nome: 'Ricardo Santos', whatsapp: '11966665555', cpf_cnpj: '456.789.123-22', loja_id: lojaId }
        ];
        const { data: clis, error: cErr } = await db.from('clientes').insert(clientesDemo).select();
        if (cErr) throw cErr;

        // 4. VENDAS (Histórico de 30 dias)
        showNotification('Progresso', 'Gerando histórico de vendas...', 'info');
        const vendasDemo = [];
        const agora = new Date();
        
        for (let i = 0; i < 15; i++) {
            const dataVenda = new Date();
            dataVenda.setDate(agora.getDate() - Math.floor(Math.random() * 30));
            
            const randomProd = prods[Math.floor(Math.random() * prods.length)];
            const randomCli = clis[Math.floor(Math.random() * clis.length)];
            const qtd = Math.floor(Math.random() * 2) + 1;
            const total = randomProd.preco_venda * qtd;
            
            const metodos = ['pix', 'cartao_credito', 'dinheiro', 'prazo'];
            const metodo = metodos[Math.floor(Math.random() * metodos.length)];

            vendasDemo.push({
                loja_id: lojaId,
                id_cliente: randomCli.id,
                id_produto: randomProd.id,
                id_variante: null, // Simplificado
                quantidade: qtd,
                total: total,
                metodo_pagamento: metodo,
                status_pagamento: metodo === 'prazo' ? 'pendente' : 'pago',
                criado_em: dataVenda.toISOString()
            });
        }
        await db.from('vendas').insert(vendasDemo);

        // 5. DESPESAS
        showNotification('Progresso', 'Lançando obrigações financeiras...', 'info');
        const despesasDemo = [
            { descricao: 'Aluguel do Ponto', valor: 2800, categoria: 'Aluguel', pago: true, loja_id: lojaId, data_vencimento: new Date().toISOString() },
            { descricao: 'Conta de Luz', valor: 420.50, categoria: 'Energia/Água', pago: false, loja_id: lojaId, data_vencimento: new Date(agora.getFullYear(), agora.getMonth(), 25).toISOString() },
            { descricao: 'Marketing Instagram', valor: 500, categoria: 'Marketing', pago: true, loja_id: lojaId, data_vencimento: new Date().toISOString() },
            { descricao: 'Internet Fibra', valor: 120, categoria: 'Software/Assinaturas', pago: true, loja_id: lojaId, data_vencimento: new Date().toISOString() }
        ];
        await db.from('despesas').insert(despesasDemo);

        showNotification('Sucesso', 'Dados de demonstração gerados com sucesso!', 'success');
        if (typeof carregarDadosMaster === 'function') carregarDadosMaster();

    } catch (error) {
        console.error('Erro ao gerar demo:', error);
        alert('Erro ao gerar dados: ' + error.message);
    }
}

window.populateStoreWithDemoData = populateStoreWithDemoData;
