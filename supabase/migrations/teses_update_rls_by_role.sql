-- Restringe UPDATE em public.teses por função (profiles.role via get_user_role).
-- Advogado: sem UPDATE. Estagiário: apenas teses com user_id = auth.uid().
-- Admin e supervisor: qualquer linha.

DROP POLICY IF EXISTS "Auth update" ON public.teses;

CREATE POLICY "teses_update_by_role"
  ON public.teses
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'supervisor')
    OR (
      public.get_user_role(auth.uid()) = 'estagiario'
      AND auth.uid() = user_id
    )
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'supervisor')
    OR (
      public.get_user_role(auth.uid()) = 'estagiario'
      AND auth.uid() = user_id
    )
  );
