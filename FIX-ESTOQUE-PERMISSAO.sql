-- ========================================================
-- FIX ESTOQUE: PERMISSÃO PARA VARIANTES E AJUSTE DE COLUNAS
-- ========================================================

-- 1. Remover políticas antigas de variantes para evitar conflitos
DROP POLICY IF EXISTS "log_var_loja" ON public.variantes;
DROP POLICY IF EXISTS "policy_variantes_loja" ON public.variantes;

-- 2. Criar nova política BLINDADA para variantes (Baseada no produto da loja)
-- Regra: Permite tudo se o produto pertencer à loja do usuário atual
CREATE POLICY "policy_variantes_final" ON public.variantes
FOR ALL USING (
    id_produto IN (
        SELECT id FROM public.produtos WHERE loja_id = public.get_my_loja()
    )
);

-- 3. Garantir que as colunas estão corretas (Segurança extra)
-- Se as colunas já existirem, o SQL apenas ignora.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='variantes' AND column_name='estoque_minimo') THEN
        ALTER TABLE public.variantes RENAME COLUMN alerta_minimo TO estoque_minimo;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='variantes' AND column_name='custo_unitario') THEN
        ALTER TABLE public.variantes RENAME COLUMN preco_custo TO custo_unitario;
    END IF;
END $$;
