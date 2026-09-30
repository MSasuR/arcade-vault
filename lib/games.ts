import { createClient } from "@/lib/supabase/server";
import type { Game } from "@/app/data";
import type { Tables } from "@/lib/supabase/database.types";

function toGame(row: Tables<"games">): Game {
  return {
    id: row.id,
    title: row.title,
    short: row.short_desc,
    long: row.long_desc,
    cat: row.category,
    cover: row.cover,
    best: row.best,
    plays: row.plays,
    color: row.color ?? undefined,
  };
}

export async function getGames(): Promise<Game[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("games").select("*").order("sort_order");
  if (error) throw new Error(`No se pudo cargar el catálogo: ${error.message}`);
  return data.map(toGame);
}

export async function getGame(id: string): Promise<Game | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("games").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`No se pudo cargar el juego: ${error.message}`);
  return data ? toGame(data) : null;
}
