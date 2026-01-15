-- ============================================
-- BANCO DE TESES JURÍDICAS - SCHEMA COMPLETO
-- ============================================

-- Tabela principal de teses
CREATE TABLE IF NOT EXISTS public.teses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  identificador TEXT UNIQUE NOT NULL, -- Código único da tese
  titulo TEXT NOT NULL,
  descricao TEXT,
  area TEXT,
  assuntos TEXT[], -- Array de strings
  texto_conteudo TEXT, -- Conteúdo HTML/Rich Text da tese
  link_externo TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_teses_identificador ON public.teses(identificador);
CREATE INDEX IF NOT EXISTS idx_teses_user_id ON public.teses(user_id);
CREATE INDEX IF NOT EXISTS idx_teses_area ON public.teses(area);
CREATE INDEX IF NOT EXISTS idx_teses_created_at ON public.teses(created_at DESC);

-- Índice GIN para busca full-text em arrays
CREATE INDEX IF NOT EXISTS idx_teses_assuntos_gin ON public.teses USING GIN(assuntos);

-- Índice para busca full-text em texto
CREATE INDEX IF NOT EXISTS idx_teses_texto_search ON public.teses USING GIN(to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(descricao, '') || ' ' || coalesce(texto_conteudo, '')));

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.teses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.teses ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler (público)
CREATE POLICY "Leitura pública" 
  ON public.teses 
  FOR SELECT 
  USING (true);

-- Política: Apenas autenticados podem inserir
CREATE POLICY "Auth insert" 
  ON public.teses 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Política: Usuários podem atualizar apenas suas próprias teses
-- (ou todas se você quiser que qualquer autenticado possa editar)
CREATE POLICY "Auth update" 
  ON public.teses 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Política: Usuários podem deletar apenas suas próprias teses
CREATE POLICY "Auth delete" 
  ON public.teses 
  FOR DELETE 
  USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Função auxiliar para busca full-text (opcional, para uso em queries)
CREATE OR REPLACE FUNCTION public.search_teses(search_term TEXT)
RETURNS SETOF public.teses AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.teses
  WHERE 
    to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(descricao, '') || ' ' || coalesce(texto_conteudo, '')) 
    @@ plainto_tsquery('portuguese', search_term)
    OR titulo ILIKE '%' || search_term || '%'
    OR descricao ILIKE '%' || search_term || '%'
    OR texto_conteudo ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON TABLE public.teses IS 'Tabela principal de teses jurídicas';
COMMENT ON COLUMN public.teses.identificador IS 'Código único identificador da tese (usado para upsert)';
COMMENT ON COLUMN public.teses.assuntos IS 'Array de assuntos relacionados à tese';
COMMENT ON COLUMN public.teses.texto_conteudo IS 'Conteúdo HTML/Rich Text editável no editor';
