-- Puntuaciones por partida y vista de ranking (mejor marca por jugador y juego)
create table public.scores (
  id         uuid primary key default gen_random_uuid(),
  game_id    text not null references public.games (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  score      integer not null check (score > 0),
  created_at timestamptz not null default now()
);

create index scores_game_score_idx on public.scores (game_id, score desc);
create index scores_user_id_idx on public.scores (user_id);

alter table public.scores enable row level security;

-- Lectura pública (rankings)
create policy "scores_select_public"
  on public.scores
  for select
  to anon, authenticated
  using (true);

-- Solo un usuario autenticado puede insertar sus propias marcas
create policy "scores_insert_own"
  on public.scores
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Sin políticas de update ni delete: las puntuaciones son inmutables

create view public.leaderboard with (security_invoker = true) as
select distinct on (s.game_id, s.user_id)
       s.game_id, s.user_id, p.username, s.score, s.created_at
from public.scores s
join public.profiles p on p.id = s.user_id
order by s.game_id, s.user_id, s.score desc, s.created_at asc;
