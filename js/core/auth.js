// Atualiza o cabeçalho com os dados da loja
async function updateStoreHeader() {
    if (!supabaseClient) return;

    try {
        const lojaId = await getUserLojaId();
        if (!lojaId) return;

        const { data: loja } = await supabaseClient
            .from('lojas')
            .select('nome, descricao, logo_url')
            .eq('id', lojaId)
            .single();

        if (loja) {
            const headerTitle = document.getElementById('headerStoreName');
            const headerDesc = document.getElementById('headerStoreDesc');
            const storeLogoImg = document.getElementById('storeLogoImg');
            const defaultLogoIcon = document.getElementById('defaultLogoIcon');

            if (headerTitle) headerTitle.innerHTML = loja.nome.toUpperCase();
            if (headerDesc) headerDesc.textContent = loja.descricao || 'Gerenciamento Profissional';

            if (loja.logo_url && storeLogoImg) {
                storeLogoImg.src = loja.logo_url;
                storeLogoImg.classList.remove('hidden');
                if (defaultLogoIcon) defaultLogoIcon.classList.add('hidden');
            }
        }
    } catch (err) {
        console.error('Erro ao atualizar cabeçalho da loja:', err);
    }
}

async function checkSession() {
    console.log('🔍 checkSession: Iniciando verificação de sessão...');
    if (!supabaseClient) {
        console.log('❌ checkSession: supabaseClient não existe');
        return;
    }
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        console.log('🔍 checkSession: Sessão obtida:', session ? 'Existe' : 'Não existe');

        if (session) {
            console.log('✅ checkSession: Usuário autenticado, carregando perfil...');
            // Carregar perfil do usuário
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                localStorage.setItem('userRole', profile.role);
                console.log('✅ checkSession: Perfil carregado, role:', profile.role);
            } else {
                console.warn('⚠️ checkSession: Perfil ausente. Criando perfil padrão...');
                // Auto-repair: Create a default profile for existing user
                const { data: newProfile, error: createErr } = await supabaseClient
                    .from('profiles')
                    .insert({
                        id: session.user.id,
                        nome: session.user.email.split('@')[0],
                        role: 'dono'
                    })
                    .select()
                    .single();

                if (newProfile) {
                    localStorage.setItem('userRole', newProfile.role);
                    console.log('✅ checkSession: Novo perfil criado');
                } else {
                    console.error('❌ checkSession: Falha ao criar perfil:', createErr);
                }
            }


            console.log('🔄 checkSession: Escondendo login e mostrando app...');
            document.getElementById('loginSection').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');

            // Aguardar o DOM renderizar antes de configurar listeners
            setTimeout(() => {
                // Configurar event listeners do app (só existem após login)
                if (typeof setupAppEventListeners === 'function') {
                    console.log('🔧 checkSession: Configurando event listeners do app...');
                    try {
                        setupAppEventListeners();
                        console.log('✅ checkSession: Event listeners configurados com sucesso');
                    } catch (err) {
                        console.error('❌ checkSession: Erro ao configurar listeners:', err);
                    }
                }
            }, 100);

            console.log('📊 checkSession: Carregando dados...');
            try {
                await loadProducts();
                await loadSales(); // Agora seguro pois produtos já carregaram
                loadExpenses();
            } catch (errData) {
                console.error('Erro no carregamento de dados:', errData);
            }

            // Aplicar permissões na UI
            if (typeof applyUIPermissions === 'function') {
                setTimeout(() => {
                    applyUIPermissions();
                    console.log('✅ checkSession: Permissões aplicadas na UI');
                }, 200);
            }

            // 🛡️ VERIFICAÇÃO DE SEGURANÇA: Dono sem Loja (Reparo Automático)
            const { data: checkProfile } = await supabaseClient
                .from('profiles')
                .select('loja_id, role')
                .eq('id', session.user.id)
                .single();

            if (checkProfile && (checkProfile.role === 'dono' || checkProfile.role === 'admin') && !checkProfile.loja_id) {
                console.warn('🚨 Dono sem loja detectado. Iniciando reparo...');
                showRepairStoreModal();
            }

            console.log('✅ checkSession: Processo completo!');
            await updateStoreHeader(); // Atualiza nome da loja no topo
        } else {
            console.log('ℹ️ checkSession: Sem sessão, mostrando tela de login');
            document.getElementById('loginSection').classList.remove('hidden');
            document.getElementById('mainApp').classList.add('hidden');
        }
    } catch (error) {
        console.error("❌ checkSession: Erro ao verificar sessão:", error);
        document.getElementById('loginSection').classList.remove('hidden');
    }
}

