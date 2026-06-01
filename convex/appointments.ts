import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listMy = query({
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

    let appointments;
    if (user.role === "PATIENT") {
      appointments = await ctx.db
        .query("appointments")
        .withIndex("by_patientId", (q) => q.eq("patientId", user._id))
        .take(50);
    } else if (user.role === "DOCTOR") {
      appointments = await ctx.db
        .query("appointments")
        .withIndex("by_doctorId", (q) => q.eq("doctorId", user._id))
        .take(50);
    } else {
      return [];
    }

    const result = [];
    for (const apt of appointments) {
      const doctorUser = await ctx.db.get(apt.doctorId);
      const patientUser = await ctx.db.get(apt.patientId);
      if (!doctorUser || !patientUser) continue;

      result.push({
        id: apt._id,
        _id: apt._id,
        _creationTime: apt._creationTime,
        patientId: apt.patientId,
        doctorId: apt.doctorId,
        scheduledAt: apt.scheduledAt,
        status: apt.status,
        type: apt.type,
        doctor: {
          user: { name: doctorUser.name },
        },
        patient: {
          user: { name: patientUser.name },
        },
      });
    }

    return result;
  },
});

export const create = mutation({
  args: {
    doctorId: v.id("users"),
    scheduledAt: v.number(),
    type: v.union(v.literal("IN_PERSON"), v.literal("REMOTE")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const patient = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();
    if (!patient) throw new ConvexError("User not found");

    const appointmentId = await ctx.db.insert("appointments", {
      patientId: patient._id,
      doctorId: args.doctorId,
      scheduledAt: args.scheduledAt,
      status: "PENDING",
      type: args.type,
    });

    return appointmentId;
  },
});

export const getUpcomingForPatient = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();
    if (!user) return [];

    const now = Date.now();
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patientId", (q) => q.eq("patientId", user._id))
      .filter((q) => q.and(
        q.gte(q.field("scheduledAt"), now),
        q.neq(q.field("status"), "CANCELLED")
      ))
      .order("asc")
      .collect();

    return await Promise.all(
      appointments.map(async (apt) => {
        const doctor = await ctx.db.get(apt.doctorId);
        return { ...apt, doctorName: doctor?.name ?? "Unknown" };
      })
    );
  },
});

export const getAllForPatient = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();
    if (!user) return [];

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patientId", (q) => q.eq("patientId", user._id))
      .order("desc")
      .collect();

    return await Promise.all(
      appointments.map(async (apt) => {
        const doctor = await ctx.db.get(apt.doctorId);
        return { ...apt, doctorName: doctor?.name ?? "Unknown" };
      })
    );
  },
});

export const getTodayForDoctor = query({
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

    // Broaden for demo: return PENDING or IN_PROGRESS
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .filter((q) => q.or(
        q.eq(q.field("status"), "PENDING"),
        q.eq(q.field("status"), "IN_PROGRESS"),
        q.eq(q.field("status"), "CONFIRMED")
      ))
      .collect();

    return await Promise.all(
      appointments.map(async (apt) => {
        const patient = await ctx.db.get(apt.patientId);
        
        const profile = await ctx.db
          .query("patients")
          .withIndex("by_userId", (q) => q.eq("userId", apt.patientId))
          .unique();

        const dob = profile?.dateOfBirth ?? 0;
        const age = dob ? Math.floor((Date.now() - dob) / (365.25 * 24 * 60 * 60 * 1000)) : "??";

        return { 
          ...apt, 
          patientName: patient?.name ?? "Unknown",
          patientAge: age
        };
      })
    );
  },
});

export const updateStatus = mutation({
  args: {
    appointmentId: v.id("appointments"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.appointmentId, { status: args.status as any });
  },
});

export const cancel = mutation({
  args: { id: v.id("appointments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const appointment = await ctx.db.get(args.id);
    if (!appointment) throw new ConvexError("Appointment not found");

    await ctx.db.patch(args.id, { status: "CANCELLED" });
  },
});
