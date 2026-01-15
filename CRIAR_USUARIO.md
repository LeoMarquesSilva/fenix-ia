# 👤 Como Criar Usuário para Login

Você tem **3 opções** para criar um usuário:

## 🎯 Opção 1: Via Interface do Supabase (MAIS RÁPIDO - Recomendado)

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Authentication** > **Users** (menu lateral)
4. Clique em **Add User** > **Create new user**
5. Preencha:
   - **Email**: `admin@teste.com` (ou qualquer email)
   - **Password**: `senha123456` (mínimo 6 caracteres)
   - **Auto Confirm User**: ✅ Marque esta opção (importante!)
6. Clique em **Create User**

✅ **Pronto!** Agora você pode fazer login na aplicação com essas credenciais.

---

## 🎯 Opção 2: Via Interface da Aplicação (Requer Configuração)

A aplicação já tem tela de cadastro, mas o Supabase por padrão exige confirmação de email.

### Para usar o cadastro da aplicação sem confirmação:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Authentication** > **Providers** > **Email**
4. Desabilite **"Confirm email"** (ou configure SMTP)
5. Salve as alterações
6. Na aplicação, clique em **"Não tem uma conta? Criar conta"**
7. Preencha email e senha
8. Faça login

---

## 🎯 Opção 3: Via Script (Avançado)

Se você tem a **Service Key** do Supabase:

1. Acesse: Supabase Dashboard > **Settings** > **API**
2. Copie a **"service_role" key** (NÃO a anon key)
3. Adicione no `.env.local`:
   ```
   SUPABASE_SERVICE_KEY=sua_service_key_aqui
   ```
4. Execute:
   ```bash
   npx tsx src/scripts/create-test-user.ts
   ```

---

## ✅ Testar Login

Após criar o usuário, acesse:
- **URL**: http://localhost:5173
- Use as credenciais que você criou

---

## 🔧 Troubleshooting

### Erro: "Email not confirmed"
- **Solução**: Use a Opção 1 e marque "Auto Confirm User"
- Ou desabilite confirmação de email (Opção 2)

### Erro: "Invalid login credentials"
- Verifique se o email e senha estão corretos
- Confirme que o usuário foi criado no Supabase

### Não consigo criar usuário
- Verifique se as políticas RLS estão configuradas
- Confirme que o SQL foi executado corretamente
