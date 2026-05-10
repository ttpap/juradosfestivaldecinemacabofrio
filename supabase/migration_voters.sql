-- Execute no Supabase SQL Editor
-- Cria tabela de cadastrados com data de nascimento

CREATE TABLE IF NOT EXISTS voters (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  festival_id  uuid REFERENCES festivals(id) ON DELETE CASCADE NOT NULL,
  name         text NOT NULL,
  email        text NOT NULL,
  birth_date   date NOT NULL,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(festival_id, email)
);

ALTER TABLE voters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "voters_insert" ON voters FOR INSERT WITH CHECK (true);
CREATE POLICY "voters_upsert" ON voters FOR UPDATE USING (true);
CREATE POLICY "voters_admin"  ON voters FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Se já criou a tabela sem birth_date, rode só isso:
-- ALTER TABLE voters ADD COLUMN IF NOT EXISTS birth_date date NOT NULL DEFAULT '1900-01-01';
-- ALTER TABLE voters ALTER COLUMN birth_date DROP DEFAULT;
