const categoryColors = {
    'Tênis': 'bg-blue-900 text-blue-100',
    'Sapatos': 'bg-green-900 text-green-100',
    'Sandálias': 'bg-yellow-900 text-yellow-100',
    'Botas': 'bg-purple-900 text-purple-100',
    'Camisetas': 'bg-red-900 text-red-100',
    'Calças': 'bg-indigo-900 text-indigo-100',
    'Jaquetas': 'bg-pink-900 text-pink-100',
    'Vestidos': 'bg-teal-900 text-teal-100',
    'Acessórios': 'bg-orange-900 text-orange-100'
};

// --- AUTO-SAVE LOGIC ---
let autoSaveInterval;

function startAutoSave() {
    if (autoSaveInterval) return;
    console.log('📝 Auto-save iniciado');
    autoSaveInterval = setInterval(() => {
        const variants = [];
        document.querySelectorAll('.variant-item').forEach(item => {
            variants.push({
                tamanho: item.querySelector('.variant-tamanho').value,
                cor: item.querySelector('.variant-cor').value,
                estoque: item.querySelector('.variant-estoque').value,
                alerta: item.querySelector('.variant-alerta').value,
                custo: item.querySelector('.variant-custo').value
            });
        });

        const formData = {
            ean: document.getElementById('ean').value,
            sku: document.getElementById('sku').value,
            nome: document.getElementById('nome').value,
            categoria: document.getElementById('categoria').value,
            preco_venda: document.getElementById('preco_venda').value,
            variantes: variants,
            timestamp: new Date().getTime()
        };

        // Só salva se houver pelo menos um nome ou SKU
        if (formData.nome || formData.sku || formData.ean) {
            localStorage.setItem('productDraft', JSON.stringify(formData));
            console.log('💾 Rascunho salvo automaticamente');
        }
    }, 10000); // 10 segundos para teste, mude para 30000 se preferir
}

function stopAutoSave() {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
    console.log('⏹️ Auto-save parado');
}

function restoreDraft() {
    const draft = localStorage.getItem('productDraft');
    if (!draft) return false;

    try {
        const data = JSON.parse(draft);
        // Só oferece restaurar se for recente (últimas 2 horas)
        if (new Date().getTime() - data.timestamp > 7200000) {
            localStorage.removeItem('productDraft');
            return false;
        }

        if (confirm(`Encontramos um rascunho de "${data.nome || 'Produto Sem Nome'}" do dia ${new Date(data.timestamp).toLocaleTimeString()}. Deseja restaurar?`)) {
            document.getElementById('ean').value = data.ean || '';
            document.getElementById('sku').value = data.sku || '';
            document.getElementById('nome').value = data.nome || '';
            document.getElementById('categoria').value = data.categoria || '';
            document.getElementById('preco_venda').value = data.preco_venda || '';

            const container = document.getElementById('variantsContainer');
            container.innerHTML = '';
            if (data.variantes && data.variantes.length > 0) {
                data.variantes.forEach(v => {
                    addVariant();
                    const last = container.lastElementChild;
                    last.querySelector('.variant-tamanho').value = v.tamanho;
                    last.querySelector('.variant-cor').value = v.cor;
                    last.querySelector('.variant-estoque').value = v.estoque;
                    last.querySelector('.variant-alerta').value = v.alerta;
                    last.querySelector('.variant-custo').value = v.custo;
                });
            } else {
                addVariant();
            }
            return true;
        } else {
            localStorage.removeItem('productDraft');
        }
    } catch (e) {
        console.error('Erro ao restaurar rascunho:', e);
    }
    return false;
}

