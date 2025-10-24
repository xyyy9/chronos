import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '@/app/lib/prisma';
import { createSession, hashPassword } from '@/app/lib/auth';

const signUpSchema = z
  .object({
    username: z.string().min(2, '用户名至少需要 2 个字符').max(32, '用户名不要超过 32 个字符'),
    email: z.string().email('请输入有效的邮箱地址'),
    password: z.string().min(6, '密码至少需要 6 个字符'),
    confirmPassword: z.string().min(6, '请再次输入密码'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: '两次输入的密码不一致',
  });

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  const parsed = signUpSchema.safeParse(payload);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? '注册信息无效';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const username = parsed.data.username.trim();
  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;

  try {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: await hashPassword(password),
      },
    });

    await createSession(user.id);
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json({ error: '该邮箱已被注册' }, { status: 409 });
    }

    console.error('sign-up-error', error);
    return NextResponse.json({ error: '注册失败，请稍后再试。' }, { status: 500 });
  }
}
