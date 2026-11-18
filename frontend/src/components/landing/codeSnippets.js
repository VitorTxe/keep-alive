export const CODE_SNIPPETS = [
  {
    id: 'prisma',
    label: 'Prisma + MongoDB',
    code: `app.get('/api/health', async (req, res) => {
  try {
    const start = performance.now();
    await prisma.$runCommandRaw({ ping: 1 });
    const dbLatencyMs = Math.round(performance.now() - start);

    res.json({ status: 'ok', dbLatencyMs });
  } catch {
    res.status(503).json({ status: 'error' });
  }
});`,
  },
  {
    id: 'upstash',
    label: 'Upstash Redis',
    code: `const redis = Redis.fromEnv();

app.get('/api/health', async (req, res) => {
  try {
    const start = performance.now();
    await redis.ping();
    const dbLatencyMs = Math.round(performance.now() - start);

    res.json({ status: 'ok', dbLatencyMs });
  } catch {
    res.status(503).json({ status: 'error' });
  }
});`,
  },
  {
    id: 'supabase',
    label: 'Supabase',
    code: `app.get('/api/health', async (req, res) => {
  const start = performance.now();
  const { error } = await supabase
    .from('projects')
    .select('id', { head: true, count: 'exact' });
  const dbLatencyMs = Math.round(performance.now() - start);

  if (error) return res.status(503).json({ status: 'error' });
  res.json({ status: 'ok', dbLatencyMs });
});`,
  },
];
