"use client";

import { useState } from "react";

type PulseResult = {
  topic: string;
  urgencyScore: number;
  trendLabel: "spiking" | "steady" | "quiet";
  insight?: string;
};

export default function Home() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<PulseResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const topics = input
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);
    if (topics.length === 0) return;

    setLoading(true);
    setResults([]);
    try {
      const res = await fetch("/api/pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics }),
      });
      const data = await res.json();
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-12 md:px-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-serif text-3xl md:text-4xl mb-2">ExamPulse</h1>
        <p className="text-muted mb-10 text-sm">
          Paste your syllabus topics, one per line. We read the real search
          signal on each to tell you what to study first.
        </p>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"Binary Search Trees\nGraph Traversal\nLinked Lists"}
          rows={5}
          className="w-full bg-transparent border border-muted/40 rounded-none p-4 text-foreground placeholder:text-muted/60 focus:outline-none focus:border-calm resize-none"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-4 border border-foreground px-5 py-2 text-sm hover:bg-foreground hover:text-background transition-colors disabled:opacity-40"
        >
          {loading ? "Reading signal..." : "Read the pulse"}
        </button>

        {results.length > 0 && (
          <div className="mt-12 border-t border-muted/30">
            {results.map((r, i) => (
              <PulseRow key={r.topic} result={r} rank={i + 1} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function PulseRow({ result, rank }: { result: PulseResult; rank: number }) {
  const { topic, urgencyScore, trendLabel, insight } = result;
  const isUrgent = trendLabel === "spiking";

  const seed = topic.length + urgencyScore;
  const points = Array.from({ length: 24 }, (_, i) => {
    const wave = Math.sin(i * 0.8 + seed) * (urgencyScore / 6);
    const noise = Math.sin(i * 2.3 + seed * 1.7) * (urgencyScore / 20);
    return 20 - wave - noise;
  });
  const path = points
    .map((y, i) => `${i === 0 ? "M" : "L"} ${i * 5.2} ${y}`)
    .join(" ");

  const labelText =
    result.insight ||
    (trendLabel === "spiking"
      ? "spiking right now"
      : trendLabel === "steady"
        ? "steady, moderate demand"
        : "quiet — low priority right now");

  return (
    <div className="flex items-center gap-6 py-5 border-b border-muted/20">
      <span className="font-mono text-xs text-muted w-4">{rank}</span>

      <svg
        width="130"
        height="40"
        viewBox="0 0 125 40"
        className="shrink-0 overflow-visible"
      >
        <path
          d={path}
          fill="none"
          stroke={isUrgent ? "#D96C4C" : "#5A7D6C"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 300,
            strokeDashoffset: 300,
            animation: "draw 1s ease-out forwards",
            animationDelay: `${rank * 0.08}s`,
          }}
        />
      </svg>

      <div className="flex-1 min-w-0">
        <div className="text-base">{topic}</div>
        <div className="text-xs text-muted mt-0.5">{labelText}</div>
      </div>

      <span
        className={`font-mono text-sm ${isUrgent ? "text-urgent" : "text-calm"
          }`}
      >
        {Math.round(urgencyScore)}
      </span>

      <style jsx>{`
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}