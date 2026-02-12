# 🛍️ Sistema de Gestão Comercial

Sistema completo de gestão para lojas de varejo com controle de estoque, vendas, clientes, finanças e relatórios avançados.

## ✨ Funcionalidades

### 📦 Gestão de Estoque
- ✅ Cadastro de produtos com variantes (tamanho, cor)
- ✅ Controle de estoque em tempo real
- ✅ Alertas de estoque baixo
- ✅ Importação em massa via XML
- ✅ Código de barras (EAN/BIP)
- ✅ Categorização de produtos

### 💰 Vendas
- ✅ Registro rápido de vendas
- ✅ Carrinho de compras
- ✅ Leitura de código de barras
- ✅ Vinculação com clientes
- ✅ Histórico completo de vendas

### 👥 Gestão de Clientes
- ✅ Cadastro completo (nome, WhatsApp, CPF/CNPJ, endereço)
- ✅ Busca avançada
- ✅ Histórico de compras

### 💵 Finanças
- ✅ Controle de despesas
- ✅ DRE (Demonstrativo de Resultados)
- ✅ Cálculo de lucro bruto e líquido
- ✅ CMV (Custo de Mercadoria Vendida)

### 📊 Relatórios e Dashboards
- ✅ Gráficos interativos (Chart.js)
- ✅ Análise de tendências
- ✅ Top produtos mais vendidos
- ✅ Performance por categoria
- ✅ Mapa de calor semanal
- ✅ Metas de faturamento

### 🔐 Controle de Acesso (RBAC)
- ✅ 4 níveis de permissão: Usuário, Gerente, Admin, Master
- ✅ Controle granular de funcionalidades
- ✅ Sistema de autenticação seguro

### 🎨 Interface Premium
- ✅ Design moderno e responsivo
- ✅ Modo escuro/claro
- ✅ Animações suaves
- ✅ UX otimizada para produtividade

---

## 🚀 Começando

### Pré-requisitos