function switchTab(tab) {
    if (activeTab === tab) return;
    activeTab = tab;

    const btnEstoque = document.getElementById('navEstoque');
    const btnVendas = document.getElementById('navVendas');
    const btnClientes = document.getElementById('navClientes');
    const btnFinancas = document.getElementById('navFinancas');
    const btnRelatorios = document.getElementById('navRelatorios');

    const sectionEstoque = document.getElementById('sectionEstoque');
    const sectionVendas = document.getElementById('sectionVendas');
    const sectionClientes = document.getElementById('sectionClientes');
    const sectionFinancas = document.getElementById('sectionFinancas');
    const sectionRelatorios = document.getElementById('sectionRelatorios');

    const sidebarEstoque = document.getElementById('sidebar');
    const sidebarVenda = document.getElementById('sidebarVenda');
    const sidebarCliente = document.getElementById('sidebarCliente');
    const sidebarDespesa = document.getElementById('sidebarDespesa');

    [btnEstoque, btnVendas, btnClientes, btnFinancas, btnRelatorios].forEach(btn => {
        btn.classList.remove('active');
    });

    [sectionEstoque, sectionVendas, sectionClientes, sectionFinancas, sectionRelatorios, sidebarEstoque, sidebarVenda, sidebarCliente, sidebarDespesa].forEach(sec => {
        sec.classList.add('hidden');
        sec.classList.remove('tab-content', 'open');
    });
    document.getElementById('drawerOverlay').classList.remove('active');

    const sections = {
        'estoque': sectionEstoque,
        'vendas': sectionVendas,
        'clientes': sectionClientes,
        'financas': sectionFinancas,
        'relatorios': sectionRelatorios
    };
    const buttons = {
        'estoque': btnEstoque,
        'vendas': btnVendas,
        'clientes': btnClientes,
        'financas': btnFinancas,
        'relatorios': btnRelatorios
    };

    const activeSection = sections[tab];
    const activeBtn = buttons[tab];

    if (activeSection) activeSection.classList.add('tab-content');
    if (activeBtn) activeBtn.classList.add('active');

    if (tab === 'estoque') {
        sectionEstoque.classList.remove('hidden');
        sidebarEstoque.classList.remove('hidden');
        document.getElementById('drawerOverlay').classList.remove('active');
        renderProductsTable();
    } else if (tab === 'vendas') {
        sectionVendas.classList.remove('hidden');
        sidebarVenda.classList.remove('hidden');
        renderSalesTable();
        updateSalesSummary();
    } else if (tab === 'clientes') {
        sectionClientes.classList.remove('hidden');
        sidebarCliente.classList.remove('hidden');
        loadClientes();
    } else if (tab === 'financas') {
        sectionFinancas.classList.remove('hidden');
        sidebarDespesa.classList.remove('hidden');
        loadExpenses();
    } else if (tab === 'relatorios') {
        sectionRelatorios.classList.remove('hidden');
        updateDashboardMetrics();
        renderCharts();
    }
}

function showNotification(title, message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationIcon = document.getElementById('notificationIcon');
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationMessage = document.getElementById('notificationMessage');

    let borderColor = 'border-blue-500';
    let icon = '<i class="fas fa-info-circle text-blue-500 text-xl"></i>';

    if (type === 'success') {
        borderColor = 'border-green-500';
        icon = '<i class="fas fa-check-circle text-green-500 text-xl"></i>';
    } else if (type === 'warning') {
        borderColor = 'border-yellow-500';
        icon = '<i class="fas fa-exclamation-triangle text-yellow-500 text-xl"></i>';
    } else if (type === 'error') {
        borderColor = 'border-red-500';
        icon = '<i class="fas fa-times-circle text-red-500 text-xl"></i>';
    }

    notification.className = `fixed top-4 right-4 z-[200] max-w-sm rounded-lg shadow-lg p-4 border-l-4 flex items-start slide-in bg-white dark:bg-slate-800 ${borderColor}`;
    notificationIcon.innerHTML = icon;
    notificationTitle.textContent = title;
    notificationMessage.textContent = message;

    notification.classList.remove('hidden');
    if (type !== 'error') setTimeout(() => notification.classList.add('hidden'), 5000);
}

