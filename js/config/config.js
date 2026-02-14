// =====================================================
// CONFIGURAÇÕES DO SUPABASE
// =====================================================
// ⚠️ DESENVOLVIMENTO LOCAL: Carrega js/config.production.js
// ⚠️ PRODUÇÃO (Netlify): Usa js/config.netlify.js
// =====================================================

// O config.production.js ou config.netlify.js já definem window.SUPABASE_CONFIG
// Este arquivo apenas garante que existe um fallback

window.SUPABASE_CONFIG = window.SUPABASE_CONFIG || {
    url: '',
    key: ''
};

// Avisar se não foi configurado
if (!window.SUPABASE_CONFIG.url || !window.SUPABASE_CONFIG.key) {
    console.error('❌ SUPABASE_CONFIG não configurado!');
    console.warn('📝 Local: Carregue js/config.production.js no HTML');
    console.warn('☁️ Netlify: Carregue js/config.netlify.js no HTML');
}

// VARIÁVEIS GLOBAIS DO SISTEMA
var supabaseClient = null;
var produtos = [];
var vendas = [];
var clientes = [];
var despesas = [];
var carrinho = [];
var activeTab = 'estoque';
var currentPage = 1;
var produtosPerPage = 10;
var selectedProductId = null;
var selectedClientId = null;
var selectedExpenseId = null;
var lojaIdCache = null;
var appListenersInitialized = false;

// =====================================================
// SISTEMA DE UTILITÁRIOS GLOBAIS
// =====================================================

// 23. SISTEMA DE FEATURE FLAGS
window.FEATURES = {
    IMPORTACAO_XML: true,
    get RELATORIO_AVANCADO() {
        return typeof getUserRole === 'function' ? getUserRole() === 'master' : false;
    },
    get SCANNER_CAMERA() {
        return 'BarcodeDetector' in window;
    },
    get PWA() {
        return location.protocol === 'https:' || location.hostname === 'localhost';
    }
};

// 24. LOGS ESTRUTURADOS
window.logger = {
    info: (action, data) => {
        console.log(`📘 [%c${new Date().toISOString()}%c] %c${action}`, "color: #4f46e5; font-weight: bold", "color: inherit", "font-weight: bold", data || '');
    },
    error: (action, error) => {
        console.error(`❌ [%c${new Date().toISOString()}%c] %c${action}`, "color: #ef4444; font-weight: bold", "color: inherit", "font-weight: bold", error || '');
    }
};

// INICIALIZAÇÃO IMEDIATA (Para evitar erros nos outros scripts)
if (window.supabase) {
    supabaseClient = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.key);
    logger.info('Supabase Client inicializado globalmente.');
}
