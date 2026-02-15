"use server"

import { revalidatePath, revalidateTag } from "next/cache"

export async function revalidatePlayerImage(playerId: number) {
  revalidateTag(`player-${playerId}`, "max")
  revalidateTag("players", "max")
  revalidateTag("swiss-manager-export", "max")

  revalidatePath("/")
  revalidatePath(`/jogadores/${playerId}`)
  revalidatePath("/ratings")
  revalidatePath("/titulados")
  revalidatePath(`/private/dashboard/players/${playerId}`)
  revalidatePath("/private/dashboard/players")
}

export async function revalidatePostImage(postId: string) {
  revalidateTag(`post-${postId}`, "max")
  revalidateTag("posts", "max")
  revalidateTag("fresh-posts", "max")

  revalidatePath("/")
  revalidatePath("/noticias")
  revalidatePath(`/private/dashboard/posts/${postId}`)
  revalidatePath("/private/dashboard/posts")
}
