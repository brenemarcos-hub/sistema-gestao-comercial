// Função de auxílio para obter ID da loja do usuário logado

async function getUserLojaId() {
    if (!supabaseClient) return null;

    // Tenta usar o cache
    if (lojaIdCache) return lojaIdCache;

    try {
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) return null;

        const { data: profile, error: profError } = await supabaseClient
            .from('profiles')
            .select('loja_id')
            .eq('id', user.id)
            .single();

        if (profError) {
            console.error('❌ Erro ao buscar perfil:', profError);
            return null;
        }

        if (profile?.loja_id) {
            lojaIdCache = profile.loja_id;
            return lojaIdCache;
        }

        return null;
    } catch (err) {
        console.error('⚠️ Falha crítica no getUserLojaId:', err);
        return null;
    }
}

// ✅ VALIDAÇÃO GLOBAL - Verifica se o loja_id pertence ao usuário atual
async function validateLojaAccess(lojaId, userId) {
    if (!supabaseClient) return false;

    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('loja_id')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('❌ Erro ao validar acesso à loja:', error);
            return false;
        }

        return data?.loja_id === lojaId;
    } catch (err) {
        console.error('⚠️ Falha na validação de acesso:', err);
        return false;
    }
}

// Testar conexão com o Supabase
async function testConnection() {
    if (!supabaseClient) return false;

    try {
        // Testamos com a tabela 'lojas' que permite leitura pública (conforme o Limpador Nuclear)
        const { data, error } = await supabaseClient
            .from('lojas')
            .select('id')
            .limit(1);

        if (error) {
            // Se o erro for de conexão real (network) ou API key inválida
            console.error('Erro na conexão:', error);
            showNotification('Erro de conexão', 'Não foi possível conectar ao banco de dados. Verifique sua internet.', 'error');
            return false;
        }

        console.log('✅ Conexão estabelecida com sucesso.');
        return true;
    } catch (error) {
        return false;
    }
}


async function loadProducts() {
    if (!supabaseClient) return;

    const lojaId = await getUserLojaId();
    if (!lojaId) {
        console.warn('⚠️ Usuário sem loja vinculada');
        return;
    }

    try {
        const { data: produtosData, error: produtosError } = await supabaseClient
            .from('produtos')
            .select('*')
            .eq('loja_id', lojaId)
            .order('criado_em', { ascending: false });

        if (produtosError) throw produtosError;

        const produtosComVariantes = await Promise.all(
            produtosData.map(async (produto) => {
                const { data: variantes, error: variantesError } = await supabaseClient
                    .from('variantes')
                    .select('*')
                    .eq('id_produto', produto.id);

                if (variantesError) throw variantesError;

                return { ...produto, variantes: variantes || [] };
            })
        );

        produtos = produtosComVariantes;
        updateSummaryCards();
        renderProductsTable();
        loadClientes();
        if (activeTab === 'relatorios') renderCharts();

    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        showNotification('Erro ao carregar', 'Não foi possível carregar os produtos.', 'error');
    }
}

