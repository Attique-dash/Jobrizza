import { NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const res = await fetch(`${API}/api/portfolio/username-check/${params.username}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check username' }, { status: 500 })
  }
}
