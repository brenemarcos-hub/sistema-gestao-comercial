// Função de auxílio para obter ID da loja do usuário logado

async function getUserLojaId() {
    if (!supabaseClient) return null;

    // Tenta usar o cache
    if (lojaIdCache) return lojaIdCache;

    // --- MODO SUPORTE (MASTER) ---
    const impId = localStorage.getItem('master_impersonate_id');
    const role = localStorage.getItem('userRole');
    if (impId && role === 'master') {
        console.log('🎭 MODO SUPORTE ATIVO: Acessando loja via Personificação');
        return impId;
    }

    try {
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) return null;

        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('loja_id')
            .eq('id', user.id)
            .single();

        if (profileError || !profile || !profile.loja_id) {
            // Se já estamos com o modal aberto, não fazemos nada nem logamos erro para evitar loop
            const modalLoja = document.getElementById('modalCriarLojaObrigatorio');
            if (modalLoja && !modalLoja.classList.contains('hidden')) return null;

            // --- NOVO: Abrir modal de criação se for Dono ---
            const userRole = localStorage.getItem('userRole');
            if (userRole === 'dono') {
                const subBlocker = document.getElementById('subscriptionBlocker');
                const loginSection = document.getElementById('loginSection');
                
                if (modalLoja) {
                    modalLoja.classList.remove('hidden');
                    modalLoja.classList.add('flex');
                    if (subBlocker) subBlocker.classList.add('hidden');
                    if (loginSection) loginSection.classList.add('hidden');
                    
                    setTimeout(() => {
                        const input = document.getElementById('obrigatorioNomeLoja');
                        if (input) input.focus();
                    }, 500);
                }
            }
            return null;
        }

        lojaIdCache = profile.loja_id;
        return profile.loja_id;
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


// --- CACHE INTELIGENTE ---
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutos

function getFromCache(key) {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp > CACHE_EXPIRATION) return null;
        console.log(`⚡ Dados carregados do cache: ${key}`);
        return data;
    } catch (e) { return null; }
}
window.getFromCache = getFromCache;

function saveToCache(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) { console.warn('Falha ao salvar no cache local', e); }
}
window.saveToCache = saveToCache;

