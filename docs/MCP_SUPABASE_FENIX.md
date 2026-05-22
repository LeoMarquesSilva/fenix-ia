# MCP Supabase — projeto Fênix I.A (`qwvqpnkegcoihcnvencd`)

## Configuração em `.cursor/mcp.json`

O bloco **`supabase-teses-fenix-ia`** precisa ser igual ao do marketing:

1. **`"type": "http"`** — sem isso o MCP HTTP pode não registrar as ferramentas (`list_tables`, `execute_sql`, `apply_migration`, etc.).
2. **`Authorization: Bearer <PAT>`** — token pessoal do Supabase (mesmo PAT pode servir para vários projetos da conta).

Exemplo:

```json
"supabase-teses-fenix-ia": {
  "type": "http",
  "url": "https://mcp.supabase.com/mcp?project_ref=qwvqpnkegcoihcnvencd",
  "headers": {
    "Authorization": "Bearer sbp_SEU_TOKEN_AQUI"
  }
}
```

Token: **Supabase Dashboard** → ícone do usuário → **Account** → **Access Tokens** → criar token com escopo adequado.

## Depois de alterar o MCP

1. Salve `mcp.json`.
2. **Reinicie o Cursor** (ou *Developer: Reload Window*) para o servidor aparecer como **`user-supabase-teses-fenix-ia`**.
3. No chat, peça para usar esse MCP (não o `marketing-system`) ao inspecionar `profiles`, migrações, etc.

## Segurança

Não commite tokens no Git. Prefira variável de ambiente se o Cursor suportar no seu setup, ou mantenha o PAT só no `mcp.json` local.