function updateSummaryCards() {
    if (produtos.length === 0) return;

    const safeText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    safeText('totalProdutos', produtos.length);

    let totalEstoque = 0, estoqueBaixo = 0;
    const categorias = new Set();

    produtos.forEach(produto => {
        categorias.add(produto.categoria);
        produto.variantes.forEach(variante => {
            totalEstoque += variante.estoque_atual;
            if (variante.estoque_atual <= variante.alerta_minimo) estoqueBaixo++;
        });
    });

    safeText('totalEstoque', totalEstoque);
    safeText('estoqueBaixo', estoqueBaixo);
    safeText('totalCategorias', categorias.size);

    // Insights de Estoque
    const nomesCategorias = Array.from(categorias).slice(0, 3).join(', ') + (categorias.size > 3 ? '...' : '');
    safeText('insightTotalProdutos', `Categorias: ${nomesCategorias}`);

    // Encontrar produto com maior estoque físico
    const topEstoque = [...produtos].sort((a, b) =>
        b.variantes.reduce((acc, v) => acc + v.estoque_atual, 0) -
        a.variantes.reduce((acc, v) => acc + v.estoque_atual, 0)
    )[0];
    safeText('insightMaiorEstoque', topEstoque ? `Top: ${topEstoque.nome}` : 'Nenhum');

    // Lista de itens baixos
    const itensBaixos = produtos.filter(p => p.variantes.some(v => v.estoque_atual <= v.alerta_minimo))
        .map(p => p.nome).slice(0, 2).join(', ') + (estoqueBaixo > 2 ? '...' : '');
    safeText('insightEstoqueBaixo', estoqueBaixo > 0 ? `Itens: ${itensBaixos}` : 'Tudo em dia!');
}

function showSkeletonLoader(tableId, cols = 7, rows = 5) {
    const tableBody = document.getElementById(tableId);
    tableBody.innerHTML = '';
    for (let i = 0; i < rows; i++) {
        const tr = document.createElement('tr');
        let tds = '';
        for (let j = 0; j < cols; j++) {
            tds += `<td class="px-6 py-4"><div class="skeleton h-4 w-full"></div></td>`;
        }
        tr.innerHTML = tds;
        tableBody.appendChild(tr);
    }
}

