"use client";

import { useReducer, useState, useEffect } from "react";
import { scoreReducer, type ScoreState } from "@/lib/stateMachine";
import { aggregate } from "@/lib/aggregate";

const SUBMISSION_TEXT = `I went deep on the audience side first. The TEDxManchester ticket data shows 62 percent of attendees are 28 to 42, professional, design conscious. I built a single master deck that leans into that. Then I tailored three versions, one for Marks and Spencer, one for Lululemon, one for Ace Hotel. The pricing tiers are 5k, 15k, 35k. I decided against programmatic banner ads because the audience hates them.`;

const STORAGE_KEY = "ventureship_scorer_state";

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

function loadFromStorage(): ScoreState<Scores> | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

function saveToStorage(state: ScoreState<Scores>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

function clearStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export default function Home() {
  const [state, dispatch] = useReducer(scoreReducer<Scores>, initialState);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored && stored.scores) {
      // Restore via set_scores, then apply transitions to match stored workflowState
      dispatch({ type: "set_scores", scores: stored.scores });
      if (stored.workflowState === "reviewed" || stored.workflowState === "published") {
        dispatch({ type: "transition_to_reviewed" });
      }
      if (stored.workflowState === "published") {
        dispatch({ type: "transition_to_published" });
      }
    }
    setHydrated(true);
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    if (hydrated && state.scores) {
      saveToStorage(state);
    }
  }, [state, hydrated]);

  const isPublished = state.workflowState === "published";

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

  function handlePublish() {
    // Transition through reviewed to published
    dispatch({ type: "transition_to_reviewed" });
    dispatch({ type: "transition_to_published" });
  }

  function handleStartNew() {
    clearStorage();
    window.location.reload();
  }

  // Compute total and tier from aggregate function
  function getAggregateResult() {
    if (!state.scores) return null;

    const scores = state.scores.map((p) => p.score) as [number, number, number, number, number];
    return aggregate(scores);
  }

  const aggregateResult = getAggregateResult();

  // Published Report View - calm, read-only, distinct from editor
  if (isPublished && state.scores && aggregateResult?.ok) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-light text-stone-800 mb-2">Score Report</h1>
            <p className="text-stone-500 text-sm">Candidate Assessment</p>
          </div>

          {/* Total Score */}
          <div className="text-center mb-10 py-8 border-y border-stone-200">
            <div className="text-6xl font-light text-stone-800 mb-2">
              {aggregateResult.total}
              <span className="text-2xl text-stone-400">/100</span>
            </div>
            <div className="inline-block px-4 py-1 bg-stone-100 text-stone-700 rounded-full text-sm font-medium">
              {aggregateResult.tier}
            </div>
          </div>

          {/* Pillar Scores */}
          <div className="space-y-6 mb-10">
            {state.scores.map((pillar) => (
              <div key={pillar.name} className="border-b border-stone-100 pb-6 last:border-0">
                <div className="flex justify-between items-baseline mb-2">
                  <h3 className="font-medium text-stone-800">{pillar.name}</h3>
                  <span className="text-stone-600">
                    <span className="text-lg font-medium">{pillar.score}</span>
                    <span className="text-stone-400 text-sm">/20</span>
                  </span>
                </div>
                <p className="text-stone-600 text-sm leading-relaxed">{pillar.feedback}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center pt-6 border-t border-stone-200">
            <p className="text-xs text-stone-400 mb-4">
              This report is confidential and intended for the candidate only.
            </p>
            <button
              onClick={handleStartNew}
              className="text-sm text-stone-500 hover:text-stone-700 underline"
            >
              Start New Assessment
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Editor/Workspace View
  return (
    <main className="min-h-screen p-8 bg-stone-50">
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

        {state.scores && !isPublished && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium uppercase tracking-wide px-2 py-1 rounded bg-amber-100 text-amber-800">
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

            <button
              onClick={handlePublish}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Publish Score
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
