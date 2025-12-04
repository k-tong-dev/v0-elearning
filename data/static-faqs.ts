/**
 * DEPRECATED: This file is no longer used.
 * FAQs are now fetched dynamically from Strapi/PostgreSQL database.
 * See: app/api/faqs/route.ts
 */

export type StaticFaqEntry = {
  id: number;
  question: string;
  answer: string;
  buttonText?: string | null;
  order: number;
  group: "home" | "payment" | "support" | "general";
};

// All FAQs are now stored in Strapi/PostgreSQL database
export const staticFaqs: StaticFaqEntry[] = [];
