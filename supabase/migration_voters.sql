-- Execute no Supabase SQL Editor
-- Cria tabela de cadastrados (independente de voto)

CREATE TABLE IF NOT EXISTS voters (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  festival_id  uuid REFERENCES festivals(id) ON DELETE CASCADE NOT NULL,
  name         text NOT NULL,
  email        text NOT NULL,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(festival_id, email)
);

ALTER TABLE voters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "voters_insert" ON voters FOR INSERT WITH CHECK (true);
CREATE POLICY "voters_upsert" ON voters FOR UPDATE USING (true);
CREATE POLICY "voters_admin"  ON voters FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
