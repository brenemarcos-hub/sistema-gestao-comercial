# 🚀 Guia Rápido: Publicando no GitHub

## Passo a Passo

### 1. Criar Repositório no GitHub

1. Acesse [github.com](https://github.com)
2. Clique em **"New repository"** (ou no botão **+** → **New repository**)
3. Preencha:
   - **Repository name**: `sistema-gestao-comercial` (ou o nome que preferir)
   - **Description**: "Sistema completo de gestão para lojas de varejo"
   - **Visibility**: Escolha **Public** ou **Private**
   - ❌ **NÃO** marque "Add a README file" (já temos um)
4. Clique em **"Create repository"**

---

### 2. Configurar Git Localmente

Abra o PowerShell na pasta do projeto e execute:

```powershell
# Inicializar repositório Git (se ainda não foi feito)
git init

# Configurar seu nome e email (se ainda não configurou)
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"

# Adicionar todos os arquivos (exceto os do .gitignore)
git add .

# Verificar o que será commitado
git status

# Fazer o primeiro commit
git commit -m "🎉 Commit inicial: Sistema de Gestão Comercial"

# Renomear branch para 'main' (padrão do GitHub)
git branch -M main

# Conectar com o repositório remoto do GitHub
# ⚠️ SUBSTITUA 'SEU-USUARIO' e 'SEU-REPOSITORIO' pelos valores reais
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git

# Enviar código para o GitHub
git push -u origin main
```

---

### 3. Verificar se Credenciais Foram Protegidas

Antes de fazer o push, **CERTIFIQUE-SE** de que:

✅ O arquivo `.gitignore` existe
✅ O arquivo `js/config.production.js` está listado no `.gitignore`
✅ Execute este comando para verificar:

```powershell
git status
```

**Você NÃO deve ver** `js/config.production.js` na lista de arquivos a serem commitados.

Se aparecer, **PARE IMEDIATAMENTE** e execute:

```powershell
git reset
git rm --cached js/config.production.js
git add .
git commit -m "🎉 Commit inicial: Sistema de Gestão Comercial"
```

---

### 4. Autenticação no GitHub

Quando você executar `git push`, o GitHub pedirá autenticação:

#### Opção A: Personal Access Token (Recomendado)

1. Acesse: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Dê um nome: `Git Access`
4. Marque o escopo: `repo` (acesso completo aos repositórios)
5. Clique em **"Generate token"**
6. **COPIE O TOKEN** (você não verá novamente!)
7. Use o token como senha quando o Git pedir

#### Opção B: GitHub CLI (Mais fácil)

```powershell
# Instalar GitHub CLI
winget install --id GitHub.cli

# Fazer login
gh auth login

# Seguir as instruções interativas
```

---

### 5. Comandos Úteis para o Dia a Dia

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
git log --oneline

# Criar nova branch
git checkout -b nome-da-branch

# Voltar para a branch main
git checkout main
```

---

### 6. Estrutura de Commits (Boas Práticas)

Use emojis e mensagens descritivas:

```
✨ feat: Nova funcionalidade
🐛 fix: Correção de bug
📝 docs: Atualização de documentação
💄 style: Mudanças de estilo/UI
♻️ refactor: Refatoração de código
⚡ perf: Melhoria de performance
🔒 security: Correção de segurança
🚀 deploy: Deploy/release
```

**Exemplos:**
```powershell
git commit -m "✨ feat: Adiciona importação de produtos via XML"
git commit -m "🐛 fix: Corrige cálculo de estoque na venda"
git commit -m "📝 docs: Atualiza README com instruções de instalação"
```

---

### 7. O que Fazer se Commitou Credenciais por Engano

**⚠️ ATENÇÃO: Se você acidentalmente commitou `config.production.js`:**

```powershell
# 1. Remover do histórico
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch js/config.production.js" \
  --prune-empty --tag-name-filter cat -- --all

# 2. Forçar push (CUIDADO!)
git push origin --force --all

# 3. IMPORTANTE: Revogar credenciais antigas no Supabase
# Acesse Supabase Dashboard → Settings → API → Reset anon key
```

**Melhor ainda:** Use o [BFG Repo-Cleaner](https://reps-cleaner.github.io/)

---

### 8. Colaborando com Outros Desenvolvedores

Quando alguém clonar o repositório:

```powershell
# 1. Clonar o repositório
git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
cd SEU-REPOSITORIO

# 2. Copiar arquivo de configuração
cp js/config.example.js js/config.production.js

# 3. Editar config.production.js e adicionar credenciais
# (Você precisa fornecer as credenciais para o colaborador de forma segura)

# 4. Abrir app.html no navegador
```

---

### 9. Protegendo Secrets no GitHub

Para projetos com CI/CD, use **GitHub Secrets**:

1. Repositório → Settings → Secrets and variables → Actions
2. Clique em **"New repository secret"**
3. Adicione:
   - `SUPABASE_URL`: sua URL do Supabase
   - `SUPABASE_ANON_KEY`: sua chave anon

---

### 10. Checklist Final Antes do Push

- [ ] `.gitignore` criado e configurado
- [ ] `config.production.js` NÃO aparece em `git status`
- [ ] `README.md` atualizado com suas informações
- [ ] Código testado e funcionando
- [ ] Mensagem de commit descritiva
- [ ] Credenciais do Supabase seguras

---

## 🎉 Pronto!

Seu código está no GitHub e suas credenciais estão protegidas!

**Próximos passos:**
- Adicione uma licença (MIT, GPL, etc)
- Configure GitHub Pages (se quiser hospedar)
- Adicione badges ao README
- Configure GitHub Actions para CI/CD

---

**Dúvidas?** Consulte a [documentação oficial do Git](https://git-scm.com/doc)
