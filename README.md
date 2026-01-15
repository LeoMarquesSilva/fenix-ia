# 🔥 Fênix.IA - Banco de Teses Jurídicas

<p align="center">
  <img src="public/assets/logos/logo-fenix-ia-09.png" alt="Fênix.IA Logo" width="200"/>
</p>

Sistema moderno para gerenciamento de teses jurídicas com IA integrada, editor rico, sistema de roles e exportação para Word.

## ✨ Funcionalidades

- 📝 **Editor Rico** - Editor de texto completo com formatação avançada
- 🤖 **IA Integrada** - Geração e reescrita de teses com OpenAI
- 📊 **Dashboard com Métricas** - Gráficos e estatísticas do banco de teses
- 🔍 **Filtros Avançados** - Busca por área, assunto, criador, data e ordenação
- 👥 **Sistema de Roles** - Admin, Advogado, Supervisor, Estagiário
- 📤 **Import/Export** - Upload de Word, importação de Excel, exportação para DOCX
- 🔐 **Autenticação** - Login seguro com Supabase Auth

## 🛠️ Tech Stack

| Tecnologia | Uso |
|------------|-----|
| **React 18** | Framework frontend |
| **TypeScript** | Tipagem estática |
| **Vite** | Build tool |
| **Tailwind CSS** | Estilização |
| **Shadcn/UI** | Componentes UI |
| **Supabase** | Backend (PostgreSQL + Auth) |
| **TanStack Query** | Gerenciamento de estado |
| **Tiptap** | Editor de texto rico |
| **OpenAI API** | Integração com IA |

## 🚀 Quick Start

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/fenix-ia.git
cd fenix-ia
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
VITE_OPENAI_API_KEY=sua_chave_openai
```

### 4. Configurar o banco de dados
Execute os scripts SQL no Supabase Dashboard:
1. `supabase/schema.sql` - Tabela de teses
2. `supabase/migrations/fix_profiles_with_roles.sql` - Tabela de perfis e roles

### 5. Iniciar o servidor
```bash
npm run dev
```

Acesse: http://localhost:5173

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes Shadcn/UI
│   ├── EditorAISidebar.tsx
│   ├── AIGenerateModal.tsx
│   └── UploadWordModal.tsx
├── hooks/              # Custom hooks
│   ├── useAuth.tsx     # Autenticação e roles
│   ├── useProfile.ts   # Gerenciamento de perfis
│   └── useTeses.ts     # CRUD de teses
├── lib/                # Utilitários
│   ├── supabase.ts     # Cliente Supabase
│   ├── openai.ts       # Cliente OpenAI
│   └── htmlToDocx.ts   # Conversão para Word
├── pages/              # Páginas
│   ├── Dashboard.tsx   # Dashboard principal
│   ├── ThesisEditor.tsx # Editor de teses
│   ├── Login.tsx       # Página de login
│   └── UsersManagement.tsx # Gestão de usuários
└── types/              # Definições TypeScript

docs/                   # Documentação
├── CHANGELOG.md        # Histórico de mudanças
└── SISTEMA_ROLES.md    # Sistema de permissões

supabase/
├── schema.sql          # Schema do banco
└── migrations/         # Scripts de migração
```

## 🔐 Sistema de Roles

| Role | Permissões |
|------|------------|
| **Admin** | Acesso total, gerenciar usuários |
| **Advogado** | Criar, editar, excluir teses |
| **Supervisor** | Revisar e editar todas as teses |
| **Estagiário** | Criar e visualizar teses |

## 📊 Métricas do Dashboard

- **Teses por Área** - Distribuição por área jurídica
- **Teses por Mês** - Evolução temporal
- **Top Criadores** - Ranking de produtividade

## 🌐 Deploy na Vercel

1. Push para o GitHub
2. Conecte o repositório na Vercel
3. Configure as variáveis de ambiente
4. Deploy automático!

## 📝 Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run preview  # Preview do build
npm run lint     # Verificação de código
```

## 📄 Licença

Este projeto é proprietário e confidencial.

---

Desenvolvido com 💜 por Fênix.IA
