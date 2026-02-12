-- ========================================================
-- RESET TOTAL E RECONSTRUÇÃO DO SISTEMA VERUM GESTÃO
-- ========================================================

-- 1. LIMPEZA TOTAL DE POLÍTICAS (Para evitar conflitos de segurança)
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 2. APAGAR TABELAS EXISTENTES (Ordem correta para respeitar chaves estrangeiras)
DROP TABLE IF EXISTS public.variantes CASCADE;
DROP TABLE IF EXISTS public.vendas CASCADE;
DROP TABLE IF EXISTS public.produtos CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;
DROP TABLE IF EXISTS public.despesas CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.lojas CASCADE;

-- 3. CRIAR TABELA DE LOJAS (Coração do sistema multi-loja)
CREATE TABLE public.lojas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    logo_url TEXT,
    chave_acesso TEXT UNIQUE NOT NULL,
    dono_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR TABELA DE PERFIS (Vínculo entre o login do Supabase e o sistema)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT,
    email TEXT,
    role TEXT DEFAULT 'vendedor', -- 'dono' ou 'vendedor'
    loja_id UUID REFERENCES public.lojas(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CRIAR TABELA DE PRODUTOS
CREATE TABLE public.produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loja_id UUID REFERENCES public.lojas(id) ON DELETE CASCADE,
    sku TEXT,
    ean TEXT,
    nome TEXT NOT NULL,
    categoria TEXT,
    preco_venda DECIMAL(10,2) DEFAULT 0,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CRIAR TABELA DE VARIANTES (Onde mora o estoque físico)
CREATE TABLE public.variantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_produto UUID REFERENCES public.produtos(id) ON DELETE CASCADE,
    tamanho TEXT,
    cor TEXT,
    estoque_atual INTEGER DEFAULT 0,
    estoque_minimo INTEGER DEFAULT 5,
    custo_unitario DECIMAL(10,2) DEFAULT 0,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CRIAR TABELA DE CLIENTES
CREATE TABLE public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loja_id UUID REFERENCES public.lojas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    telefone TEXT,
    email TEXT,
    cpf_cnpj TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. CRIAR TABELA DE VENDAS
CREATE TABLE public.vendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loja_id UUID REFERENCES public.lojas(id) ON DELETE CASCADE,
    vendedor_id UUID REFERENCES auth.users(id),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    id_produto UUID REFERENCES public.produtos(id),
    id_variante UUID REFERENCES public.variantes(id),
    quantidade INTEGER NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    metodo_pagamento TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. CRIAR TABELA DE DESPESAS
CREATE TABLE public.despesas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loja_id UUID REFERENCES public.lojas(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    categoria TEXT,
    data_vencimento DATE,
    pago BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. FUNÇÕES DE SEGURANÇA (SECURITY DEFINER - Crucial para evitar o Erro 500)
CREATE OR REPLACE FUNCTION public.get_auth_loja() 
RETURNS UUID AS $$
  SELECT loja_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.gerar_chave_acesso() 
RETURNS TEXT AS $$
  SELECT upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
$$ LANGUAGE sql SECURITY DEFINER;

-- 11. HABILITAR SEGURANÇA DE LINHA (RLS)
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

-- 12. POLÍTICAS DE ACESSO INFALÍVEIS (Isolamento por loja)

-- LOJAS: Pública para validar chave, apenas o dono gerencia
CREATE POLICY "policy_loja_read" ON public.lojas FOR SELECT USING (true);
CREATE POLICY "policy_loja_manage" ON public.lojas FOR ALL USING (auth.uid() = dono_id);

-- PROFILES: Cada usuário mexe apenas no seu perfil
CREATE POLICY "policy_profile_self" ON public.profiles FOR ALL USING (auth.uid() = id);

-- DADOS: Todos protegidos e isolados pelo ID da loja consultado via função segura
CREATE POLICY "policy_produtos_loja" ON public.produtos FOR ALL USING (loja_id = public.get_auth_loja());
CREATE POLICY "policy_clientes_loja" ON public.clientes FOR ALL USING (loja_id = public.get_auth_loja());
CREATE POLICY "policy_vendas_loja"   ON public.vendas   FOR ALL USING (loja_id = public.get_auth_loja());
CREATE POLICY "policy_despesas_loja" ON public.despesas FOR ALL USING (loja_id = public.get_auth_loja());

-- VARIANTES: Herda segurança através do produto
CREATE POLICY "policy_variantes_loja" ON public.variantes FOR ALL USING (
    id_produto IN (SELECT id FROM public.produtos WHERE loja_id = public.get_auth_loja())
);

-- 13. ÍNDICES (Garantem que o sistema seja rápido mesmo com milhares de registros)
CREATE INDEX idx_prof_loja ON public.profiles(loja_id);
CREATE INDEX idx_prod_loja ON public.produtos(loja_id);
CREATE INDEX idx_vend_loja ON public.vendas(loja_id);
CREATE INDEX idx_cli_loja  ON public.clientes(loja_id);
