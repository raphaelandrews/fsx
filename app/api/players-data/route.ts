import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { db } from "@/db";
import { players } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
    const supabase = createClient();

    const {
        data: { session },
    } = await (await supabase).auth.getSession();

    if (!session?.user?.id) {
        return new NextResponse('Unauthenticated', { status: 403 });
    }

    async function maxPlayerId() {
        try {
            const result = await db
                .select({ id: players.id })
                .from(players)
                .orderBy(sql`${players.id} DESC`)
                .limit(1);

            return result.length > 0 ? result[0].id : 0;
        } catch (error) {
            console.error("Error fetching max player ID with Drizzle:", error);
            return null;
        }
    }

    async function newPlayerId() {
        try {
            const maxId = await maxPlayerId();
            if (maxId === null || Number.isNaN(maxId)) {
                throw new Error("Failed to retrieve max player ID");
            }
            return maxId + 1;
        } catch (error) {
            console.error("Error generating new player ID:", error);
            return null;
        }
    }

    const body = await req.json();

    const {
        name,
        birth,
        sex,
        clubId,
        locationId,
    } = body;

    if (!name) {
        const missingFields = [];
        if (!name) missingFields.push('name');
        return new NextResponse(`Missing mandatory fields: ${missingFields.join(', ')}`, { status: 400 });
    }

    const playerId = await newPlayerId();

    if (playerId === null) {
        return new NextResponse('Failed to generate player ID', { status: 500 });
    }

    const createData = {
        id: playerId,
        name,
        ...(birth !== undefined && { birth }),
        ...(sex !== undefined && { sex }),
        ...(clubId !== undefined && clubId !== 0 && { clubId }),
        ...(locationId !== undefined && { locationId }),
    };

    try {
        await db.insert(players).values(createData);

        console.log(`Jogador ${playerId} criado`);

        return new NextResponse(JSON.stringify({
            id: playerId,
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error("Error creating player with Drizzle:", error);
        return new NextResponse('Internal error', { status: 500 });
    }
}
