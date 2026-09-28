"use client";

import { useParams } from "next/navigation";
import GameDetail from "@/app/components/GameDetail";

export default function GameDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return <GameDetail id={id} />;
}
