import { NextResponse } from "next/server";

type StrapiAttributes = {
  question?: string;
  answer?: string;
  buttonText?: string | null;
  order?: number;
  group?: string;
  category?: string;
  isPublished?: boolean;
  publishedAt?: string | null;
};

type StrapiFaq = {
  id: number;
  attributes?: StrapiAttributes;
};

// Use the standard Strapi URL environment variable
const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  process.env.NEXT_PUBLIC_STRAPI_API_URL ||
  process.env.STRAPI_URL ||
  "http://localhost:1337";

const sanitizeFaqs = (faqs: any[]): StrapiFaq[] => {
  return faqs
    .map((faq) => {
      // Handle different Strapi response formats
      // Strapi v5 might return: { id: 1, documentId: "xxx", ...attributes }
      // or: { id: 1, attributes: { question: "...", answer: "..." } }
      
      let id: number | undefined;
      let attributes: StrapiAttributes | undefined;

      // Check if it's the new Strapi v5 format (attributes at root level)
      if (faq.documentId || (faq.question && faq.answer)) {
        id = typeof faq.id === 'number' ? faq.id : parseInt(faq.id) || undefined;
        attributes = {
          question: faq.question,
          answer: faq.answer,
          buttonText: faq.buttonText || null,
          order: faq.order,
          group: faq.group || faq.attributes?.group,
          category: faq.category || faq.attributes?.category,
          isPublished: faq.isPublished,
          publishedAt: faq.publishedAt,
        };
      } 
      // Check if it's the old Strapi v4 format (attributes nested)
      else if (faq.attributes) {
        id = typeof faq.id === 'number' ? faq.id : parseInt(faq.id) || undefined;
        attributes = faq.attributes;
      }
      // Try to extract from any structure
      else {
        id = typeof faq.id === 'number' ? faq.id : parseInt(faq.id) || undefined;
        attributes = {
          question: faq.question || faq.attributes?.question,
          answer: faq.answer || faq.attributes?.answer,
          buttonText: faq.buttonText || faq.attributes?.buttonText || null,
          order: faq.order || faq.attributes?.order,
          group: faq.group || faq.attributes?.group,
          category: faq.category || faq.attributes?.category,
          isPublished: faq.isPublished || faq.attributes?.isPublished,
          publishedAt: faq.publishedAt || faq.attributes?.publishedAt,
        };
      }

      return { id, attributes };
    })
    .filter(
      (faq) =>
        typeof faq.id !== "undefined" &&
        faq.id !== null &&
        typeof faq.attributes?.question === "string" &&
        typeof faq.attributes?.answer === "string" &&
        faq.attributes.question.length > 0 &&
        faq.attributes.answer.length > 0
    ) as StrapiFaq[];
};

