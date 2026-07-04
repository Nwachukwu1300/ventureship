"use client";

import { useReducer, useState, useEffect } from "react";
import { scoreReducer, type ScoreState } from "@/lib/stateMachine";
import { aggregate, type Tier } from "@/lib/aggregate";

const SUBMISSION_TEXT = `I went deep on the audience side first. The TEDxManchester ticket data shows 62 percent of attendees are 28 to 42, professional, design conscious. I built a single master deck that leans into that. Then I tailored three versions, one for Marks and Spencer, one for Lululemon, one for Ace Hotel. The pricing tiers are 5k, 15k, 35k. I decided against programmatic banner ads because the audience hates them.`;

const STORAGE_KEY = "ventureship_scorer_state";

type PillarScore = {
  name: string;
  score: number;
  feedback: string;
};

const PILLAR_DESCRIPTIONS: Record<string, string> = {
  "Analytical Rigour": "Depth of research and logical reasoning",
  "Commercial Acumen": "Understanding of market dynamics and business value",
  "Quality of Output": "Clarity, structure, and craft of the final deliverable",
  "Communication": "Ability to convey ideas clearly and concisely",
  "Initiative and Ownership": "Proactiveness, accountability, and drive shown throughout",
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

  // Tier chip styling based on tier from aggregate function
  function getTierChipStyles(tier: Tier) {
    switch (tier) {
      case "Exceptional":
        return { bg: "#E3F0E6", text: "#1F6B3D", dot: "#1F6B3D" };
      case "High Performer":
        return { bg: "#EAF4EC", text: "#3B8A5A", dot: "#3B8A5A" };
      case "Promising":
        return { bg: "#FBF0DE", text: "#A66A1F", dot: "#A66A1F" };
      case "Developing":
        return { bg: "#F7E8E4", text: "#A84B33", dot: "#A84B33" };
    }
  }

  // Published Report View - calm, read-only, distinct from editor
  if (isPublished && state.scores && aggregateResult?.ok) {
    const tierStyles = getTierChipStyles(aggregateResult.tier);

    return (
      <main className="min-h-screen font-[family-name:var(--font-inter)]" style={{ backgroundColor: "#FAF9F5" }}>
        <div className="max-w-[720px] mx-auto px-6 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <p
              className="text-xs font-medium uppercase tracking-[0.2em] mb-6"
              style={{ color: "#A8A499" }}
            >
              Final Score
            </p>
            <div className="mb-4">
              <span
                className="text-7xl font-[family-name:var(--font-playfair)]"
                style={{ color: "#1F1E1B" }}
              >
                {aggregateResult.total}
              </span>
              <span className="text-2xl ml-1" style={{ color: "#A8A499" }}>
                /100
              </span>
            </div>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{ backgroundColor: tierStyles.bg, color: tierStyles.text }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tierStyles.dot }}
              />
              {aggregateResult.tier}
            </div>
          </div>

          {/* Pillar Scores */}
          <div className="space-y-0">
            {state.scores.map((pillar, index) => (
              <div
                key={pillar.name}
                className={index < state.scores!.length - 1 ? "pb-6 mb-6" : "pb-6"}
                style={{ borderBottom: index < state.scores!.length - 1 ? "1px solid #E7E4DC" : "none" }}
              >
                {/* Pillar header row */}
                <div className="flex justify-between items-baseline mb-3">
                  <h3
                    className="text-lg font-[family-name:var(--font-playfair)]"
                    style={{ color: "#1F1E1B" }}
                  >
                    {pillar.name}
                  </h3>
                  <span>
                    <span className="text-lg font-medium" style={{ color: "#C15F3C" }}>
                      {pillar.score}
                    </span>
                    <span className="text-sm ml-0.5" style={{ color: "#A8A499" }}>
                      /20
                    </span>
                  </span>
                </div>

                {/* Progress bar - width computed from score */}
                <div className="h-0.5 w-full mb-3" style={{ backgroundColor: "#E7E4DC" }}>
                  <div
                    className="h-full"
                    style={{
                      backgroundColor: "#C15F3C",
                      width: `${(pillar.score / 20) * 100}%`,
                    }}
                  />
                </div>

                {/* Feedback */}
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#57534A" }}
                >
                  {pillar.feedback}
                </p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center pt-10 mt-10" style={{ borderTop: "1px solid #E7E4DC" }}>
            <p className="text-xs mb-4" style={{ color: "#A8A499" }}>
              This report is confidential and intended for the candidate only.
            </p>
            <button
              onClick={handleStartNew}
              className="text-sm hover:underline"
              style={{ color: "#A8A499" }}
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
    <main
      className="min-h-screen font-[family-name:var(--font-inter)]"
      style={{ backgroundColor: "#FAF9F5" }}
    >
      {/* Top Bar */}
      <div
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: "#E7E4DC" }}
      >
        <h1
          className="text-xl font-[family-name:var(--font-playfair)]"
          style={{ color: "#1F1E1B" }}
        >
          Submission Scorer
        </h1>
        {state.scores && (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-[0.1em]"
            style={{
              backgroundColor: state.workflowState === "published" ? "#EAF4EC" : "#FBF0DE",
              color: state.workflowState === "published" ? "#3B8A5A" : "#A66A1F",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: state.workflowState === "published" ? "#3B8A5A" : "#A66A1F",
              }}
            />
            {state.workflowState}
          </div>
        )}
      </div>

      <div className="px-6 py-8">
        {/* Error banners */}
        {apiError && (
          <div
            className="max-w-5xl mx-auto mb-6 px-4 py-3 rounded-lg"
            style={{ backgroundColor: "#F7E8E4", color: "#A84B33" }}
          >
            {apiError}
          </div>
        )}

        {state.error && (
          <div
            className="max-w-5xl mx-auto mb-6 px-4 py-3 rounded-lg"
            style={{ backgroundColor: "#F7E8E4", color: "#A84B33" }}
          >
            {state.error}
          </div>
        )}

        {/* Initial state - no scores yet */}
        {!state.scores && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <h2
              className="text-2xl font-[family-name:var(--font-playfair)] mb-4"
              style={{ color: "#1F1E1B" }}
            >
              Ready to Score
            </h2>
            <p className="mb-8" style={{ color: "#57534A" }}>
              Generate an AI-powered draft score for the candidate submission.
            </p>
            <button
              onClick={handleGenerateScore}
              disabled={loading}
              className="px-6 py-3 rounded-lg text-white font-medium disabled:opacity-50"
              style={{ backgroundColor: "#C15F3C" }}
            >
              {loading ? "Generating..." : "Generate Draft Score"}
            </button>

            {/* Submission preview */}
            <div
              className="mt-10 p-6 rounded-2xl text-left"
              style={{
                backgroundColor: "#FDFCFA",
                border: "1px solid #E7E4DC",
              }}
            >
              <p
                className="text-xs font-medium uppercase tracking-[0.15em] mb-3"
                style={{ color: "#A8A499" }}
              >
                Candidate Submission
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#57534A" }}
              >
                {SUBMISSION_TEXT}
              </p>
            </div>
          </div>
        )}

        {/* Workspace with scores */}
        {state.scores && (
          <>
            {/* Header row */}
            <div className="max-w-7xl mx-auto mb-8 flex items-end justify-between px-4">
              <div>
                <p
                  className="text-xs font-medium uppercase tracking-[0.15em] mb-1"
                  style={{ color: "#A8A499" }}
                >
                  Candidate Review
                </p>
                <h2
                  className="text-2xl font-[family-name:var(--font-playfair)]"
                  style={{ color: "#1F1E1B" }}
                >
                  Assessment Workspace
                </h2>
              </div>
              <div className="text-right">
                <p
                  className="text-xs font-medium uppercase tracking-[0.15em] mb-1"
                  style={{ color: "#A8A499" }}
                >
                  Total Score
                </p>
                {aggregateResult && aggregateResult.ok && (
                  <div>
                    <span
                      className="text-4xl font-[family-name:var(--font-playfair)]"
                      style={{ color: "#1F1E1B" }}
                    >
                      {aggregateResult.total}
                    </span>
                    <span className="text-lg ml-1" style={{ color: "#A8A499" }}>
                      /100
                    </span>
                  </div>
                )}
                {aggregateResult && !aggregateResult.ok && (
                  <div className="text-sm" style={{ color: "#A84B33" }}>
                    {aggregateResult.error}
                  </div>
                )}
              </div>
            </div>

            {/* Two column layout */}
            <div className="max-w-7xl mx-auto flex gap-8 px-4">
              {/* Left column - Submission */}
              <div className="w-[35%]">
                <div
                  className="p-5 rounded-2xl"
                  style={{
                    backgroundColor: "#FDFCFA",
                    border: "1px solid #E7E4DC",
                  }}
                >
                  <p
                    className="text-xs font-medium uppercase tracking-[0.15em] mb-3"
                    style={{ color: "#A8A499" }}
                  >
                    Candidate Submission
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "#57534A" }}
                  >
                    {SUBMISSION_TEXT}
                  </p>
                </div>
              </div>

              {/* Right column - Pillar cards */}
              <div className="w-[65%] space-y-5">
                {state.scores.map((pillar, index) => (
                  <div
                    key={pillar.name}
                    className="p-6 rounded-2xl"
                    style={{
                      backgroundColor: "#FDFCFA",
                      border: "1px solid #E7E4DC",
                    }}
                  >
                    {/* Pillar header */}
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3
                          className="text-lg font-[family-name:var(--font-playfair)]"
                          style={{ color: "#1F1E1B" }}
                        >
                          {pillar.name}
                        </h3>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "#A8A499" }}
                        >
                          {PILLAR_DESCRIPTIONS[pillar.name]}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={pillar.score}
                          onChange={(e) => handleScoreChange(index, e.target.value)}
                          className="w-12 text-right rounded px-2 py-1 focus:outline-none focus:ring-2"
                          style={{
                            border: "1px solid #E7E4DC",
                            color: "#1F1E1B",
                          }}
                        />
                        <span style={{ color: "#A8A499" }}>/20</span>
                      </div>
                    </div>

                    {/* Progress bar with circle marker */}
                    <div className="relative my-4">
                      <div
                        className="h-0.5 w-full"
                        style={{ backgroundColor: "#E7E4DC" }}
                      >
                        <div
                          className="h-full"
                          style={{
                            backgroundColor: "#C15F3C",
                            width: `${(pillar.score / 20) * 100}%`,
                          }}
                        />
                      </div>
                      {/* Circle marker at end of terracotta portion */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: "#C15F3C",
                          boxShadow: "0 0 0 2px #FAF9F5",
                          left: `calc(${(pillar.score / 20) * 100}% - 5px)`,
                        }}
                      />
                    </div>

                    {/* Feedback */}
                    <textarea
                      value={pillar.feedback}
                      onChange={(e) => handleFeedbackChange(index, e.target.value)}
                      rows={3}
                      placeholder="Add feedback..."
                      className="w-full text-sm rounded px-3 py-2 focus:outline-none focus:ring-2 resize-none"
                      style={{
                        border: "1px solid #E7E4DC",
                        color: "#57534A",
                        backgroundColor: "#FDFCFA",
                      }}
                    />
                  </div>
                ))}

                {/* Publish button */}
                <button
                  onClick={handlePublish}
                  className="w-full py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#C15F3C" }}
                >
                  Publish Score
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
