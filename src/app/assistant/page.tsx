"use client";

import { useState, type FormEvent } from "react";
import { Button, Container } from "@/components/ui";

export default function AssistantPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); // Submit with JavaScript instead of reloading the page.
    if (loading || !question.trim()) return;
    setLoading(true);
    setAnswer("");
    setError("");

    try {
      // Send JSON from the browser to our own backend endpoint.
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to send your question.");
      setAnswer(data.answer);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main id="main">
      <Container className="py-section">
        <div className="mx-auto max-w-prose">
          <p className="type-label mb-4">Learning demo</p>
          <h1 className="type-heading">Shopping assistant</h1>
          <p className="mt-4 text-muted">
            Ask a question to try the form. This demo returns a practice response;
            AI recommendations are coming in a later lesson.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4" aria-busy={loading}>
            <label htmlFor="question" className="type-label block">Your question</label>
            <textarea
              id="question"
              name="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Can you help me find a jacket under $100?"
              maxLength={500}
              required
              rows={4}
              className="block w-full resize-y border border-line p-4"
            />
            <Button type="submit" disabled={loading || !question.trim()}>
              {loading ? "Sending..." : "Send question"}
            </Button>
          </form>
          <div role="status" aria-live="polite" className="mt-6">
            {answer && <p className="border-t border-line pt-6">{answer}</p>}
          </div>
          {error && <p role="alert" className="mt-4 text-danger">{error}</p>}
        </div>
      </Container>
    </main>
  );
}
