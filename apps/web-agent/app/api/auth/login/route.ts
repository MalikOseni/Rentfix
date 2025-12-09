import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }
  const mockToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
  const response = NextResponse.json({ token: mockToken });
  response.cookies.set('rf_agent_token', mockToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 4
  });
  return response;
}
