import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    await connectDB()

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    const user = await User.create({
      name,
      email,
      password,
      verified: true
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}