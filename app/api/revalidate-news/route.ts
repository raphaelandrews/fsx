import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    revalidateTag("posts")

    return NextResponse.json({
      revalidated: true,
      message: "Posts cache revalidated successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        revalidated: false,
        message: "Error revalidating posts cache",
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
