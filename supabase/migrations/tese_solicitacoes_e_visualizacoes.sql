-- Solicitações de teses ainda inexistentes + log de visualizações para ranking
-- (espelha migration aplicada via Supabase)

CREATE TABLE public.tese_solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo_sugerido text NOT NULL,
  descricao text,
  area text,
  status text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'em_analise', 'atendida', 'descartada'))
);

CREATE INDEX idx_tese_solicitacoes_user ON public.tese_solicitacoes(user_id);
CREATE INDEX idx_tese_solicitacoes_status ON public.tese_solicitacoes(status);
CREATE INDEX idx_tese_solicitacoes_created ON public.tese_solicitacoes(created_at DESC);

ALTER TABLE public.tese_solicitacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tese_solicitacoes_insert_own"
  ON public.tese_solicitacoes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tese_solicitacoes_select_own_or_admin"
  ON public.tese_solicitacoes FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "tese_solicitacoes_update_admin"
  ON public.tese_solicitacoes FOR UPDATE TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE TABLE public.tese_visualizacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  tese_id uuid NOT NULL REFERENCES public.teses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_tese_visualizacoes_tese ON public.tese_visualizacoes(tese_id);
CREATE INDEX idx_tese_visualizacoes_created ON public.tese_visualizacoes(created_at DESC);

ALTER TABLE public.tese_visualizacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tese_visualizacoes_insert_own"
  ON public.tese_visualizacoes FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.teses t WHERE t.id = tese_id)
  );

CREATE POLICY "tese_visualizacoes_select_admin"
  ON public.tese_visualizacoes FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE OR REPLACE FUNCTION public.ranking_teses_por_acesso(p_limit integer DEFAULT 15)
RETURNS TABLE (
  tese_id uuid,
  titulo text,
  identificador text,
  acessos bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id,
    t.titulo,
    t.identificador,
    COUNT(v.id)::bigint AS acessos
  FROM public.teses t
  INNER JOIN public.tese_visualizacoes v ON v.tese_id = t.id
  GROUP BY t.id, t.titulo, t.identificador
  ORDER BY acessos DESC, t.titulo ASC
  LIMIT GREATEST(1, LEAST(COALESCE(NULLIF(p_limit, 0), 15), 100));
$$;

REVOKE ALL ON FUNCTION public.ranking_teses_por_acesso(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ranking_teses_por_acesso(integer) TO authenticated;
