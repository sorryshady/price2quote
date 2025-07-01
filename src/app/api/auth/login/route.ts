import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import db from '@/db';
import { sessions, users } from '@/db/schema';
import { env } from '@/env/server';
import { getIpAddress, getLocation } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const SESSION_COOKIE_NAME = 'session_token';
const SESSION_EXPIRES_DAYS = 7;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.errors },
        { status: 400 }
      );
    }
    const { email, password } = parsed.data;

    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 404 });
    }
    const ip = getIpAddress(req);
    const location = await getLocation(ip);
    const userAgent = req.headers.get('user-agent') || '';
    const { email: userEmail, emailVerified, name, id } = user;
    if (!emailVerified) {
      return NextResponse.json(
        {
          error: 'Email not verified',
          user: { email: userEmail, id, name, ip, location },
        },
        { status: 401 }
      );
    }

    // Compare password+pepper with stored hash
    const pepper = env.AUTH_SECRET;
    const isValid = await bcrypt.compare(password + pepper, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate session token
    const sessionToken = randomBytes(48).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

    // Store session in DB
    await db.insert(sessions).values({
      id: sessionToken,
      userId: user.id,
      expiresAt,
      createdAt: now,
      ip,
      userAgent,
    });

    // Set session cookie
    const res = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
    });
    res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      path: '/',
      expires: expiresAt,
    });
    return res;
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Server error',
        details: err instanceof Error ? err.message : err,
      },
      { status: 500 }
    );
  }
}
