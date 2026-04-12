// ============================================
// SISTEMA DE NÍVEIS DE CONTA (ROLES & PLANOS)
// ============================================

/**
 * NÍVEIS DE ACESSO (O QUE O USUÁRIO É)
 * Determina hierarquia dentro da loja.
 */
const ROLES = {
    VENDEDOR: 'vendedor', // Operacional (PDV, Estoque, Clientes)
    GERENTE: 'gerente',   // Administrativo (Preços, Relatórios de Vendas)
    DONO: 'dono',         // Total (Financeiro, Configurações da Loja)
    MASTER: 'master'      // Sistema (Audit, Backup, Manutenção Global)
};

const ROLE_HIERARCHY = {
    [ROLES.VENDEDOR]: 10,
    [ROLES.GERENTE]: 20,
    [ROLES.DONO]: 30,
    [ROLES.MASTER]: 100
};

/**
 * NÍVEIS DE ASSINATURA (O QUE A LOJA TEM)
 * Determina limites de recursos e ferramentas premium.
 */
const PLANS = {
    BASICA: 'basica',
    STAND: 'stand',
    PREMIUM: 'premium'
};

const PLAN_LIMITS = {
    [PLANS.BASICA]: {
        produtos: 300,
        usuarios: 1,
        lucro_real: false,
        backup_nuvem: false,
        export: false
    },
    [PLANS.STAND]: {
        produtos: 99999,
        usuarios: 5,
        lucro_real: true,
        backup_nuvem: true,
        export: false
    },
    [PLANS.PREMIUM]: {
        produtos: 99999,
        usuarios: 999,
        lucro_real: true,
        backup_nuvem: true,
        export: true
    }
};

/**
 * MATRIZ DE CAPACIDADES (O QUE PODE SER FEITO)
 * Centraliza a lógica de Role + Plan.
 */
const CAPABILITIES = {
    // --- VENDAS ---
    'pos:use': () => true, // Todos podem vender
    'sales:edit': () => hasMinimumRole(ROLES.GERENTE),
    'sales:delete': () => hasMinimumRole(ROLES.DONO),
    'sales:export': () => (hasMinimumRole(ROLES.DONO) && getStorePlan() === PLANS.PREMIUM),

    // --- PRODUTOS ---
    'products:view': () => true,
    'products:manage': () => hasMinimumRole(ROLES.GERENTE),
    'products:cost_price': () => hasMinimumRole(ROLES.DONO),
    'products:import_xml': () => hasMinimumRole(ROLES.GERENTE),

    // --- CLIENTES ---
    'clients:view': () => true,
    'clients:manage': () => true, // Vendedor pode cadastrar cliente
    'clients:delete': () => hasMinimumRole(ROLES.GERENTE),

    // --- FINANÇAS ---
    'finance:view': () => hasMinimumRole(ROLES.DONO) || (hasMinimumRole(ROLES.GERENTE) && getStorePlan() !== PLANS.BASICA),
    'finance:profit': () => getStorePlan() !== PLANS.BASICA && hasMinimumRole(ROLES.DONO),
    'expenses:manage': () => hasMinimumRole(ROLES.DONO),

    // --- CONFIGURAÇÃO ---
    'store:config': () => hasMinimumRole(ROLES.DONO),
    'users:manage': () => hasMinimumRole(ROLES.DONO) && PLAN_LIMITS[getStorePlan()]?.usuarios > 1,

    // --- MASTER ---
    'master:access': () => hasMinimumRole(ROLES.MASTER)
};

// ============================================
// FUNÇÕES ÚTEIS
// ============================================

function getUserRole() {
    if (localStorage.getItem('master_impersonate_id')) return ROLES.DONO;
    const role = localStorage.getItem('userRole') || ROLES.VENDEDOR;
    // Normalização rápida para legados
    if (role === 'usuario' || role === 'vendedor') return ROLES.VENDEDOR;
    if (role === 'admin' || role === 'dono') return ROLES.DONO;
    if (role === 'programador' || role === 'master') return ROLES.MASTER;
    return role;
}

