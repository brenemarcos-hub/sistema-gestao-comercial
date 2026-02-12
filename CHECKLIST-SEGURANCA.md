# ✅ CHECKLIST DE SEGURANÇA - VERUM GESTÃO

## 🚨 AÇÕES URGENTES (Fazer AGORA)

- [✅] **Alterar email autorizado para Master**
  - Arquivo: `js/main.js` linha 99
  - Trocar `'brenemarcos@example.com'` pelo seu email real
  
- [✅] **Testar promoção Master**
  - Fazer logout
  - Fazer login com sua conta
  - Tentar usar `app.html?master=verum-master`
  - Verificar se funciona apenas com seu email

## ⚠️ ANTES DE IR PARA PRODUÇÃO

- [ ] **Configurar HTTPS**
  - Nunca usar HTTP em produção
  - Obter certificado SSL (Let's Encrypt é gratuito)
  
- [ ] **Configurar Supabase RLS**
  - Abrir painel do Supabase
  - Ir em "Authentication" → "Policies"
  - Aplicar políticas do arquivo `AUDITORIA-SEGURANCA.md`
  
- [ ] **Remover/Desabilitar porta dos fundos**
  - Comentar linhas 125-135 de `js/main.js` (botão secreto e URL)
  - Ou manter apenas para seu IP (configurar no servidor)

- [ ] **Fazer backup do banco de dados**
  - Exportar dados do Supabase
  - Guardar em local seguro

## 🔒 SEGURANÇA OPERACIONAL

- [ ] **Criar usuários de teste**
  - Criar 1 Vendedor
  - Criar 1 Gerente  
  - Criar 1 Dono
  - Testar permissões de cada um

- [ ] **Testar invisibilidade Master**
  - Logar como Dono
  - Verificar que Master não aparece na lista
  - Verificar que não pode editar Master

- [ ] **Testar restrições de edição**
  - Dono não pode editar outro Dono
  - Gerente não pode acessar usuários
  - Vendedor não vê finanças

## 📝 DOCUMENTAÇÃO

- [ ] **Treinar equipe**
  - Explicar níveis de acesso
  - Mostrar o que cada um pode fazer
  - Alertar sobre segurança de senhas

- [ ] **Documentar procedimentos**
  - Como adicionar novo usuário
  - Como promover/rebaixar usuário
  - Como recuperar acesso em emergência

## 🔍 MONITORAMENTO

- [ ] **Verificar logs regularmente**
  - Abrir console do navegador (F12)
  - Procurar por erros ou avisos
  - Verificar tentativas de acesso não autorizado

- [ ] **Revisar usuários mensalmente**
  - Remover usuários inativos
  - Verificar se roles estão corretos
  - Auditar quem tem acesso Dono/Master

## 🛡️ BOAS PRÁTICAS

- [ ] **Senhas fortes**
  - Mínimo 12 caracteres
  - Letras, números e símbolos
  - Não reutilizar senhas

- [ ] **Não compartilhar credenciais**
  - Cada pessoa deve ter sua própria conta
  - Nunca compartilhar senha Master

- [ ] **Fazer logout ao sair**
  - Especialmente em computadores compartilhados
  - Usar modo privado se necessário

## 🚀 PERFORMANCE

- [ ] **Otimizar imagens**
  - Comprimir logos antes de fazer upload
  - Usar formatos modernos (WebP)

- [ ] **Limpar dados antigos**
  - Arquivar vendas antigas (> 1 ano)
  - Remover produtos descontinuados

## 📱 COMPATIBILIDADE

- [ ] **Testar em diferentes navegadores**
  - Chrome ✓
  - Firefox ✓
  - Safari ✓
  - Edge ✓

- [ ] **Testar em mobile**
  - Smartphone Android
  - iPhone
  - Tablet

---

## ✅ STATUS ATUAL

**Vulnerabilidades Corrigidas:** 3/3 (100%)  
**Arquivos Obsoletos Removidos:** 1  
**Documentação Criada:** 2 arquivos  
**Sistema Pronto para:** ✅ Testes | ⚠️ Produção (após checklist)

---

**Última Atualização:** 04/02/2026  
**Próxima Revisão:** Após completar checklist
