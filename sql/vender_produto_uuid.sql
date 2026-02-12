-- =====================================================
-- 🧹 LIMPEZA DE VERSÕES ANTERIORES
-- =====================================================
DROP FUNCTION IF EXISTS vender_produto(bigint, integer, bigint, numeric, bigint, bigint);
DROP FUNCTION IF EXISTS vender_produto(uuid, integer, uuid, numeric, bigint, uuid);
DROP FUNCTION IF EXISTS vender_produto(uuid, integer, uuid, numeric, text, uuid);

-- =====================================================
-- 🔒 PROTEÇÃO ATÔMICA CONTRA RACE CONDITION (VERSÃO TOTAL UUID)
-- =====================================================
CREATE OR REPLACE FUNCTION vender_produto(
    p_variant_id uuid,
    p_quantidade integer,
    p_produto_id uuid,
    p_preco_unitario numeric,
    p_cliente_id text DEFAULT NULL, -- Aceita texto para converter em UUID
    p_loja_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    v_estoque_atual integer;
    v_loja_id uuid;
BEGIN
    -- 1. Obter loja_id do usuário autenticado se não foi fornecido
    IF p_loja_id IS NULL THEN
        SELECT loja_id INTO v_loja_id
        FROM profiles
        WHERE id = auth.uid();
        
        IF v_loja_id IS NULL THEN
            RAISE EXCEPTION 'Usuário não tem loja vinculada';
        END IF;
    ELSE
        v_loja_id := p_loja_id;
    END IF;

    -- 2. Atualizar estoque COM LOCK
    UPDATE variantes
    SET estoque_atual = estoque_atual - p_quantidade
    WHERE id = p_variant_id 
      AND estoque_atual >= p_quantidade
    RETURNING estoque_atual INTO v_estoque_atual;

    -- 3. Verificar se o UPDATE foi bem-sucedido
    IF NOT FOUND THEN
        SELECT estoque_atual INTO v_estoque_atual
        FROM variantes
        WHERE id = p_variant_id;
        
        IF v_estoque_atual IS NULL THEN
            RAISE EXCEPTION 'Variante não encontrada ID: %', p_variant_id;
        ELSE
            RAISE EXCEPTION 'Estoque insuficiente. Disponível: %, Solicitado: %', 
                v_estoque_atual, p_quantidade;
        END IF;
    END IF;

    -- 4. Inserir registro de venda
    INSERT INTO vendas (
        id_produto,
        id_variante,
        cliente_id,
        quantidade,
        total,
        loja_id,
        criado_em
    ) VALUES (
        p_produto_id,
        p_variant_id,
        CASE 
            WHEN p_cliente_id IS NULL OR p_cliente_id = '' THEN NULL 
            ELSE p_cliente_id::uuid -- ✅ CORREÇÃO: Agora converte para UUID
        END,
        p_quantidade,
        p_preco_unitario * p_quantidade,
        v_loja_id,
        NOW()
    );

    RETURN true;

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões
GRANT EXECUTE ON FUNCTION vender_produto(uuid, integer, uuid, numeric, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION vender_produto(uuid, integer, uuid, numeric, text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION vender_produto(uuid, integer, uuid, numeric, text, uuid) TO service_role;
