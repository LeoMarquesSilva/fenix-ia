# 🔧 Configurar Conexão com Supabase

## Passo 1: Criar arquivo .env.local

Crie um arquivo chamado `.env.local` na **raiz do projeto** (mesmo nível do `package.json`) com o seguinte conteúdo:

```env
VITE_SUPABASE_URL=https://qwvqpnkegcoihcnvencd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_MRq6_FTAYUwNq3fLkwmTpg_OBEvZegP
```

⚠️ **IMPORTANTE**: 
- Use o prefixo `VITE_` (não `NEXT_PUBLIC_`)
- O arquivo `.env.local` já está no `.gitignore` (não será commitado)

## Passo 2: Executar o SQL no Supabase

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Abra o arquivo `supabase/schema.sql` deste projeto
5. Cole todo o conteúdo no SQL Editor
6. Clique em **Run** (ou pressione Ctrl+Enter)

Isso criará:
- ✅ Tabela `teses`
- ✅ Índices para performance
- ✅ Políticas RLS (Row Level Security)
- ✅ Funções e triggers

## Passo 3: Verificar Conexão

Após criar o `.env.local` e executar o SQL:

```bash
npm run dev
```

Abra o console do navegador (F12) e verifique se aparece:
```
✅ Conexão com Supabase estabelecida com sucesso!
```

## 🔍 Troubleshooting

### Erro: "Missing Supabase environment variables"
- Verifique se o arquivo `.env.local` existe na raiz
- Confirme que as variáveis começam com `VITE_`
- Reinicie o servidor (`npm run dev`)

### Erro: "relation 'teses' does not exist"
- Execute o script SQL no Supabase SQL Editor
- Verifique se não houve erros na execução

### Erro de permissão (RLS)
- Verifique se as políticas RLS foram criadas corretamente
- Confirme que está logado na aplicação

## ✅ Próximos Passos

Após configurar:
1. Acesse `http://localhost:5173`
2. Crie uma conta ou faça login
3. Teste a importação de Excel
4. Explore o editor de teses
