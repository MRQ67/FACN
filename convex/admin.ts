import { ConvexError } from "convex/values";
import { query } from "./_generated/server";

export const getStats = query({
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

    if (!user || user.role !== "ADMIN") return null;

    const allUsers = await ctx.db.query("users").take(100);
    const total = allUsers.length;
    const doctors = allUsers.filter((u) => u.role === "DOCTOR").length;
    const nurses = allUsers.filter((u) => u.role === "NURSE").length;
    const patients = allUsers.filter((u) => u.role === "PATIENT").length;
    const pendingApprovals = allUsers.filter((u) => !u.isApproved).length;

    const hospitals = await ctx.db.query("hospitals").take(50);
    const pharmacies = await ctx.db.query("pharmacies").take(50);

    const auditLogs = await ctx.db
      .query("auditLogs")
      .order("desc")
      .take(10);

    const recentLogs = [];
    for (const log of auditLogs) {
      const logUser = await ctx.db.get("users", log.userId);
      recentLogs.push({
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

    return {
      users: { total, doctors, nurses, patients, pendingApprovals },
      entities: { hospitals: hospitals.length, pharmacies: pharmacies.length },
      recentLogs,
    };
  },
});
