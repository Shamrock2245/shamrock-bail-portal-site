import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { studentName, studentEmail, licenseNumber, webinarDate } = body;

    if (!studentName || !studentEmail) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // In production, insert this into a WebinarAttendance MongoDB collection
    // or trigger an email to the DFS compliance inbox.
    console.log(`Webinar attendance recorded for ${studentName} (${studentEmail}) on ${webinarDate}`);
    
    return new Response(JSON.stringify({ success: true, message: "Attendance recorded successfully." }), {
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