- Conta no [Supabase](https://supabase.com) (gratuita)
- Navegador moderno (Chrome, Firefox, Edge, Safari)

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
cd SEU-REPOSITORIO
```

2. **Configure o Supabase**

   a. Crie um projeto no [Supabase Dashboard](https://supabase.com/dashboard)
   
   b. Execute os scripts SQL na seguinte ordem:
   - `CREATE-MASTER-KEY-SYSTEM.sql` (sistema de chave mestra)
   - Outros scripts SQL conforme necessário

3. **Configure as credenciais**

   a. Copie o arquivo de exemplo:
   ```bash
   cp js/config.example.js js/config.production.js
   ```
   
   b. Edite `js/config.production.js` e adicione suas credenciais do Supabase:
   ```javascript
   window.SUPABASE_CONFIG = {
       url: 'https://SEU-PROJETO.supabase.co',
       key: 'SUA-CHAVE-ANON-AQUI'
   };
   ```
   
   c. Para encontrar suas credenciais:
   - Acesse: Supabase Dashboard → Seu Projeto → Settings → API
   - Copie **Project URL** e **anon/public key**

4. **Abra o sistema**
   
   Abra o arquivo `app.html` no seu navegador ou use um servidor local:
   ```bash
   # Opção 1: Python
   python -m http.server 8000
   
   # Opção 2: Node.js (http-server)
   npx http-server
   ```

---

## 📁 Estrutura do Projeto

```
├── app.html                    # Aplicação principal
├── index.html                  # Página de login/landing
├── .gitignore                  # Arquivos ignorados pelo Git
├── README.md                   # Este arquivo
│
├── css/
│   └── style.css              # Estilos globais
│
├── js/
│   ├── config.example.js      # Exemplo de configuração
│   ├── config.production.js   # Credenciais reais (NÃO vai para o Git)
│   ├── config.js              # Configuração base
│   ├── auth.js                # Autenticação
│   ├── database.js            # Operações de banco
│   ├── main.js                # Lógica principal
│   ├── ui.js                  # Interface do usuário
│   ├── dashboard.js           # Dashboard e métricas
│   ├── charts.js              # Gráficos
│   ├── clientes.js            # Gestão de clientes
│   ├── financas.js            # Gestão financeira
│   ├── users.js               # Gestão de usuários
│   ├── permissions.js         # Controle de permissões
│   ├── loja_config.js         # Configurações da loja
│   └── import.js              # Importação XML
│
├── docs/                       # 📚 Documentação
│   ├── INDEX.md               # Índice da documentação
│   ├── AUDITORIA-SEGURANCA.md
│   ├── CHECKLIST-SEGURANCA.md
│   ├── DOCS-CHAVE-MESTRA.md
│   ├── COMO-PUBLICAR-GITHUB.md
│   ├── GUIA-GITHUB.md
│   ├── COMANDOS-GIT.txt
│   ├── CHECKLIST.txt
│   ├── INSTALACAO-IMPORTACAO-XML.md
│   ├── INSTALACAO-RACE-CONDITION.md
│   ├── IMPORTACAO-XML-INSTALADO.md
│   ├── RELATORIO-FINAL.md
│   ├── PLANO-DE-TESTES.md
│   ├── ATUALIZACAO-PRECO-CUSTO.md
│   └── PERMISSOES.md
│
├── sql/                        # 🗄️ Scripts SQL
│   ├── README.md              # Guia dos scripts SQL
│   ├── CREATE-MASTER-KEY-SYSTEM.sql
│   ├── CREATE-VENDER-PRODUTO-FUNCTION.sql
│   ├── FIX-CLIENTES-BANCO.sql
│   ├── FIX-ESTOQUE-PERMISSAO.sql
│   ├── FIX-FINAL-RECURSAO.sql
│   ├── FIX-PERMISSAO-USUARIOS.sql
│   └── RESET-TOTAL-SISTEMA.sql
│
└── scripts/                    # 🔧 Scripts de automação
    ├── setup-git.bat          # Setup Git (Windows)
    └── setup-git.ps1          # Setup Git (PowerShell)
```

---

## 🔒 Segurança

### Credenciais Protegidas
- ✅ Credenciais do Supabase **NÃO** estão no código versionado
- ✅ Arquivo `config.production.js` está no `.gitignore`
- ✅ Sistema de chave mestra com hash SHA-256
- ✅ RLS (Row Level Security) no Supabase

### Níveis de Acesso

| Nível | Permissões |
|-------|-----------|
| **Usuário** | Visualizar estoque, registrar vendas básicas |
| **Gerente** | + Adicionar produtos, gerenciar clientes, importar XML |
| **Admin** | + Gerenciar usuários, configurações da loja |
| **Master** | Acesso total ao sistema |

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Gráficos**: Chart.js
- **Ícones**: Font Awesome
- **Autenticação**: Supabase Auth
- **Banco de Dados**: PostgreSQL (via Supabase)

---

## 📝 Configuração do Banco de Dados

### Tabelas Principais

- `produtos` - Catálogo de produtos
- `variantes` - Variações de produtos (tamanho, cor)
- `vendas` - Registro de vendas
- `clientes` - Base de clientes
- `despesas` - Controle de despesas
- `profiles` - Perfis de usuários
- `system_config` - Configurações do sistema

### Políticas RLS

Todas as tabelas possuem políticas de Row Level Security configuradas para garantir que usuários só acessem dados permitidos.

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 📧 Contato

Para dúvidas ou sugestões, entre em contato:
- Email: seu-email@exemplo.com
- GitHub: [@seu-usuario](https://github.com/seu-usuario)

---

## 🎯 Roadmap

### Próximas Funcionalidades

- [ ] App mobile (PWA)
- [ ] Integração com WhatsApp Business
- [ ] Emissão de NF-e
- [ ] Relatórios em PDF
- [ ] Multi-loja (SaaS)
- [ ] Integração com marketplaces
- [ ] Sistema de comissões
- [ ] Programa de fidelidade

---

## ⚠️ Importante

**Nunca commite o arquivo `js/config.production.js`!** Ele contém suas credenciais reais e está protegido pelo `.gitignore`.

Se você acidentalmente commitou credenciais:
1. Revogue as chaves antigas no Supabase
2. Gere novas credenciais
3. Atualize o `config.production.js` local
4. Use `git filter-branch` ou BFG Repo-Cleaner para limpar o histórico

---

**Desenvolvido com ❤️ para facilitar a gestão do seu negócio**
