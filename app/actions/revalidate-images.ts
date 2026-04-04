"use server"

import { revalidatePath, revalidateTag } from "next/cache"

export async function revalidatePlayerImage(playerId: number) {
  revalidateTag(`player-${playerId}`, "default")
  revalidateTag("players", "default")
  revalidateTag("swiss-manager-export", "default")

  revalidatePath("/")
  revalidatePath(`/jogadores/${playerId}`)
  revalidatePath("/ratings")
  revalidatePath("/titulados")
  revalidatePath(`/private/dashboard/players/${playerId}`)
  revalidatePath("/private/dashboard/players")
}

export async function revalidatePostImage(postId: string) {
  revalidateTag(`post-${postId}`, "default")
  revalidateTag("posts", "default")
  revalidateTag("fresh-posts", "default")

  revalidatePath("/")
  revalidatePath("/noticias")
  revalidatePath(`/private/dashboard/posts/${postId}`)
  revalidatePath("/private/dashboard/posts")
}
