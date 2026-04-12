// ============================================
// IMPORTAÇÃO DE ESTOQUE (XML E PLANILHAS)
// ============================================

let importResults = {
    success: [],
    errors: [],
    updated: 0,
    created: 0
};

// Abrir modal de importação
function openImportModal() {
    if (typeof PERMISSIONS !== 'undefined' && !PERMISSIONS.canManageProducts()) {
        return showNotification('Acesso Negado', 'Você não tem permissão para importar produtos.', 'error');
    }

    const modal = document.getElementById('importModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Limpar resultados anteriores
        document.getElementById('importResults').classList.add('hidden');
        const fileInput = document.getElementById('importFileInput');
        if (fileInput) fileInput.value = '';
    }
}

// Fechar modal de importação
function closeImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) modal.classList.add('hidden');
}

// Ponto de entrada unificado para importação
async function processImportFile() {
    const fileInput = document.getElementById('importFileInput');
    const file = fileInput.files[0];

    if (!file) {
        return showNotification('Erro', 'Selecione um arquivo (Excel, CSV ou XML).', 'error');
    }

    const fileName = file.name.toLowerCase();
    
    // Mostrar loading
    const btn = document.getElementById('processImportBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    btn.disabled = true;

    try {
        // Resetar resultados
        importResults = { success: [], errors: [], updated: 0, created: 0 };

        if (fileName.endsWith('.xml')) {
            await processXMLFile(file);
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
            await processExcelFile(file);
        } else {
            throw new Error('Formato de arquivo não suportado. Use .xlsx, .csv ou .xml');
        }

        // Mostrar resultados
        displayImportResults();
        
        // Recarregar produtos se houve sucesso
        if (importResults.updated > 0 || importResults.created > 0) {
            // Limpa cache para forçar recarga real do banco
            if (typeof loadProducts === 'function') {
                await loadProducts();
            }
        }

        if (importResults.errors.length > 0 && importResults.success.length === 0) {
            showNotification('Falha Geral', 'Nenhum produto foi importado. Verifique os avisos abaixo.', 'error');
        } else if (importResults.errors.length > 0) {
            showNotification('Importação Parcial', 
                `${importResults.success.length} OK, mas ${importResults.errors.length} falharam. Veja os detalhes.`, 
                'warning');
        } else {
            showNotification('Sucesso Total',
                `${importResults.updated} produtos atualizados e ${importResults.created} criados.`,
                'success');
        }

    } catch (error) {
        console.error('Erro na importação:', error);
        showNotification('Erro', error.message || 'Falha ao processar arquivo.', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Processar arquivo XML (Lógica original refatourada)
async function processXMLFile(file) {
    const xmlText = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) throw new Error('XML inválido. Verifique a estrutura.');

    let productNodes = xmlDoc.querySelectorAll('produto') || xmlDoc.querySelectorAll('item') || xmlDoc.querySelectorAll('product');
    
    if (productNodes.length === 0) {
        // Tenta buscar por qualquer tag que pareça um item se as padrões falharem
        productNodes = xmlDoc.querySelectorAll('produtos > *');
    }

    if (productNodes.length === 0) throw new Error('Nenhum produto encontrado no XML.');

    for (const node of productNodes) {
        try {
            const data = {
                sku: getXMLValue(node, 'sku') || getXMLValue(node, 'codigo') || getXMLValue(node, 'id'),
                nome: getXMLValue(node, 'nome') || getXMLValue(node, 'descricao') || getXMLValue(node, 'name'),
                quantidade: parseInt(getXMLValue(node, 'quantidade') || getXMLValue(node, 'estoque') || getXMLValue(node, 'qty') || getXMLValue(node, 'qCom') || '0'),
                preco: parseFloat(getXMLValue(node, 'preco') || getXMLValue(node, 'valor') || getXMLValue(node, 'price') || getXMLValue(node, 'vUnCom') || '0'),
                precoCusto: parseFloat(getXMLValue(node, 'preco_custo') || getXMLValue(node, 'custo') || getXMLValue(node, 'cost') || getXMLValue(node, 'vUnid') || '0'),
                categoria: getXMLValue(node, 'categoria') || getXMLValue(node, 'category') || getXMLValue(node, 'grupo') || 'Importado',
                tamanho: getXMLValue(node, 'tamanho') || getXMLValue(node, 'tam') || 'Único',
                cor: getXMLValue(node, 'cor') || getXMLValue(node, 'cor') || 'Padrão'
            };
            await processProductData(data);
        } catch (error) {
            importResults.errors.push({ sku: 'XML Node', error: error.message });
        }
    }
}

// Processar arquivo Excel/CSV
async function processExcelFile(file) {
    if (typeof XLSX === 'undefined') {
        throw new Error('Biblioteca XLSX não carregada. Verifique sua conexão ou recarregue a página.');
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                if (jsonData.length === 0) throw new Error('A planilha está vazia ou os dados não estão na primeira aba.');

                console.log(`📊 Processando ${jsonData.length} linhas da planilha.`);

                for (let i = 0; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    try {
                        // Função auxiliar para buscar chaves ignorando maiúsculas/minúsculas e espaços
                        const findValue = (row, ...keys) => {
                            const rowKeys = Object.keys(row);
                            for (let k of keys) {
                                const match = rowKeys.find(rk => rk.toLowerCase().trim() === k.toLowerCase());
                                if (match) return row[match];
                            }
                            return null;
                        };

                        const item = {
                            sku: findValue(row, 'sku', 'codigo', 'código', 'id', 'referencia'),
                            nome: findValue(row, 'nome', 'descricao', 'descrição', 'name', 'produto'),
                            quantidade: findValue(row, 'quantidade', 'estoque', 'qtd', 'qty', 'stock', 'unidades', 'quant', 'qtde'),
                            preco: findValue(row, 'preco', 'preço', 'valor', 'price', 'venda', 'vlr_venda'),
                            precoCusto: findValue(row, 'custo', 'preco_custo', 'preço_custo', 'cost', 'compra', 'vlr_custo'),
                            categoria: findValue(row, 'categoria', 'category', 'grupo', 'tipo') || 'Importado',
                            tamanho: findValue(row, 'tamanho', 'tam', 'size', 'num', 'numero'),
                            cor: findValue(row, 'cor', 'color', 'tonalidade')
                        };

                        // Limpeza e conversão de tipos
                        item.sku = item.sku ? item.sku.toString().trim() : null;
                        item.nome = item.nome ? item.nome.toString().trim() : null;
                        
                        // Conversão Robusta de Quantidade
                        let rawQty = item.quantidade?.toString().replace(',', '.') || '0';
                        item.quantidade = Math.floor(parseFloat(rawQty)) || 0;

                        item.preco = parseFloat(item.preco?.toString().replace(',', '.')) || 0;
                        item.precoCusto = parseFloat(item.precoCusto?.toString().replace(',', '.')) || 0;

                        console.log(`📦 Processando SKU: ${item.sku} | Qtd: ${item.quantidade} | Nome: ${item.nome}`);

                        if (!item.sku) {
                            throw new Error(`Linha ${i + 2}: Coluna SKU não encontrada ou vazia.`);
                        }

                        await processProductData(item);
                    } catch (err) {
                        console.warn('Erro na linha:', i + 2, err.message);
                        importResults.errors.push({ 
                            sku: row.sku || row.SKU || row.codigo || `Linha ${i + 2}`, 
                            error: err.message 
                        });
                    }
                }
                resolve();
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Erro ao ler o arquivo físico.'));
        reader.readAsArrayBuffer(file);
    });
}

// Lógica de salvamento no Banco (Unificada e Corrigida para a Estrutura Real)
async function processProductData(item) {
    if (!item.sku) throw new Error('SKU obrigatório não encontrado.');
    if (!item.nome) throw new Error(`Produto ${item.sku}: Nome não encontrado.`);

    const lojaId = await getUserLojaId();
    if (!lojaId) throw new Error("Loja não identificada. Por favor, saia e entre novamente.");

    // 1. Buscar produto existente nesta loja
    const { data: existingProducts, error: searchError } = await supabaseClient
        .from('produtos')
        .select('id, nome, preco_venda')
        .eq('loja_id', lojaId)
        .ilike('sku', item.sku.toString().trim())
        .maybeSingle();

    if (searchError) throw searchError;

    let targetProductId;

    if (existingProducts) {
        targetProductId = existingProducts.id;
        // Atualizar dados básicos do produto se necessário
        const updateData = { 
            nome: item.nome,
            categoria: item.categoria 
        };
        if (item.preco > 0) updateData.preco_venda = item.preco;
        
        await supabaseClient.from('produtos').update(updateData).eq('id', targetProductId);
        importResults.updated++;
    } else {
        // Criar novo produto
        const { data: newP, error: newPError } = await supabaseClient.from('produtos').insert({
            sku: item.sku.toString().trim(),
            nome: item.nome,
            categoria: item.categoria,
            preco_venda: item.preco > 0 ? item.preco : 0,
            loja_id: lojaId
        }).select().single();

        if (newPError) throw newPError;
        targetProductId = newP.id;
        importResults.created++;
    }

    // 2. Gerenciar Variantes (Tabela separada)
    const tamanho = (item.tamanho || 'Único').toString().trim();
    const cor = (item.cor || 'Padrão').toString().trim();

    console.log(`🔍 Buscando variante: ${tamanho} / ${cor} para produto ${targetProductId}`);

    // Buscar se esta variante específica já existe
    const { data: existingVariant, error: variantSearchError } = await supabaseClient
        .from('variantes')
        .select('id, estoque_atual')
        .eq('id_produto', targetProductId)
        .ilike('tamanho', tamanho)
        .ilike('cor', cor)
        .maybeSingle();

    if (variantSearchError) {
        console.error('Erro ao buscar variante:', variantSearchError);
        throw new Error(`Erro ao verificar estoque da variante: ${variantSearchError.message}`);
    }

    if (existingVariant) {
        // Atualiza estoque da variante existente
        const { error: updateVarError } = await supabaseClient.from('variantes').update({
            estoque_atual: item.quantidade,
            custo_unitario: item.precoCusto > 0 ? item.precoCusto : 0
        }).eq('id', existingVariant.id);

        if (updateVarError) throw new Error(`Erro ao atualizar estoque: ${updateVarError.message}`);
    } else {
        // Cria nova variante
        const { error: insertVarError } = await supabaseClient.from('variantes').insert({
            id_produto: targetProductId,
            tamanho: tamanho,
            cor: cor,
            estoque_atual: item.quantidade,
            estoque_minimo: 5,
            custo_unitario: item.precoCusto > 0 ? item.precoCusto : 0
        });

        if (insertVarError) {
            console.error('Erro ao inserir variante:', insertVarError);
            throw new Error(`Erro ao criar estoque/variante: ${insertVarError.message}`);
        }
    }

    importResults.success.push({ sku: item.sku, nome: item.nome, action: existingProducts ? 'Atualizado' : 'Criado', quantidade: item.quantidade });
}

// Obter valor de tag XML
function getXMLValue(node, tagName) {
    const element = node.querySelector(tagName) || node.querySelector(tagName.toUpperCase());
    return element ? element.textContent.trim() : null;
}

// Exibir resultados da importação
function displayImportResults() {
    const resultsDiv = document.getElementById('importResults');
    const successList = document.getElementById('importSuccessList');
    const errorList = document.getElementById('importErrorList');

    resultsDiv.classList.remove('hidden');

    if (importResults.success.length > 0) {
        successList.innerHTML = importResults.success.map(item => `
            <div class="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-100 dark:border-green-800/30 mb-1">
                <div class="text-xs">
                    <span class="font-bold text-green-700 dark:text-green-300">${sanitizeHTML(item.sku)}</span> - ${sanitizeHTML(item.nome)}
                </div>
                <div class="text-[10px] font-bold">
                    <span class="text-green-600">${item.action}</span> (Qtd: ${item.quantidade})
                </div>
            </div>
        `).join('');
    } else {
        successList.innerHTML = '<p class="text-gray-400 text-xs italic">Nenhum produto processado com sucesso.</p>';
    }

    if (importResults.errors.length > 0) {
        errorList.innerHTML = importResults.errors.map(item => `
            <div class="p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-100 dark:border-red-800/30 mb-1 text-[10px]">
                <span class="font-bold text-red-600">${sanitizeHTML(item.sku)}</span>: ${sanitizeHTML(item.error)}
            </div>
        `).join('');
        
        // Scroll suave para os erros se houver muitos
        setTimeout(() => {
            errorList.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300);
    } else {
        errorList.innerHTML = '<p class="text-gray-400 text-xs italic">Nenhum erro encontrado.</p>';
    }
}

function sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Baixar template Excel
function downloadExcelTemplate() {
    const data = [
        { sku: 'TENIS-XP-A01', nome: 'Tênis Ultra Boost XP', quantidade: 10, preco: 349.90, custo: 180.00, categoria: 'Calçados', tamanho: '42', cor: 'Preto/Cinza' },
        { sku: 'TENIS-XP-A01', nome: 'Tênis Ultra Boost XP', quantidade: 5, preco: 349.90, custo: 180.00, categoria: 'Calçados', tamanho: '40', cor: 'Preto/Cinza' },
        { sku: 'CAMISA-DRY-01', nome: 'Camiseta Dry Fit Performance', quantidade: 25, preco: 79.90, custo: 32.00, categoria: 'Camisetas', tamanho: 'G', cor: 'Azul Marinho' },
        { sku: 'CAMISA-DRY-01', nome: 'Camiseta Dry Fit Performance', quantidade: 12, preco: 79.90, custo: 32.00, categoria: 'Camisetas', tamanho: 'M', cor: 'Azul Marinho' },
        { sku: 'BONÉ-TRAINING', nome: 'Boné Training Adjustable', quantidade: 30, preco: 55.00, custo: 20.00, categoria: 'Acessórios', tamanho: 'Único', cor: 'Branco' }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Layout de Importação");

    // Ajustar largura das colunas
    const wscols = [
        {wch:15}, // sku
        {wch:30}, // nome
        {wch:12}, // quantidade
        {wch:10}, // preco
        {wch:10}, // custo
        {wch:15}, // categoria
        {wch:10}, // tamanho
        {wch:12}  // cor
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, "modelo-importacao-estoque.xlsx");
    showNotification('Download', 'Template Excel baixado com sucesso!', 'success');
}

// Baixar template XML
function downloadXMLTemplate() {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<estoque>
    <produto>
        <sku>TENIS-XP-A01</sku>
        <nome>Tênis Ultra Boost XP</nome>
        <quantidade>10</quantidade>
        <preco>349.90</preco>
        <preco_custo>180.00</preco_custo>
        <categoria>Calçados</categoria>
        <tamanho>42</tamanho>
        <cor>Preto/Cinza</cor>
    </produto>
    <produto>
        <sku>TENIS-XP-A01</sku>
        <nome>Tênis Ultra Boost XP</nome>
        <quantidade>5</quantidade>
        <preco>349.90</preco>
        <preco_custo>180.00</preco_custo>
        <categoria>Calçados</categoria>
        <tamanho>40</tamanho>
        <cor>Preto/Cinza</cor>
    </produto>
    <produto>
        <sku>CAMISA-DRY-01</sku>
        <nome>Camiseta Dry Fit Performance</nome>
        <quantidade>25</quantidade>
        <preco>79.90</preco>
        <preco_custo>32.00</preco_custo>
        <categoria>Camisetas</categoria>
        <tamanho>G</tamanho>
        <cor>Azul Marinho</cor>
    </produto>
</estoque>`;

    const blob = new Blob([xmlContent], { type: 'text/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_importacao.xml';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    showNotification('Download', 'Template XML baixado com sucesso!', 'success');
}

// Globalizar funções
window.openImportModal = openImportModal;
window.closeImportModal = closeImportModal;
window.processImportFile = processImportFile;
window.downloadExcelTemplate = downloadExcelTemplate;
window.downloadXMLTemplate = downloadXMLTemplate;
