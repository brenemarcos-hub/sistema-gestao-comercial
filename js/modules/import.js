// ============================================
// IMPORTAÇÃO DE ESTOQUE VIA XML
// ============================================

let importResults = {
    success: [],
    errors: [],
    updated: 0,
    created: 0
};

// Abrir modal de importação
function openImportModal() {
    if (!PERMISSIONS.canManageProducts()) {
        return showNotification('Acesso Negado', 'Você não tem permissão para importar produtos.', 'error');
    }

    const modal = document.getElementById('importModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Limpar resultados anteriores
        document.getElementById('importResults').classList.add('hidden');
        document.getElementById('xmlFileInput').value = '';
    }
}

// Fechar modal de importação
function closeImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) modal.classList.add('hidden');
}

// Processar arquivo XML
async function processXMLFile() {
    const fileInput = document.getElementById('xmlFileInput');
    const file = fileInput.files[0];

    if (!file) {
        return showNotification('Erro', 'Selecione um arquivo XML.', 'error');
    }

    if (!file.name.endsWith('.xml')) {
        return showNotification('Erro', 'O arquivo deve ser XML (.xml).', 'error');
    }

    // Mostrar loading
    const btn = document.getElementById('processXMLBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    btn.disabled = true;

    try {
        const xmlText = await file.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        // Verificar erros de parsing
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            throw new Error('XML inválido. Verifique a estrutura do arquivo.');
        }

        // Resetar resultados
        importResults = {
            success: [],
            errors: [],
            updated: 0,
            created: 0
        };

        // Processar produtos
        await processXMLProducts(xmlDoc);

        // Mostrar resultados
        displayImportResults();

        // Recarregar produtos
        await loadProdutos();

        showNotification('Importação Concluída',
            `${importResults.updated} produtos atualizados, ${importResults.created} criados.`,
            'success');

    } catch (error) {
        console.error('Erro ao processar XML:', error);
        showNotification('Erro', error.message || 'Erro ao processar arquivo XML.', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Processar produtos do XML
async function processXMLProducts(xmlDoc) {
    // Suporta múltiplos formatos de XML
    let productNodes = xmlDoc.querySelectorAll('produto');

    // Se não encontrar, tenta outros formatos comuns
    if (productNodes.length === 0) {
        productNodes = xmlDoc.querySelectorAll('item');
    }
    if (productNodes.length === 0) {
        productNodes = xmlDoc.querySelectorAll('product');
    }

    if (productNodes.length === 0) {
        throw new Error('Nenhum produto encontrado no XML. Verifique a estrutura.');
    }

    for (const node of productNodes) {
        try {
            await processProductNode(node);
        } catch (error) {
            const sku = getXMLValue(node, 'sku') || getXMLValue(node, 'codigo') || 'Desconhecido';
            importResults.errors.push({
                sku: sku,
                error: error.message
            });
        }
    }
}

// Processar um nó de produto
async function processProductNode(node) {
    // Extrair dados (suporta múltiplos nomes de tags)
    const sku = getXMLValue(node, 'sku') || getXMLValue(node, 'codigo') || getXMLValue(node, 'id');
    const nome = getXMLValue(node, 'nome') || getXMLValue(node, 'descricao') || getXMLValue(node, 'name');
    const quantidade = parseInt(getXMLValue(node, 'quantidade') || getXMLValue(node, 'estoque') || getXMLValue(node, 'qty') || '0');
    const preco = parseFloat(getXMLValue(node, 'preco') || getXMLValue(node, 'valor') || getXMLValue(node, 'price') || '0');
    const precoCusto = parseFloat(getXMLValue(node, 'preco_custo') || getXMLValue(node, 'custo') || getXMLValue(node, 'cost') || '0');
    const categoria = getXMLValue(node, 'categoria') || getXMLValue(node, 'category') || 'Importado';

    // Validações
    if (!sku) {
        throw new Error('SKU/Código não encontrado');
    }
    if (!nome) {
        throw new Error(`Produto ${sku}: Nome não encontrado`);
    }
    if (isNaN(quantidade) || quantidade < 0) {
        throw new Error(`Produto ${sku}: Quantidade inválida`);
    }

    // Buscar produto existente pelo SKU
    const { data: existingProducts } = await supabaseClient
        .from('produtos')
        .select('*')
        .eq('sku', sku)
        .limit(1);

    if (existingProducts && existingProducts.length > 0) {
        // Atualizar produto existente
        const product = existingProducts[0];

        // Atualizar variante principal (primeira variante)
        if (product.variantes && product.variantes.length > 0) {
            const updatedVariantes = [...product.variantes];
            updatedVariantes[0].estoque_atual = quantidade;

            const updateData = {
                variantes: updatedVariantes
            };

            // Atualizar preço de venda se fornecido
            if (preco > 0) {
                updateData.preco_venda = preco;
            }

            // Atualizar preço de custo se fornecido
            if (precoCusto > 0) {
                updateData.preco_custo = precoCusto;
            }

            const { error } = await supabaseClient
                .from('produtos')
                .update(updateData)
                .eq('id', product.id);

            if (error) throw error;

            importResults.updated++;
            importResults.success.push({
                sku: sku,
                nome: nome,
                action: 'Atualizado',
                quantidade: quantidade
            });
        }
    } else {
        // Criar novo produto
        const newProduct = {
            nome: nome,
            sku: sku,
            categoria: categoria,
            preco_venda: preco > 0 ? preco : 0,
            preco_custo: precoCusto > 0 ? precoCusto : 0,
            variantes: [{
                id: Date.now().toString(),
                tamanho: 'Único',
                cor: 'Padrão',
                estoque_atual: quantidade,
                estoque_minimo: 5
            }]
        };

        const { error } = await supabaseClient
            .from('produtos')
            .insert(newProduct);

        if (error) throw error;

        importResults.created++;
        importResults.success.push({
            sku: sku,
            nome: nome,
            action: 'Criado',
            quantidade: quantidade
        });
    }
}

// Obter valor de tag XML (suporta múltiplos nomes)
function getXMLValue(node, tagName) {
    const element = node.querySelector(tagName);
    if (element) return element.textContent.trim();

    // Tenta com letra maiúscula
    const elementUpper = node.querySelector(tagName.toUpperCase());
    if (elementUpper) return elementUpper.textContent.trim();

    return null;
}

// Exibir resultados da importação
function displayImportResults() {
    const resultsDiv = document.getElementById('importResults');
    const successList = document.getElementById('importSuccessList');
    const errorList = document.getElementById('importErrorList');

    resultsDiv.classList.remove('hidden');

    // Sucessos
    if (importResults.success.length > 0) {
        successList.innerHTML = importResults.success.map(item => `
            <div class="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <div>
                    <span class="font-bold">${sanitizeHTML(item.sku)}</span> - ${sanitizeHTML(item.nome)}
                </div>
                <div class="text-sm">
                    <span class="text-green-600 dark:text-green-400">${item.action}</span> 
                    (Qtd: ${item.quantidade})
                </div>
            </div>
        `).join('');
    } else {
        successList.innerHTML = '<p class="text-gray-500 text-sm">Nenhum produto processado com sucesso.</p>';
    }

    // Erros
    if (importResults.errors.length > 0) {
        errorList.innerHTML = importResults.errors.map(item => `
            <div class="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                <span class="font-bold text-red-600">${sanitizeHTML(item.sku)}</span>: 
                <span class="text-sm">${sanitizeHTML(item.error)}</span>
            </div>
        `).join('');
    } else {
        errorList.innerHTML = '<p class="text-gray-500 text-sm">Nenhum erro encontrado.</p>';
    }
}

// Função auxiliar de sanitização (reutiliza do users.js)
function sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Baixar template XML de exemplo
function downloadXMLTemplate() {
    const template = `<?xml version="1.0" encoding="UTF-8"?>
<produtos>
    <!-- Exemplo 1: Produto completo com preço de custo -->
    <produto>
        <sku>TENIS-001</sku>
        <nome>Tênis Nike Air Max</nome>
        <quantidade>50</quantidade>
        <preco>299.90</preco>
        <preco_custo>150.00</preco_custo>
        <categoria>Tênis</categoria>
    </produto>
    
    <!-- Exemplo 2: Criar novo produto com custo -->
    <produto>
        <sku>CAMISA-002</sku>
        <nome>Camisa Adidas Preta</nome>
        <quantidade>30</quantidade>
        <preco>89.90</preco>
        <preco_custo>45.00</preco_custo>
        <categoria>Camisetas</categoria>
    </produto>
    
    <!-- Exemplo 3: Apenas atualizar estoque (sem alterar preços) -->
    <produto>
        <sku>CALCA-003</sku>
        <nome>Calça Jeans Levis</nome>
        <quantidade>15</quantidade>
    </produto>
    
    <!-- Exemplo 4: Atualizar estoque e preço de venda -->
    <produto>
        <sku>BONE-004</sku>
        <nome>Boné New Era</nome>
        <quantidade>25</quantidade>
        <preco>79.90</preco>
    </produto>
</produtos>`;

    const blob = new Blob([template], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-importacao.xml';
    a.click();
    URL.revokeObjectURL(url);

    showNotification('Download', 'Template XML baixado com sucesso!', 'success');
}
