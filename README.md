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

1. Read the playful landing screen and start the prediction.
2. Enter guest name, what baby will call the guest, a name suggestion, and a gender guess.
3. Build baby’s look with predictions about eyes, smile, nose, cheeks, outfit, and resemblance.
4. Predict baby’s personality, habits, internet presence, and arrival date through the family joke questions.
5. Leave a personalized message for baby to discover later.
6. Generate the AI baby portrait from the submitted prediction.
7. Review and lock in the full prediction to Supabase.

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
