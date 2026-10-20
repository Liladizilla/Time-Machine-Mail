export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const config = {
    supabaseUrl: process.env.TMM_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.TMM_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  };
  return new Response(`window.__TMM_CONFIG__ = ${JSON.stringify(config)};`, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
