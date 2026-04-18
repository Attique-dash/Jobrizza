import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const res = await fetch(`${API}/api/job-alerts/unsubscribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.user.id}`,
      },
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
  }
}
