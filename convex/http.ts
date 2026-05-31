import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/seed",
  method: "POST",
  handler: httpAction(async (ctx) => {
    try {
      await ctx.runMutation(api.seed.seed);
      return new Response("Seeded successfully", { status: 200 });
    } catch (e: any) {
      return new Response("Seed failed: " + e.message, { status: 500 });
    }
  }),
});

export default http;
