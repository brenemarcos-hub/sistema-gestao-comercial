-- ========================================================
-- ATUALIZAÇÃO DA TABELA DE CLIENTES: NOVAS COLUNAS E CAMPOS
-- ========================================================

-- 1. Adicionar coluna de endereço e whatsapp (caso não existam)
-- Usamos um bloco DO para evitar erros se a coluna já existir
DO $$ 
BEGIN
    -- Adicionar coluna Endereço
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='endereco') THEN
        ALTER TABLE public.clientes ADD COLUMN endereco TEXT;
    END IF;

    -- Renomear telefone para whatsapp para manter padrão do código (ou vice-versa)
    -- Para evitar quebra, vamos garantir que ambas as colunas possam ser usadas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='whatsapp') THEN
        ALTER TABLE public.clientes ADD COLUMN whatsapp TEXT;
    END IF;
END $$;

-- 2. Garantir que a RLS está ativa e correta
DROP POLICY IF EXISTS "policy_clientes_loja" ON public.clientes;
CREATE POLICY "policy_clientes_loja" ON public.clientes 
FOR ALL USING (loja_id = public.get_auth_loja());
