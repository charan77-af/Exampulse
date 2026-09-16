import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topics } = body;

    if (!Array.isArray(topics)) {
      return NextResponse.json(
        { error: 'Invalid topics array' },
        { status: 400 }
      );
    }

    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'SERPAPI_KEY is not configured' },
        { status: 500 }
      );
    }

    const results = await Promise.all(
      topics.map(async (topic) => {
        try {
          const url = `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(
            topic
          )}&date=today%203-m&api_key=${apiKey}`;

          const response = await fetch(url);
          const data = await response.json();

          const timelineData = data?.interest_over_time?.timeline_data;

          if (!Array.isArray(timelineData) || timelineData.length === 0) {
            return { topic, urgencyScore: 0, trendLabel: 'quiet' };
          }

          // Take the last 4 entries
          const lastEntries = timelineData.slice(-4);
          const values = lastEntries.map((entry: any) => {
            // Check both SerpApi structures (nested in values array or direct)
            const val = entry.values?.[0]?.extracted_value ?? entry.extracted_value;
            return typeof val === 'number' ? val : parseInt(val || '0', 10);
          });

          const sum = values.reduce((a, b) => a + b, 0);
          const urgencyScore = sum / values.length;
          const mostRecentValue = values[values.length - 1];

          // Determine trendLabel by checking if recent value is notably higher/lower
          let trendLabel = 'steady';
          const threshold = 10; // Notably higher/lower by 10 points

          if (mostRecentValue > urgencyScore + threshold) {
            trendLabel = 'spiking';
          } else if (mostRecentValue < urgencyScore - threshold) {
            trendLabel = 'quiet';
          }

          return { topic, urgencyScore, trendLabel };
        } catch (error) {
          console.error(`Error fetching data for topic ${topic}:`, error);
          return { topic, urgencyScore: 0, trendLabel: 'quiet' };
        }
      })
    );

    // Sort by urgencyScore descending
    results.sort((a, b) => b.urgencyScore - a.urgencyScore);

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && results.length > 0) {
      try {
        const prompt = `Here is a list of topics with their urgency scores and trend labels:\n${JSON.stringify(
          results
        )}\n\nReturn a JSON array of objects with keys "topic" and "insight". The "insight" should be one short sentence (under 15 words) explaining why that topic matters right now for exam prep, written for a student.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          let text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

          // Strip markdown code fences if present
          const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
          if (jsonMatch) {
            text = jsonMatch[1];
          } else {
            text = text.trim();
          }

          try {
            const insights = JSON.parse(text);
            const insightsMap = new Map(insights.map((i: any) => [i.topic, i.insight]));

            for (const result of results) {
              const insight = insightsMap.get(result.topic);
              if (insight) {
                (result as any).insight = insight;
              }
            }
          } catch (parseError) {
            console.error('Error parsing Gemini JSON response:', parseError);
          }
        } else {
          console.error('Gemini API error:', await geminiRes.text());
        }
      } catch (geminiError) {
        console.error('Error calling Gemini API:', geminiError);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in pulse API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
