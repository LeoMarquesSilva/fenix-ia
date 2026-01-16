-- Adicionar campo tipo_tese na tabela teses
ALTER TABLE public.teses 
ADD COLUMN IF NOT EXISTS tipo_tese TEXT DEFAULT 'Consultivo';

-- Comentário para documentação
COMMENT ON COLUMN public.teses.tipo_tese IS 'Tipo da tese (opções: Tese ou Consultivo, padrão: Consultivo)';