function renderProductsTable() {
    const tableBody = document.getElementById('produtosTable');
    if (!produtos || produtos.length === 0) {
        showSkeletonLoader('produtosTable');
    }
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    let filtered = produtos.filter(p =>
        p.nome.toLowerCase().includes(searchTerm) ||
        p.sku.toLowerCase().includes(searchTerm) ||
        (p.ean && p.ean.toLowerCase().includes(searchTerm)) ||
        p.categoria.toLowerCase().includes(searchTerm)
    );

    const totalPages = Math.ceil(filtered.length / produtosPerPage);
    const startIndex = (currentPage - 1) * produtosPerPage;
    const paginated = filtered.slice(startIndex, startIndex + produtosPerPage);

    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages || totalPages === 0;
    document.getElementById('produtosMostrados').textContent = `${startIndex + 1}-${Math.min(startIndex + produtosPerPage, filtered.length)}`;
    document.getElementById('totalProdutosTabela').textContent = filtered.length;

    tableBody.innerHTML = '';

    if (paginated.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-500">Nenhum produto encontrado</td></tr>';
        return;
    }

    paginated.forEach(produto => {
        const estoqueTotal = produto.variantes.reduce((acc, v) => acc + v.estoque_atual, 0);
        const temBaixo = produto.variantes.some(v => v.estoque_atual <= v.alerta_minimo);

        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-slate-700/50';
        row.innerHTML = `
            <td class="px-6 py-4"><div class="text-sm font-medium text-gray-900 dark:text-white">${produto.nome}</div></td>
            <td class="px-6 py-4"><span class="px-2 py-1 text-xs font-semibold rounded-full ${categoryColors[produto.categoria] || 'bg-gray-100 text-gray-800'}">${produto.categoria}</span></td>
            <td class="px-6 py-4 text-sm text-gray-500">${produto.sku}</td>
            <td class="px-6 py-4 text-sm font-medium">R$ ${parseFloat(produto.preco_venda).toFixed(2).replace('.', ',')}</td>
            <td class="px-6 py-4 text-sm ${estoqueTotal === 0 ? 'text-red-500' : 'text-gray-500'}">${estoqueTotal}</td>
            <td class="px-6 py-4">${estoqueTotal === 0 ? '<span class="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">Esgotado</span>' : temBaixo ? '<span class="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Baixo</span>' : '<span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">OK</span>'}</td>
            <td class="px-6 py-4 text-sm font-medium">
                <button onclick="viewProductDetails('${produto.id}')" class="text-indigo-600 hover:text-indigo-900 mr-2" title="Ver Detalhes"><i class="fas fa-eye"></i></button>
                ${PERMISSIONS.canEditProducts() ? `<button onclick="editProduct('${produto.id}')" class="text-emerald-600 hover:text-emerald-900 mr-2 edit-product-btn" title="Editar"><i class="fas fa-edit"></i></button>` : ''}
                ${PERMISSIONS.canDeleteProducts() ? `<button onclick="deleteProduct('${produto.id}')" class="text-rose-600 hover:text-rose-900 delete-product-btn" title="Excluir"><i class="fas fa-trash"></i></button>` : ''}
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function renderSalesTable() {
    const tableBody = document.getElementById('vendasTable');
    const searchTerm = document.getElementById('searchVendasInput')?.value.toLowerCase() || '';

    let filtered = vendas.filter(v => (v.produtos?.nome || '').toLowerCase().includes(searchTerm));
    tableBody.innerHTML = filtered.length === 0 ? '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-500">Nenhuma venda encontrada</td></tr>' : '';

    filtered.forEach(v => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-slate-700/50 text-sm';
        row.innerHTML = `
            <td class="px-6 py-4 text-gray-500">${new Date(v.criado_em).toLocaleString('pt-BR')}</td>
            <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${v.produtos?.nome || 'Excluído'}</td>
            <td class="px-6 py-4 text-gray-500">${v.variantes?.tamanho || '-'} / ${v.variantes?.cor || '-'}</td>
            <td class="px-6 py-4">${v.quantidade}</td>
            <td class="px-6 py-4 text-emerald-600 font-bold">R$ ${parseFloat(v.total).toFixed(2).replace('.', ',')}</td>
            <td class="px-6 py-4">
                ${PERMISSIONS.canDeleteSales() ? `<button onclick="deleteSale('${v.id}')" class="text-rose-600 hover:text-rose-900 delete-sale-btn" title="Excluir Venda"><i class="fas fa-trash"></i></button>` : ''}
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function applyTheme(theme) {
    // Forçar sempre modo escuro
    const html = document.documentElement;
    html.classList.add('dark');
    localStorage.setItem('theme', 'dark');
}

function updateSalesSummary() {
    const hoje = new Date().toISOString().split('T')[0];
    const vHoje = vendas.filter(v => v.criado_em && v.criado_em.startsWith(hoje));
    const total = vendas.reduce((acc, v) => acc + (parseFloat(v.total) || 0), 0);

    const setElText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setElText('vendasHoje', vHoje.length);
    setElText('totalVendido', vendas.length);
    setElText('receitaTotal', `R$ ${total.toFixed(2).replace('.', ',')}`);

    // Insights de Vendas
    const ultimaVenda = [...vHoje].sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em))[0];
    const elVendaHoje = document.getElementById('insightVendaHoje');
    if (elVendaHoje) {
        elVendaHoje.textContent = ultimaVenda ?
            `${ultimaVenda.produtos?.nome || 'Produto Removido'} (${new Date(ultimaVenda.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})` :
            'Nenhuma venda feita hoje';
    }

    const elTotalVendido = document.getElementById('insightTotalVendido');
    if (elTotalVendido) {
        elTotalVendido.textContent = `Aprox. R$ ${(total / Math.max(vendas.length, 1)).toFixed(2)} por pedido`;
    }

    // Produto mais vendido em valor
    const vendasPorProduto = {};
    vendas.forEach(v => {
        const nomeProd = v.produtos?.nome || 'Produto Removido';
        vendasPorProduto[nomeProd] = (vendasPorProduto[nomeProd] || 0) + parseFloat(v.total);
    });
    const topProduto = Object.keys(vendasPorProduto).sort((a, b) => vendasPorProduto[b] - vendasPorProduto[a])[0];
    const elReceitaTotal = document.getElementById('insightReceitaTotal');
    if (elReceitaTotal) {
        elReceitaTotal.textContent = topProduto ? `Top: ${topProduto}` : 'Sem dados';
    }
}

function resetForm() {
    document.getElementById('productForm').reset();
    const eanField = document.getElementById('ean');
    if (eanField) eanField.value = '';
    document.getElementById('variantsContainer').innerHTML = '';
    addVariant();
    selectedProductId = null;
    localStorage.removeItem('productDraft'); // Limpa rascunho ao resetar manual ou salvar
}

function addVariant() {
    const div = document.createElement('div');
    div.className = 'variant-item p-4 border border-gray-100 rounded-xl bg-gray-50 dark:bg-slate-900/50 mb-3';
    div.innerHTML = `
        <div class="grid grid-cols-3 gap-3 mb-3">
            <input type="text" class="variant-tamanho w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-500" placeholder="Tam">
            <input type="text" class="variant-cor w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-500" placeholder="Cor">
            <input type="number" class="variant-estoque w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-500" value="0" min="0" placeholder="Estoque">
        </div>
        <div class="grid grid-cols-2 gap-3">
            <input type="number" class="variant-alerta w-full px-3 py-2 border rounded-lg" value="5" min="1" placeholder="Alerta Mín">
            <input type="number" class="variant-custo w-full px-3 py-2 border rounded-lg" value="0" min="0" step="0.01" placeholder="Preço de Custo">
        </div>
        <button type="button" class="mt-2 remove-variant text-rose-500 hover:bg-rose-50 p-2 rounded-lg w-full" onclick="this.closest('.variant-item').remove()"><i class="fas fa-trash mr-2"></i>Remover Variante</button>
    `;
    document.getElementById('variantsContainer').appendChild(div);
}

async function viewProductDetails(id) {
    const p = produtos.find(item => item.id == id);
    if (!p) return;

    // Helper para atualizar texto com segurança
    const setSafeText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setSafeText('modalProductName', p.nome);
    setSafeText('modalProductSku', `SKU: ${p.sku}`);
    setSafeText('modalProductCategory', p.categoria);
    setSafeText('modalProductPrice', `R$ ${parseFloat(p.preco_venda).toFixed(2).replace('.', ',')}`);

    const table = document.getElementById('modalVariantsTable');
    if (table) {
        table.innerHTML = '';
        p.variantes.forEach(v => {
            const row = `<tr><td class="px-4 py-2">${v.tamanho}</td><td class="px-4 py-2">${v.cor}</td><td class="px-4 py-2">${v.estoque_atual}</td><td class="px-4 py-2">${v.alerta_minimo}</td></tr>`;
            table.innerHTML += row;
        });
    }

    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('hidden');
    selectedProductId = id;
}

function editProduct(id) {
    const p = produtos.find(item => item.id == id);
    if (!p) return;

    document.getElementById('sku').value = p.sku;
    document.getElementById('nome').value = p.nome;
    document.getElementById('categoria').value = p.categoria;
    document.getElementById('preco_venda').value = p.preco_venda;

    const container = document.getElementById('variantsContainer');
    container.innerHTML = '';
    p.variantes.forEach(v => {
        addVariant();
        const last = container.lastElementChild;
        last.querySelector('.variant-tamanho').value = v.tamanho;
        last.querySelector('.variant-cor').value = v.cor;
        last.querySelector('.variant-estoque').value = v.estoque_atual;
        last.querySelector('.variant-alerta').value = v.alerta_minimo;
        last.querySelector('.variant-custo').value = v.preco_custo || 0;
    });

    selectedProductId = id;
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('drawerOverlay').classList.add('active');
}

function updateSaleProductDropdown() {
    const s = document.getElementById('saleProduto');
    s.innerHTML = '<option value="">Selecione um produto</option>';
    produtos.forEach(p => s.innerHTML += `<option value="${p.id}">${p.nome}</option>`);
}

function updateSaleVariantDropdown(id) {
    const s = document.getElementById('saleVariante');
    s.innerHTML = '<option value="">Selecione a variante</option>';
    const p = produtos.find(item => item.id == id);
    if (p) p.variantes.forEach(v => s.innerHTML += `<option value="${v.id}">${v.tamanho} / ${v.cor} (Estoque: ${v.estoque_atual})</option>`);
}

function updateSalePriceAndStock() {
    const pId = document.getElementById('saleProduto').value;
    const vId = document.getElementById('saleVariante').value;
    const p = produtos.find(item => item.id == pId);
    if (p) {
        document.getElementById('salePrecoUnitario').value = `R$ ${parseFloat(p.preco_venda).toFixed(2).replace('.', ',')}`;
        const v = p.variantes.find(item => item.id == vId);
        document.getElementById('saleEstoqueInfo').textContent = `Estoque disponível: ${v ? v.estoque_atual : '-'}`;
    }
}
const handleSaleBarcode = (ean) => {
    if (!ean) return;

    // Procura o produto pelo EAN
    const p = produtos.find(item => item.ean === ean);
    if (!p) return;

    // Seleciona o produto no dropdown
    const productSelect = document.getElementById('saleProduto');
    productSelect.value = p.id;

    // Atualiza o dropdown de variantes e preço
    updateSaleVariantDropdown(p.id);

    // Se tiver apenas uma variante, seleciona automaticamente
    const variantSelect = document.getElementById('saleVariante');
    if (p.variantes.length === 1) {
        variantSelect.value = p.variantes[0].id;
        updateSalePriceAndStock();
        // Foca na quantidade para o usuário apenas dar enter ou ajustar
        document.getElementById('saleQuantidade').focus();
        document.getElementById('saleQuantidade').select();
    } else {
        // Se tiver mais de uma, foca no seletor de variantes
        variantSelect.focus();
    }

    // Limpa o campo de EAN para o próximo bipe (opcional, dependendo do leitor)
    document.getElementById('saleEan').value = '';
    showNotification('Produto Encontrado', `${p.nome} selecionado via bipe.`, 'success');
};

function renderCart() {
    const list = document.getElementById('cartItemsList');
    const summary = document.getElementById('cartSummary');
    const grandTotalEl = document.getElementById('cartGrandTotal');
    const countEl = document.getElementById('cartCount');

    if (!list) return;

    let grandTotal = 0;

    if (carrinho.length === 0) {
        list.innerHTML = '<p id="emptyCartMsg" class="text-xs text-gray-400 text-center py-4 italic">Carrinho vazio</p>';
        if (summary) summary.classList.add('hidden');
        if (countEl) countEl.textContent = '0 itens';
        return;
    }

    list.innerHTML = ''; // Limpa a lista para renderizar os itens
    if (summary) summary.classList.remove('hidden');
    if (countEl) countEl.textContent = `${carrinho.length} ${carrinho.length === 1 ? 'item' : 'itens'}`;

    carrinho.forEach((item, index) => {
        const totalItem = item.preco * item.qtd;
        grandTotal += totalItem;

        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-100 dark:border-slate-600 group';
        row.innerHTML = `
            <div class="flex-1 min-w-0 text-left">
                <p class="text-sm font-bold text-gray-800 dark:text-white truncate">${item.nome}</p>
                <p class="text-[10px] text-gray-500 dark:text-gray-400 capitalize">${item.variante} • ${item.qtd}x R$ ${item.preco.toLocaleString('pt-BR')}</p>
            </div>
            <div class="flex items-center gap-3 text-right">
                <span class="text-sm font-bold text-indigo-600">R$ ${totalItem.toLocaleString('pt-BR')}</span>
                <button onclick="removeFromCart(${index})" class="text-gray-400 hover:text-red-500 transition p-1">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        list.appendChild(row);
    });

    if (grandTotalEl) grandTotalEl.textContent = `R$ ${grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function removeFromCart(index) {
    if (typeof carrinho !== 'undefined' && carrinho[index]) {
        showNotification('Removido', `${carrinho[index].nome} retirado do carrinho.`, 'info');
        carrinho.splice(index, 1);
        renderCart();
    }
}

// Função para renderizar gráficos de forma robusta
function renderCharts() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    try {
        if (window.myChart) window.myChart.destroy();

        // Exemplo básico de gráfico
        window.myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Vendas da Semana',
                    data: [12, 19, 3, 5, 2, 3, 7],
                    borderColor: '#f59e0b',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    } catch (e) {
        console.warn('Chart.js não pôde ser inicializado:', e);
    }
}
