# Shikhar Spawn

Mobile-first baby shower app for guests to make predictions, suggest a baby name, generate an AI baby portrait, and answer a second round of fun questions.

## Stack

- Static HTML/CSS/JavaScript frontend
- Vercel serverless API routes in `api/`
- Supabase for submissions and generated image storage
- OpenAI image generation for baby portraits

## Local Setup

```bash
npm install
npx vercel dev
```

Local app:

```text
http://localhost:3000
```

Local admin:

```text
http://localhost:3000/admin.html
```

On localhost, the baby generation step is bypassed with a fast preview image so you can move through the flow quickly.

## Environment Variables

Create `.env.local`:

```bash
OPENAI_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_PASSWORD=...
```

These are configured in Vercel for Development and Production.

## Guest Flow

1. Choose Team Pink or Team Blue.
2. Enter guest name.
3. Enter what the baby will call the guest.
4. Guess gender.
5. Suggest a baby name.
6. Pick visual traits: eyes, smile, nose, hair, expression, outfit, and overall resemblance.
7. Add an optional visual description and message.
8. Generate an AI baby portrait.
9. Answer the second round of fun prediction questions.
10. Save the full prediction to Supabase.

After gender and name are collected, later questions use the suggested baby name and gendered pronouns when available.

## Admin

Admin dashboard:

```text
/admin.html
```

The admin UI has three tabs:

- `Dashboard` for stats and consensus generation
- `Consensus Baby` for creating a consensus portrait from recent submissions
- `Baby Gallery` for a phone-style viewer with image, submitter, name suggestion, and gender guess

CSV export has been removed.

## Deploy

GitHub repo:

```text
https://github.com/pushkardravid/shikhar-spawn
```

Vercel app:

```text
https://shikhar-spawn.vercel.app
```

Pushing to `main` deploys to Vercel production.
