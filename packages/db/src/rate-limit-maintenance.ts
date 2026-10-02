export async function cleanupExpiredRateLimits(
  database: D1Database,
  expiredBefore: number,
): Promise<number> {
  const result = await database
    .prepare("DELETE FROM rate_limits WHERE window_start < ?")
    .bind(expiredBefore)
    .run();
  return result.meta.changes;
}
