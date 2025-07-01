import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import db from '@/db';
import { users } from '@/db/schema';
import { forgotPasswordSchema } from '@/lib/schemas';
import { getIpAddress, getLocation } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.errors },
        { status: 400 }
      );
    }
    const { email } = parsed.data;

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const ip = getIpAddress(req);
    const location = await getLocation(ip);
    const { email: userEmail, id, name } = user;
    return NextResponse.json({
      success: true,
      user: {
        email: userEmail,
        id,
        name,
        ip,
        location,
      },
    });
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
