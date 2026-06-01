import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) return [];

    const asRequester = await ctx.db
      .query("consultations")
      .withIndex("by_requesterId", (q) => q.eq("requesterId", user._id))
      .take(50);

    const asSpecialist = await ctx.db
      .query("consultations")
      .withIndex("by_specialistId", (q) => q.eq("specialistId", user._id))
      .take(50);

    const merged = [...asRequester, ...asSpecialist].sort((a, b) => b._creationTime - a._creationTime);
    
    // Map to a basic shape expected by the frontend
    return merged.map(c => ({
      id: c._id,
      _id: c._id,
      status: c.status,
      notes: c.notes,
      startedAt: c._creationTime,
      _creationTime: c._creationTime,
      requesterId: c.requesterId,
      specialistId: c.specialistId,
    }));
  },
});

export const create = mutation({
  args: {
    notes: v.optional(v.string()),
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

    const consultationId = await ctx.db.insert("consultations", {
      requesterId: user._id,
      specialistId: undefined,
      status: "PENDING",
      notes: args.notes,
      endedAt: undefined,
    });

    return await ctx.db.get(consultationId);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("consultations"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const consultation = await ctx.db.get(args.id);
    if (!consultation) throw new ConvexError("Consultation not found");

    await ctx.db.patch(args.id, { status: args.status });

    return { ...consultation, status: args.status };
  },
});

// TODO: implement api.consultations.getIncompleteForDoctor
export const getIncompleteForDoctor = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const doctor = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();
    if (!doctor) return [];

    return await ctx.db
      .query("consultations")
      .withIndex("by_specialistId", (q) =>
        q.eq("specialistId", doctor._id)
      )
      .filter((q) => q.neq(q.field("status"), "COMPLETED"))
      .collect();
  },
});

export const saveNotes = mutation({
  args: {
    id: v.id("consultations"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { notes: args.notes });
  },
});
