"use client";

import { useParams } from "next/navigation";
import GamePlayer from "@/app/components/GamePlayer";

export default function GamePlayerPage() {
  const params = useParams();
  const id = params.id as string;

  return <GamePlayer id={id} />;
}
