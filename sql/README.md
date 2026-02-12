# 🗄️ Scripts SQL

Este diretório contém todos os scripts SQL para configuração e manutenção do banco de dados.

---

## 📋 Scripts Disponíveis

### 🔐 Segurança e Autenticação
- **CREATE-MASTER-KEY-SYSTEM.sql** - Sistema de chave mestra para acesso administrativo

### 🛠️ Correções (FIX)
- **FIX-CLIENTES-BANCO.sql** - Correção de problemas na tabela de clientes
- **FIX-ESTOQUE-PERMISSAO.sql** - Correção de permissões de estoque
- **FIX-FINAL-RECURSAO.sql** - Correção de problemas de recursão
- **FIX-PERMISSAO-USUARIOS.sql** - Correção de permissões de usuários

### ✨ Funcionalidades
- **CREATE-VENDER-PRODUTO-FUNCTION.sql** - Função para venda com proteção contra race condition

### 🔄 Manutenção
- **RESET-TOTAL-SISTEMA.sql** - Reset completo do sistema (USE COM CUIDADO!)

---

## 📖 Ordem de Execução Recomendada

### Para Nova Instalação:

1. **CREATE-MASTER-KEY-SYSTEM.sql** - Primeiro, configure a segurança
2. **CREATE-VENDER-PRODUTO-FUNCTION.sql** - Adicione a função de venda
3. **FIX-PERMISSAO-USUARIOS.sql** - Configure permissões básicas
4. **FIX-ESTOQUE-PERMISSAO.sql** - Configure permissões de estoque

### Para Correções:

Execute os scripts FIX-* conforme necessário para resolver problemas específicos.

---

## ⚠️ Avisos Importantes

### 🔴 RESET-TOTAL-SISTEMA.sql
**CUIDADO!** Este script:
- ❌ Apaga TODOS os dados
- ❌ Remove TODAS as tabelas
- ❌ Reseta o sistema completamente
- ✅ Use APENAS em desenvolvimento
- ✅ NUNCA use em produção

### 🟡 Scripts FIX-*
- Sempre faça backup antes de executar
- Leia o conteúdo antes de executar
- Teste em ambiente de desenvolvimento primeiro

---

## 🚀 Como Executar

### No Supabase Dashboard:

1. Acesse o **SQL Editor**
2. Clique em **"New query"**
3. Copie o conteúdo do script
4. Cole no editor
5. Clique em **"Run"** (ou `Ctrl+Enter`)

### Via CLI (psql):

```bash
psql -h SEU_HOST -U postgres -d postgres -f nome-do-script.sql
```

---

## 📊 Descrição Detalhada

### CREATE-MASTER-KEY-SYSTEM.sql
Cria um sistema de chave mestra para acesso administrativo seguro. Inclui:
- Função de verificação de chave
- Hash SHA-256 para segurança
- Permissões apropriadas

### CREATE-VENDER-PRODUTO-FUNCTION.sql
Implementa venda atômica com proteção contra race condition:
- UPDATE com lock implícito
- Validação atômica de estoque
- Rollback automático em caso de erro
- Mensagens de erro detalhadas

### FIX-CLIENTES-BANCO.sql
Corrige problemas na estrutura da tabela de clientes.

### FIX-ESTOQUE-PERMISSAO.sql
Ajusta permissões RLS para operações de estoque.

### FIX-FINAL-RECURSAO.sql
Resolve problemas de recursão em funções SQL.

### FIX-PERMISSAO-USUARIOS.sql
Corrige permissões de acesso de usuários.

### RESET-TOTAL-SISTEMA.sql
Reset completo do banco de dados. Recria todas as tabelas, funções e políticas.

---

## 🔍 Verificação Pós-Execução

Após executar um script, verifique:

```sql
-- Verificar funções criadas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public';

-- Verificar tabelas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Verificar políticas RLS
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

---

## 📞 Suporte

Se encontrar problemas ao executar os scripts:
1. Verifique os logs de erro no Supabase
2. Consulte a documentação em `/docs`
3. Revise as permissões do usuário

---

**Última atualização:** 11/02/2026
