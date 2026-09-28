"use client";

import { useRouter } from "next/navigation";

interface Game {
  id: string;
  title: string;
  cover: string;
  cat: string;
}

export default function MiniCard({ game }: { game: Game }) {
  const router = useRouter();

  return (
    <div className="mini-card" onClick={() => router.push(`/games/${game.id}`)}>
      <div className="mini-cover">
        <div className={"cover-bg " + game.cover}></div>
      </div>
      <div className="mini-meta">
        <div className="mini-title">{game.title}</div>
        <div className="mini-cat">{game.cat}</div>
      </div>
    </div>
  );
}
