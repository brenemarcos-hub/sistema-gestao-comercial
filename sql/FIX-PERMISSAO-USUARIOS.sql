-- AJUSTE DE PERMISSÃO PARA GERENCIAR USUÁRIOS
-- Permite que o Dono e Master vejam os outros funcionários da mesma loja

DROP POLICY IF EXISTS "policy_profile_self" ON public.profiles;

-- Nova política: 
-- 1. Você pode ver/editar o seu próprio perfil.
-- 2. Se você for 'dono', 'gerente' ou 'master', você pode ver/editar perfis da sua loja.
CREATE POLICY "policy_profile_manage" ON public.profiles
FOR ALL 
USING (
    auth.uid() = id 
    OR 
    (
        loja_id = (SELECT p.loja_id FROM public.profiles p WHERE p.id = auth.uid())
        AND 
        (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) IN ('dono', 'gerente', 'master')
    )
);
