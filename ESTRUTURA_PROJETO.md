# Estrutura do Projeto - Banco de Teses Jurídicas

## 📁 Estrutura de Pastas

```
teses-cursor/
├── supabase/
│   └── schema.sql              # Script SQL completo para Supabase
├── src/
│   ├── components/
│   │   ├── ui/                 # Componentes Shadcn/UI
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   └── use-toast.ts
│   │   └── ImportModal.tsx     # Modal de importação Excel
│   ├── hooks/
│   │   ├── useAuth.tsx         # Hook de autenticação
│   │   └── useTeses.ts         # Hooks React Query para teses
│   ├── lib/
│   │   ├── supabase.ts         # Cliente Supabase
│   │   └── utils.ts            # Utilitários (cn, etc)
│   ├── pages/
│   │   ├── Login.tsx           # Página de login/cadastro
│   │   ├── Dashboard.tsx       # Listagem e busca de teses
│   │   └── ThesisEditor.tsx    # Editor de teses (Tiptap)
│   ├── types/
│   │   └── supabase.ts         # Tipos TypeScript do Supabase
│   ├── App.tsx                 # Componente principal e rotas
│   ├── main.tsx                # Entry point
│   └── index.css               # Estilos globais (Tailwind)
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```

## 🗄️ Banco de Dados

### Tabela: `teses`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Chave primária |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de atualização |
| `identificador` | TEXT | Código único (usado para upsert) |
| `titulo` | TEXT | Título da tese |
| `descricao` | TEXT | Descrição resumida |
| `area` | TEXT | Área jurídica |
| `assuntos` | TEXT[] | Array de assuntos |
| `texto_conteudo` | TEXT | Conteúdo HTML/Rich Text |
| `link_externo` | TEXT | Link externo |
| `user_id` | UUID | ID do usuário que criou |

### Índices

- `idx_teses_identificador` - Busca rápida por identificador
- `idx_teses_user_id` - Filtro por usuário
- `idx_teses_area` - Filtro por área
- `idx_teses_assuntos_gin` - Busca em arrays (GIN)
- `idx_teses_texto_search` - Full-text search (GIN)

### Políticas RLS

- **Leitura pública**: Todos podem ler
- **Auth insert**: Apenas autenticados podem inserir
- **Auth update**: Apenas autenticados podem atualizar
- **Auth delete**: Apenas o criador pode deletar

## 🔑 Funcionalidades

### 1. Autenticação
- Login/Cadastro com Supabase Auth
- Rotas protegidas
- Gerenciamento de sessão

### 2. Dashboard
- Listagem paginada de teses
- Busca full-text (título, descrição, conteúdo)
- Filtros por área e assunto
- Importação via Excel

### 3. Importação Excel
- Suporte a arquivos .xlsx
- Mapeamento automático de colunas
- Upsert inteligente (inserir ou atualizar)
- Barra de progresso e resumo

### 4. Editor de Teses
- Editor WYSIWYG (Tiptap)
- Formatação rica (negrito, itálico, listas, etc)
- Exportação para DOCX
- Salvamento automático

## 📦 Dependências Principais

- **React 18** + TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **Shadcn/UI** - Componentes
- **Supabase** - Backend/DB
- **TanStack Query** - State management
- **React Router** - Roteamento
- **Tiptap** - Editor rico
- **XLSX** - Leitura de Excel
- **docx** - Geração de Word

## 🚀 Próximos Passos

1. Execute o SQL em `supabase/schema.sql` no Supabase
2. Configure as variáveis de ambiente (`.env.local`)
3. Instale as dependências: `npm install`
4. Inicie o servidor: `npm run dev`
