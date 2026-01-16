-- Atualizar comentário da coluna tipo_tese
-- As opções válidas são: Tese, Consultivo
COMMENT ON COLUMN public.teses.tipo_tese IS 'Tipo da tese (opções: Tese ou Consultivo, padrão: Consultivo)';