// Salvar produto
async function saveProduct(e) {
    e.preventDefault();
    if (!supabaseClient) return;

    const ean = document.getElementById('ean').value.trim();
    const sku = document.getElementById('sku').value;
    const nome = document.getElementById('nome').value;
    const categoria = document.getElementById('categoria').value;
    const preco_venda = document.getElementById('preco_venda').value;

    const variantes = [];
    document.querySelectorAll('.variant-item').forEach(item => {
        const tamanho = item.querySelector('.variant-tamanho').value;
        const cor = item.querySelector('.variant-cor').value;
        const estoque = parseInt(item.querySelector('.variant-estoque').value) || 0;
        const alerta = parseInt(item.querySelector('.variant-alerta').value) || 5;
        const custo = parseFloat(item.querySelector('.variant-custo').value) || 0;

        if (tamanho && cor) {
            variantes.push({ tamanho, cor, estoque_atual: estoque, alerta_minimo: alerta, preco_custo: custo });
        }
    });

    if (!sku || !nome || !categoria || !preco_venda || variantes.length === 0) {
        showNotification('Campos obrigatórios', 'Preencha todos os campos e variantes.', 'warning');
        return;
    }

    const cleanSku = sku.trim();
    const isEditing = selectedProductId !== null;

    try {
        let targetProductId = selectedProductId;
        let shouldSumStock = false;

        if (!isEditing) {
            const { data: existing } = await supabaseClient
                .from('produtos')
                .select('id')
                .ilike('sku', cleanSku)
                .maybeSingle();

            if (existing) {
                targetProductId = existing.id;
                shouldSumStock = true;
            }
        }

        if (targetProductId) {
            const lojaId = await getUserLojaId();
            await supabaseClient.from('produtos').update({
                sku: cleanSku,
                ean: ean,
                nome: nome.trim(),
                categoria: categoria.trim(),
                preco_venda: parseFloat(preco_venda)
            }).eq('id', targetProductId).eq('loja_id', lojaId); // Segurança extra: garante que só edite o produto da sua loja

            const { data: dbVariants } = await supabaseClient.from('variantes').select('*').eq('id_produto', targetProductId);

            for (const fVar of variantes) {
                const existingVar = (dbVariants || []).find(
                    v => v.tamanho.trim().toLowerCase() === fVar.tamanho.trim().toLowerCase() &&
                        v.cor.trim().toLowerCase() === fVar.cor.trim().toLowerCase()
                );

                if (existingVar) {
                    const novoEstoque = shouldSumStock ? Number(existingVar.estoque_atual) + Number(fVar.estoque_atual) : fVar.estoque_atual;
                    await supabaseClient.from('variantes').update({
                        estoque_atual: novoEstoque,
                        estoque_minimo: fVar.alerta_minimo,
                        custo_unitario: fVar.preco_custo
                    }).eq('id', existingVar.id);
                } else {
                    await supabaseClient.from('variantes').insert({
                        id_produto: targetProductId,
                        tamanho: fVar.tamanho.trim(),
                        cor: fVar.cor.trim(),
                        estoque_atual: fVar.estoque_atual,
                        estoque_minimo: fVar.alerta_minimo,
                        custo_unitario: fVar.preco_custo
                    });
                }
            }
            showNotification('Sucesso', shouldSumStock ? 'Estoque somado.' : 'Produto atualizado.', 'success');
        } else {
            const lojaId = await getUserLojaId();
            if (!lojaId) throw new Error("Loja não identificada. Faça login novamente.");

            const { data: newP, error: newPError } = await supabaseClient.from('produtos').insert({
                sku: cleanSku,
                ean: ean,
                nome: nome.trim(),
                categoria: categoria.trim(),
                preco_venda: parseFloat(preco_venda),
                loja_id: lojaId
            }).select();

            if (newPError) throw newPError;
            for (const v of variantes) {
                await supabaseClient.from('variantes').insert({
                    id_produto: newP[0].id,
                    tamanho: v.tamanho.trim(),
                    cor: v.cor.trim(),
                    estoque_atual: v.estoque_atual,
                    estoque_minimo: v.alerta_minimo,
                    custo_unitario: v.preco_custo
                });
            }
            showNotification('Cadastrado', 'Novo produto adicionado.', 'success');
        }

        document.getElementById('sidebar').classList.remove('open');
        resetForm();
        loadProducts();

    } catch (error) {
        console.error('Erro ao salvar:', error);
        showNotification('Erro ao salvar', 'Ocorreu um problema técnico.', 'error');
    }
}

// Excluir produto
async function deleteProduct(productId) {
    if (!confirm('Tem certeza que deseja excluir?')) return;

    try {
        // 🔒 VALIDAÇÃO DE SEGURANÇA: Verifica se o produto pertence à loja do usuário
        const lojaId = await getUserLojaId();
        if (!lojaId) {
            showNotification('Erro de autenticação', 'Não foi possível identificar sua loja.', 'error');
            return;
        }

        // Verifica se o produto pertence à loja antes de excluir
        const { data: produto, error: checkError } = await supabaseClient
            .from('produtos')
            .select('loja_id')
            .eq('id', productId)
            .single();

        if (checkError) throw checkError;

        if (produto.loja_id !== lojaId) {
            showNotification('Acesso negado', 'Você não tem permissão para excluir este produto.', 'error');
            console.error('⚠️ Tentativa de exclusão de produto de outra loja bloqueada!');
            return;
        }

        // Excluir variantes primeiro
        await supabaseClient.from('variantes').delete().eq('id_produto', productId);

        // Excluir produto com validação de loja_id
        const { error } = await supabaseClient
            .from('produtos')
            .delete()
            .eq('id', productId)
            .eq('loja_id', lojaId); // Segurança extra

        if (error) throw error;

        showNotification('Produto excluído', 'Sucesso.', 'success');
        loadProducts();
    } catch (error) {
        console.error('Erro ao excluir:', error);
        showNotification('Erro', 'Não foi possível excluir.', 'error');
    }
}

// Carregar vendas
async function loadSales() {
    if (!supabaseClient) return;

    const lojaId = await getUserLojaId();
    if (!lojaId) {
        console.warn('⚠️ Usuário sem loja vinculada');
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('vendas')
            .select('*')
            .eq('loja_id', lojaId)
            .order('criado_em', { ascending: false });
        if (error) throw error;

        vendas = (data || []).map(venda => {
            const produto = produtos.find(p => p.id == venda.id_produto);
            const variante = produto ? produto.variantes.find(v => v.id == venda.id_variante) : null;

            return {
                ...venda,
                produtos: { nome: produto ? produto.nome : 'Produto Removido' },
                variantes: {
                    tamanho: variante ? variante.tamanho : '-',
                    cor: variante ? variante.cor : '-'
                }
            };
        });

        renderSalesTable();
        updateSalesSummary();
        if (activeTab === 'relatorios') renderCharts();
    } catch (error) {
        console.error('Erro ao carregar vendas:', error);
    }
}

