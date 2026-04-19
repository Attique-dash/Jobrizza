import { NextRequest, NextResponse } from 'next/server'
import { getFlaskAuthHeader } from '@/lib/flask-auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = await getFlaskAuthHeader()
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const res = await fetch(`${API}/api/applications/${params.id}/notes`, {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 })
  }
}
