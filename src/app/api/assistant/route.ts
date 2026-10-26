// This function runs on the server when the browser POSTs to /api/assistant.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Please send a valid JSON request." }, { status: 400 });
  }

  const question =
    typeof body === "object" && body !== null && "question" in body
      ? body.question
      : undefined;

  if (typeof question !== "string" || !question.trim() || question.length > 500) {
    return Response.json(
      { error: "Please enter a question between 1 and 500 characters." },
      { status: 400 },
    );
  }

  // Lesson one: a fixed response. No AI service or API key is used yet.
  return Response.json({
    answer: "Hello from the backend! I received your question.",
  });
}
