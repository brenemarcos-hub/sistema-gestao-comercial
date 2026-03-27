/**
 * SISTEMA DE AUDITORIA E MONITORAMENTO - VERUM GESTÃO
 * Responsável por registrar acessos, ações e erros no banco de dados.
 */

// 1. REGISTRAR ACESSO (Login, Logout, Falhas)
async function registrarAcesso(usuarioId, usuarioEmail, usuarioNome, acao, sucesso = true) {
    if (!window.supabaseClient) return;

    try {
        const info = obterInfoDispositivo();
        
        const { error } = await window.supabaseClient
            .from('logs_acessos')
            .insert({
                usuario_id: usuarioId || null,
                usuario_email: usuarioEmail || null,
                usuario_nome: usuarioNome || null,
                acao: acao,
                ip: '0.0.0.0', // O Supabase captura o IP real se configurado, ou via Edge Function. No client-side é limitado.
                user_agent: navigator.userAgent,
                dispositivo: info.dispositivo,
                navegador: info.navegador,
                sistema_operacional: info.so
            });

        if (error) console.error('Erro ao salvar log de acesso:', error);
    } catch (err) {
        console.error('Falha crítica ao registrar acesso:', err);
    }
}

// 2. CAPTURAR ERRO GLOBAL
async function capturarErro(erro, contexto = {}) {
    console.error('⚠️ Erro capturado pelo sistema de auditoria:', erro, contexto);
    
    if (!window.supabaseClient) return;

    try {
        let usuarioId = null;
        let usuarioEmail = null;

        // Tentar pegar dados da sessão se existirem
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) {
            usuarioId = session.user.id;
            usuarioEmail = session.user.email;
        }

        const { error } = await window.supabaseClient
            .from('logs_erros')
            .insert({
                usuario_id: usuarioId,
                usuario_email: usuarioEmail,
                rota: contexto.rota || window.location.href,
                funcao: contexto.funcao || 'Global',
                mensagem_erro: erro?.message || String(erro),
                stack_trace: erro?.stack || null,
                dados_contexto: contexto
            });

        if (error) console.error('Erro ao salvar log de erro no banco:', error);
    } catch (err) {
        console.error('Falha crítica ao capturar erro:', err);
    }
}

// 3. REGISTRAR AÇÃO DO USUÁRIO
async function registrarAcao(usuarioId, usuarioEmail, acao, entidade, entidadeId, detalhes = {}) {
    if (!window.supabaseClient) return;

    try {
        // Se não passar ID/Email, tenta pegar da sessão
        if (!usuarioId) {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session) {
                usuarioId = session.user.id;
                usuarioEmail = session.user.email;
            }
        }

        const { error } = await window.supabaseClient
            .from('logs_acoes')
            .insert({
                usuario_id: usuarioId,
                usuario_email: usuarioEmail,
                acao: acao,
                entidade: entidade,
                entidade_id: entidadeId || null,
                detalhes: detalhes
            });

        if (error) console.error('Erro ao salvar log de ação:', error);
    } catch (err) {
        console.error('Falha crítica ao registrar ação:', err);
    }
}

// 4. OBTER INFORMAÇÕES DO DISPOSITIVO
function obterInfoDispositivo() {
    const ua = navigator.userAgent;
    let dispositivo = "desktop";
    
    if (/tablet|ipad|playbook|silk/i.test(ua)) dispositivo = "tablet";
    else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Opera Mini/i.test(ua)) dispositivo = "mobile";

    // Navegador simples
    let navegador = "Desconhecido";
    if (ua.includes("Chrome")) navegador = "Chrome";
    else if (ua.includes("Firefox")) navegador = "Firefox";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) navegador = "Safari";
    else if (ua.includes("Edge")) navegador = "Edge";

    // SO simples
    let so = "Desconhecido";
    if (ua.includes("Windows")) so = "Windows";
    else if (ua.includes("Mac OS")) so = "Mac OS";
    else if (ua.includes("Android")) so = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) so = "iOS";
    else if (ua.includes("Linux")) so = "Linux";

    return { dispositivo, navegador, so };
}
