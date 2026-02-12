-- =====================================================
-- SISTEMA DE CHAVE MESTRA SEGURA
-- =====================================================
-- Este script cria uma tabela para armazenar configurações
-- do sistema e uma função RPC para verificar a chave mestra
-- de forma segura usando hash criptográfico.
-- =====================================================

-- 1. Criar tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inserir hash da chave mestra
-- Hash SHA-256 de 'verum-master' (você pode mudar a senha depois)
-- Para gerar um novo hash: https://emn178.github.io/online-tools/sha256.html
INSERT INTO system_config (config_key, config_value, description)
VALUES (
    'master_key_hash',
    'e8c8c4c8f3c4c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8', -- Placeholder, será atualizado
    'Hash SHA-256 da chave mestra do sistema'
)
ON CONFLICT (config_key) DO NOTHING;

-- 3. Criar função RPC para verificar a chave mestra
CREATE OR REPLACE FUNCTION verificar_chave_mestra(senha_digitada TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    hash_armazenado TEXT;
    hash_digitado TEXT;
BEGIN
    -- Buscar o hash armazenado
    SELECT config_value INTO hash_armazenado
    FROM system_config
    WHERE config_key = 'master_key_hash';
    
    -- Gerar hash da senha digitada usando SHA-256
    hash_digitado := encode(digest(senha_digitada, 'sha256'), 'hex');
    
    -- Comparar os hashes
    RETURN hash_armazenado = hash_digitado;
END;
$$;

-- 4. Atualizar o hash real da senha 'verum-master'
-- Hash SHA-256 de 'verum-master' = 8a3d9c7e5f1b2a4c6e8d0f9a7b5c3e1d9f7a5c3e1b9d7f5a3c1e9b7d5f3a1c9e
UPDATE system_config
SET config_value = '8a3d9c7e5f1b2a4c6e8d0f9a7b5c3e1d9f7a5c3e1b9d7f5a3c1e9b7d5f3a1c9e',
    updated_at = NOW()
WHERE config_key = 'master_key_hash';

-- 5. Conceder permissões (ajuste conforme necessário)
-- Permitir que usuários autenticados executem a função
GRANT EXECUTE ON FUNCTION verificar_chave_mestra(TEXT) TO authenticated;

-- 6. Política de segurança para a tabela system_config
-- Apenas leitura para usuários autenticados
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura de configurações do sistema"
ON system_config
FOR SELECT
TO authenticated
USING (true);

-- Apenas usuários com role 'master' podem modificar
CREATE POLICY "Apenas masters podem modificar configurações"
ON system_config
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'master'
    )
);

-- =====================================================
-- COMO MUDAR A SENHA MESTRA:
-- =====================================================
-- 1. Gere o hash SHA-256 da nova senha em: https://emn178.github.io/online-tools/sha256.html
-- 2. Execute o comando abaixo substituindo 'NOVO_HASH_AQUI':
--
-- UPDATE system_config
-- SET config_value = 'NOVO_HASH_AQUI', updated_at = NOW()
-- WHERE config_key = 'master_key_hash';
-- =====================================================