async function loadProducts(forceRefresh = false) {
    if (!supabaseClient) return;

    const lojaId = await getUserLojaId();
    if (!lojaId) {
        console.warn('⚠️ Usuário sem loja vinculada');
        return;
    }

    // Tentar carregar do cache primeiro (se não for refresh forçado)
    if (!forceRefresh) {
        const cached = getFromCache(`produtos_${lojaId}`);
        if (cached) {
            produtos = cached;
            updateSummaryCards();
            renderProductsTable();
            // Carrega o resto do cache ou banco
            loadClientes();
            if (activeTab === 'relatorios') renderCharts();
            return;
        }
    }

    try {
        console.log('📡 Buscando produtos do banco de dados...');
        
        // 🚀 OTIMIZAÇÃO: Busca única com variantes (Join)
        const { data: produtosData, error: produtosError } = await supabaseClient
            .from('produtos')
            .select('*, variantes(*)') // Pegamos o produto E todas as suas variantes em uma só query
            .eq('loja_id', lojaId)
            .order('criado_em', { ascending: false });

        if (produtosError) throw produtosError;

        produtos = produtosData || [];
        
        // Salvar no cache
        saveToCache(`produtos_${lojaId}`, produtos);

        updateSummaryCards();
        renderProductsTable();
        await loadClientes();
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

        // Capturar Imagem da Prévia
        const imagePreview = document.getElementById('productImagePreview');
        const imagemUrl = imagePreview && !imagePreview.classList.contains('hidden') ? imagePreview.src : null;

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

            // --- HISTÓRICO DE PREÇOS ---
            const { data: oldProd } = await supabaseClient.from('produtos').select('preco_venda').eq('id', targetProductId).single();
            const pNovo = parseFloat(preco_venda);
            const pAntigo = oldProd ? parseFloat(oldProd.preco_venda) : 0;

            if (pNovo !== pAntigo) {
                const { data: { user } } = await supabaseClient.auth.getUser();
                await supabaseClient.from('historico_precos').insert({
                    loja_id: lojaId,
                    produto_id: targetProductId,
                    preco_antigo: pAntigo,
                    preco_novo: pNovo,
                    alterado_por: user?.id
                });
            }

            await supabaseClient.from('produtos').update({
                sku: cleanSku,
                ean: ean,
                nome: nome.trim(),
                categoria: categoria.trim(),
                preco_venda: pNovo,
                imagem_url: imagemUrl
            }).eq('id', targetProductId).eq('loja_id', lojaId);

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
            
            // Registrar Ação: Edição
            registrarAcao(null, null, 'editou_produto', 'produto', targetProductId, { 
                sku: cleanSku, 
                nome: nome,
                isSummingStock: shouldSumStock
            });
        } else {
            const lojaId = await getUserLojaId();
            if (!lojaId) throw new Error("Loja não identificada. Faça login novamente.");

            // --- TRAVA DE PLANO: Limite de Produtos ---
            const plan = getStorePlan();
            const limit = PLAN_LIMITS[plan]?.produtos || 500;
            const userRole = getUserRole();

            if (produtos.length >= limit && userRole !== 'master') {
                return showNotification(
                    'Limite do Plano', 
                    `Seu plano ${plan.toUpperCase()} permite até ${limit} produtos. Faça upgrade para cadastrar mais.`, 
                    'warning'
                );
            }

            const { data: newP, error: newPError } = await supabaseClient.from('produtos').insert({
                sku: cleanSku,
                ean: ean,
                nome: nome.trim(),
                categoria: categoria.trim(),
                preco_venda: parseFloat(preco_venda),
                loja_id: lojaId,
                imagem_url: imagemUrl
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

            // Registrar Ação: Criação
            registrarAcao(null, null, 'criou_produto', 'produto', newP[0].id, {
                sku: cleanSku,
                nome: nome.trim()
            });
        }

        document.getElementById('sidebar').classList.remove('open');
        stopAutoSave();
        resetForm();
        loadProducts(true);

    } catch (error) {
        console.error('Erro ao salvar:', error);
        capturarErro(error, { funcao: 'saveProduct', sku: ean || sku });
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
        
        // Registrar Ação: Exclusão
        registrarAcao(null, null, 'excluiu_produto', 'produto', productId);

        loadProducts(true);
    } catch (error) {
        console.error('Erro ao excluir:', error);
        capturarErro(error, { funcao: 'deleteProduct', productId: productId });
        showNotification('Erro', 'Não foi possível excluir.', 'error');
    }
}

/**
 * 🕵️ AUDITORIA: Registra quando uma loja abre o sistema
 */
async function registrarAcessoAuditoria() {
    if (!supabaseClient) return;
    
    // Evita registrar acessos do Master na auditoria de lojas
    if (localStorage.getItem('userRole') === 'master') return;

    try {
        const lojaId = await getUserLojaId();
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!lojaId || !user) return;

        const { data: profile } = await supabaseClient.from('profiles').select('nome').eq('id', user.id).single();

        // Detectar dispositivo de forma simples
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const browser = navigator.userAgent.split(') ')[1] || 'Web Browser';

        await supabaseClient.from('logs_acessos').insert({
            usuario_id: user.id,
            usuario_nome: profile?.nome || user.email,
            usuario_email: user.email,
            loja_id: lojaId,
            acao: 'login',
            dispositivo: isMobile ? 'mobile' : 'desktop',
            navegador: browser,
            ip: '0.0.0.0', // O Supabase captura o IP real se configurado no banco
            criado_em: new Date().toISOString()
        });
    } catch (err) {
        console.warn('⚠️ Falha ao registrar log de acesso:', err);
    }
}

