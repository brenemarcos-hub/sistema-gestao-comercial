# ✅ ATUALIZAÇÃO: PREÇO DE CUSTO NO XML

**Data:** 04/02/2026 - 23:38  
**Versão:** 1.1

---

## 🎯 O QUE FOI ADICIONADO

✅ **Suporte ao Preço de Custo (preco_custo) na importação XML**

Agora você pode importar tanto o **preço de venda** quanto o **preço de custo** pelo XML!

---

## 📄 FORMATO ATUALIZADO

```xml
<?xml version="1.0"?>
<produtos>
  <produto>
    <sku>TENIS-001</sku>
    <nome>Tênis Nike Air Max</nome>
    <quantidade>50</quantidade>
    <preco>299.90</preco>
    <preco_custo>150.00</preco_custo>
    <categoria>Tênis</categoria>
  </produto>
</produtos>
```

---

## 🏷️ TAGS ACEITAS PARA PREÇO DE CUSTO

O sistema aceita **3 variações** de tags:

| Tag | Descrição |
|---|---|
| `<preco_custo>` | Tag padrão (recomendada) |
| `<custo>` | Tag alternativa |
| `<cost>` | Tag em inglês |

**Exemplo:**
```xml
<!-- Qualquer uma dessas funciona -->
<preco_custo>150.00</preco_custo>
<custo>150.00</custo>
<cost>150.00</cost>
```

---

## 📊 TABELA COMPLETA DE CAMPOS

| Campo | Tags Aceitas | Obrigatório | Exemplo |
|---|---|---|---|
| **SKU** | `<sku>`, `<codigo>`, `<id>` | ✅ Sim | `TENIS-001` |
| **Nome** | `<nome>`, `<descricao>`, `<name>` | ✅ Sim | `Tênis Nike` |
| **Quantidade** | `<quantidade>`, `<estoque>`, `<qty>` | ✅ Sim | `50` |
| **Preço Venda** | `<preco>`, `<valor>`, `<price>` | ❌ Não | `299.90` |
| **Preço Custo** | `<preco_custo>`, `<custo>`, `<cost>` | ❌ Não | `150.00` |
| **Categoria** | `<categoria>`, `<category>` | ❌ Não | `Tênis` |

---

## ⚙️ COMO FUNCIONA

### 1. **Atualizar Produto Existente:**
```xml
<produto>
  <sku>TENIS-001</sku>
  <nome>Tênis Nike</nome>
  <quantidade>50</quantidade>
  <preco>299.90</preco>
  <preco_custo>150.00</preco_custo>
</produto>
```
**Resultado:**
- ✅ Atualiza estoque para 50
- ✅ Atualiza preço de venda para R$ 299,90
- ✅ Atualiza preço de custo para R$ 150,00

### 2. **Criar Produto Novo:**
```xml
<produto>
  <sku>CAMISA-002</sku>
  <nome>Camisa Adidas</nome>
  <quantidade>30</quantidade>
  <preco>89.90</preco>
  <preco_custo>45.00</preco_custo>
</produto>
```
**Resultado:**
- ✅ Cria produto com SKU CAMISA-002
- ✅ Define preço de venda: R$ 89,90
- ✅ Define preço de custo: R$ 45,00
- ✅ Estoque inicial: 30

### 3. **Atualizar Apenas Estoque:**
```xml
<produto>
  <sku>CALCA-003</sku>
  <nome>Calça Jeans</nome>
  <quantidade>15</quantidade>
</produto>
```
**Resultado:**
- ✅ Atualiza apenas o estoque
- ✅ Preços permanecem inalterados

### 4. **Atualizar Apenas Preço de Custo:**
```xml
<produto>
  <sku>BONE-004</sku>
  <nome>Boné New Era</nome>
  <quantidade>25</quantidade>
  <preco_custo>30.00</preco_custo>
</produto>
```
**Resultado:**
- ✅ Atualiza estoque para 25
- ✅ Atualiza preço de custo para R$ 30,00
- ✅ Preço de venda permanece inalterado

---

## 🔍 REGRAS DE ATUALIZAÇÃO

### Preço de Venda (`<preco>`):
- Se `preco > 0`: **Atualiza** o preço de venda
- Se `preco = 0` ou ausente: **Mantém** o preço atual

