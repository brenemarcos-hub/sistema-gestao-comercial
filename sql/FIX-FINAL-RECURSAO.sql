-- ========================================================
-- FIX FINAL: FIM DA RECURSÃO INFINITA (ERRO 500)
-- ========================================================

-- 1. Criar função segura para buscar o ROLE sem recursão
CREATE OR REPLACE FUNCTION public.get_my_role() 
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 2. Criar função segura para buscar a LOJA sem recursão
CREATE OR REPLACE FUNCTION public.get_my_loja() 
RETURNS UUID AS $$
  SELECT loja_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 3. Limpar políticas antigas da tabela profiles para evitar conflitos
DROP POLICY IF EXISTS "policy_profile_self" ON public.profiles;
DROP POLICY IF EXISTS "policy_profile_manage" ON public.profiles;
DROP POLICY IF EXISTS "log_prof_self" ON public.profiles;
DROP POLICY IF EXISTS "policy_profiles_v3" ON public.profiles;

-- 4. Criar a nova política BLINDADA para perfis
CREATE POLICY "policy_profiles_final" ON public.profiles
FOR ALL USING (
    id = auth.uid() -- Sempre pode ver/editar o próprio
    OR 
    (
        loja_id = public.get_my_loja() -- Mesma loja
        AND 
        public.get_my_role() IN ('dono', 'gerente', 'master')
    )
);

-- 5. PROMOCÃO MASTER PARA O SEU E-MAIL
UPDATE public.profiles 
SET role = 'master' 
WHERE email = 'brenemarcos@gmail.com'; 

-- 6. Atualizar as outras tabelas para usar as funções seguras
DROP POLICY IF EXISTS "policy_produtos_v3" ON public.produtos;
CREATE POLICY "policy_produtos_final" ON public.produtos FOR ALL USING (loja_id = public.get_my_loja());

DROP POLICY IF EXISTS "policy_clientes_v3" ON public.clientes;
CREATE POLICY "policy_clientes_final" ON public.clientes FOR ALL USING (loja_id = public.get_my_loja());

DROP POLICY IF EXISTS "policy_vendas_v3" ON public.vendas;
CREATE POLICY "policy_vendas_final" ON public.vendas FOR ALL USING (loja_id = public.get_my_loja());

DROP POLICY IF EXISTS "policy_despesas_v3" ON public.despesas;
CREATE POLICY "policy_despesas_final" ON public.despesas FOR ALL USING (loja_id = public.get_my_loja());