// Finalizar venda do carrinho (Bulk)
async function saveSale(e) {
    if (e) e.preventDefault();
    if (carrinho.length === 0) return;

    try {
        showNotification('Processando...', 'Sincronizando com o banco de dados.', 'info');

        // Cliente selecionado no dropdown da Sidebar de Venda
        const idCliente = document.getElementById('saleCliente').value || null;
        const lojaId = await getUserLojaId();

        if (!lojaId) {
            throw new Error('Não foi possível identificar sua loja. Faça login novamente.');
        }

        // 🔒 PROTEÇÃO CONTRA RACE CONDITION
        // Usar transação atômica via RPC para cada item do carrinho
        const vendasProcessadas = [];
        const erros = [];

        for (const item of carrinho) {
            try {
                // Chama a função SQL que faz tudo atomicamente
                const { data, error } = await supabaseClient.rpc('vender_produto', {
                    p_variant_id: item.variantId,
                    p_quantidade: item.qtd,
                    p_produto_id: item.productId,
                    p_preco_unitario: item.preco,
                    p_cliente_id: idCliente,
                    p_loja_id: lojaId
                });

                if (error) {
                    // Captura erros específicos da função SQL
                    throw new Error(error.message || `Erro ao processar ${item.nome}`);
                }

                vendasProcessadas.push(item.nome);
            } catch (itemError) {
                // Registra erro mas continua processando outros itens
                erros.push({
                    produto: item.nome,
                    variante: item.variante,
                    erro: itemError.message
                });
                console.error(`❌ Erro ao vender ${item.nome}:`, itemError);
            }
        }

        // Verificar resultado do processamento
        if (erros.length > 0 && vendasProcessadas.length === 0) {
            // Todos os itens falharam
            throw new Error(`Nenhum item pôde ser vendido:\n${erros.map(e => `• ${e.produto}: ${e.erro}`).join('\n')}`);
        } else if (erros.length > 0) {
            // Alguns itens falharam
            showNotification(
                'Venda parcial',
                `${vendasProcessadas.length} itens vendidos. ${erros.length} falharam:\n${erros.map(e => `• ${e.produto}: ${e.erro}`).join('\n')}`,
                'warning'
            );
        } else {
            // Tudo certo!
            showNotification('Sucesso!', `${carrinho.length} itens vendidos com sucesso.`, 'success');
        }

        // Fechar sidebar e resetar
        document.getElementById('sidebarVenda').classList.remove('open');
        document.getElementById('drawerOverlay').classList.remove('active');
        carrinho = [];
        renderCart();

        // Recarregar dados em ordem para evitar "Produto Removido"
        await loadProducts();
        await loadSales();

    } catch (error) {
        console.error('Erro na venda multi-item:', error);
        showNotification('Erro ao finalizar', error.message || 'Problema na transação.', 'error');
    }
}


// Excluir venda
async function deleteSale(saleId) {
    if (!confirm('Deseja excluir este registro de venda?')) return;

    try {
        // 🔒 VALIDAÇÃO DE SEGURANÇA: Verifica se a venda pertence à loja do usuário
        const lojaId = await getUserLojaId();
        if (!lojaId) {
            showNotification('Erro de autenticação', 'Não foi possível identificar sua loja.', 'error');
            return;
        }

        // Busca a venda com validação de loja
        const { data: venda, error: vendaError } = await supabaseClient
            .from('vendas')
            .select('quantidade, id_variante, loja_id')
            .eq('id', saleId)
            .single();

        if (vendaError) throw vendaError;

        // Verifica se a venda pertence à loja do usuário
        if (venda.loja_id !== lojaId) {
            showNotification('Acesso negado', 'Você não tem permissão para excluir esta venda.', 'error');
            console.error('⚠️ Tentativa de exclusão de venda de outra loja bloqueada!');
            return;
        }

        // Busca variante para restaurar estoque
        const { data: variante } = await supabaseClient
            .from('variantes')
            .select('estoque_atual')
            .eq('id', venda.id_variante)
            .single();

        // Restaura estoque
        await supabaseClient
            .from('variantes')
            .update({ estoque_atual: variante.estoque_atual + venda.quantidade })
            .eq('id', venda.id_variante);

        // Exclui venda com validação de loja_id
        await supabaseClient
            .from('vendas')
            .delete()
            .eq('id', saleId)
            .eq('loja_id', lojaId); // Segurança extra

        showNotification('Venda excluída', 'Estoque restaurado.', 'success');
        await loadProducts();
        await loadSales();
    } catch (error) {
        console.error('Erro ao excluir venda:', error);
        showNotification('Erro', 'Não foi possível restaurar estoque.', 'error');
    }
}
