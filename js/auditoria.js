/**
 * SISTEMA DE AUDITORIA E MONITORAMENTO - VERUM GESTÃO
 * Responsável por registrar acessos, ações e erros no banco de dados.
 */

// 1. OBTER IP REAL (Múltiplas Fontes)
async function obterIP() {
    const fontes = [
        'https://api.ipify.org?format=json',
        'https://api.my-ip.io/ip.json',
        'https://ipapi.co/json/'
    ];

    for (const fonte of fontes) {
        try {
            const response = await fetch(fonte);
            const data = await response.json();
            const ip = data.ip || data.query;
            if (ip && ip !== '0.0.0.0' && !ip.includes(':')) return ip;
        } catch (e) {
            console.warn('Falha ao obter IP de', fonte);
        }
    }

    // Fallback usando WebRTC se as APIs falharem
    try {
        return await obterIPviaWebRTC() || 'IP não detectado';
    } catch (e) {
        return 'IP não detectado';
    }
}

function obterIPviaWebRTC() {
    return new Promise((resolve) => {
        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel('');
        pc.createOffer().then(offer => pc.setLocalDescription(offer));
        pc.onicecandidate = (event) => {
            if (event && event.candidate && event.candidate.candidate) {
                const ipMatch = event.candidate.candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/);
                if (ipMatch) {
                    resolve(ipMatch[0]);
                    pc.close();
                }
            }
        };
        setTimeout(() => resolve('IP não detectado'), 2000);
    });
}

// 2. REGISTRAR ACESSO (Login, Logout, Falhas)
async function registrarAcesso(usuarioId, usuarioEmail, usuarioNome, acao, sucesso = true) {
    // Usar window.supabaseClient ou o que estiver globalmente disponível
    const db = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (!db) {
        console.warn('Auditoria: Supabase Client não encontrado.');
        return;
    }

    try {
        const info = obterInfoDispositivo();
        const ip = await obterIP();
        
        const { error } = await db
            .from('logs_acessos')
            .insert({
                usuario_id: usuarioId || null,
                usuario_email: usuarioEmail || null,
                usuario_nome: usuarioNome || null,
                acao: acao,
                ip: ip,
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

// 3. CAPTURAR ERRO GLOBAL
async function capturarErro(erro, contexto = {}) {
    console.error('⚠️ Erro capturado pelo sistema de auditoria:', erro, contexto);
    const db = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (!db) return;

    try {
        let usuarioId = null;
        let usuarioEmail = null;

        const { data: { session } } = await db.auth.getSession();
        if (session) {
            usuarioId = session.user.id;
            usuarioEmail = session.user.email;
        }

        const { error } = await db
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

        if (error) console.error('Erro ao salvar log de erro:', error);
    } catch (err) {
        console.error('Falha crítica ao capturar erro:', err);
    }
}

// 4. REGISTRAR AÇÃO DO USUÁRIO (Bloco 4 Correção)
// 4. REGISTRAR AÇÃO DO USUÁRIO (Compatível com múltiplos formatos)
async function registrarAcao(arg1, arg2, arg3, arg4, arg5, arg6) {
    const db = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (!db) return;

    try {
        let dados;
        // Verifica se veio no formato de objeto único ou argumentos espalhados
        if (arg1 && typeof arg1 === 'object' && arg1.acao) {
            dados = arg1;
        } else {
            // Se veio no formato: null, null, acao, entidade, entidade_id, detalhes
            // Ou no formato: acao, entidade, entidade_id, detalhes
            const temNulls = (arg1 === null);
            dados = {
                acao: temNulls ? arg3 : arg1,
                entidade: temNulls ? arg4 : arg2,
                entidade_id: temNulls ? arg5 : arg3,
                detalhes: (temNulls ? arg6 : arg4) || {}
            };
        }

        const { data: { session } } = await db.auth.getSession();
        const usuarioId = session?.user?.id;
        const usuarioEmail = session?.user?.email;

        const acaoData = {
            usuario_id: usuarioId,
            usuario_email: usuarioEmail,
            acao: dados.acao,
            entidade: dados.entidade,
            entidade_id: dados.entidade_id,
            detalhes: dados.detalhes || {},
            criado_em: new Date().toISOString()
        };

        const { error } = await db.from('logs_acoes').insert(acaoData);
        if (error) console.error('Erro ao registrar ação:', error);
    } catch (err) {
        console.error('Falha no registro de ação:', err);
    }
}

// 5. OBTER INFORMAÇÕES DO DISPOSITIVO
function obterInfoDispositivo() {
    const ua = navigator.userAgent;
    let dispositivo = "desktop";

    if (/tablet|ipad|playbook|silk/i.test(ua)) dispositivo = "tablet";
    else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Opera Mini/i.test(ua)) dispositivo = "mobile";

    let navegador = "Desconhecido";
    if (ua.includes("Chrome")) navegador = "Chrome";
    else if (ua.includes("Firefox")) navegador = "Firefox";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) navegador = "Safari";
    else if (ua.includes("Edge")) navegador = "Edge";

    let so = "Desconhecido";
    if (ua.includes("Windows")) so = "Windows";
    else if (ua.includes("Mac OS")) so = "Mac OS";
    else if (ua.includes("Android")) so = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) so = "iOS";
    else if (ua.includes("Linux")) so = "Linux";

    return { dispositivo, navegador, so };
}

// Configurar captura global automática de erros se a config permitir
window.onerror = function(message, source, lineno, colno, error) {
    capturarErro(error || message, { rota: window.location.href, funcao: 'window.onerror', linha: lineno });
};

window.onunhandledrejection = function(event) {
    capturarErro(event.reason, { rota: window.location.href, funcao: 'promise_rejection' });
};
