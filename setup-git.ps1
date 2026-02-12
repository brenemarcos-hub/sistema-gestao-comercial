# ========================================
# Script de Configuracao Automatica do Git
# ========================================

Write-Host "Configurando Git para o projeto..." -ForegroundColor Cyan
Write-Host ""

# Verificar se o Git esta instalado
try {
    $gitVersion = git --version
    Write-Host "Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "Git nao encontrado. Por favor, reinicie o PowerShell." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Configuracao do Git" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor DarkGray

# Solicitar nome do usuario
$userName = Read-Host "Digite seu nome completo (ex: Joao Silva)"
if ([string]::IsNullOrWhiteSpace($userName)) {
    Write-Host "Nome nao pode estar vazio!" -ForegroundColor Red
    exit 1
}

# Solicitar email
$userEmail = Read-Host "Digite seu email (ex: joao@exemplo.com)"
if ([string]::IsNullOrWhiteSpace($userEmail)) {
    Write-Host "Email nao pode estar vazio!" -ForegroundColor Red
    exit 1
}

# Configurar Git
Write-Host ""
Write-Host "Configurando Git..." -ForegroundColor Cyan
git config --global user.name "$userName"
git config --global user.email "$userEmail"
Write-Host "Configuracao do Git concluida!" -ForegroundColor Green

# Inicializar repositorio
Write-Host ""
Write-Host "Inicializando repositorio Git..." -ForegroundColor Cyan
git init
Write-Host "Repositorio inicializado!" -ForegroundColor Green

# Adicionar arquivos
Write-Host ""
Write-Host "Adicionando arquivos ao Git..." -ForegroundColor Cyan
git add .
Write-Host "Arquivos adicionados!" -ForegroundColor Green

# Verificar status
Write-Host ""
Write-Host "Status do repositorio:" -ForegroundColor Yellow
git status --short

# Verificar se config.production.js esta protegido
Write-Host ""
Write-Host "Verificando protecao de credenciais..." -ForegroundColor Cyan
$configInGit = git ls-files | Select-String "config.production.js"
if ($configInGit) {
    Write-Host "AVISO: config.production.js esta sendo rastreado!" -ForegroundColor Red
    Write-Host "Removendo do Git..." -ForegroundColor Yellow
    git rm --cached js/config.production.js 2>$null
    Write-Host "Arquivo removido do rastreamento!" -ForegroundColor Green
} else {
    Write-Host "Credenciais protegidas corretamente!" -ForegroundColor Green
}

# Fazer primeiro commit
Write-Host ""
Write-Host "Criando primeiro commit..." -ForegroundColor Cyan
git commit -m "Commit inicial: Sistema de Gestao Comercial"
Write-Host "Commit criado!" -ForegroundColor Green

# Renomear branch para main
Write-Host ""
Write-Host "Renomeando branch para 'main'..." -ForegroundColor Cyan
git branch -M main
Write-Host "Branch renomeada!" -ForegroundColor Green

# Solicitar informacoes do GitHub
Write-Host ""
Write-Host "Configuracao do GitHub" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Antes de continuar, voce precisa:" -ForegroundColor White
Write-Host "1. Criar um repositorio no GitHub (https://github.com/new)" -ForegroundColor White
Write-Host "2. NAO marque 'Add a README file'" -ForegroundColor White
Write-Host ""

$continuar = Read-Host "Voce ja criou o repositorio no GitHub? (S/N)"
if ($continuar -ne "S" -and $continuar -ne "s") {
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor Yellow
    Write-Host "1. Acesse: https://github.com/new" -ForegroundColor White
    Write-Host "2. Crie o repositorio" -ForegroundColor White
    Write-Host "3. Execute este script novamente" -ForegroundColor White
    Write-Host ""
    exit 0
}

# Solicitar URL do repositorio
Write-Host ""
$repoUrl = Read-Host "Cole a URL do seu repositorio (ex: https://github.com/usuario/repositorio.git)"
if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "URL nao pode estar vazia!" -ForegroundColor Red
    exit 1
}

# Adicionar remote
Write-Host ""
Write-Host "Conectando ao GitHub..." -ForegroundColor Cyan
git remote add origin $repoUrl
Write-Host "Repositorio remoto adicionado!" -ForegroundColor Green

# Fazer push
Write-Host ""
Write-Host "Enviando codigo para o GitHub..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Voce precisara autenticar no GitHub:" -ForegroundColor Yellow
Write-Host "- Use seu Personal Access Token como senha" -ForegroundColor White
Write-Host "- Ou use GitHub CLI (gh auth login)" -ForegroundColor White
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCESSO! Seu codigo esta no GitHub!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor Yellow
    Write-Host "- Acesse seu repositorio: $repoUrl" -ForegroundColor White
    Write-Host "- Adicione uma licenca (Settings -> Add license)" -ForegroundColor White
    Write-Host "- Configure GitHub Pages se desejar" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Houve um problema no push." -ForegroundColor Red
    Write-Host ""
    Write-Host "Possiveis solucoes:" -ForegroundColor Yellow
    Write-Host "1. Verifique se a URL do repositorio esta correta" -ForegroundColor White
    Write-Host "2. Configure autenticacao:" -ForegroundColor White
    Write-Host "   - Personal Access Token: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "   - GitHub CLI: gh auth login" -ForegroundColor White
    Write-Host ""
}
