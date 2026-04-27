# EduFlix AI

An LLM-powered adaptive learning platform that reads your background — education, certifications, projects, work history — and generates a personalized, gap-targeted study plan specific to you.

Most learning platforms give everyone the same curriculum. EduFlix doesn't. It analyses who you are first, then builds the path.

## How it works

1. **Onboarding** — Multi-step intake captures your education, work experience, projects, certifications, skills, and career goals. Resume upload supported.
2. **Skill extraction** — A GPT-4o pipeline (MetaGPT architecture) reads your full profile, infers both explicit and implicit skills, assigns proficiency levels, and validates them against industry benchmarks.
3. **Gap analysis** — Career and learning goals are cross-referenced against extracted skills to identify priority gaps.
4. **Learning pathway generation** — A structured pathway is generated with modules, subtopics, and curated resources — scoped to your specific gaps, not a generic syllabus.
5. **Continuous refinement** — Task completion rates per session feed back into pathway prioritisation.

## Tech stack

- **Frontend** — Next.js 15, TypeScript, Tailwind CSS, Framer Motion
- **Backend** — Python FastAPI, GPT-4o (OpenAI), MetaGPT pipeline
- **Database** — Supabase (Postgres + pgvector), full schema for profiles, education, experience, projects, certifications, skill proficiencies
- **Auth** — Supabase Auth with full session management

## Key features

- Resume + transcript upload with AI-assisted skill extraction
- Proficiency scoring per skill with industry validation
- Adaptive questionnaire to refine career and learning goals
- EduReels — short-form learning content feed
- Social layer — friends, study groups, discussion board, messenger
- Real-time learning pathway editor with module/subtopic management

## Architecture note

The skill extraction pipeline uses a LangChain-style chaining pattern: GPT-4o ingests the full user profile → extracts and normalises skills → scores them against impact statements → cross-validates against industry benchmark data → outputs a structured skill gap map. Fine-tuning (PEFT/LoRA) was evaluated and ruled out — prompt-based extraction was chosen because it adapts as industry benchmarks shift without retraining.
