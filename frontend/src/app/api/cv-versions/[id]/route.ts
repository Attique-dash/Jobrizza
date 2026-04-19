import { NextRequest, NextResponse } from 'next/server'
import { getFlaskAuthHeader } from '@/lib/flask-auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = await getFlaskAuthHeader()
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await fetch(`${API}/api/cv-versions/${params.id}`, {
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch CV version' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = await getFlaskAuthHeader()
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await fetch(`${API}/api/cv-versions/${params.id}`, {
      method: 'DELETE',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete CV version' }, { status: 500 })
  }
}
