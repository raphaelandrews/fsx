import { NextResponse } from 'next/server';
import type { z } from 'zod';

import { APIPlayersResponseSchema, getPlayersByPage } from '@/db/queries';

const createResponse = (data: z.infer<typeof APIPlayersResponseSchema>, status = 200) =>
  NextResponse.json(data, { status });

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 20,
      sortBy: searchParams.get('sortBy') as 'rapid' | 'blitz' | 'classic' || 'rapid',
      sex: searchParams.get('sex') === 'true' ? true : searchParams.get('sex') === 'false' ? false : undefined,
      titles: searchParams.getAll('title'),
      clubs: searchParams.getAll('club'), 
      groups: searchParams.getAll('group'),
      locations: searchParams.getAll('location'),
    };
    console.log(filters, searchParams);
    const { players, pagination } = await getPlayersByPage(filters);

    const validation = APIPlayersResponseSchema.safeParse({
      success: true,
      data: { players, pagination }
    });

    if (!validation.success) {
      console.error('Validation failed:', validation.error);
      return createResponse({
        success: false,
        error: { code: 400, message: 'Invalid data format', details: validation.error.errors },
      }, 400);
    }

    return createResponse(validation.data);

  } catch (error: unknown) {
    const details =
      process.env.NODE_ENV === 'development'
        ? error instanceof Error
          ? error.message
          : String(error)
        : undefined;

    console.error("[ERROR]:", error);
    return createResponse({
      success: false,
      error: {
        code: 500,
        message: 'Internal server error',
        details,
      }
    }, 500);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
  });
}