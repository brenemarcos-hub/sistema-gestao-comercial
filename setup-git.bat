@echo off
chcp 65001 >nul
color 0A

echo ========================================
echo   CONFIGURAÇÃO AUTOMÁTICA DO GIT
echo ========================================
echo.

REM Verificar se Git está instalado
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Git não encontrado!
    echo.
    echo Por favor:
    echo 1. Feche este terminal
    echo 2. Abra um NOVO PowerShell ou CMD
    echo 3. Execute este script novamente
    echo.
    pause
    exit /b 1
)

echo [OK] Git encontrado!
git --version
echo.

echo ========================================
echo   CONFIGURAÇÃO DO USUÁRIO
echo ========================================
echo.

set /p USERNAME_GIT="Digite seu nome completo: "
set /p USEREMAIL_GIT="Digite seu email: "

echo.
echo Configurando Git...
git config --global user.name "%USERNAME_GIT%"
git config --global user.email "%USEREMAIL_GIT%"
echo [OK] Configuração concluída!
echo.

echo ========================================
echo   INICIALIZANDO REPOSITÓRIO
echo ========================================
echo.

echo Inicializando repositório Git...
git init
echo [OK] Repositório inicializado!
echo.

echo Adicionando arquivos...
git add .
echo [OK] Arquivos adicionados!
echo.

echo ========================================
echo   STATUS DO REPOSITÓRIO
echo ========================================
echo.
git status --short
echo.

echo ========================================
echo   VERIFICANDO SEGURANÇA
echo ========================================
echo.

git ls-files | findstr "config.production.js" >nul 2>&1
if %errorlevel% equ 0 (
    echo [AVISO] config.production.js está sendo rastreado!
    echo Removendo do Git...
    git rm --cached js/config.production.js >nul 2>&1
    echo [OK] Arquivo removido do rastreamento!
) else (
    echo [OK] Credenciais protegidas corretamente!
)
echo.

echo ========================================
echo   CRIANDO PRIMEIRO COMMIT
echo ========================================
echo.

git commit -m "Commit inicial: Sistema de Gestao Comercial"
echo [OK] Commit criado!
echo.

echo Renomeando branch para 'main'...
git branch -M main
echo [OK] Branch renomeada!
echo.

echo ========================================
echo   CONFIGURAÇÃO DO GITHUB
echo ========================================
echo.
echo Antes de continuar, você precisa:
echo 1. Criar um repositório no GitHub
echo 2. Acesse: https://github.com/new
echo 3. NÃO marque "Add a README file"
echo.

set /p CONTINUAR="Você já criou o repositório? (S/N): "
if /i not "%CONTINUAR%"=="S" (
    echo.
    echo Próximos passos:
    echo 1. Acesse: https://github.com/new
    echo 2. Crie o repositório
    echo 3. Execute este script novamente
    echo.
    pause
    exit /b 0
)

echo.
set /p REPO_URL="Cole a URL do repositório (ex: https://github.com/usuario/repo.git): "

echo.
echo Conectando ao GitHub...
git remote add origin %REPO_URL%
echo [OK] Repositório remoto adicionado!
echo.

echo ========================================
echo   ENVIANDO PARA O GITHUB
echo ========================================
echo.
echo IMPORTANTE: Você precisará autenticar
echo - Use Personal Access Token como senha
echo - Crie em: https://github.com/settings/tokens
echo.
pause

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   SUCESSO! CÓDIGO NO GITHUB!
    echo ========================================
    echo.
    echo Acesse: %REPO_URL%
    echo.
) else (
    echo.
    echo [ERRO] Problema no push!
    echo.
    echo Possíveis soluções:
    echo 1. Verifique a URL do repositório
    echo 2. Use Personal Access Token
    echo 3. Ou instale GitHub CLI: gh auth login
    echo.
)

pause
