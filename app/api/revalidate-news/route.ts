import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    revalidateTag("news")

    return NextResponse.json({
      revalidated: true,
      message: "News cache revalidated successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        revalidated: false,
        message: "Error revalidating news cache",
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
