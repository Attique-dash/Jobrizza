import { NextRequest, NextResponse } from 'next/server'
import { getFlaskAuthHeader } from '@/lib/flask-auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export async function GET(req: NextRequest) {
  try {
    const authHeader = await getFlaskAuthHeader()
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = searchParams.get('limit') || '20'

    const res = await fetch(`${API}/api/interview/history?limit=${limit}`, {
      headers: authHeader,
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch grading history' }, { status: 500 })
  }
}
