import { protectedProcedure, router } from "../index";

export const seedRouter = router({
  run: protectedProcedure.mutation(() => {
    return { seeded: true };
  }),
});
