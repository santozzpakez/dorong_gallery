# Dorong Gallery — Premium Cinematic Ecommerce Scaffold

This is a minimal scaffold for the Dorong Gallery ecommerce site.

Tech stack:
- Next.js
- Tailwind CSS
- Framer Motion
- Supabase (placeholder integration)

Local setup:

1. Install dependencies

```bash
cd Desktop/project1
npm install
```

2. Run development server

```bash
npm run dev
```

3. Supabase

Set environment variables in a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Notes:
- This scaffold focuses on UI and structure. Integrate Supabase tables, storage, and auth as needed.
- Add real assets into the `public/` folder (e.g. `sublimation-sample.mp4`).

Docker (run without installing Node locally):

Development (hot-reload):

```bash
cd Desktop/project1
docker compose up --build
```

Production build & run:

```bash
cd Desktop/project1
docker build -t dorong-gallery .
docker run -p 3000:3000 dorong-gallery
```

Notes: The `docker-compose.yml` uses `Dockerfile.dev` for a development container that mounts the project into the container. For production use the `Dockerfile`.
