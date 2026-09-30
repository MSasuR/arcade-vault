import { createClient } from "@/lib/supabase/client";

export interface LeaderboardEntry {
  rank: number; // posición 1-based en el top, o rango real en getUserBest
  username: string;
  score: number;
  createdAt: string; // ISO
}

// Top N de un juego: una marca por jugador, score descendente y, en empate, gana quien llegó antes.
export async function getTopScores(gameId: string, limit: number): Promise<LeaderboardEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leaderboard")
    .select("username, score, created_at")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data.map((row, i) => ({
    rank: i + 1,
    username: row.username ?? "",
    score: row.score ?? 0,
    createdAt: row.created_at ?? "",
  }));
}

// Mejor marca del usuario en un juego con su rango real (1 + jugadores con mejor score), o null si no tiene.
export async function getUserBest(
  userId: string,
  gameId: string,
): Promise<LeaderboardEntry | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leaderboard")
    .select("username, score, created_at")
    .eq("game_id", gameId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.score === null) return null;

  const { count, error: countError } = await supabase
    .from("leaderboard")
    .select("*", { count: "exact", head: true })
    .eq("game_id", gameId)
    .gt("score", data.score);
  if (countError) throw new Error(countError.message);

  return {
    rank: (count ?? 0) + 1,
    username: data.username ?? "",
    score: data.score,
    createdAt: data.created_at ?? "",
  };
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}
