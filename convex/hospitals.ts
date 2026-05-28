import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const hospitals = await ctx.db.query("hospitals").take(50);
    return hospitals.map((h) => ({
      id: h._id,
      name: h.name,
      location: h.location,
      specialties: h.specialties.split(',').map(s => s.trim()).filter(s => s),
    }));
  },
});

export const getById = query({
  args: { hospitalId: v.id("hospitals") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const hospital = await ctx.db.get("hospitals", args.hospitalId);
    if (!hospital) throw new ConvexError("Hospital not found");

    return hospital;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    location: v.string(),
    totalDoctors: v.number(),
    availableDoctors: v.number(),
    specialties: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) throw new ConvexError("User not found");

    const hospitalId = await ctx.db.insert("hospitals", {
      name: args.name,
      location: args.location,
      totalDoctors: args.totalDoctors,
      availableDoctors: args.availableDoctors,
      specialties: args.specialties,
    });

    return await ctx.db.get("hospitals", hospitalId);
  },
});

export const update = mutation({
  args: {
    hospitalId: v.id("hospitals"),
    name: v.optional(v.string()),
    location: v.optional(v.string()),
    totalDoctors: v.optional(v.number()),
    availableDoctors: v.optional(v.number()),
    specialties: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const { hospitalId, ...fields } = args;

    const hospital = await ctx.db.get("hospitals", hospitalId);
    if (!hospital) throw new ConvexError("Hospital not found");

    const patch: Record<string, unknown> = {};
    if (fields.name !== undefined) patch.name = fields.name;
    if (fields.location !== undefined) patch.location = fields.location;
    if (fields.totalDoctors !== undefined)
      patch.totalDoctors = fields.totalDoctors;
    if (fields.availableDoctors !== undefined)
      patch.availableDoctors = fields.availableDoctors;
    if (fields.specialties !== undefined)
      patch.specialties = fields.specialties;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch("hospitals", hospitalId, patch);
    }

    return { ...hospital, ...patch };
  },
});

export const remove = mutation({
  args: { hospitalId: v.id("hospitals") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");
    await ctx.db.delete(args.hospitalId);
  },
});