export async function GET(request: Request) {
  // Check if Strapi URL is properly configured
  if (!STRAPI_URL) {
    console.error("[FAQ API] Strapi URL not configured");
    return NextResponse.json(
      {
        error: "Strapi URL not configured",
        message: "Please set NEXT_PUBLIC_STRAPI_URL environment variable",
      },
      { status: 500 }
    );
  }

  try {
    // Build Strapi query with populate and filters
    // Fetch published FAQs with all fields populated, sorted by order
    const queryParams = new URLSearchParams({
      "publicationState": "live",
      "populate": "*",
      "sort": "order:asc",
      "filters[isPublished][$eq]": "true",
      "pagination[pageSize]": "100",
    });

    let strapiEndpoint = `${STRAPI_URL}/api/faqs?${queryParams.toString()}`;
    
    console.log(`[FAQ API] Fetching from: ${strapiEndpoint}`);
    
    let res = await fetch(strapiEndpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    // If that fails, try without publicationState
    if (!res.ok) {
      console.log(`[FAQ API] First attempt failed (${res.status}), trying without publicationState`);
      const fallbackParams = new URLSearchParams({
        "populate": "*",
        "sort": "order:asc",
        "filters[isPublished][$eq]": "true",
        "pagination[pageSize]": "100",
      });
      strapiEndpoint = `${STRAPI_URL}/api/faqs?${fallbackParams.toString()}`;
      res = await fetch(strapiEndpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });
    }

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[FAQ API] Strapi API error (${res.status}):`, errorText);
      return NextResponse.json(
        {
          error: "Failed to fetch FAQs from Strapi",
          message: `Strapi responded with ${res.status}: ${errorText}`,
          strapiUrl: STRAPI_URL,
        },
        { status: res.status }
      );
    }

    const payload = await res.json();
    
    console.log(`[FAQ API] Received response status: ${res.status}`);
    console.log(`[FAQ API] Full payload structure:`, JSON.stringify(payload, null, 2).substring(0, 500));
    console.log(`[FAQ API] Response structure:`, {
      hasData: !!payload?.data,
      dataType: Array.isArray(payload?.data) ? 'array' : typeof payload?.data,
      dataLength: Array.isArray(payload?.data) ? payload.data.length : payload?.data ? 1 : 0,
      firstItemKeys: payload?.data?.[0] ? Object.keys(payload.data[0]) : null,
    });
    
    // Handle both array and object response formats from Strapi
    let faqsData: any[] = [];
    
    if (Array.isArray(payload?.data)) {
      faqsData = payload.data;
    } else if (payload?.data) {
      faqsData = [payload.data];
    } else if (Array.isArray(payload)) {
      // Sometimes Strapi returns array directly
      faqsData = payload;
    }
    
    console.log(`[FAQ API] Extracted ${faqsData.length} FAQs, first item:`, JSON.stringify(faqsData[0] || {}, null, 2).substring(0, 300));

    console.log(`[FAQ API] Processing ${faqsData.length} FAQs from Strapi`);

    const sanitized = sanitizeFaqs(faqsData);

    console.log(`[FAQ API] After sanitization: ${sanitized.length} valid FAQs`);

    if (!sanitized.length) {
      if (faqsData.length > 0) {
        console.warn("[FAQ API] No valid FAQs found after sanitization");
        console.warn("[FAQ API] Raw data sample:", JSON.stringify(faqsData[0], null, 2));
        console.warn("[FAQ API] First FAQ structure check:", {
          hasId: typeof faqsData[0]?.id !== "undefined",
          idValue: faqsData[0]?.id,
          idType: typeof faqsData[0]?.id,
          hasAttributes: !!faqsData[0]?.attributes,
          hasQuestion: typeof faqsData[0]?.question === "string" || typeof faqsData[0]?.attributes?.question === "string",
          hasAnswer: typeof faqsData[0]?.answer === "string" || typeof faqsData[0]?.attributes?.answer === "string",
          questionValue: faqsData[0]?.question || faqsData[0]?.attributes?.question,
          answerValue: faqsData[0]?.answer || faqsData[0]?.attributes?.answer,
          allKeys: Object.keys(faqsData[0] || {}),
        });
      }
      
      return NextResponse.json(
        {
          error: "No valid FAQs found",
          message: "Strapi returned data but no valid FAQs were found after sanitization",
          debug: {
            received: faqsData.length,
            sanitized: sanitized.length,
            strapiUrl: STRAPI_URL,
            endpoint: strapiEndpoint,
            rawSample: faqsData[0] || null,
          },
        },
        { status: 404 }
      );
    }

    console.log(`[FAQ API] Successfully returning ${sanitized.length} FAQs from Strapi`);
    return NextResponse.json({
      data: sanitized,
      meta: {
        source: "strapi",
        total: sanitized.length,
        strapiUrl: STRAPI_URL,
      },
    });
  } catch (error) {
    console.error("[FAQ API] Failed to fetch FAQs from Strapi:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch FAQs",
        message: (error as Error).message,
        strapiUrl: STRAPI_URL,
      },
      { status: 500 }
    );
  }
}

