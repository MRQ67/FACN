import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) return [];

    return await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(50);
  },
});

export const markRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const notification = await ctx.db.get("notifications", args.id);
    if (!notification) throw new ConvexError("Notification not found");

    await ctx.db.patch("notifications", args.id, { isRead: true });

    return { ...notification, isRead: true };
  },
});
