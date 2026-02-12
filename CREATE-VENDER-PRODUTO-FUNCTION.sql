-- =====================================================
-- FUNÇÃO: vender_produto
-- Proteção contra Race Condition no Estoque
-- =====================================================
-- Esta função garante que vendas sejam processadas
-- atomicamente, evitando que dois usuários vendam
-- o mesmo produto ao mesmo tempo e causem estoque negativo.
-- =====================================================

CREATE OR REPLACE FUNCTION vender_produto(
    p_variant_id bigint,
    p_quantidade integer,
    p_produto_id bigint,
    p_preco_unitario numeric,
    p_cliente_id bigint DEFAULT NULL,
    p_loja_id bigint DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    v_estoque_atual integer;
    v_loja_id bigint;
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

    -- 2. Atualizar estoque COM LOCK (FOR UPDATE)
    -- Isso garante que apenas uma transação processe por vez
    UPDATE variantes
    SET estoque_atual = estoque_atual - p_quantidade
    WHERE id = p_variant_id 
      AND estoque_atual >= p_quantidade  -- Validação atômica
    RETURNING estoque_atual INTO v_estoque_atual;

    -- 3. Verificar se o UPDATE foi bem-sucedido
    IF NOT FOUND THEN
        -- Buscar estoque atual para mensagem de erro mais informativa
        SELECT estoque_atual INTO v_estoque_atual
        FROM variantes
        WHERE id = p_variant_id;
        
        IF v_estoque_atual IS NULL THEN
            RAISE EXCEPTION 'Variante não encontrada (ID: %)', p_variant_id;
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
        p_cliente_id,
        p_quantidade,
        p_preco_unitario * p_quantidade,
        v_loja_id,
        NOW()
    );

    -- 5. Retornar sucesso
    RETURN true;

EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, a transação será revertida automaticamente
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PERMISSÕES
-- =====================================================
-- Permitir que usuários autenticados executem a função
GRANT EXECUTE ON FUNCTION vender_produto(bigint, integer, bigint, numeric, bigint, bigint) TO authenticated;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON FUNCTION vender_produto IS 
'Processa venda de produto com proteção contra race condition. 
Atualiza estoque atomicamente e registra a venda.
Retorna true em caso de sucesso ou lança exceção em caso de erro.';

-- =====================================================
-- TESTE DA FUNÇÃO (OPCIONAL - COMENTAR APÓS TESTAR)
-- =====================================================
-- SELECT vender_produto(
--     p_variant_id := 1,        -- ID da variante
--     p_quantidade := 2,         -- Quantidade a vender
--     p_produto_id := 1,         -- ID do produto
--     p_preco_unitario := 50.00, -- Preço unitário
--     p_cliente_id := NULL,      -- ID do cliente (opcional)
--     p_loja_id := 1             -- ID da loja
-- );
