import { NextResponse } from 'next/server'
import { getFlaskAuthHeader } from '@/lib/flask-auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export async function GET() {
  const authHeader = await getFlaskAuthHeader()
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await fetch(`${API}/api/applications/stats`, {
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch application stats' }, { status: 500 })
  }
}
