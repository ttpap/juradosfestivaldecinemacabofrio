-- ============================================================
-- FINCCA – Júri Popular  (schema simplificado)
-- Execute no Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS festivals (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name         text NOT NULL,
  year         int  NOT NULL,
  voting_open  boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS films (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  festival_id   uuid REFERENCES festivals(id) ON DELETE CASCADE NOT NULL,
  title         text NOT NULL,
  director      text NOT NULL,
  synopsis      text,
  category      text,
  thumbnail_url text,
  active        boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id   uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role text DEFAULT 'public' CHECK (role IN ('public', 'admin'))
);

-- 1 voto por email por festival
CREATE TABLE IF NOT EXISTS public_votes (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  festival_id  uuid REFERENCES festivals(id) ON DELETE CASCADE NOT NULL,
  film_id      uuid REFERENCES films(id)     ON DELETE CASCADE NOT NULL,
  voter_name   text NOT NULL,
  voter_email  text NOT NULL,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(festival_id, voter_email)
);

-- ── Triggers ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_films_updated_at ON films;
CREATE TRIGGER set_films_updated_at
  BEFORE UPDATE ON films FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'public')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ── RLS ─────────────────────────────────────────────────────

ALTER TABLE festivals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE films        ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_votes ENABLE ROW LEVEL SECURITY;

-- Festivals: leitura pública, escrita admin
CREATE POLICY "festivals_read"  ON festivals FOR SELECT USING (true);
CREATE POLICY "festivals_admin" ON festivals FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Films: leitura pública dos ativos, CRUD admin pode ver todos
CREATE POLICY "films_public_read" ON films FOR SELECT USING (active = true);
CREATE POLICY "films_admin"       ON films FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Profiles
CREATE POLICY "profiles_own"   ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_admin" ON profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Votes: qualquer um insere, só admin lê
CREATE POLICY "votes_insert" ON public_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "votes_admin"  ON public_votes FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
