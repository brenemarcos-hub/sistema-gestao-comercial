# 🚀 Guia Rápido: Deploy no Netlify

## ✅ SOLUÇÃO SIMPLES (Recomendada)

Criei o arquivo `js/config.netlify.js` com suas credenciais. Siga estes passos:

---

## 📝 PASSO A PASSO:

### **1. Fazer Commit e Push**

```powershell
cd "c:\Users\Biel\OneDrive\Área de Trabalho\meu site"
git add .
git commit -m "🌐 Adiciona configuração para Netlify"
git push
```

### **2. Configurar no Netlify**

1. Acesse: https://app.netlify.com
2. Vá no seu site
3. Clique em **"Site configuration"** → **"Build & deploy"**
4. Em **"Build settings"**, configure:
   - **Build command:** (deixe vazio)
   - **Publish directory:** `.` (ponto)

### **3. Adicionar arquivo de configuração**

O arquivo `netlify.toml` já foi criado e está pronto!

### **4. Deploy**

O Netlify vai fazer deploy automaticamente quando você der push no GitHub.

---

## 🔧 ALTERNATIVA: Variáveis de Ambiente (Mais Seguro)

Se quiser usar variáveis de ambiente (mais profissional):

### **No Netlify:**

1. Vá em: **Site settings** → **Environment variables**
2. Adicione:
   - **Nome:** `SUPABASE_URL`
   - **Valor:** `https://tfpxfdyifvqgwstxmugk.supabase.co`
   
3. Adicione:
   - **Nome:** `SUPABASE_ANON_KEY`
   - **Valor:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcHhmZHlpZnZxZ3dzdHhtdWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzA5MTksImV4cCI6MjA4NTA0NjkxOX0.3Ldm9Olwj5KUhS7SGU2QsIgZlll2mPpDrkjxtIl7_fs`

---

## ⚠️ IMPORTANTE:

### **Qual arquivo usar?**

- **Desenvolvimento Local:** `js/config.production.js` (não vai pro Git)
- **Netlify:** `js/config.netlify.js` (VAI pro Git)

### **Como o sistema escolhe?**

O `js/config.js` foi atualizado para:
1. Tentar carregar de `config.production.js` (local)
2. Se não existir, usar `config.netlify.js` (Netlify)

---

## 🎯 CHECKLIST:

- [ ] Arquivo `js/config.netlify.js` criado ✅
- [ ] Arquivo `netlify.toml` criado ✅
- [ ] Fazer commit e push
- [ ] Aguardar deploy no Netlify
- [ ] Testar o site na URL do Netlify

---

## 🔍 TESTAR:

Após o deploy, acesse sua URL do Netlify e:

1. Abra o console (F12)
2. Deve aparecer: `✅ Configuração do Netlify carregada`
3. Tente fazer login

---

## 🆘 SE DER ERRO:

### **Erro: "SUPABASE_CONFIG não configurado"**

**Solução:** O arquivo `config.netlify.js` não está sendo carregado.

Verifique se você fez commit dele:
```powershell
git status
git add js/config.netlify.js
git commit -m "Adiciona config do Netlify"
git push
```

### **Erro: "Invalid API key"**

**Solução:** Credenciais incorretas.

1. Acesse: https://supabase.com/dashboard
2. Vá em: Settings → API
3. Copie novamente URL e KEY
4. Atualize `js/config.netlify.js`
5. Faça commit e push

---

## 📊 ESTRUTURA FINAL:

```
js/
├── config.js ← Carrega automaticamente
├── config.production.js ← Local (não vai pro Git)
├── config.netlify.js ← Netlify (VAI pro Git) ✅
└── config.example.js ← Exemplo
```

---

**Pronto! Agora é só fazer push e aguardar o deploy!** 🚀