function getStorePlan() {
    const impPlan = localStorage.getItem('master_impersonate_plan');
    if (impPlan && localStorage.getItem('master_impersonate_id')) return impPlan;
    return localStorage.getItem('storePlan') || PLANS.BASICA;
}

function hasMinimumRole(minRole) {
    const current = getUserRole();
    return (ROLE_HIERARCHY[current] || 0) >= (ROLE_HIERARCHY[minRole] || 0);
}

/**
 * Verifica se o usuário tem permissão para uma capacidade
 * @param {string} capability - ID da capacidade (ex: 'products:manage')
 * @returns {boolean}
 */
function can(capability) {
    if (getUserRole() === ROLES.MASTER) return true; // Master pode TUDO
    
    const checker = CAPABILITIES[capability];
    if (!checker) {
        console.warn(`Capacidade desconhecida: ${capability}`);
        return false;
    }
    return checker();
}

// ============================================
// APLICAÇÃO NA UI (DINÂMICA)
// ============================================

/**
 * Varre o DOM procurando elementos com atributos de permissão
 * data-capability: Requer can(capability)
 * data-role: Requer hasMinimumRole(role)
 */
function applyUIPermissions() {
    const role = getUserRole();
    console.log(`🔐 Aplicando Permissões (Role: ${role}, Plan: ${getStorePlan()})`);

    // 1. Elementos por CAPACIDADE
    document.querySelectorAll('[data-capability]').forEach(el => {
        const capability = el.getAttribute('data-capability');
        const allowed = can(capability);
        
        // Se tiver o atributo data-lock="true", em vez de esconder, desabilita e mostra cadeado
        if (el.getAttribute('data-lock') === 'true') {
            if (!allowed) {
                el.disabled = true;
                el.classList.add('opacity-50', 'cursor-not-allowed', 'grayscale');
                if (!el.querySelector('.fa-lock')) {
                    const lock = document.createElement('i');
                    lock.className = 'fas fa-lock ml-2 text-[10px] text-amber-500';
                    el.appendChild(lock);
                }
            } else {
                el.disabled = false;
                el.classList.remove('opacity-50', 'cursor-not-allowed', 'grayscale');
                const lock = el.querySelector('.fa-lock');
                if (lock) lock.remove();
            }
        } else {
            // Comportamento padrão: Esconder
            el.classList.toggle('hidden', !allowed);
            if (allowed) el.classList.remove('hidden');
        }
    });

    // 2. Elementos por ROLE MÍNIMA
    document.querySelectorAll('[data-role]').forEach(el => {
        const minRole = el.getAttribute('data-role');
        const allowed = hasMinimumRole(minRole);
        el.classList.toggle('hidden', !allowed);
    });

    // --- COMPORTAMENTOS ESPECÍFICOS ---
    
    // Notificar ui.js que as permissões mudaram (para renderizar tabelas etc)
    if (typeof renderProductsTable === 'function' && window.activeTab === 'estoque') renderProductsTable();
    if (typeof renderSalesTable === 'function' && window.activeTab === 'vendas') renderSalesTable();
}


/**
 * Atalho para verificar e alertar se não puder
 */
function checkPermissionOrNotify(capability, action = 'realizar esta ação') {
    if (!can(capability)) {
        showNotification(
            'Acesso Restrito',
            `Seu nível de conta não permite ${action}. Verifique seu plano ou cargo.`,
            'error'
        );
        return false;
    }
    return true;
}

// Objeto de permissões para compatibilidade com módulos de UI
const PERMISSIONS = {
    canViewProducts: () => can('products:view'),
    canManageProducts: () => can('products:manage'),
    canEditProducts: () => can('products:manage'),
    canDeleteProducts: () => can('products:manage'),
    canViewProfit: () => can('finance:profit'),
    canDeleteSales: () => can('sales:delete'),
};

// Exportar globais
window.ROLES = ROLES;
window.PLANS = PLANS;
window.PLAN_LIMITS = PLAN_LIMITS;
window.can = can;
window.hasMinimumRole = hasMinimumRole;
window.applyUIPermissions = applyUIPermissions;
window.checkPermissionOrNotify = checkPermissionOrNotify;
window.getUserRole = getUserRole;
window.getStorePlan = getStorePlan;
window.PERMISSIONS = PERMISSIONS;
