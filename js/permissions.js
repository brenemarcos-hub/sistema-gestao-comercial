// ============================================
// SISTEMA DE PERMISSÕES POR ROLE
// ============================================

const ROLES = {
    VENDEDOR: 'vendedor', // Nível 1
    GERENTE: 'gerente',   // Nível 2
    DONO: 'dono',         // Nível 3
    MASTER: 'master'      // Nível 99 (Você)
};

// Hierarquia de permissões (do menor para o maior)
const ROLE_HIERARCHY = {
    'vendedor': 1,
    'gerente': 2,
    'dono': 3,
    'master': 99
};

// Obter role do usuário atual
function getUserRole() {
    const role = localStorage.getItem('userRole') || 'vendedor';
    // Normalização de roles legados
    if (role === 'usuario' || role === 'vendedor') return 'vendedor';
    if (role === 'admin' || role === 'dono') return 'dono';
    if (role === 'programador' || role === 'master') return 'master';
    return role;
}

// Verificar se o usuário tem permissão mínima
function hasMinimumRole(minimumRole) {
    const userRole = getUserRole();
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

// Verificar se o usuário tem um role específico
function hasRole(role) {
    return getUserRole() === role;
}

// Verificar se o usuário tem um dos roles especificados
function hasAnyRole(roles) {
    const userRole = getUserRole();
    return roles.includes(userRole);
}

// ============================================
// PERMISSÕES POR FUNCIONALIDADE
// ============================================

const PERMISSIONS = {
    // === NÍVEL 1: VENDEDOR ===
    canUsePOS: () => true,
    canViewStock: () => true,
    canCreateClients: () => true,
    canViewClients: () => true,
    canEditClients: () => true,

    // === NÍVEL 2: GERENTE (Tudo do 1 + Gerenciamento operacional) ===
    canManageProducts: () => hasMinimumRole(ROLES.GERENTE),
    canChangeStock: () => hasMinimumRole(ROLES.GERENTE),
    canViewSalesReports: () => hasMinimumRole(ROLES.GERENTE),
    canViewFinancialReports: () => hasMinimumRole(ROLES.GERENTE),
    canDeleteClients: () => hasMinimumRole(ROLES.GERENTE),
    canEditSales: () => hasMinimumRole(ROLES.GERENTE),

    // === NÍVEL 3: DONO (Tudo do 2 + Visão total do negócio) ===
    canViewCostPrice: () => hasMinimumRole(ROLES.DONO),
    canViewNetProfit: () => hasMinimumRole(ROLES.DONO),
    canViewAllFinancials: () => hasMinimumRole(ROLES.DONO),
    canManageEmployees: () => hasMinimumRole(ROLES.DONO),
    canDeleteSales: () => hasMinimumRole(ROLES.DONO),
    canChangeRoles: () => hasMinimumRole(ROLES.DONO),

    // === NÍVEL 99: MASTER (Tudo do 3 + Sistema) ===
    canManageSystemConfig: () => hasMinimumRole(ROLES.MASTER),
    canDeleteActivityLogs: () => hasMinimumRole(ROLES.MASTER),
    canAccessMaster: () => hasMinimumRole(ROLES.MASTER),
    canAccessSettings: () => hasMinimumRole(ROLES.DONO) // Dono+ pode configurar loja
};

// --- ÁREAS DE ACESSO (MAPPING PARA O CÓDIGO) ---
PERMISSIONS.canCreateProducts = PERMISSIONS.canManageProducts;
PERMISSIONS.canEditProducts = PERMISSIONS.canManageProducts;
PERMISSIONS.canDeleteProducts = PERMISSIONS.canManageProducts;
PERMISSIONS.canViewSales = PERMISSIONS.canUsePOS;
PERMISSIONS.canCreateSales = PERMISSIONS.canUsePOS;
PERMISSIONS.canViewExpenses = PERMISSIONS.canViewFinancialReports;
PERMISSIONS.canCreateExpenses = PERMISSIONS.canViewFinancialReports;
PERMISSIONS.canViewReports = PERMISSIONS.canViewSalesReports;
PERMISSIONS.canExportData = PERMISSIONS.canViewSalesReports;


// ============================================
// APLICAR PERMISSÕES NA UI
// ============================================

function applyUIPermissions() {
    const userRole = getUserRole();
    // Exibir botão de configurações apenas para o dono
    const btnConfig = document.getElementById('btnConfigLoja');
    if (btnConfig) {
        if (userRole === 'dono') {
            btnConfig.classList.remove('hidden');
        } else {
            btnConfig.classList.add('hidden');
        }
    }

    console.log('✅ Permissões aplicadas com sucesso!');
    console.log('🔐 Aplicando permissões para role:', userRole);

    // Limpar estilos inline forçados (do Master) antes de aplicar permissões
    const allElements = ['addProductBtn', 'addVendaBtn', 'addClientBtn', 'addExpenseBtn', 'usersBtn', 'configBtn', 'navFinancas', 'navRelatorios', 'importXMLBtn'];
    allElements.forEach(id => {
        const el = document.getElementById(id);
        if (el && userRole !== 'master') {
            // Remove estilos inline que podem ter sido aplicados pelo Master
            el.style.removeProperty('display');
            el.style.removeProperty('visibility');
            el.style.removeProperty('opacity');
        }
    });

    // Botões Principais (True = Esconde, False = Mostra)
    hideElementIf('addProductBtn', !PERMISSIONS.canManageProducts());
    hideElementIf('addVendaBtn', !PERMISSIONS.canUsePOS());
    hideElementIf('addClientBtn', !PERMISSIONS.canCreateClients());
    hideElementIf('addExpenseBtn', !PERMISSIONS.canViewFinancialReports());
    hideElementIf('usersBtn', !PERMISSIONS.canManageEmployees());
    hideElementIf('configBtn', !PERMISSIONS.canAccessSettings());
    hideElementIf('importXMLBtn', !PERMISSIONS.canManageProducts()); // Gerente+ pode importar

    // Navegação (Tabs)
    hideElementIf('navFinancas', !PERMISSIONS.canViewFinancialReports());
    hideElementIf('navRelatorios', !PERMISSIONS.canViewSalesReports());

    // Master vê TUDO (Força visibilidade com !important)
    if (userRole === 'master') {
        const masterElements = ['addProductBtn', 'addVendaBtn', 'addClientBtn', 'addExpenseBtn', 'usersBtn', 'configBtn', 'navFinancas', 'navRelatorios', 'importXMLBtn'];
        masterElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('hidden');
                el.style.setProperty('display', 'inline-flex', 'important');
                el.style.setProperty('visibility', 'visible', 'important');
                el.style.setProperty('opacity', '1', 'important');
            }
        });
    }

    // Badge de Role (DONO, MASTER, etc)
    updateRoleBadge(userRole);

    // Atualizar tabelas se necessário
    if (typeof renderProductsTable === 'function' && activeTab === 'estoque') renderProductsTable();
    if (typeof renderSalesTable === 'function' && activeTab === 'vendas') renderSalesTable();
}

