-- ============================================================
-- FINCCA — Schema do banco de dados
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- Extensões necessárias
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABELAS
-- ============================================================

-- Configurações do festival (uma linha por edição)
create table if not exists festivals (
  id uuid primary key default uuid_generate_v4(),
  name text not null default 'FINCCA — Festival Internacional de Cinema de Cabo Frio',
  year integer not null default extract(year from now())::integer,
  logo_url text,
  voting_open boolean default false,
  min_votes_for_winner integer default 3,
  allow_jury_edit boolean default false,
  created_at timestamptz default now()
);

-- Filmes inscritos
create table if not exists films (
  id uuid primary key default uuid_generate_v4(),
  festival_id uuid references festivals(id) on delete cascade,
  title text not null,
  director text not null,
  category text not null default 'Curta-metragem',
  country text,
  city text,
  duration_minutes integer,
  synopsis text,
  poster_url text,
  session_date timestamptz,
  session_location text,
  is_active boolean default true,
  order_index integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Perfis de usuário (estende auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  role text default 'public' check (role in ('public', 'judge', 'admin')),
  created_at timestamptz default now()
);

-- Jurados técnicos
create table if not exists judges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  festival_id uuid references festivals(id) on delete cascade,
  name text not null,
  email text not null,
  bio text,
  created_at timestamptz default now(),
  unique(festival_id, email)
);

-- Categorias de premiação
create table if not exists award_categories (
  id uuid primary key default uuid_generate_v4(),
  festival_id uuid references festivals(id) on delete cascade,
  name text not null,
  criteria_key text,
  is_active boolean default true,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- Critérios de avaliação técnica
create table if not exists evaluation_criteria (
  id uuid primary key default uuid_generate_v4(),
  festival_id uuid references festivals(id) on delete cascade,
  name text not null,
  key text not null,
  max_score integer default 10,
  order_index integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Votos do Júri Popular
create table if not exists public_votes (
  id uuid primary key default uuid_generate_v4(),
  film_id uuid references films(id) on delete cascade,
  voter_name text not null,
  voter_email text not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique(film_id, voter_email)
);

-- Avaliações do Júri Técnico
create table if not exists technical_evaluations (
  id uuid primary key default uuid_generate_v4(),
  film_id uuid references films(id) on delete cascade,
  judge_id uuid references judges(id) on delete cascade,
  scores jsonb not null default '{}',
  comment text,
  is_submitted boolean default false,
  submitted_at timestamptz,
  updated_at timestamptz default now(),
  unique(film_id, judge_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table festivals enable row level security;
alter table films enable row level security;
alter table profiles enable row level security;
alter table judges enable row level security;
alter table award_categories enable row level security;
alter table evaluation_criteria enable row level security;
alter table public_votes enable row level security;
alter table technical_evaluations enable row level security;

-- Festivals
create policy "Festivals: leitura pública" on festivals
  for select using (true);

create policy "Festivals: escrita apenas admin" on festivals
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Films
create policy "Films: leitura para todos" on films
  for select using (true);

create policy "Films: escrita apenas admin" on films
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Films: update apenas admin" on films
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Films: delete apenas admin" on films
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Profiles
create policy "Profiles: ver próprio perfil" on profiles
  for select using (
    id = auth.uid() or
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Profiles: atualizar próprio perfil" on profiles
  for update using (id = auth.uid());

create policy "Profiles: insert via trigger" on profiles
  for insert with check (id = auth.uid());

-- Judges
create policy "Judges: admin vê todos" on judges
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    or user_id = auth.uid()
  );

create policy "Judges: admin gerencia" on judges
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Award categories
create policy "Categories: leitura pública" on award_categories
  for select using (true);

create policy "Categories: escrita admin" on award_categories
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Evaluation criteria
create policy "Criteria: leitura pública" on evaluation_criteria
  for select using (true);

create policy "Criteria: escrita admin" on evaluation_criteria
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Public votes
create policy "Votos populares: qualquer um insere" on public_votes
  for insert with check (true);

create policy "Votos populares: só admin lê" on public_votes
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Technical evaluations
create policy "Avaliações: jurado gerencia suas próprias" on technical_evaluations
  for all using (
    exists (
      select 1 from judges
      where judges.id = judge_id and judges.user_id = auth.uid()
    )
    or
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- FUNCTIONS E TRIGGERS
-- ============================================================

-- Cria perfil automaticamente ao criar usuário
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    'public'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Atualiza updated_at automaticamente
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_films_updated_at on films;
create trigger update_films_updated_at
  before update on films
  for each row execute procedure update_updated_at_column();

drop trigger if exists update_evaluations_updated_at on technical_evaluations;
create trigger update_evaluations_updated_at
  before update on technical_evaluations
  for each row execute procedure update_updated_at_column();

-- ============================================================
-- DADOS INICIAIS
-- ============================================================

-- Festival padrão
insert into festivals (name, year, voting_open, min_votes_for_winner)
values ('FINCCA — Festival Internacional de Cinema de Cabo Frio', 2025, false, 3)
on conflict do nothing;

-- Critérios de avaliação padrão (sem festival_id = globais)
-- Será necessário associar ao festival_id após criá-lo
-- Execute a query abaixo depois de criar o festival:
/*
insert into evaluation_criteria (festival_id, key, name, order_index)
select f.id, c.key, c.name, c.order_index
from festivals f,
(values
  ('direction',      'Direção',          1),
  ('screenplay',     'Roteiro',          2),
  ('photography',    'Fotografia',       3),
  ('editing',        'Montagem',         4),
  ('sound',          'Som / Trilha',     5),
  ('acting',         'Atuação',          6),
  ('originality',    'Originalidade',    7),
  ('artistic_impact','Impacto Artístico',8),
  ('overall',        'Avaliação Geral',  9)
) as c(key, name, order_index)
where f.name = 'FINCCA — Festival Internacional de Cinema de Cabo Frio';

insert into award_categories (festival_id, name, criteria_key, order_index)
select f.id, c.name, c.criteria_key, c.order_index
from festivals f,
(values
  ('Melhor Filme',                     'overall',         1),
  ('Melhor Direção',                   'direction',       2),
  ('Melhor Roteiro',                   'screenplay',      3),
  ('Melhor Fotografia',               'photography',     4),
  ('Melhor Montagem',                  'editing',         5),
  ('Melhor Som / Trilha',              'sound',           6),
  ('Melhor Atuação',                   'acting',          7),
  ('Melhor Documentário',              null,              8),
  ('Melhor Curta-metragem',            null,              9),
  ('Melhor Filme pelo Júri Técnico',   'overall',        10)
) as c(name, criteria_key, order_index)
where f.name = 'FINCCA — Festival Internacional de Cinema de Cabo Frio';
*/

-- ============================================================
-- COMO CRIAR O PRIMEIRO ADMIN
-- ============================================================
-- 1. Crie a conta no Supabase Authentication (ou via signup na app)
-- 2. Pegue o UUID do usuário em Authentication > Users
-- 3. Execute:
--    update profiles set role = 'admin' where id = 'UUID_DO_USUARIO';
-- ============================================================
