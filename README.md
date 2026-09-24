# ExamPulse

**Know what to study first — backed by real search signal, not guesswork.**

Built for the SerpApi India Hackathon 2026.

## What it does

Students paste in their syllabus topics. ExamPulse pulls real, live search-interest
data for each topic using SerpApi's Google Trends engine, scores each one's
"urgency" (0–100), and uses Gemini to generate a short reason why each topic
matters right now. Topics are ranked highest-urgency first, so students know
exactly where to focus their limited study time.

## Tech Stack

- Next.js (App Router, TypeScript, Tailwind CSS)
- SerpApi — Google Trends engine
- Gemini API
- Deployed on Vercel

## Getting Started (Run Locally)

1. Clone the repo:

   git clone https://github.com/charan77-af/Exampulse.git
   cd Exampulse

2. Install dependencies:

   npm install

3. Create a .env.local file in the project root with:

   SERPAPI_KEY=your_serpapi_key_here
   GEMINI_API_KEY=your_gemini_key_here

   - Get a free SerpApi key at https://serpapi.com
   - Get a free Gemini API key at https://aistudio.google.com/apikey

4. Run the development server:

   npm run dev

5. Open http://localhost:3000 and paste in some syllabus topics to see it in action.

## Live Demo

https://exampulse-ochre.vercel.app/