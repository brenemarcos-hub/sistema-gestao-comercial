-- ==========================================
-- CRIAR TABELA DE HISTÓRICO DE PREÇOS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.historico_precos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loja_id UUID REFERENCES public.lojas(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE,
    preco_antigo DECIMAL(10,2),
    preco_novo DECIMAL(10,2),
    alterado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.historico_precos ENABLE ROW LEVEL SECURITY;

-- Política de acesso isolada por loja
DROP POLICY IF EXISTS "policy_historico_precos_loja" ON public.historico_precos;
CREATE POLICY "policy_historico_precos_loja" ON public.historico_precos 
FOR ALL USING (loja_id = public.get_auth_loja());

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_hist_prod ON public.historico_precos(produto_id);
CREATE INDEX IF NOT EXISTS idx_hist_loja ON public.historico_precos(loja_id);
