# 🧪 Plano de Testes Master - Sistema Verum Gestão

Este documento descreve os testes essenciais para validar a integridade do sistema multi-loja e funcionalidade total.

## 1. Fluxo de Autenticação e Multi-Loja
- [ ] **Cenário A: Primeiro Acesso (Dono)**
    - Cadastrar novo e-mail.
    - Selecionar "Criar Loja".
    - Validar se a Chave de Acesso foi exibida.
    - Verificar se o nome da loja aparece no cabeçalho após o login.
- [ ] **Cenário B: Funcionário (Vendedor)**
    - Cadastrar novo e-mail.
    - Selecionar "Entrar em Loja".
    - Usar a chave gerada no Cenário A.
    - Validar se o usuário entra na mesma loja do dono.

## 2. Inventário e Produtos (Isolamento)
- [ ] **Cadastro com Variantes:** Criar produto com 2 tamanhos e 2 cores.
- [ ] **Alerta de Estoque:** Cadastrar produto com 1 item e alerta em 5. Verificar se aparece como "Baixo Estoque".
- [ ] **Proteção Cruzada:** Logar com Loja A, criar produto. Logar com Loja B, verificar se o produto da Loja A está invisível (Deve estar).

## 3. Vendas e Caixa
- [ ] **Baixa de Estoque:** Realizar venda de um item. Verificar se o estoque físico diminuiu no inventário.
- [ ] **Carrinho Multi-Itens:** Adicionar 3 produtos diferentes no carrinho e finalizar. Validar se o valor total está correto.
- [ ] **Cancelamento:** Excluir uma venda e verificar se o valor foi removido dos gráficos.

## 4. Comunicação e Clientes
- [ ] **Cadastro de Cliente:** Validar se o telefone/e-mail do cliente é salvo.
- [ ] **Sugestão de Melhoria:** Adicionar botão de "Enviar WhatsApp" direto da lista de clientes.

## 5. Financeiro e Relatórios
- [ ] **Registro de Despesa:** Lançar uma despesa fixa (ex: Aluguel).
- [ ] **Lucro Real:** Verificar no dashboard se o gráfico de "Receita vs Despesa" está calculando a diferença corretamente.
- [ ] **Exportação:** Tentar exportar vendas (PDF/Excel) se a funcionalidade estiver ativa.

---
📅 **Última Revisão:** 05/02/2026
✅ **Status Atual:** Em Teste
