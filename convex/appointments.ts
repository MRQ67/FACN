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
      const patient = await ctx.db
        .query("patients")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
      if (!patient) return [];

      appointments = await ctx.db
        .query("appointments")
        .withIndex("by_patientId", (q) => q.eq("patientId", patient.userId))
        .take(50);
    } else if (user.role === "DOCTOR") {
      const doctor = await ctx.db
        .query("doctors")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
      if (!doctor) return [];

      appointments = await ctx.db
        .query("appointments")
        .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor.userId))
        .take(50);
    } else {
      return [];
    }

    const result = [];
    for (const apt of appointments) {
      const doctorUser = await ctx.db.get(apt.doctorId);
      const patientUser = await ctx.db.get(apt.patientId);
      if (!doctorUser || !patientUser) continue;

      const doctorProfile = await ctx.db
        .query("doctors")
        .withIndex("by_userId", (q) => q.eq("userId", doctorUser._id))
        .unique();
      
      const patientProfile = await ctx.db
        .query("patients")
        .withIndex("by_userId", (q) => q.eq("userId", patientUser._id))
        .unique();

      if (!doctorProfile || !patientProfile) continue;

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
          id: doctorProfile._id,
          userId: doctorUser._id,
          specialty: doctorProfile.specialty,
          hospitalId: doctorProfile.hospitalId,
          isAvailable: doctorProfile.isAvailable,
          workingHours: doctorProfile.workingHours,
          lastLat: doctorProfile.lastLat,
          lastLng: doctorProfile.lastLng,
          user: {
            id: doctorUser._id,
            name: doctorUser.name,
            phone: doctorUser.phone,
            email: doctorUser.email,
            role: doctorUser.role,
          },
        },
        patient: {
          id: patientProfile._id,
          userId: patientUser._id,
          dateOfBirth: patientProfile.dateOfBirth,
          bloodType: patientProfile.bloodType,
          chronicConditions: patientProfile.chronicConditions,
          user: {
            id: patientUser._id,
            name: patientUser.name,
            phone: patientUser.phone,
            email: patientUser.email,
            role: patientUser.role,
          },
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
      .filter((q) => q.gte(q.field("scheduledAt"), now))
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

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .filter((q) =>
        q.and(
          q.gte(q.field("scheduledAt"), startOfDay.getTime()),
          q.lte(q.field("scheduledAt"), endOfDay.getTime())
        )
      )
      .collect();

    return await Promise.all(
      appointments.map(async (apt) => {
        const patient = await ctx.db.get(apt.patientId);
        return { ...apt, patientName: patient?.name ?? "Unknown" };
      })
    );
  },
});

export const updateStatus = mutation({
  args: {
    appointmentId: v.id("appointments"),
    status: v.union(
      v.literal("PENDING"),
      v.literal("CONFIRMED"),
      v.literal("IN_PROGRESS"),
      v.literal("COMPLETED"),
      v.literal("CANCELLED")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.appointmentId, { status: args.status });
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
