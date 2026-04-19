import { NextResponse } from 'next/server'
import { getFlaskAuthHeader } from '@/lib/flask-auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export async function GET() {
  try {
    const authHeader = await getFlaskAuthHeader()
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const res = await fetch(`${API}/api/network/insights`, {
      headers: authHeader,
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch network insights' }, { status: 500 })
  }
}
