/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as appointments from "../appointments.js";
import type * as auditLogs from "../auditLogs.js";
import type * as consultations from "../consultations.js";
import type * as doctors from "../doctors.js";
import type * as hospitals from "../hospitals.js";
import type * as http from "../http.js";
import type * as labResults from "../labResults.js";
import type * as notifications from "../notifications.js";
import type * as patients from "../patients.js";
import type * as pharmacies from "../pharmacies.js";
import type * as prescriptions from "../prescriptions.js";
import type * as seed from "../seed.js";
import type * as triage from "../triage.js";
import type * as triageAction from "../triageAction.js";
import type * as users from "../users.js";
import type * as vitals from "../vitals.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  appointments: typeof appointments;
  auditLogs: typeof auditLogs;
  consultations: typeof consultations;
  doctors: typeof doctors;
  hospitals: typeof hospitals;
  http: typeof http;
  labResults: typeof labResults;
  notifications: typeof notifications;
  patients: typeof patients;
  pharmacies: typeof pharmacies;
  prescriptions: typeof prescriptions;
  seed: typeof seed;
  triage: typeof triage;
  triageAction: typeof triageAction;
  users: typeof users;
  vitals: typeof vitals;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
