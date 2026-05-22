-- Executar uma vez no SQL Editor do Supabase (ou como migração) para alinhar
-- títulos já gravados com o formato do app (MAIÚSCULAS em pt-BR).
-- Assuntos (text[]): o aplicativo normaliza leitura/gravação; duplicatas antigas
-- somem na interface após regravar a tese ou reimportar planilha.

UPDATE public.teses
SET titulo = UPPER(TRIM(titulo))
WHERE titulo IS NOT NULL;
