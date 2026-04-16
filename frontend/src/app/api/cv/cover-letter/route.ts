import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import CV from '@/models/CV';

// POST - Add a cover letter to user's CV
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { jobTitle, companyName, coverLetter, subject } = body;

    if (!jobTitle || !companyName || !coverLetter) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    const cv = await CV.findOneAndUpdate(
      { userId: session.user.id },
      {
        $push: {
          coverLetters: {
            jobTitle,
            companyName,
            coverLetter,
            subject: subject || `Application for ${jobTitle} at ${companyName}`,
            createdAt: new Date(),
          },
        },
      },
      { new: true, sort: { createdAt: -1 } }
    );

    if (!cv) {
      return NextResponse.json(
        { error: 'No CV found for this user' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Cover letter saved successfully',
      coverLetter: cv.coverLetters?.[cv.coverLetters.length - 1]
    });
  } catch (error: any) {
    console.error('Save cover letter error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// GET - Get all cover letters for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();

    const cv = await CV.findOne({ userId: session.user.id })
      .select('coverLetters')
      .sort({ createdAt: -1 });
    
    if (!cv) {
      return NextResponse.json(
        { error: 'No CV found for this user' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      coverLetters: cv.coverLetters || [] 
    });
  } catch (error: any) {
    console.error('Get cover letters error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
