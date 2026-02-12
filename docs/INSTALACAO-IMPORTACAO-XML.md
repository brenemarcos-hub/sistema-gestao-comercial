# 📦 SISTEMA DE IMPORTAÇÃO XML - INSTRUÇÕES DE INSTALAÇÃO

## 🎯 O que foi criado:

1. **`js/import.js`** - Sistema completo de importação XML
2. Este arquivo com instruções de instalação

---

## 📋 PASSO 1: Adicionar o Script no HTML

Abra o arquivo `app.html` e adicione esta linha **ANTES** da tag `</body>`:

```html
<!-- Sistema de Importação XML -->
<script src="js/import.js"></script>
```

---

## 📋 PASSO 2: Adicionar o Botão de Importação

Procure a seção de **Estoque** no `app.html` e adicione este botão junto com os outros botões de ação:

```html
<!-- Botão Importar XML -->
<button id="importXMLBtn" onclick="openImportModal()"
    class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2">
    <i class="fas fa-file-import"></i>
    Importar XML
</button>
```

---

## 📋 PASSO 3: Adicionar o Modal de Importação

Adicione este HTML **ANTES** da tag `</body>` (junto com os outros modais):

```html
<!-- Modal de Importação XML -->
<div id="importModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <i class="fas fa-file-import text-purple-600"></i>
                Importar Estoque via XML
            </h2>
            <button onclick="closeImportModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <i class="fas fa-times text-xl"></i>
            </button>
        </div>

        <!-- Body -->
        <div class="p-6">
            <!-- Instruções -->
            <div class="mb-6 bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 class="font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                    <i class="fas fa-info-circle"></i>
                    Como funciona
                </h3>
                <ul class="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• O sistema busca produtos pelo <strong>SKU</strong></li>
                    <li>• Se o produto existir, <strong>atualiza</strong> o estoque</li>
                    <li>• Se não existir, <strong>cria</strong> um novo produto</li>
                    <li>• Formatos aceitos: <code class="bg-blue-100 dark:bg-blue-900 px-1 rounded">sku</code>, <code class="bg-blue-100 dark:bg-blue-900 px-1 rounded">codigo</code>, <code class="bg-blue-100 dark:bg-blue-900 px-1 rounded">id</code></li>
                </ul>
            </div>

            <!-- Upload -->
            <div class="mb-6">
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Selecione o arquivo XML
                </label>
                <input type="file" id="xmlFileInput" accept=".xml" 
                    class="w-full p-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 transition cursor-pointer bg-gray-50 dark:bg-slate-700">
            </div>

            <!-- Botões -->
            <div class="flex gap-3 mb-6">
                <button id="processXMLBtn" onclick="processXMLFile()"
                    class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2">
                    <i class="fas fa-upload"></i>
                    Processar XML
                </button>
                <button onclick="downloadXMLTemplate()"
                    class="bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 font-bold py-3 px-4 rounded-lg transition flex items-center gap-2">
                    <i class="fas fa-download"></i>
                    Baixar Template
                </button>
            </div>

            <!-- Resultados -->
            <div id="importResults" class="hidden">
                <div class="border-t border-gray-200 dark:border-slate-700 pt-6">
                    <h3 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <i class="fas fa-clipboard-check text-green-600"></i>
                        Resultados da Importação
                    </h3>

                    <!-- Sucessos -->
                    <div class="mb-4">
                        <h4 class="font-semibold text-green-600 dark:text-green-400 mb-2">
                            ✅ Produtos Processados
                        </h4>
                        <div id="importSuccessList" class="space-y-2 max-h-60 overflow-y-auto"></div>
                    </div>

                    <!-- Erros -->
                    <div>
                        <h4 class="font-semibold text-red-600 dark:text-red-400 mb-2">
                            ❌ Erros Encontrados
                        </h4>
                        <div id="importErrorList" class="space-y-2 max-h-40 overflow-y-auto"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 rounded-b-xl">
            <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
                <i class="fas fa-shield-alt"></i>
                Apenas usuários com permissão de <strong>Gerente+</strong> podem importar produtos
            </p>
        </div>
    </div>
</div>
```

---

## 📋 PASSO 4: Testar o Sistema

1. Recarregue a página
2. Vá na aba **Estoque**
3. Clique em **"Importar XML"**
4. Clique em **"Baixar Template"** para ver o formato
5. Edite o template com seus produtos
6. Faça upload e clique em **"Processar XML"**

---

## 📄 Formato do XML Aceito

```xml
<?xml version="1.0" encoding="UTF-8"?>
<produtos>
    <produto>
        <sku>TENIS-001</sku>
        <nome>Tênis Nike Air Max</nome>
        <quantidade>50</quantidade>
        <preco>299.90</preco>
        <categoria>Tênis</categoria>
    </produto>
</produtos>
```

### Tags Aceitas (Flexível):

| Campo | Tags Aceitas |
|---|---|
| **SKU** | `<sku>`, `<codigo>`, `<id>` |
| **Nome** | `<nome>`, `<descricao>`, `<name>` |
| **Quantidade** | `<quantidade>`, `<estoque>`, `<qty>` |
| **Preço** | `<preco>`, `<valor>`, `<price>` |
| **Categoria** | `<categoria>`, `<category>` |

---

## ✅ Funcionalidades

- ✅ Importação em massa de produtos
- ✅ Atualização automática de estoque
- ✅ Criação de novos produtos
- ✅ Validação de dados
- ✅ Relatório detalhado de importação
- ✅ Download de template XML
- ✅ Suporte a múltiplos formatos de tags
- ✅ Proteção por permissões (Gerente+)
- ✅ Sanitização contra XSS

---

## 🔒 Segurança

- Apenas **Gerente**, **Dono** e **Master** podem importar
- Dados são sanitizados antes de exibir
- Validação de estrutura XML
- Tratamento de erros robusto

---

## 🆘 Troubleshooting

### "Nenhum produto encontrado no XML"
- Verifique se as tags estão corretas (`<produto>`, `<item>` ou `<product>`)
- Certifique-se que o XML está bem formatado

### "SKU/Código não encontrado"
- Todo produto precisa ter um SKU/código
- Use as tags: `<sku>`, `<codigo>` ou `<id>`

### "Quantidade inválida"
- A quantidade deve ser um número inteiro positivo
- Use a tag `<quantidade>`, `<estoque>` ou `<qty>`

---

**Criado por:** Antigravity AI  
**Data:** 04/02/2026  
**Versão:** 1.0
