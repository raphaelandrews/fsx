import { cleanupExpiredRateLimits } from "@fsx/db/rate-limit-maintenance";

interface RateLimitCleanupEnv {
  DB: D1Database;
}

export default {
  async scheduled(_controller: ScheduledController, env: RateLimitCleanupEnv) {
    const expiredBefore = Date.now() - 10 * 60 * 1000;
    const deletedRows = await cleanupExpiredRateLimits(env.DB, expiredBefore);

    console.info("[security] rate-limit cleanup complete", {
      deletedRows,
    });
  },
} satisfies ExportedHandler<RateLimitCleanupEnv>;
