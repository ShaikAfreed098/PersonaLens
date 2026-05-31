# PersonaLens

## Adaptive Behavioral Intelligence Platform

PersonaLens is an AI-powered behavioral intelligence platform that dynamically analyzes how individuals think, decide, communicate, adapt, lead, and respond to real-world situations.

Unlike traditional personality tests that rely on static questionnaires, PersonaLens uses an adaptive assessment engine powered by AI-driven behavioral analysis. The platform intelligently selects questions from a 500+ question behavioral dataset, continuously refining user profiles until confidence thresholds are achieved.

The result is a comprehensive behavioral report that provides actionable insights into leadership, decision-making, emotional resilience, motivation, adaptability, creativity, social intelligence, and personal growth opportunities.

---

## Features

### Adaptive Assessment Engine

- Dynamic question selection
- Confidence-based assessment flow
- Behavioral trait calibration
- Multi-format question support
- Reduced assessment fatigue

### Behavioral Profiling

Analyze behavioral dimensions including:

- Decision Making
- Leadership
- Emotional Resilience
- Social Orientation
- Motivation
- Adaptability
- Creativity & Innovation
- Values & Identity
- Behavioral Patterns
- Self-Awareness

### AI-Powered Insights

- Google Gemini 2.5 Flash integration
- Behavioral archetype generation
- Strength identification
- Growth opportunity analysis
- Personalized behavioral summaries

### Interactive Dashboard

- Assessment history
- Behavioral analytics
- Report management
- Visual trait tracking
- Progress monitoring

### Comprehensive Reports

- Primary and secondary archetypes
- Behavioral trait breakdowns
- Confidence indicators
- Visual analytics
- Export-friendly layouts

---

## Tech Stack

### Frontend

- Next.js 15 (App Router)
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts

### Backend

- Next.js API Routes
- Supabase Authentication
- Supabase Database
- Google Gemini API

### Database

- Supabase PostgreSQL

### Development Tools

- ESLint
- Turbopack
- Git
- GitHub

---

## Architecture

```text
User
 │
 ▼
Adaptive Question Engine
 │
 ▼
Response Collection
 │
 ▼
Trait Scoring Engine
 │
 ▼
Confidence Evaluation
 │
 ├── Additional Questions Required
 │
 └── Confidence Threshold Achieved
             │
             ▼
      Gemini Analysis Engine
             │
             ▼
      Behavioral Report Generation
             │
             ▼
      Dashboard & Visualization
```

## Assessment Workflow

1. User starts an assessment.
2. Initial calibration questions are presented.
3. Responses are evaluated by the adaptive trait engine.
4. Confidence levels are calculated across behavioral dimensions.
5. Additional questions are selected dynamically where confidence is low.
6. Assessment concludes once confidence thresholds are met.
7. Behavioral data is analyzed.
8. Google Gemini generates personalized insights.
9. A behavioral report is produced.
10. Results are stored and displayed on the dashboard.

---

## Project Structure

```text
src/
├── app/
│   ├── auth/
│   ├── assessment/
│   ├── dashboard/
│   ├── report/
│   └── api/
│
├── components/
│
├── lib/
│   ├── trait-engine.ts
│   ├── adaptive-engine.ts
│   ├── db.ts
│   └── gemini.ts
│
├── data/
│   └── questions/
│
├── hooks/
│
└── types/
```

---

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/your-username/personalens.git

cd personalens
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Application runs at:

```text
http://localhost:3000
```

---

## Local Development Mode

PersonaLens includes a LocalStorage fallback system.

If Supabase credentials are unavailable:

- User sessions work locally
- Assessments are stored locally
- Reports remain accessible
- Full application testing is possible without external services

---

## Privacy & Ethics

PersonaLens is intended for behavioral insights and self-reflection.

The platform:

- Does not diagnose mental health conditions
- Does not provide medical advice
- Does not replace professional psychological evaluation
- Presents results as behavioral tendencies rather than definitive conclusions

---

## Future Enhancements

- Behavioral trend tracking
- AI coaching assistant
- Team compatibility assessments
- Growth roadmap generation
- Enterprise analytics
- Mobile application
- Multi-language support

---

## License

This project is intended for educational, research, and portfolio purposes.

---

## Author

Developed as an advanced AI-powered behavioral intelligence platform combining adaptive assessment systems, behavioral analytics, and generative AI to deliver personalized insights.
