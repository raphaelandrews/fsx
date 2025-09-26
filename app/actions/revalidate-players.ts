"use server";

import { revalidateTag } from "next/cache";

export async function revalidatePlayersAction() {
  revalidateTag("players");
  return { success: true, message: "Players cache revalidated!" };
}