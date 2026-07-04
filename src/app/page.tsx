"use client";

import { useReducer, useState } from "react";
import { scoreReducer, type ScoreState } from "@/lib/stateMachine";
import { aggregate } from "@/lib/aggregate";

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

  function handleScoreChange(index: number, value: string) {
    if (!state.scores) return;

    // Only allow digits
    const digitsOnly = value.replace(/\D/g, "");

    // Parse and clamp to 0-20
    let numValue = digitsOnly === "" ? 0 : parseInt(digitsOnly, 10);
    numValue = Math.max(0, Math.min(20, numValue));

    const updatedScores = state.scores.map((pillar, i) =>
      i === index ? { ...pillar, score: numValue } : pillar
    );

    dispatch({ type: "edit", scores: updatedScores });
  }

  function handleFeedbackChange(index: number, value: string) {
    if (!state.scores) return;

    const updatedScores = state.scores.map((pillar, i) =>
      i === index ? { ...pillar, feedback: value } : pillar
    );

    dispatch({ type: "edit", scores: updatedScores });
  }

  // Compute total and tier from aggregate function
  function getAggregateResult() {
    if (!state.scores) return null;

    const scores = state.scores.map((p) => p.score) as [number, number, number, number, number];
    return aggregate(scores);
  }

  const aggregateResult = getAggregateResult();

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
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium uppercase tracking-wide px-2 py-1 bg-amber-100 text-amber-800 rounded">
                {state.workflowState}
              </span>

              {aggregateResult && (
                aggregateResult.ok ? (
                  <div className="text-right">
                    <span className="text-2xl font-semibold">{aggregateResult.total}</span>
                    <span className="text-stone-400">/100</span>
                    <span className="ml-3 px-2 py-1 text-sm bg-stone-100 text-stone-700 rounded">
                      {aggregateResult.tier}
                    </span>
                  </div>
                ) : (
                  <div className="text-red-600 text-sm">{aggregateResult.error}</div>
                )
              )}
            </div>

            {state.scores.map((pillar, index) => (
              <div
                key={pillar.name}
                className="bg-white rounded-lg border border-stone-200 p-4"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">{pillar.name}</h3>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={pillar.score}
                      onChange={(e) => handleScoreChange(index, e.target.value)}
                      className="w-12 text-right border border-stone-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-stone-400"
                    />
                    <span className="text-stone-400">/20</span>
                  </div>
                </div>
                <textarea
                  value={pillar.feedback}
                  onChange={(e) => handleFeedbackChange(index, e.target.value)}
                  rows={2}
                  className="w-full text-sm text-stone-600 border border-stone-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
