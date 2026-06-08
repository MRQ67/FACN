"use node";

import { v, ConvexError } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const analyze = action({
  args: {
    symptoms: v.string(),
    patientId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `You are a clinical triage assistant for a
telemedicine platform in Dire Dawa, Ethiopia. Analyze the following
patient symptoms and provide a structured triage assessment.

Patient Symptoms: ${args.symptoms}

Respond in this EXACT JSON format with no markdown, no backticks,
no extra text \u2014 just raw JSON:
{
  "severity": "LOW" or "MODERATE" or "CRITICAL",
  "summary": "2-3 sentence clinical summary of the patient's condition",
  "recommendation": "Specific actionable recommendation for the healthcare worker",
  "urgency": "Timeframe for care e.g. Immediate, Within 24 hours, Within 1 week",
  "flags": ["list", "of", "clinical", "red", "flags", "if", "any"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsed;
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      parsed = {
        severity: "MODERATE",
        summary: text,
        recommendation: "Please consult with a healthcare professional.",
        urgency: "Within 24 hours",
        flags: [],
      };
    }

    if (args.patientId) {
      await ctx.runMutation(api.triage.storeTriageResult, {
        patientId: args.patientId,
        triageResult: JSON.stringify(parsed),
        symptoms: args.symptoms,
      });
    }

    return parsed;
  },
});
