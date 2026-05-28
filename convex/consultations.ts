import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { asRequester: [], asSpecialist: [] };

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) return { asRequester: [], asSpecialist: [] };

    const asRequester = await ctx.db
      .query("consultations")
      .withIndex("by_requesterId", (q) => q.eq("requesterId", user._id))
      .take(50);

    const asSpecialist = await ctx.db
      .query("consultations")
      .withIndex("by_specialistId", (q) => q.eq("specialistId", user._id))
      .take(50);

    return { asRequester, asSpecialist };
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

    return await ctx.db.get("consultations", consultationId);
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

    const consultation = await ctx.db.get("consultations", args.id);
    if (!consultation) throw new ConvexError("Consultation not found");

    await ctx.db.patch("consultations", args.id, { status: args.status });

    return { ...consultation, status: args.status };
  },
});
