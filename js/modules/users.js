let usuariosList = [];

// 🔒 SEGURANÇA: Sanitizar HTML para prevenir XSS
function sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Carregar usuários do banco de dados
async function loadUsers() {
    if (!can('users:manage')) {
        showNotification('Acesso Negado', 'Você não tem permissão para gerenciar usuários.', 'error');
        return;
    }

    const tbody = document.getElementById('usersTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> Carregando...</td></tr>';

    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .order('criado_em', { ascending: false });

        if (error) throw error;

        usuariosList = data;

        // Obter ID do usuário atual corretamente (Supabase v2)
        const { data: { session } } = await supabaseClient.auth.getSession();
        const currentUserId = session?.user?.id;

        renderUsersTable(currentUserId);
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        showNotification('Erro', 'Não foi possível carregar a lista de usuários.', 'error');
    }
}

// Renderizar tabela de usuários
function renderUsersTable(currentUserId) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (usuariosList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4 text-gray-500">Nenhum usuário encontrado.</td></tr>';
        return;
    }

    const currentUserRole = getUserRole();
    const isMaster = currentUserRole === ROLES.MASTER;

    // FILTRO DE INVISIBILIDADE (O PULO DO GATO)
    // Se eu não sou Master, eu não vejo Masters na lista.
    const visibleUsers = usuariosList.filter(user => {
        if ((user.role === ROLES.MASTER || user.role === 'programador') && !isMaster) return false;
        return true;
    });

    tbody.innerHTML = visibleUsers.map(user => {
        // Lógica de permissão para edição
        const isSelf = user.id === currentUserId;
        const isTargetMaster = user.role === ROLES.MASTER;
        const isTargetDono = user.role === ROLES.DONO;

        let canEdit = false;

        if (currentUserRole === ROLES.MASTER) {
            // Master pode editar qualquer um (exceto a si mesmo, tratado abaixo)
            canEdit = true;
        } else if (currentUserRole === ROLES.DONO) {
            // Dono pode editar vendedores e gerentes
            // Não pode editar Master nem outros Donos
            if (user.role === ROLES.VENDEDOR || user.role === ROLES.GERENTE || user.role === 'usuario') {
                canEdit = true;
            }
        }

        // Não permitir editar o próprio papel para evitar trancar-se para fora
        if (isSelf) canEdit = false;

        const disabledAttr = canEdit ? '' : 'disabled';
        const opacityClass = canEdit ? '' : 'opacity-50 cursor-not-allowed';

        // 🔒 SANITIZAR dados do usuário para prevenir XSS
        const safeName = sanitizeHTML(user.nome || 'Usuário Sem Nome');
        const safeEmail = user.email ? sanitizeHTML(user.email) : '<span class="italic text-xs">Email não registrado</span>';
        const safeRole = sanitizeHTML(user.role || ROLES.VENDEDOR);

        return `
        <tr class="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td class="p-4">
                <div class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <i class="fas fa-user"></i>
                    </div>
                    ${safeName}
                </div>
            </td>
            <td class="p-4 text-sm text-gray-500 dark:text-gray-400">
                ${safeEmail}
            </td>
            <td class="p-4">
                <span class="px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadgeClass(user.role)}">
                    ${safeRole.toUpperCase()}
                </span>
            </td>
            <td class="p-4">
                <select 
                    onchange="changeUserRole('${user.id}', this.value)" 
                    class="p-2 text-sm border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none ${opacityClass}"
                    ${disabledAttr}
                >
                    <option value="vendedor" ${user.role === ROLES.VENDEDOR || user.role === 'usuario' ? 'selected' : ''}>Vendedor</option>
                    <option value="gerente" ${user.role === ROLES.GERENTE ? 'selected' : ''}>Gerente</option>
                    <option value="dono" ${user.role === ROLES.DONO || user.role === 'admin' ? 'selected' : ''}>Dono</option>
                    ${isMaster ? `<option value="master" ${user.role === ROLES.MASTER ? 'selected' : ''}>Master</option>` : ''}
                </select>
            </td>
        </tr>
    `}).join('');
}

// Helper para cores das badges
function getRoleBadgeClass(role) {
    switch (role) {
        case ROLES.MASTER: return 'bg-red-100 text-red-700 border-red-200';
        case ROLES.DONO: return 'bg-amber-100 text-amber-700 border-amber-200';
        case ROLES.GERENTE: return 'bg-blue-100 text-blue-700 border-blue-200';
        case ROLES.VENDEDOR: return 'bg-gray-100 text-gray-700 border-gray-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
}

// Alterar o nível de acesso
async function changeUserRole(userId, newRole) {
    if (!can('users:manage')) return;

    // Confirmação visual rápida (Optimistic UI)
    const userIndex = usuariosList.findIndex(u => u.id === userId);
    if (userIndex >= 0) {
        usuariosList[userIndex].role = newRole;
        renderUsersTable();
    }

    try {
        const { error } = await supabaseClient
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) throw error;

        showNotification('Sucesso', 'Nível de acesso atualizado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao atualizar role:', error);
        showNotification('Erro', 'Falha ao atualizar permissão no servidor.', 'error');
        // Reverter em caso de erro
        loadUsers();
    }
}
