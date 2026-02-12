# 🔒 Guia de Instalação - Proteção contra Race Condition

## 📋 O que foi implementado?

Esta atualização adiciona **proteção atômica contra race condition** no sistema de vendas, garantindo que o estoque nunca fique negativo mesmo com múltiplos usuários vendendo simultaneamente.

---

## 🎯 Arquivos Criados/Modificados

### ✅ Criados:
- `CREATE-VENDER-PRODUTO-FUNCTION.sql` - Função SQL para venda atômica

### ✅ Modificados:
- `js/database.js` - Função `saveSale()` atualizada para usar RPC

---

## 🚀 Passo a Passo de Instalação

### **PASSO 1: Executar o SQL no Supabase**

1. Acesse o **Supabase Dashboard**
2. Vá em: **SQL Editor**
3. Clique em **"New query"**
4. Abra o arquivo: `CREATE-VENDER-PRODUTO-FUNCTION.sql`
5. Copie **TODO** o conteúdo
6. Cole no SQL Editor
7. Clique em **"Run"** (ou pressione `Ctrl+Enter`)

**Resultado esperado:**
```
Success. No rows returned
```

---

### **PASSO 2: Verificar se a função foi criada**

Execute este SQL para confirmar:

```sql
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name = 'vender_produto';
```

**Resultado esperado:**
```
routine_name    | routine_type
----------------|-------------
vender_produto  | FUNCTION
```

---

### **PASSO 3: Testar a função (OPCIONAL)**

Execute este teste para garantir que está funcionando:

```sql
-- Substitua os IDs pelos valores reais do seu banco
SELECT vender_produto(
    p_variant_id := 1,        -- ID de uma variante existente
    p_quantidade := 1,         -- Quantidade a vender
    p_produto_id := 1,         -- ID do produto
    p_preco_unitario := 50.00, -- Preço
    p_cliente_id := NULL,      -- Opcional
    p_loja_id := 1             -- ID da sua loja
);
```

**Resultado esperado:**
```
vender_produto
--------------
true
```

---

### **PASSO 4: Verificar o JavaScript**

O arquivo `js/database.js` já foi atualizado automaticamente! ✅

A função `saveSale()` agora usa:
```javascript
await supabaseClient.rpc('vender_produto', {...})
```

---

## 🔍 Como Funciona?

### **ANTES (❌ Vulnerável):**
```javascript
// 1. Lê estoque
const estoque = await buscarEstoque();

// 2. Valida
if (quantidade > estoque) throw Error;

// ⚠️ PROBLEMA: Outro usuário pode vender aqui!

// 3. Insere venda
await inserirVenda();

// 4. Atualiza estoque
await atualizarEstoque(estoque - quantidade);
```

### **DEPOIS (✅ Seguro):**
```javascript
// Tudo em uma transação atômica no banco!
await supabaseClient.rpc('vender_produto', {...});
```

**No SQL:**
```sql
-- UPDATE com validação atômica
UPDATE variantes
SET estoque_atual = estoque_atual - p_quantidade
WHERE id = p_variant_id 
  AND estoque_atual >= p_quantidade;  -- ✅ Validação atômica!

-- Se não encontrou = estoque insuficiente
IF NOT FOUND THEN
    RAISE EXCEPTION 'Estoque insuficiente';
END IF;
```

---

## ✅ Benefícios

| Antes | Depois |
|-------|--------|
| ❌ Race condition possível | ✅ Transação atômica |
| ❌ Estoque pode ficar negativo | ✅ Validação garantida |
| ❌ 3 queries separadas | ✅ 1 chamada RPC |
| ❌ Lento em alta concorrência | ✅ Rápido e seguro |
| ❌ Sem rollback automático | ✅ Rollback em caso de erro |

---

## 🧪 Como Testar

### **Teste 1: Venda Normal**
1. Adicione produtos ao carrinho
2. Finalize a venda
3. Verifique se o estoque foi atualizado corretamente

### **Teste 2: Estoque Insuficiente**
1. Tente vender mais unidades do que há em estoque
2. Deve aparecer erro: "Estoque insuficiente. Disponível: X, Solicitado: Y"

### **Teste 3: Venda Parcial**
1. Adicione 2 produtos ao carrinho
2. Faça um ter estoque insuficiente
3. Deve processar o que tem estoque e avisar sobre o que falhou

---

## 🆘 Solução de Problemas

### ❌ "function vender_produto does not exist"

**Causa:** A função SQL não foi criada no Supabase

**Solução:**
1. Execute o arquivo `CREATE-VENDER-PRODUTO-FUNCTION.sql` no SQL Editor
2. Verifique se não há erros de sintaxe

---

### ❌ "permission denied for function vender_produto"

**Causa:** Permissões não foram concedidas

**Solução:**
Execute este SQL:
```sql
GRANT EXECUTE ON FUNCTION vender_produto(bigint, integer, bigint, numeric, bigint, bigint) TO authenticated;
```

---

### ❌ "Estoque insuficiente" mesmo tendo estoque

**Causa:** IDs incorretos ou estoque realmente insuficiente

**Solução:**
1. Verifique os IDs no console do navegador
2. Confirme o estoque real no banco:
```sql
SELECT id, estoque_atual FROM variantes WHERE id = SEU_ID;
```

---

## 📊 Monitoramento

Para ver as vendas processadas pela nova função:

```sql
SELECT 
    v.id,
    v.criado_em,
    p.nome as produto,
    var.tamanho,
    var.cor,
    v.quantidade,
    v.total
FROM vendas v
JOIN produtos p ON p.id = v.id_produto
JOIN variantes var ON var.id = v.id_variante
ORDER BY v.criado_em DESC
LIMIT 10;
```

---

## 🎉 Conclusão

Após seguir estes passos, seu sistema estará **100% protegido** contra race conditions no estoque!

**Checklist:**
- [ ] Executei o SQL no Supabase
- [ ] Verifiquei que a função foi criada
- [ ] Testei uma venda
- [ ] Testei estoque insuficiente
- [ ] Tudo funcionando! 🚀

---

**Data de criação:** 11/02/2026  
**Versão:** 1.0  
**Autor:** Sistema de Gestão Comercial
