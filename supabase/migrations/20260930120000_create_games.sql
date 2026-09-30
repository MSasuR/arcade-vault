-- Catálogo de juegos (reemplaza el arreglo GAMES de app/data.ts)
create table public.games (
  id          text primary key check (id ~ '^[a-z0-9-]+$'),
  title       text not null,
  short_desc  text not null,
  long_desc   text not null,
  category    text not null,
  cover       text not null,
  color       text,
  best        integer not null default 0,
  plays       integer not null default 0,
  sort_order  integer not null unique
);

alter table public.games enable row level security;

-- Lectura pública; sin políticas de escritura (el catálogo se cambia con migraciones)
create policy "games_select_public"
  on public.games
  for select
  to anon, authenticated
  using (true);

insert into public.games (id, title, short_desc, long_desc, category, cover, color, best, plays, sort_order) values
  ('galaga', 'GALAGA VAULT', 'Disparos contra invasores',
   'Entra en el clásico arcade de defensa. Dispara contra formaciones de naves enemigas que se ciernen sobre ti. ¿Cuántas olas puedes resistir?',
   'ACCIÓN', 'cover-invaders', null, 245600, 3241, 1),
  ('tetris', 'TETRIS VAULT', 'Piezas que caen, mente que piensa',
   'El rompecabezas eterno. Encaja las piezas de colores mientras caen. Cada línea completada te acerca al siguiente nivel. ¿Cuál es tu límite?',
   'PUZZLE', 'cover-tetro', 'yellow', 1823400, 5129, 2),
  ('snake', 'SNAKE VAULT', 'Crece comiendo, evita tu cola',
   'Controla la serpiente hambrienta. Come manzanas para crecer más, pero cuidado: no colisiones con tu propio cuerpo. El espacio se reduce a medida que creces.',
   'PUZZLE', 'cover-snake', null, 89320, 2156, 3),
  ('frogger', 'FROGGER VAULT', 'Cruza el camino sin ser atropellado',
   'Ayuda a la rana a cruzar carreteras llenas de tráfico y ríos caudalosos. Cada salto cuenta. Llega al lado opuesto sano y salvo.',
   'ACCIÓN', 'cover-rana', 'magenta', 156780, 1847, 4),
  ('pacman', 'PACMAN VAULT', 'Come puntos, evita fantasmas',
   'El clásico laberinto sin fin. Come todos los puntos mientras evitas a los fantasmas multicolores. Usa los potenciadores para invertir la caza. ¿Podrás limpiar todos los niveles?',
   'ACCIÓN', 'cover-glot', null, 412890, 4567, 5),
  ('asteroids', 'ASTEROIDS VAULT', 'Dispara rocas en el espacio',
   'Tu nave flota en el espacio vacío. Asteroides enormes se acercan. Dispara para romperlos en pedazos más pequeños. Sobrevive a la lluvia de rocas.',
   'ACCIÓN', 'cover-rocas', null, 287650, 1923, 6),
  ('duel', 'DUEL VAULT', 'Duelo de pistolas al atardecer',
   'Dos guerreros se encuentran bajo el sol ardiente del desierto. Quien sea más rápido al sacar su arma vive otro día. Reflejos, precisión y coraje.',
   'DEPORTES', 'cover-duelo', null, 98765, 876, 7),
  ('breakout', 'BREAKOUT VAULT', 'Rompe ladrillos con la bola',
   'Controla una paleta para rebotar una bola contra un muro de ladrillos. Cada ladrillo roto te da puntos. Rompe toda la pared y avanza al siguiente nivel.',
   'PUZZLE', 'cover-bricks', null, 654320, 2834, 8);