// Funções para Reparo de Loja Faltante
function showRepairStoreModal() {
    const modal = document.getElementById('modalCriarLojaObrigatorio');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        const form = document.getElementById('formCriarLojaObrigatorio');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const nomeLoja = document.getElementById('obrigatorioNomeLoja').value.trim();
                if (!nomeLoja) return;

                const btn = document.getElementById('btnConfirmarCriarLoja');
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...';

                try {
                    await repairMissingStore(nomeLoja);
                    showNotification('Sucesso', 'Sua loja foi criada com sucesso!', 'success');
                    setTimeout(() => location.reload(), 1500);
                } catch (err) {
                    console.error(err);
                    showNotification('Erro', 'Falha ao criar loja: ' + err.message, 'error');
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-rocket"></i> Criar Minha Loja Agora';
                }
            };
        }
    }
}

async function repairMissingStore(nomeLoja) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) throw new Error("Sessão expirada");

    // 1. Gerar Chave Única
    const chaveUnica = Math.random().toString(36).substring(2, 10).toUpperCase();

    // 2. Criar a Loja
    const { data: novaLoja, error: lojaError } = await supabaseClient
        .from('lojas')
        .insert({
            nome: nomeLoja,
            chave_acesso: chaveUnica,
            dono_id: session.user.id,
            ativo: true
        })
        .select()
        .single();

    if (lojaError) throw lojaError;

    // 3. Vincular Perfil à Loja
    const { error: profError } = await supabaseClient
        .from('profiles')
        .update({ loja_id: novaLoja.id })
        .eq('id', session.user.id);

    if (profError) throw profError;

    return novaLoja;
}

async function loginUser(e) {
    e.preventDefault();
    const btn = document.getElementById('btnLogin');
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Autenticando...';

    if (!supabaseClient) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Acessar Sistema';
        return showNotification('Conexão Necessária', 'Configure o banco de dados antes de entrar (Botão "Configurar Conexão").', 'warning');
    }

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        showNotification('Bem-vindo!', 'Acesso concedido com sucesso.', 'success');
        await checkSession(); // checkSession chamará loadUserRole

    } catch (error) {
        console.error("Erro no login:", error);
        showNotification('Erro de Acesso', error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Acessar Sistema';
    }
}

async function logoutUser() {
    if (!confirm('Deseja realmente sair do sistema?')) return;

    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;

        localStorage.removeItem('userRole');
        lojaIdCache = null; // Limpa o cache para segurança

        produtos = [];
        vendas = [];
        clientes = [];
        despesas = [];

        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');

        showNotification('Sessão Encerrada', 'Você saiu do sistema com segurança.', 'info');
    } catch (error) {
        console.error("Erro ao deslogar:", error);
        showNotification('Erro ao sair', 'Tente novamente.', 'error');
    }
}

