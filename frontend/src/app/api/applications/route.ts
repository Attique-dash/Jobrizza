import { NextRequest, NextResponse } from 'next/server'
import { getFlaskAuthHeader } from '@/lib/flask-auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export async function GET(request: NextRequest) {
  const authHeader = await getFlaskAuthHeader()
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const url = new URL(`${API}/api/applications`)
    if (status) url.searchParams.set('status', status)

    const res = await fetch(url, {
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authHeader = await getFlaskAuthHeader()
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const res = await fetch(`${API}/api/applications`, {
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
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 })
  }
}
