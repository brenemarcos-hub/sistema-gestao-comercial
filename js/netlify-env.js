// =====================================================
// NETLIFY ENVIRONMENT VARIABLES INJECTOR
// =====================================================
// Este arquivo injeta as variáveis de ambiente do Netlify
// no objeto window.env para que o config.js possa usá-las
// =====================================================

(function () {
    // Criar objeto window.env se não existir
    window.env = window.env || {};

    // Netlify injeta variáveis de ambiente em process.env
    // Mas no browser, precisamos usar uma abordagem diferente

    // As variáveis serão substituídas durante o build do Netlify
    // usando o plugin netlify-plugin-inline-env

    // Ou podemos usar a API do Netlify para buscar as variáveis
    // Mas a forma mais simples é configurar via Netlify UI

    console.log('🌐 Netlify Environment Loader carregado');

    // Se as variáveis já foram injetadas pelo Netlify, use-as
    if (typeof SUPABASE_URL !== 'undefined') {
        window.env.SUPABASE_URL = SUPABASE_URL;
    }

    if (typeof SUPABASE_ANON_KEY !== 'undefined') {
        window.env.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
    }

    // Log para debug (não mostra a key completa por segurança)
    if (window.env.SUPABASE_URL) {
        console.log('✅ SUPABASE_URL configurado via Netlify');
    }

    if (window.env.SUPABASE_ANON_KEY) {
        console.log('✅ SUPABASE_ANON_KEY configurado via Netlify');
    }
})();
