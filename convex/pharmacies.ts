import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");
    const pharmacies = await ctx.db.query("pharmacies").take(50);
    return pharmacies.map((p) => ({
      id: p._id,
      name: p.name,
      location: p.location,
      phone: p.phone,
    }));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    location: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");
    const id = await ctx.db.insert("pharmacies", args);
    return await ctx.db.get("pharmacies", id);
  },
});

export const update = mutation({
  args: {
    pharmacyId: v.id("pharmacies"),
    name: v.optional(v.string()),
    location: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");
    const { pharmacyId, ...fields } = args;
    const patch: Record<string, unknown> = {};
    if (fields.name !== undefined) patch.name = fields.name;
    if (fields.location !== undefined) patch.location = fields.location;
    if (fields.phone !== undefined) patch.phone = fields.phone;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch("pharmacies", pharmacyId, patch);
    }
    return await ctx.db.get("pharmacies", pharmacyId);
  },
});

export const remove = mutation({
  args: { pharmacyId: v.id("pharmacies") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");
    await ctx.db.delete(args.pharmacyId);
  },
});
