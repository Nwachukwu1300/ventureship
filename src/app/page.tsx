"use client";

import { useReducer, useState } from "react";
import { scoreReducer, type ScoreState } from "@/lib/stateMachine";

const SUBMISSION_TEXT = `I went deep on the audience side first. The TEDxManchester ticket data shows 62 percent of attendees are 28 to 42, professional, design conscious. I built a single master deck that leans into that. Then I tailored three versions, one for Marks and Spencer, one for Lululemon, one for Ace Hotel. The pricing tiers are 5k, 15k, 35k. I decided against programmatic banner ads because the audience hates them.`;

type PillarScore = {
  name: string;
  score: number;
  feedback: string;
};

type Scores = PillarScore[] | null;

const initialState: ScoreState<Scores> = {
  workflowState: "draft",
  scores: null,
  error: null,
};

export default function Home() {
  const [state, dispatch] = useReducer(scoreReducer<Scores>, initialState);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  async function handleGenerateScore() {
    setLoading(true);
    setApiError(null);

    try {
      const response = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionText: SUBMISSION_TEXT }),
      });

      const data = await response.json();

      if (!data.ok) {
        setApiError(data.error);
        return;
      }

      dispatch({ type: "set_scores", scores: data.pillars });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Submission Scorer</h1>

        <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-sm mb-6">
          <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-3">
            Candidate Submission
          </h2>
          <p className="text-stone-700 leading-relaxed">{SUBMISSION_TEXT}</p>
        </div>

        {apiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {apiError}
          </div>
        )}

        {state.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {state.error}
          </div>
        )}

        {!state.scores && (
          <button
            onClick={handleGenerateScore}
            disabled={loading}
            className="bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 disabled:bg-stone-400 disabled:cursor-not-allowed"
          >
            {loading ? "Generating..." : "Generate Draft Score"}
          </button>
        )}

        {state.scores && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium uppercase tracking-wide px-2 py-1 bg-amber-100 text-amber-800 rounded">
                {state.workflowState}
              </span>
            </div>

            {state.scores.map((pillar) => (
              <div
                key={pillar.name}
                className="bg-white rounded-lg border border-stone-200 p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{pillar.name}</h3>
                  <span className="text-stone-600">
                    {pillar.score}
                    <span className="text-stone-400">/20</span>
                  </span>
                </div>
                <p className="text-sm text-stone-600">{pillar.feedback}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
