import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = searchParams.get('limit') || '20'

    const res = await fetch(`${API}/api/interview/history?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${session.user.id}`,
      },
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch grading history' }, { status: 500 })
  }
}