// Função para Resetar Todos os Usuários para Vendedor (Útil para limpeza)
async function resetAllUserRoles() {
    if (!confirm('⚠️ ISSO VAI RESETAR TODOS OS USUÁRIOS PARA "VENDEDOR". Deseja continuar?')) return;

    try {
        const { error } = await supabaseClient
            .from('profiles')
            .update({ role: 'vendedor' })
            .neq('role', 'master'); // Protege quem já é Master

        if (error) throw error;
        showNotification('Sucesso', 'Todos os usuários foram resetados para Vendedor.', 'success');
        setTimeout(() => location.reload(), 2000);
    } catch (err) {
        console.error(err);
        alert('Erro ao resetar: ' + err.message);
    }
}

function hideElementIf(elementId, condition) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = condition ? 'none' : '';
    }
}

function updateRoleBadge(role) {
    // Estilos dos Badges
    const roleColors = {
        'vendedor': 'bg-gray-500',
        'gerente': 'bg-blue-600',
        'dono': 'bg-amber-500',
        'master': 'bg-indigo-600' // Cor distinta para Master
    };

    const roleLabels = {
        'vendedor': 'Vendedor',
        'gerente': 'Gerente',
        'dono': 'Dono',
        'master': 'Master'
    };

    // Fallback para roles antigos se existirem no DB
    const bgClass = roleColors[role] || 'bg-gray-500';
    const label = roleLabels[role] || role.toUpperCase();

    const headerName = document.getElementById('headerStoreName');
    if (headerName) {
        const existingBadge = document.querySelector('.role-badge');
        if (existingBadge) existingBadge.remove();

        const badge = document.createElement('span');
        badge.className = `role-badge ml-2 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded text-white ${bgClass}`;
        badge.textContent = label;
        headerName.appendChild(badge);
    }
}

function applyTablePermissions() {
    // Já tratado dinamicamente no render das tabelas (ui.js)
}

function checkPermissionOrNotify(permission, action = 'realizar esta ação') {
    if (!permission()) {
        showNotification(
            'Sem Permissão',
            `Você não tem permissão para ${action}. Entre em contato com um administrador.`,
            'error'
        );
        return false;
    }
    return true;
}

// Exportar para uso global
window.PERMISSIONS = PERMISSIONS;
window.hasMinimumRole = hasMinimumRole;
window.hasRole = hasRole;
window.hasAnyRole = hasAnyRole;
window.applyUIPermissions = applyUIPermissions;
window.checkPermissionOrNotify = checkPermissionOrNotify;
window.ROLES = ROLES;
window.resetAllUserRoles = resetAllUserRoles;
