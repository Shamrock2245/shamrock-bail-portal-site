import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { studentId, courseId } = body;

    if (!studentId || !courseId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Call out to GAS (the bridge) to handle PDF generation
    // Because Wix CLI backend API runs outside of Velo, we use standard fetch
    // Note: You must configure GAS_WEBHOOK_URL in environment or pass it.
    
    // For now we return 200 Accepted to indicate the webhook was received
    console.log(`Received request to issue certificate for student ${studentId}, course ${courseId}`);
    
    return new Response(JSON.stringify({ success: true, message: "Certificate issuance triggered." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
