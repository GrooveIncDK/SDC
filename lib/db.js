import { neon } from '@neondatabase/serverless';

// DATABASE_URL is the pooled Neon connection string, set as an env var in
// the Vercel project (Project Settings -> Environment Variables). Using
// Neon's HTTP driver here rather than a `pg` Pool deliberately — the WebDev
// notes from the ISL/Supabase build document a pool-sizing pitfall on
// serverless (concurrent requests on one warm instance queuing for a single
// connection). The Neon HTTP driver sidesteps that entirely: each query is
// a stateless fetch, no connection to size or exhaust.
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Add the Neon pooled connection string as an env var in the Vercel project settings.'
  );
}

export const sql = neon(process.env.DATABASE_URL);
