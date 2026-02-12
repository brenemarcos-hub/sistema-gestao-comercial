# 🔐 Sistema de Chave Mestra Segura

## ✅ O que foi implementado

A senha mestra hardcoded (`'verum-master'`) foi **removida do código** e substituída por um sistema seguro baseado em:

1. **Hash SHA-256** - A senha é armazenada como hash criptográfico no banco de dados
2. **Função RPC** - Verificação server-side via Supabase
3. **Tabela `system_config`** - Armazena configurações do sistema de forma segura

---

## 📋 Passos para ativar o sistema

### 1. Executar o script SQL no Supabase

1. Acesse o **Supabase Dashboard** → SQL Editor
2. Abra o arquivo `CREATE-MASTER-KEY-SYSTEM.sql`
3. Copie todo o conteúdo e execute no SQL Editor
4. Verifique se não houve erros

### 2. Testar a funcionalidade

Agora você pode usar a chave mestra de duas formas:

#### Opção A: Botão Secreto
1. Faça login com qualquer conta
2. Clique no botão secreto (rodapé ou onde estiver configurado)
3. Digite a senha: `verum-master`
4. Sua conta será promovida a MASTER

#### Opção B: Parâmetro URL
1. Acesse: `app.html?master=verum-master`
2. Faça login normalmente
3. Após 2 segundos, você será automaticamente promovido a MASTER

---

## 🔄 Como mudar a senha mestra

### Passo 1: Gerar o hash da nova senha

1. Acesse: https://emn178.github.io/online-tools/sha256.html
2. Digite sua nova senha (ex: `minha-senha-super-secreta`)
3. Copie o hash gerado (ex: `a1b2c3d4e5f6...`)

### Passo 2: Atualizar no banco de dados

Execute no SQL Editor do Supabase:

```sql
UPDATE system_config
SET config_value = 'SEU_HASH_AQUI',
    updated_at = NOW()
WHERE config_key = 'master_key_hash';
```

**Exemplo:**
```sql
UPDATE system_config
SET config_value = 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234',
    updated_at = NOW()
WHERE config_key = 'master_key_hash';
```

---

## 🔒 Segurança

### ✅ Vantagens do novo sistema:

- ✅ **Sem senha no código** - Impossível descobrir a senha lendo o JavaScript
- ✅ **Hash criptográfico** - Mesmo com acesso ao banco, não é possível reverter o hash
- ✅ **Verificação server-side** - A validação acontece no servidor Supabase
- ✅ **Fácil de trocar** - Basta atualizar o hash no banco de dados
- ✅ **Auditável** - Você pode adicionar logs na função RPC se quiser

### ⚠️ Importante:

- A lista de **emails autorizados** ainda está no código (linhas 87-90 do `main.js`)
- Isso é uma camada adicional de segurança
- Mesmo com a senha correta, apenas emails autorizados podem se promover

---

## 🧪 Testando

### Teste 1: Senha correta
```
1. Clique no botão secreto
2. Digite: verum-master
3. Resultado esperado: Promoção para MASTER
```

### Teste 2: Senha incorreta
```
1. Clique no botão secreto
2. Digite: senha-errada
3. Resultado esperado: "❌ Chave mestra incorreta."
```

### Teste 3: Via URL
```
1. Acesse: app.html?master=verum-master
2. Faça login
3. Resultado esperado: Promoção automática após 2 segundos
```

---

## 📊 Estrutura do banco de dados

### Tabela: `system_config`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | SERIAL | ID único |
| config_key | VARCHAR(100) | Chave da configuração (ex: 'master_key_hash') |
| config_value | TEXT | Valor da configuração (hash SHA-256) |
| description | TEXT | Descrição da configuração |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data da última atualização |

### Função RPC: `verificar_chave_mestra`

```sql
verificar_chave_mestra(senha_digitada TEXT) RETURNS BOOLEAN
```

**Parâmetros:**
- `senha_digitada` - A senha em texto plano digitada pelo usuário

**Retorno:**
- `true` - Senha correta
- `false` - Senha incorreta

---

## 🎯 Próximos passos (opcional)

Para aumentar ainda mais a segurança, você pode:

1. **Adicionar rate limiting** - Limitar tentativas de verificação
2. **Logs de auditoria** - Registrar todas as tentativas de acesso
3. **2FA** - Adicionar autenticação de dois fatores
4. **Expiração de senha** - Forçar troca periódica da senha mestra
5. **Notificações** - Alertar por email quando alguém se promover a MASTER

---

## ❓ Troubleshooting

### Erro: "function verificar_chave_mestra does not exist"
**Solução:** Execute o script SQL novamente

### Erro: "permission denied for function verificar_chave_mestra"
**Solução:** Verifique se a permissão GRANT foi executada corretamente

### A senha correta não funciona
**Solução:** Verifique se o hash no banco está correto. Gere novamente em https://emn178.github.io/online-tools/sha256.html

---

**Implementado em:** 11/02/2026  
**Arquivo principal:** `js/main.js` (linhas 128-154)  
**Script SQL:** `CREATE-MASTER-KEY-SYSTEM.sql`
