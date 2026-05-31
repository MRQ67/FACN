import { v, ConvexError } from "convex/values";
import { query } from "./_generated/server";

export const list = query({
  args: { limit: v.optional(v.number()), cursor: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const limit = args.limit ?? 20;

    const logs = await ctx.db.query("auditLogs").order("desc").take(limit);

    const enriched = [];
    for (const log of logs) {
      const logUser = await ctx.db.get("users", log.userId);
      enriched.push({
        id: log._id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        ipAddress: log.ipAddress,
        timestamp: log._creationTime,
        user: {
          id: log.userId,
          name: logUser?.name ?? "Unknown",
          role: logUser?.role ?? "Unknown",
        },
      });
    }

    return enriched;
  },
});

// TODO: implement api.auditLogs.getRecent
export const getRecent = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("auditLogs").order("desc").take(50);
  },
});
