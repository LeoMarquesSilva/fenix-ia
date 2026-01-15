-- Adicionar coluna 'area' na tabela profiles
-- Execute este script no Supabase SQL Editor

-- Adicionar a coluna area (pode ser NULL)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS area TEXT DEFAULT NULL;

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public';
