-- ============================================================
-- Execute este script DEPOIS do schema.sql
-- Ele cadastra critérios e categorias no festival ativo
-- ============================================================

-- Critérios de avaliação
insert into evaluation_criteria (festival_id, key, name, order_index, is_active)
select f.id, c.key, c.name, c.order_index, true
from festivals f,
(values
  ('direction',       'Direção',           1),
  ('screenplay',      'Roteiro',           2),
  ('photography',     'Fotografia',        3),
  ('editing',         'Montagem',          4),
  ('sound',           'Som / Trilha',      5),
  ('acting',          'Atuação',           6),
  ('originality',     'Originalidade',     7),
  ('artistic_impact', 'Impacto Artístico', 8),
  ('overall',         'Avaliação Geral',   9)
) as c(key, name, order_index)
order by f.created_at desc
limit 9;

-- Categorias de premiação
insert into award_categories (festival_id, name, criteria_key, is_active, order_index)
select f.id, c.name, c.criteria_key, true, c.order_index
from festivals f,
(values
  ('Melhor Filme',                   'overall',         1),
  ('Melhor Direção',                 'direction',       2),
  ('Melhor Roteiro',                 'screenplay',      3),
  ('Melhor Fotografia',              'photography',     4),
  ('Melhor Montagem',                'editing',         5),
  ('Melhor Som / Trilha',            'sound',           6),
  ('Melhor Atuação',                 'acting',          7),
  ('Melhor Documentário',            null,              8),
  ('Melhor Curta-metragem',          null,              9),
  ('Melhor Filme pelo Júri Técnico', 'overall',        10)
) as c(name, criteria_key, order_index)
order by f.created_at desc
limit 10;
