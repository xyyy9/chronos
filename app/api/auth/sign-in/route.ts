import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/app/lib/prisma';
import { createSession, verifyPassword } from '@/app/lib/auth';

const signInSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = signInSchema.safeParse(payload);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? '登录信息无效';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ error: '邮箱或密码不正确' }, { status: 401 });
  }

  const matches = await verifyPassword(password, user.passwordHash);
  if (!matches) {
    return NextResponse.json({ error: '邮箱或密码不正确' }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  });
}
