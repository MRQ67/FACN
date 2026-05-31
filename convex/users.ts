import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) return null;

    let doctor: Record<string, unknown> | null = null;
    let patient: Record<string, unknown> | null = null;
    let nurse: Record<string, unknown> | null = null;

    if (user.role === "PATIENT") {
      patient = await ctx.db
        .query("patients")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
    } else if (user.role === "DOCTOR") {
      doctor = await ctx.db
        .query("doctors")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
    } else if (user.role === "NURSE") {
      nurse = await ctx.db
        .query("nurses")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
    }

    return {
      _id: user._id,
      _creationTime: user._creationTime,
      tokenIdentifier: user.tokenIdentifier,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isVerified: user.isVerified,
      isApproved: user.isApproved,
      createdAt: user.createdAt,
      doctor,
      patient,
      nurse,
    };
  },
});

export const syncUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("PATIENT"),
      v.literal("DOCTOR"),
      v.literal("NURSE"),
      v.literal("RURAL_HO"),
      v.literal("ADMIN"),
    ),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (existing) return existing._id;

    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      name: args.name,
      email: args.email,
      phone: args.phone,
      role: args.role,
      isVerified: true,
      isApproved: args.role === "PATIENT",
      createdAt: Date.now(),
    });

    return userId;
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
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

    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.phone !== undefined) patch.phone = args.phone;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch("users", user._id, patch);
    }

    return { ...user, ...patch };
  },
});

export const completeOnboarding = mutation({
  args: {
    name: v.string(),
    role: v.union(
      v.literal("PATIENT"),
      v.literal("DOCTOR"),
      v.literal("NURSE"),
      v.literal("RURAL_HO"),
      v.literal("ADMIN"),
    ),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (existing) {
      const patch: Record<string, unknown> = {};
      if (args.name) patch.name = args.name;
      if (args.phone) patch.phone = args.phone;
      if (args.role) patch.role = args.role;
      await ctx.db.patch("users", existing._id, patch);
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      name: args.name,
      email: identity.email ?? "",
      phone: args.phone,
      role: args.role,
      isVerified: true,
      isApproved: args.role === "PATIENT",
      createdAt: Date.now(),
    });

    return userId;
  },
});

export const listPatients = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) return [];

    const allowedRoles = ["DOCTOR", "NURSE", "ADMIN", "RURAL_HO"];
    if (!allowedRoles.includes(user.role)) return [];

    let patientUsers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "PATIENT"))
      .take(50);

    if (args.search) {
      const term = args.search.toLowerCase();
      patientUsers = patientUsers.filter((u) =>
        u.name.toLowerCase().includes(term),
      );
    }

    const result = [];
    for (const patientUser of patientUsers) {
      const patient = await ctx.db
        .query("patients")
        .withIndex("by_userId", (q) => q.eq("userId", patientUser._id))
        .unique();
      if (patient) {
        result.push({ user: patientUser, patient });
      }
    }

    return result;
  },
});

export const listAll = query({
  args: { role: v.optional(v.string()), isApproved: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!admin || admin.role !== "ADMIN") throw new ConvexError("Not authorized");

    let users = await ctx.db.query("users").take(100);

    if (args.role) {
      users = users.filter((u) => u.role === args.role);
    }
    if (args.isApproved !== undefined) {
      users = users.filter((u) => u.isApproved === args.isApproved);
    }

    return users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isVerified: u.isVerified,
      isApproved: u.isApproved,
      createdAt: u.createdAt,
    }));
  },
});

export const approveUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!admin || admin.role !== "ADMIN") throw new ConvexError("Not authorized");

    await ctx.db.patch("users", args.userId, { isApproved: true });

    await ctx.db.insert("auditLogs", {
      userId: admin._id,
      action: "APPROVE_USER",
      entity: "users",
      entityId: args.userId,
      ipAddress: undefined,
    });
  },
});

export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!admin || admin.role !== "ADMIN") throw new ConvexError("Not authorized");

    await ctx.db.delete("users", args.userId);

    await ctx.db.insert("auditLogs", {
      userId: admin._id,
      action: "DELETE_USER",
      entity: "users",
      entityId: args.userId,
      ipAddress: undefined,
    });
  },
});

// TODO: implement api.users.getSummaryByRole
export const getSummaryByRole = query({
  args: {},
  handler: async (ctx) => {
    return [];
  },
});

// TODO: implement api.users.assignRole
export const assignRole = mutation({
  args: { userId: v.id('users'), role: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { role: args.role as any });
  },
});