### Preço de Custo (`<preco_custo>`):
- Se `preco_custo > 0`: **Atualiza** o preço de custo
- Se `preco_custo = 0` ou ausente: **Mantém** o preço atual

### Quantidade:
- **Sempre atualiza** para o valor fornecido

---

## 💡 CASOS DE USO

### Caso 1: Importar NF-e com Custos
```xml
<!-- Importar produtos da nota fiscal -->
<produto>
  <sku>PROD-001</sku>
  <nome>Produto da NF-e</nome>
  <quantidade>100</quantidade>
  <preco>199.90</preco>
  <preco_custo>89.50</preco_custo>
</produto>
```

### Caso 2: Atualizar Margem de Lucro
```xml
<!-- Atualizar custos para recalcular margem -->
<produto>
  <sku>PROD-002</sku>
  <nome>Produto com Nova Margem</nome>
  <quantidade>50</quantidade>
  <preco_custo>120.00</preco_custo>
</produto>
```

### Caso 3: Importação de Fornecedor
```xml
<!-- Importar lista de preços do fornecedor -->
<produto>
  <sku>FORN-001</sku>
  <nome>Produto do Fornecedor</nome>
  <quantidade>200</quantidade>
  <custo>75.00</custo> <!-- Tag alternativa -->
</produto>
```

---

## 📈 BENEFÍCIOS

1. **Cálculo Automático de Margem**
   - Sistema calcula margem de lucro automaticamente
   - Relatórios financeiros mais precisos

2. **Importação Completa de NF-e**
   - Importa todos os dados da nota fiscal
   - Custos atualizados automaticamente

3. **Gestão Financeira Melhorada**
   - Lucro real calculado corretamente
   - Análise de rentabilidade por produto

4. **Flexibilidade**
   - Pode importar só custo, só venda, ou ambos
   - Mantém valores existentes se não fornecidos

---

## 🆕 TEMPLATE ATUALIZADO

O template XML foi atualizado com 4 exemplos:

1. ✅ Produto completo (com custo)
2. ✅ Criar novo produto (com custo)
3. ✅ Atualizar apenas estoque
4. ✅ Atualizar estoque e preço de venda

**Baixe o novo template:** Clique em "Baixar Template" no modal de importação

---

## 🔒 SEGURANÇA

⚠️ **IMPORTANTE:** O preço de custo é **sensível**!

- Apenas **Dono** e **Master** podem ver preços de custo
- **Gerente** pode importar, mas não vê o custo nos relatórios
- Dados são validados antes da importação

---

## ✅ COMPATIBILIDADE

### Retrocompatível:
- ✅ XMLs antigos (sem `preco_custo`) continuam funcionando
- ✅ Produtos existentes mantêm seus custos se não fornecidos
- ✅ Nenhuma mudança necessária em XMLs atuais

### Novos Recursos:
- ✅ Importação de custo opcional
- ✅ Múltiplas tags aceitas
- ✅ Validação automática

---

## 🚀 COMO USAR

1. **Recarregue a página** (F5)
2. Vá em **Estoque** → **Importar XML**
3. Clique em **"Baixar Template"**
4. Veja os novos exemplos com `<preco_custo>`
5. Edite seu XML incluindo os custos
6. Importe normalmente!

---

## 📝 EXEMPLO COMPLETO

```xml
<?xml version="1.0" encoding="UTF-8"?>
<produtos>
    <!-- Produto 1: Completo -->
    <produto>
        <sku>TENIS-001</sku>
        <nome>Tênis Nike Air Max</nome>
        <quantidade>50</quantidade>
        <preco>299.90</preco>
        <preco_custo>150.00</preco_custo>
        <categoria>Tênis</categoria>
    </produto>
    
    <!-- Produto 2: Sem custo (mantém o atual) -->
    <produto>
        <sku>CAMISA-002</sku>
        <nome>Camisa Adidas</nome>
        <quantidade>30</quantidade>
        <preco>89.90</preco>
    </produto>
    
    <!-- Produto 3: Só atualiza custo -->
    <produto>
        <sku>CALCA-003</sku>
        <nome>Calça Jeans</nome>
        <quantidade>15</quantidade>
        <preco_custo>60.00</preco_custo>
    </produto>
</produtos>
```

---

**Desenvolvido por:** Antigravity AI  
**Versão:** 1.1  
**Data:** 04/02/2026  
**Status:** ✅ ATUALIZADO E FUNCIONAL