async function registerUser(e) {
    if (e) e.preventDefault();

    if (!supabaseClient) {
        return showNotification('Conexão Necessária', 'Configure o banco de dados antes de cadastrar.', 'warning');
    }

    const email = document.getElementById('regEmail')?.value.trim();
    const password = document.getElementById('regPassword')?.value.trim();
    const nome = document.getElementById('regNome')?.value.trim();
    const chaveAcesso = document.getElementById('regChaveAcesso')?.value.trim().toUpperCase();
    const nomeLoja = document.getElementById('regNomeLoja')?.value.trim();
    const btn = document.getElementById('btnRegister');

    if (!email || !password || !nome) {
        return showNotification('Erro', 'Preencha todos os campos obrigatórios.', 'error');
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    }

    try {
        // Obter tipo de cadastro selecionado
        const isNovaLoja = document.getElementById('btnNovaLoja')?.classList.contains('bg-amber-500');

        // Se NÃO for nova loja, validar chave de acesso
        let lojaId = null;
        let lojaRole = 'vendedor';

        if (!isNovaLoja) {
            if (!chaveAcesso) {
                return showNotification('Chave Necessária', 'Digite a chave de acesso fornecida pelo dono da loja.', 'warning');
            }

            // Buscar loja pela chave de acesso
            const { data: lojaEncontrada, error: lojaError } = await supabaseClient
                .from('lojas')
                .select('id, nome')
                .eq('chave_acesso', chaveAcesso)
                .single();

            if (lojaError || !lojaEncontrada) {
                return showNotification('Chave Inválida', 'A chave de acesso não existe ou está incorreta.', 'error');
            }

            lojaId = lojaEncontrada.id;
            console.log('✅ Chave válida! Vinculando à loja:', lojaEncontrada.nome);
        }

        // 1. Criar Usuário no Auth
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: email,
            password: password
        });

        if (authError) throw authError;

        if (authData.user) {
            console.log('👤 Usuário criado no Auth:', authData.user.id);

            // Se for nova loja, criar a loja primeiro
            if (isNovaLoja) {
                if (!nomeLoja) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-rocket"></i> Criar Conta';
                    return showNotification('Nome da Loja', 'Digite o nome da sua loja.', 'warning');
                }

                // Tenta gerar chave pelo banco, se falhar gera localmente
                let chaveUnica = '';
                try {
                    const { data: chaveBanco } = await supabaseClient.rpc('gerar_chave_acesso');
                    chaveUnica = chaveBanco || Math.random().toString(36).substring(2, 10).toUpperCase();
                } catch (e) {
                    chaveUnica = Math.random().toString(36).substring(2, 10).toUpperCase();
                }

                console.log('🔑 Gerando chave:', chaveUnica);

                // Criar a loja com retry simples
                const { data: novaLoja, error: lojaError } = await supabaseClient
                    .from('lojas')
                    .insert({
                        nome: nomeLoja,
                        chave_acesso: chaveUnica,
                        dono_id: authData.user.id,
                        ativo: true
                    })
                    .select()
                    .single();

                if (lojaError) {
                    console.error('❌ Erro ao criar loja:', lojaError);
                    throw new Error("Falha ao criar loja no banco: " + lojaError.message);
                }

                lojaId = novaLoja.id;
                lojaRole = 'dono';

                // Mostrar a chave para o usuário
                alert(`LOJA CRIADA COM SUCESSO!\n\nSua chave de acesso é: ${chaveUnica}\n\nGuarde-a para cadastrar funcionários.`);
            }

            // 2. Criar o Perfil vinculado à loja
            console.log('📝 Criando perfil para usuario:', authData.user.id, ' na loja:', lojaId);
            const { error: profileError } = await supabaseClient
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    nome: nome,
                    email: email,
                    role: lojaRole,
                    loja_id: lojaId
                });

            if (profileError) {
                console.error('❌ Erro ao criar perfil:', profileError);
                // Se der erro de política, tentamos um pequeno delay e retry
                await new Promise(r => setTimeout(r, 1000));
                await supabaseClient.from('profiles').upsert({
                    id: authData.user.id,
                    nome: nome,
                    email: email,
                    role: lojaRole,
                    loja_id: lojaId
                });
            }

            showNotification('Sucesso!', 'Conta criada com sucesso!', 'success');

            // Forçar login para garantir sessão
            await supabaseClient.auth.signInWithPassword({ email, password });
            window.location.reload(); // Recarrega para limpar todos os estados
        }

    } catch (error) {
        console.error("Erro no registro:", error);

        if (error.message && error.message.toLowerCase().includes('email')) {
            return showNotification('Erro no E-mail', `O e-mail "${email}" parece inválido.`, 'warning');
        }

        if (error.message && (error.message.includes('rate limit') || error.status === 429)) {
            return showNotification('Muitas Tentativas', 'Aguarde alguns minutos e tente novamente.', 'warning');
        }

        showNotification('Erro', error.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-rocket"></i> Criar Conta';
        }
    }
}

