# 🚀 GUIA COMPLETO - PUBLICAR NO GITHUB

## ⚠️ PASSO 0: REINICIAR O TERMINAL (IMPORTANTE!)

O Git foi instalado com sucesso, mas você precisa **FECHAR e REABRIR** o PowerShell/Terminal para que ele seja reconhecido.

**Como fazer:**
1. Feche TODAS as janelas do PowerShell/Terminal que estão abertas
2. Abra um NOVO PowerShell
3. Navegue até a pasta do projeto:
   ```powershell
   cd "c:\Users\Biel\OneDrive\Área de Trabalho\meu site"
   ```

---

## 🎯 OPÇÃO 1: USAR O SCRIPT AUTOMÁTICO (RECOMENDADO)

Depois de reabrir o terminal, execute:

```powershell
.\setup-git.bat
```

O script vai fazer TUDO automaticamente! Você só precisa:
- Informar seu nome e email
- Criar o repositório no GitHub quando solicitado
- Colar a URL do repositório
- Autenticar quando pedir

---

## 🎯 OPÇÃO 2: EXECUTAR COMANDOS MANUALMENTE

Se preferir fazer manualmente, siga os passos abaixo:

### 1️⃣ Verificar se o Git está funcionando

```powershell
git --version
```

**Resultado esperado:** `git version 2.53.0.windows.1` (ou similar)

---

### 2️⃣ Configurar seu nome e email

```powershell
git config --global user.name "Seu Nome Completo"
git config --global user.email "seu-email@exemplo.com"
```

**Exemplo:**
```powershell
git config --global user.name "João Silva"
git config --global user.email "joao.silva@gmail.com"
```

---

### 3️⃣ Inicializar o repositório Git

```powershell
git init
```

**Resultado esperado:** `Initialized empty Git repository in ...`

---

### 4️⃣ Adicionar todos os arquivos

```powershell
git add .
```

---

### 5️⃣ Verificar o status (IMPORTANTE!)

```powershell
git status
```

**⚠️ ATENÇÃO:** Verifique se `config.production.js` NÃO aparece na lista!

Se aparecer, execute:
```powershell
git rm --cached js/config.production.js
```

---

### 6️⃣ Fazer o primeiro commit

```powershell
git commit -m "Commit inicial: Sistema de Gestao Comercial"
```

---

### 7️⃣ Renomear a branch para 'main'

```powershell
git branch -M main
```

---

### 8️⃣ Criar repositório no GitHub

**Acesse:** https://github.com/new

**Preencha:**
- **Repository name:** `sistema-gestao-comercial` (ou outro nome)
- **Description:** `Sistema completo de gestão para lojas de varejo`
- **Visibility:** Public ou Private (sua escolha)
- **❌ NÃO marque:** "Add a README file"

**Clique em:** "Create repository"

---

### 9️⃣ Conectar com o GitHub

Copie a URL do seu repositório (algo como: `https://github.com/SEU-USUARIO/sistema-gestao-comercial.git`)

Execute:
```powershell
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
```

**Exemplo:**
```powershell
git remote add origin https://github.com/joaosilva/sistema-gestao-comercial.git
```

---

### 🔟 Enviar para o GitHub

```powershell
git push -u origin main
```

**Você precisará autenticar!** Veja a seção abaixo.

---

## 🔐 AUTENTICAÇÃO NO GITHUB

Quando executar `git push`, o GitHub pedirá autenticação.

### Opção A: Personal Access Token (Recomendado)

1. **Criar o token:**
   - Acesse: https://github.com/settings/tokens
   - Clique em: **"Generate new token"** → **"Generate new token (classic)"**
   - Nome: `Git Access`
   - Marque: **`repo`** (acesso completo aos repositórios)
   - Clique em: **"Generate token"**
   - **COPIE O TOKEN** (você não verá novamente!)

2. **Usar o token:**
   - **Username:** seu usuário do GitHub
   - **Password:** cole o token (NÃO use sua senha normal!)

### Opção B: GitHub CLI (Mais fácil)

```powershell
# Instalar GitHub CLI
winget install --id GitHub.cli

# Fazer login
gh auth login

# Seguir as instruções interativas
```

Depois de autenticar com `gh auth login`, o `git push` funcionará automaticamente!

---

## ✅ VERIFICAR SE DEU CERTO

Depois do push, acesse seu repositório no GitHub:
```
https://github.com/SEU-USUARIO/SEU-REPOSITORIO
```

Você deve ver todos os seus arquivos lá! 🎉

---

## 📝 COMANDOS ÚTEIS PARA O DIA A DIA

```powershell
# Ver status dos arquivos
git status

# Adicionar arquivos modificados
git add .

# Fazer commit
git commit -m "Descrição das mudanças"

# Enviar para o GitHub
git push

# Baixar mudanças do GitHub
git pull

# Ver histórico de commits
git log --oneline --graph --all
```

---

## 🆘 PROBLEMAS COMUNS

### ❌ "git não é reconhecido"
**Solução:** Feche e reabra o terminal

### ❌ "Authentication failed"
**Solução:** Use Personal Access Token (não a senha)

### ❌ "config.production.js aparece no git status"
**Solução:** 
```powershell
git rm --cached js/config.production.js
git commit -m "Remove credenciais do rastreamento"
```

### ❌ "remote origin already exists"
**Solução:**
```powershell
git remote remove origin
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
```

---

## 🎯 RESUMO RÁPIDO

1. ✅ Git instalado
2. ⏳ Fechar e reabrir terminal
3. ⏳ Executar `.\setup-git.bat` OU seguir passos manuais
4. ⏳ Criar repositório no GitHub
5. ⏳ Fazer push
6. ✅ Código no GitHub!

---

## 📞 PRECISA DE AJUDA?

Se tiver qualquer problema, me avise! Estou aqui para ajudar! 😊

---

**Criado em:** 11/02/2026
**Versão:** 1.0
