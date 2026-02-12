# 📚 DOCUMENTAÇÃO DO SISTEMA DE PERMISSÕES

## 🎯 Visão Geral

O sistema possui 4 níveis hierárquicos de acesso, cada um com permissões específicas.
A hierarquia é **cumulativa**: níveis superiores herdam todas as permissões dos níveis inferiores.

---

## 👥 Níveis de Acesso

### 🔹 NÍVEL 1: VENDEDOR
**Função:** Operação de vendas e atendimento ao cliente

**Permissões:**
- ✅ Realizar vendas (POS)
- ✅ Consultar estoque (somente leitura)
- ✅ Cadastrar e editar clientes
- ✅ Visualizar histórico de vendas

**Restrições:**
- ❌ NÃO vê preços de custo
- ❌ NÃO altera estoque
- ❌ NÃO acessa relatórios financeiros
- ❌ NÃO gerencia produtos
- ❌ NÃO gerencia usuários

---

### 🔹 NÍVEL 2: GERENTE
**Função:** Gestão operacional completa

**Permissões (Tudo do Vendedor +):**
- ✅ Gerenciar produtos (criar, editar, excluir)
- ✅ Alterar estoque
- ✅ Acessar relatórios de vendas
- ✅ Acessar relatórios financeiros
- ✅ Editar e excluir vendas
- ✅ Excluir clientes

**Restrições:**
- ❌ NÃO vê preços de custo (margem de lucro oculta)
- ❌ NÃO gerencia usuários
- ❌ NÃO acessa configurações da loja

---

### 🔹 NÍVEL 3: DONO
**Função:** Proprietário do negócio - visão completa

**Permissões (Tudo do Gerente +):**
- ✅ Visualizar preços de custo
- ✅ Visualizar lucro líquido real
- ✅ Acessar todos os relatórios financeiros
- ✅ Gerenciar usuários (Vendedores e Gerentes)
- ✅ Alterar cargos (exceto Dono e Master)
- ✅ Configurar loja (nome, logo, aparência)

**Restrições:**
- ❌ NÃO vê usuários Master na lista
- ❌ NÃO pode editar outros Donos
- ❌ NÃO acessa configurações do sistema

---

### 🔹 NÍVEL 99: MASTER (Programador)
**Função:** Desenvolvedor/Administrador do sistema

**Permissões (Tudo do Dono +):**
- ✅ **ACESSO TOTAL** a todas as funcionalidades
- ✅ Configurações do sistema (banco de dados, integrações)
- ✅ Gerenciar todos os usuários (incluindo outros Masters)
- ✅ Alterar qualquer cargo
- ✅ Deletar logs de atividade
- ✅ Modo invisível (não aparece na lista para outros usuários)

**Características Especiais:**
- 🔒 Invisível para todos os outros níveis
- 🔒 Não exibe badge de cargo (modo stealth)
- 🔒 Acesso via "porta dos fundos" (URL secreta ou código)

---

## 🔐 Como Promover para Master

### Método 1: URL Secreta
```
app.html?master=verum-master
```
Faça login normalmente, depois acesse esta URL. O sistema promoverá automaticamente.

### Método 2: Console do Navegador
```javascript
(async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    await supabaseClient.from('profiles').update({ role: 'master' }).eq('id', session.user.id);
    localStorage.setItem('userRole', 'master');
    location.reload();
})();
```

### Método 3: Botão Secreto
Clique no texto "Verum Gestão Profissional v2.0" no rodapé e digite a senha: `verum-master`

---

## 📊 Tabela de Permissões Detalhada