// Inicialização de Listeners de Auth
document.addEventListener('DOMContentLoaded', () => {
    // Toggle Login/Register
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const showLoginBtn = document.getElementById('showLoginBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTitle = document.getElementById('loginStoreName');

    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            if (loginTitle) loginTitle.textContent = 'Criar Conta';

            // ATALHO DE PRATICIDADE: Detectar automaticamente se precisa criar loja ou entrar
            if (supabaseClient) {
                const { data: lojas } = await supabaseClient.from('lojas').select('id').limit(1);
                const isPrimeiro = !lojas || lojas.length === 0;

                if (isPrimeiro) {
                    // Clica automaticamente em "Nova Loja" se o banco estiver vazio
                    document.getElementById('btnNovaLoja')?.click();
                } else {
                    // Clica em "Entrar em Loja" se já existirem lojas
                    document.getElementById('btnEntrarLoja')?.click();
                }
            }
        });
    }

    // Toggle Nova Loja / Entrar em Loja
    const btnNovaLoja = document.getElementById('btnNovaLoja');
    const btnEntrarLoja = document.getElementById('btnEntrarLoja');
    const nomeLojaCont = document.getElementById('nomeLojaCont');
    const chaveAcessoCont = document.getElementById('chaveAcessoCont');

    if (btnNovaLoja && btnEntrarLoja) {
        btnNovaLoja.addEventListener('click', () => {
            // Estilo Ativo para Nova Loja
            btnNovaLoja.classList.add('bg-amber-500', 'text-slate-900', 'shadow-sm');
            btnNovaLoja.classList.remove('text-slate-500', 'hover:text-slate-700', 'dark:hover:text-slate-300');

            // Estilo Inativo para Entrar Loja
            btnEntrarLoja.classList.remove('bg-amber-500', 'text-slate-900', 'shadow-sm');
            btnEntrarLoja.classList.add('text-slate-500', 'hover:text-slate-700', 'dark:hover:text-slate-300');

            nomeLojaCont.classList.remove('hidden');
            chaveAcessoCont.classList.add('hidden');
        });

        btnEntrarLoja.addEventListener('click', () => {
            // Estilo Ativo para Entrar Loja
            btnEntrarLoja.classList.add('bg-amber-500', 'text-slate-900', 'shadow-sm');
            btnEntrarLoja.classList.remove('text-slate-500', 'hover:text-slate-700', 'dark:hover:text-slate-300');

            // Estilo Inativo para Nova Loja
            btnNovaLoja.classList.remove('bg-amber-500', 'text-slate-900', 'shadow-sm');
            btnNovaLoja.classList.add('text-slate-500', 'hover:text-slate-700', 'dark:hover:text-slate-300');

            nomeLojaCont.classList.add('hidden');
            chaveAcessoCont.classList.remove('hidden');
        });
    }

    // Feedback Visual para Chave de Acesso
    const regChaveAcesso = document.getElementById('regChaveAcesso');
    if (regChaveAcesso) {
        regChaveAcesso.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (val.length === 8) {
                regChaveAcesso.classList.add('border-emerald-500', 'ring-emerald-500');
            } else {
                regChaveAcesso.classList.remove('border-emerald-500', 'ring-emerald-500');
            }
        });
    }

    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            if (loginTitle) loginTitle.textContent = 'VERUM GESTÃO';
        });
    }

    // Login Submit
    const loginFormEl = document.getElementById('loginForm');
    if (loginFormEl) {
        loginFormEl.addEventListener('submit', loginUser);
    }

    const btnRegister = document.getElementById('btnRegister');
    if (btnRegister) {
        btnRegister.addEventListener('click', registerUser);
    }

    // Check Session on Load
    checkSession();
});
