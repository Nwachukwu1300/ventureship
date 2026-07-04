const SUBMISSION_TEXT = `I went deep on the audience side first. The TEDxManchester ticket data shows 62 percent of attendees are 28 to 42, professional, design conscious. I built a single master deck that leans into that. Then I tailored three versions, one for Marks and Spencer, one for Lululemon, one for Ace Hotel. The pricing tiers are 5k, 15k, 35k. I decided against programmatic banner ads because the audience hates them.`;

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Submission Scorer</h1>

        <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-sm">
          <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-3">
            Candidate Submission
          </h2>
          <p className="text-stone-700 leading-relaxed">
            {SUBMISSION_TEXT}
          </p>
        </div>
      </div>
    </main>
  );
}
