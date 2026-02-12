// =====================================================
// CONFIGURAÇÕES DO SUPABASE
// =====================================================
// ⚠️ As credenciais reais estão em: js/config.production.js
// ⚠️ Esse arquivo está no .gitignore e NÃO vai para o GitHub
// ⚠️ Para novos desenvolvedores: copie config.example.js → config.production.js
// =====================================================

// Este objeto será preenchido pelo config.production.js
// que é carregado ANTES deste arquivo no HTML
window.SUPABASE_CONFIG = window.SUPABASE_CONFIG || {
    url: '',
    key: ''
};

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

// INICIALIZAÇÃO IMEDIATA (Para evitar erros nos outros scripts)
if (window.supabase) {
    supabaseClient = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.key);
    console.log('⚡ Supabase Client inicializado globalmente.');
}
