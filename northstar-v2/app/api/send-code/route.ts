import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  const { email, code } = await req.json()

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  })

  await transporter.sendMail({
    from: `"NorthStar" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your NorthStar Verification Code',
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; background: #0f172a; color: white; padding: 40px; border-radius: 16px;">
        <h2 style="color: #3b82f6;">NorthStar 🌟</h2>
        <p>Your verification code is:</p>
        <h1 style="font-size: 48px; letter-spacing: 10px; color: #ffc825;">${code}</h1>
        <p style="color: #94a3b8;">This code expires in 10 minutes.</p>
      </div>
    `
  })

  return NextResponse.json({ success: true })
}