// Carregar vendas
async function loadSales(forceRefresh = false) {
    if (!supabaseClient) return;

    const lojaId = await getUserLojaId();
    if (!lojaId) {
        console.warn('⚠️ Usuário sem loja vinculada');
        return;
    }

    // Cache para vendas
    if (!forceRefresh) {
        const cached = getFromCache(`vendas_${lojaId}`);
        if (cached) {
            vendas = cached;
            renderSalesTable();
            updateSalesSummary();
            if (activeTab === 'relatorios') renderCharts();
            return;
        }
    }

    try {
        console.log('📡 Buscando vendas do banco de dados...');
        const { data, error } = await supabaseClient
            .from('vendas')
            .select('*')
            .eq('loja_id', lojaId)
            .order('criado_em', { ascending: false });
        if (error) throw error;

        vendas = (data || []).map(venda => {
            const produto = produtos.find(p => p.id == venda.id_produto);
            const variante = produto ? produto.variantes.find(v => v.id == venda.id_variante) : null;
            
            const idC = venda.id_cliente || venda.cliente_id;
            const cliente = (typeof clientes !== 'undefined' ? clientes : []).find(c => c.id == idC);

            return {
                ...venda,
                produtos: { 
                    nome: produto ? produto.nome : 'Produto Removido',
                    imagem_url: produto ? produto.imagem_url : null
                },
                variantes: {
                    tamanho: variante ? variante.tamanho : '-',
                    cor: variante ? variante.cor : '-'
                },
                cliente_nome: cliente ? cliente.nome : 'Venda Direta'
            };
        });

        // Salvar no cache
        saveToCache(`vendas_${lojaId}`, vendas);

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
        const idClienteVal = document.getElementById('saleCliente').value;
        const idCliente = idClienteVal === "" ? null : idClienteVal;
        const lojaId = await getUserLojaId();

        if (!lojaId) {
            throw new Error('Não foi possível identificar sua loja. Faça login novamente.');
        }

        setLoading('btnFinalizeSale', true, 'Faturando...');

        // 🔒 PROTEÇÃO CONTRA RACE CONDITION
        // Usar transação atômica via RPC para cada item do carrinho
        const vendasProcessadas = [];
        const erros = [];

        // Coleta de dados de pagamento
        const metodoPagamento = document.getElementById('saleMetodoPagamento').value;
        const statusPagamento = document.getElementById('saleStatusPagamento').value;
        const parcelas = parseInt(document.getElementById('saleParcelas').value) || 1;
        const dataProximo = document.getElementById('saleDataProximo').value || null;

        for (const item of carrinho) {
            try {
                // Chama a função SQL que faz tudo atomicamente (agora com suporte a pagamentos)
                const { data, error } = await supabaseClient.rpc('vender_produto', {
                    p_variant_id: item.variantId,
                    p_quantidade: item.qtd,
                    p_produto_id: item.productId,
                    p_preco_unitario: item.preco,
                    p_cliente_id: idCliente,
                    p_loja_id: lojaId,
                    p_metodo_pagamento: metodoPagamento,
                    p_status_pagamento: statusPagamento,
                    p_parcelas: parcelas,
                    p_data_proximo: dataProximo
                });

                if (error) {
                    // Captura erros específicos da função SQL
                    throw new Error(error.message || `Erro ao processar ${item.nome}`);
                }

                vendasProcessadas.push(item.nome);
            } catch (itemError) {
                // ... (rest of the catch)
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

        // Registrar Ação: Venda
        registrarAcao(null, null, 'vendeu', 'venda', null, { 
            quantidade_itens: carrinho.length,
            ids_itens: carrinho.map(i => i.productId)
        });

        // Fechar sidebar e resetar
        document.getElementById('sidebarVenda').classList.remove('open');
        document.getElementById('drawerOverlay').classList.remove('active');
        carrinho = [];
        renderCart();

        // Recarregar dados em ordem para evitar "Produto Removido"
        await loadProducts(true);
        await loadSales(true);

    } catch (error) {
        console.error('Erro na venda multi-item:', error);
        capturarErro(error, { funcao: 'saveSale', itensNoCarrinho: carrinho.length });
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
        await loadProducts(true);
        await loadSales(true);
    } catch (error) {
        console.error('Erro ao excluir venda:', error);
        showNotification('Erro', 'Não foi possível restaurar estoque.', 'error');
    }
}

async function changeSaleStatus(saleId, newStatus) {
    if (!supabaseClient) return;

    try {
        const { error } = await supabaseClient
            .from('vendas')
            .update({ status_pagamento: newStatus })
            .eq('id', saleId);

        if (error) throw error;

        showNotification('Status Atualizado', `Venda marcada como ${newStatus.toUpperCase()}.`, 'success');
        
        // Registrar Ação
        if (typeof registrarAcao === 'function') {
            registrarAcao(null, null, 'alterou_status_venda', 'venda', saleId, { status: newStatus });
        }

        // Recarregar dados
        loadSales();
        loadProducts(true);
    } catch (error) {
        console.error('Erro ao mudar status:', error);
        showNotification('Erro', 'Não foi possível atualizar o status.', 'error');
    }
}
window.changeSaleStatus = changeSaleStatus;
