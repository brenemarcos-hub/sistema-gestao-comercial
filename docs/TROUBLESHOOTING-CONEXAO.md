# 🔧 Guia de Solução de Problemas - Acesso pela Internet

## 🚨 Problema Relatado
"Falha no banco de dados ao acessar pela internet"

---

## 🔍 Diagnóstico Rápido

### **PASSO 1: Execute o Diagnóstico Automático**

Abra o arquivo: **`diagnostico.html`** no navegador

Este arquivo testa automaticamente:
- ✅ Configuração do Supabase
- ✅ Conexão com o banco
- ✅ Autenticação
- ✅ Permissões

---

## ❓ Possíveis Causas e Soluções

### **1. Arquivo `config.production.js` não está sendo carregado**

#### Sintomas:
- Erro: "SUPABASE_CONFIG is not defined"
- Página em branco
- Console mostra erro de configuração

#### Solução:
Verifique se o arquivo está sendo carregado corretamente no HTML:

```html
<!-- Deve estar ANTES de outros scripts -->
<script src="js/config.production.js"></script>
```

**Verificar:**
1. Abra o navegador (F12)
2. Vá em "Network" (Rede)
3. Recarregue a página
4. Procure por `config.production.js`
5. Se estiver em vermelho (404), o arquivo não foi encontrado

---

### **2. CORS (Cross-Origin Resource Sharing)**

#### Sintomas:
- Erro: "CORS policy blocked"
- Funciona localmente mas não na internet
- Console mostra erro de CORS

#### Solução:

**Opção A: Usar servidor HTTP (Recomendado)**

Não abra o arquivo diretamente (`file:///`). Use um servidor local:

```powershell
# Opção 1: Python
python -m http.server 8000

# Opção 2: Node.js
npx http-server

# Opção 3: PHP
php -S localhost:8000
```

Depois acesse: `http://localhost:8000`

**Opção B: Configurar Supabase**

1. Acesse Supabase Dashboard
2. Vá em: Settings → API → CORS
3. Adicione sua URL ou use `*` (não recomendado para produção)

---

### **3. Credenciais Incorretas**

#### Sintomas:
- Erro: "Invalid API key"
- Erro: "Project not found"
- Status 401 ou 403

#### Solução:

1. **Verificar credenciais no Supabase:**
   - Acesse: https://supabase.com/dashboard
   - Vá em: Settings → API
   - Copie novamente:
     - **Project URL**
     - **anon/public key**

2. **Atualizar `config.production.js`:**
   ```javascript
   window.SUPABASE_CONFIG = {
       url: 'SUA_URL_AQUI',  // https://xxx.supabase.co
       key: 'SUA_KEY_AQUI'   // eyJhbGciOiJIUzI1NiI...
   };
   ```

3. **Limpar cache do navegador:**
   - Pressione `Ctrl+Shift+Delete`
   - Limpe cache e cookies
   - Recarregue a página

---

### **4. Função SQL não criada**

#### Sintomas:
- Erro: "function vender_produto does not exist"
- Vendas não funcionam
- Outras operações funcionam normalmente

#### Solução:

Execute o script SQL no Supabase:

1. Acesse: Supabase Dashboard → SQL Editor
2. Abra: `sql/CREATE-VENDER-PRODUTO-FUNCTION.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em "Run"

---

### **5. Políticas RLS (Row Level Security)**

#### Sintomas:
- Erro: "new row violates row-level security policy"
- Não consegue inserir/atualizar dados
- Leitura funciona, escrita não

#### Solução:

**Verificar políticas:**

```sql
-- Ver políticas existentes
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public';
```

**Recriar políticas (se necessário):**

Execute: `sql/RESET-TOTAL-SISTEMA.sql` (⚠️ CUIDADO: Apaga dados!)

Ou execute os scripts FIX:
- `sql/FIX-PERMISSAO-USUARIOS.sql`
- `sql/FIX-ESTOQUE-PERMISSAO.sql`

---

### **6. Projeto Supabase Pausado**

#### Sintomas:
- Erro: "Project is paused"
- Não consegue conectar
- Dashboard mostra projeto pausado

#### Solução:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Se estiver pausado, clique em "Resume Project"
4. Aguarde alguns minutos para reativar

**Nota:** Projetos gratuitos pausam após 7 dias de inatividade.

---

### **7. Problema de Rede/Internet**

#### Sintomas:
- Erro: "Network error"
- Erro: "Failed to fetch"
- Timeout

#### Solução:

1. **Verificar conexão:**
   ```powershell
   ping supabase.co
   ```

2. **Testar DNS:**
   ```powershell
   nslookup tfpxfdyifvqgwstxmugk.supabase.co
   ```

3. **Verificar firewall:**
   - Permita conexões HTTPS (porta 443)
   - Adicione exceção para `*.supabase.co`

4. **Testar em outra rede:**
   - Use dados móveis
   - Tente outra rede Wi-Fi

---

### **8. Cache do Navegador**

#### Sintomas:
- Mudanças no código não aparecem
- Versão antiga sendo carregada
- Comportamento inconsistente

#### Solução:

**Limpar cache:**
1. Pressione `Ctrl+Shift+Delete`
2. Selecione "Cache" e "Cookies"
3. Clique em "Limpar dados"

**Ou use modo anônimo:**
- Chrome: `Ctrl+Shift+N`
- Firefox: `Ctrl+Shift+P`
- Edge: `Ctrl+Shift+N`

---

## 🛠️ Ferramentas de Diagnóstico

### **1. Console do Navegador (F12)**

Abra e verifique:
- **Console:** Erros em vermelho
- **Network:** Requisições falhadas
- **Application:** Cookies e storage

### **2. Teste Manual de Conexão**

Cole no console do navegador:

```javascript
// Testar configuração
console.log('Config:', window.SUPABASE_CONFIG);

// Testar conexão
const { createClient } = supabase;
const client = createClient(
    window.SUPABASE_CONFIG.url,
    window.SUPABASE_CONFIG.key
);

// Testar query
client.from('lojas').select('id').limit(1)
    .then(({ data, error }) => {
        if (error) console.error('Erro:', error);
        else console.log('Sucesso:', data);
    });
```

---

## 📋 Checklist de Verificação

- [ ] Arquivo `config.production.js` existe e está correto
- [ ] Credenciais do Supabase estão atualizadas
- [ ] Projeto Supabase está ativo (não pausado)
- [ ] Usando servidor HTTP (não `file:///`)
- [ ] Função SQL `vender_produto` foi criada
- [ ] Políticas RLS estão configuradas
- [ ] Cache do navegador foi limpo
- [ ] Internet está funcionando
- [ ] Console não mostra erros

---

## 🆘 Ainda com Problemas?

### **Informações para Debug:**

Colete estas informações e me envie:

1. **Erro exato do console:**
   - Abra F12 → Console
   - Copie a mensagem de erro completa

2. **Resultado do diagnóstico:**
   - Abra `diagnostico.html`
   - Clique em "Iniciar Diagnóstico"
   - Tire print dos resultados

3. **Como está acessando:**
   - [ ] Arquivo local (`file:///`)
   - [ ] Servidor local (`localhost`)
   - [ ] Hospedado na internet (qual URL?)

4. **Navegador e versão:**
   - Exemplo: Chrome 120, Firefox 121, etc.

---

## ✅ Solução Rápida (Mais Comum)

**90% dos casos são resolvidos assim:**

1. **Use servidor HTTP:**
   ```powershell
   cd "c:\Users\Biel\OneDrive\Área de Trabalho\meu site"
   python -m http.server 8000
   ```

2. **Acesse:** `http://localhost:8000`

3. **Limpe o cache:** `Ctrl+Shift+Delete`

4. **Recarregue:** `Ctrl+F5`

---

**Última atualização:** 11/02/2026
