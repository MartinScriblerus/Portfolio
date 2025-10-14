import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const task = body?.task ?? { name: 'Attend to the image.' };
  const styled = `Attend: ${task.name}. Consider the play of light and sound; act, then observe.`;
  return new Response(JSON.stringify({ text: styled }), { headers: { 'Content-Type': 'application/json' } });
}