| Funcionalidade | Vendedor | Gerente | Dono | Master |
|---|:---:|:---:|:---:|:---:|
| **VENDAS** |
| Realizar vendas | ✅ | ✅ | ✅ | ✅ |
| Editar vendas | ❌ | ✅ | ✅ | ✅ |
| Excluir vendas | ❌ | ❌ | ✅ | ✅ |
| **ESTOQUE** |
| Visualizar estoque | ✅ | ✅ | ✅ | ✅ |
| Adicionar produtos | ❌ | ✅ | ✅ | ✅ |
| Editar produtos | ❌ | ✅ | ✅ | ✅ |
| Excluir produtos | ❌ | ✅ | ✅ | ✅ |
| Alterar quantidade | ❌ | ✅ | ✅ | ✅ |
| **CLIENTES** |
| Visualizar clientes | ✅ | ✅ | ✅ | ✅ |
| Cadastrar clientes | ✅ | ✅ | ✅ | ✅ |
| Editar clientes | ✅ | ✅ | ✅ | ✅ |
| Excluir clientes | ❌ | ✅ | ✅ | ✅ |
| **FINANCEIRO** |
| Ver relatórios | ❌ | ✅ | ✅ | ✅ |
| Ver preço de custo | ❌ | ❌ | ✅ | ✅ |
| Ver lucro líquido | ❌ | ❌ | ✅ | ✅ |
| Adicionar despesas | ❌ | ✅ | ✅ | ✅ |
| **SISTEMA** |
| Gerenciar usuários | ❌ | ❌ | ✅* | ✅ |
| Configurar loja | ❌ | ❌ | ✅ | ✅ |
| Configurar sistema | ❌ | ❌ | ❌ | ✅ |

*Dono só pode gerenciar Vendedores e Gerentes

---

## 🛠️ Arquivos do Sistema

### `js/permissions.js`
- Define roles e hierarquia
- Função `getUserRole()` - Detecta role do usuário
- Função `hasMinimumRole()` - Verifica permissões
- Objeto `PERMISSIONS` - Mapeamento de permissões
- Função `applyUIPermissions()` - Aplica visibilidade na interface

### `js/auth.js`
- Gerencia login/logout
- Cria perfis padrão (role: 'vendedor')
- Aplica permissões após login

### `js/users.js`
- Lista usuários
- Filtra Masters (invisibilidade)
- Permite alteração de cargos (com validação)

### `js/main.js`
- Sistema de promoção Master (porta dos fundos)
- Listeners de eventos

---

## 🔄 Fluxo de Permissões

1. **Login** → `auth.js` autentica usuário
2. **Carregar Role** → Busca `role` na tabela `profiles`
3. **Salvar localStorage** → `localStorage.setItem('userRole', role)`
4. **Aplicar UI** → `applyUIPermissions()` mostra/esconde elementos
5. **Validação Backend** → Supabase RLS valida operações

---

## 🚨 Segurança

### Camadas de Proteção:
1. **Frontend (UI):** Esconde botões/abas que o usuário não pode usar
2. **JavaScript:** Valida permissões antes de executar ações
3. **Supabase RLS:** Políticas no banco de dados impedem acesso não autorizado

### Importante:
⚠️ **NUNCA confie apenas no frontend!** Sempre valide no backend (RLS).

---

## 📝 Notas Técnicas

### Normalização de Roles Legados
O sistema aceita nomes antigos e converte automaticamente:
- `usuario` → `vendedor`
- `admin` → `dono`
- `programador` → `master`

### Forçar Visibilidade (Master)
O Master usa `setProperty('display', 'inline-flex', 'important')` para sobrescrever qualquer CSS que oculte elementos.

---

## 🆘 Troubleshooting

### Problema: "Não consigo ver a aba Finanças como Master"
**Solução:**
1. Abra o console (F12)
2. Digite: `localStorage.getItem('userRole')`
3. Se não for `'master'`, execute o script de correção (Método 2 acima)

### Problema: "Master aparece na lista de usuários"
**Solução:** Verifique o filtro em `js/users.js` linha 50:
```javascript
if ((user.role === 'master' || user.role === 'programador') && !isMaster) return false;
```

### Problema: "Dono consegue editar outro Dono"
**Solução:** Verifique a lógica em `js/users.js` linha 65-70.

---

**Última atualização:** 04/02/2026
**Versão:** 2.0
