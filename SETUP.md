# 🚀 Guia de Setup - Banco de Teses Jurídicas

## Passo 1: Configurar Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. No SQL Editor do Supabase, execute o script completo em `supabase/schema.sql`
3. Anote sua URL e chave anônima (Settings > API)

## Passo 2: Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

## Passo 3: Instalar Dependências

```bash
npm install
```

## Passo 4: Iniciar o Servidor

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 📋 Formato do Excel para Importação

O arquivo Excel deve conter as seguintes colunas:

| Coluna | Descrição | Obrigatório |
|--------|-----------|-------------|
| `Identificador` | Código único da tese | ✅ Sim |
| `Título` | Título da tese | ✅ Sim |
| `Descrição` | Descrição resumida | ❌ Não |
| `Área` | Área jurídica | ❌ Não |
| `Assuntos` | Assuntos separados por `||` | ❌ Não |
| `Link` | Link externo | ❌ Não |

**Exemplo:**
```
Identificador | Título | Descrição | Área | Assuntos | Link
TESE-001 | Responsabilidade Civil | ... | Civil | Contrato||Danos | https://...
```

## 🎨 Recursos Implementados

✅ Autenticação completa (Login/Cadastro)  
✅ Dashboard com listagem paginada  
✅ Busca full-text em múltiplos campos  
✅ Filtros por área e assunto  
✅ Importação inteligente via Excel (Upsert)  
✅ Editor rico de texto (Tiptap)  
✅ Exportação para DOCX  
✅ Interface moderna e responsiva  
✅ Rotas protegidas  
✅ Cache inteligente (React Query)  

## 🔧 Troubleshooting

### Erro: "Missing Supabase environment variables"
- Verifique se o arquivo `.env.local` existe e está na raiz
- Confirme que as variáveis começam com `VITE_`

### Erro ao importar Excel
- Verifique se o arquivo é `.xlsx` (não `.xls`)
- Confirme que a primeira linha contém os cabeçalhos
- Verifique se a coluna "Identificador" existe e está preenchida

### Erro de permissão no Supabase
- Execute novamente o script SQL
- Verifique se as políticas RLS estão ativas
- Confirme que está logado na aplicação
