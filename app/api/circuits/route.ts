import { NextResponse } from "next/server";
import { getCircuits } from "@/db/queries/circuits/queries";

export async function GET() {
  try {
    const circuits = await getCircuits();
    
    return NextResponse.json({
      data: circuits,
    }, {
      status: 200,
    });
  } catch (error) {
    console.error("Failed to fetch circuits:", error);
    return NextResponse.json(
      { error: "Failed to fetch circuits" },
      { status: 500 }
    );
  }
}