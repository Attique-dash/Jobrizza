import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import CV from '@/models/CV';

// GET - Get user's CV data
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();

    const cv = await CV.findOne({ userId: session.user.id }).sort({ createdAt: -1 });
    
    if (!cv) {
      return NextResponse.json(
        { error: 'No CV found for this user' },
        { status: 404 }
      );
    }

    return NextResponse.json({ cv });
  } catch (error: unknown) {
    console.error('Get CV error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST - Save new CV data
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
    const { filename, rawText, parsedData, analysis } = body;

    await connectDB();

    // Delete any existing CV for this user
    await CV.deleteMany({ userId: session.user.id });

    // Create new CV
    const cv = await CV.create({
      userId: session.user.id,
      filename,
      rawText,
      parsedData,
      analysis,
    });

    return NextResponse.json({ cv }, { status: 201 });
  } catch (error: unknown) {
    console.error('Save CV error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT - Update CV data with analysis results
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      analysis, 
      aiAnalysis, 
      skillGap, 
      jobMatches, 
      learningRecommendations,
      mockInterview,
      salaryEstimate,
      careerPath,
    } = body;

    await connectDB();

    const cv = await CV.findOneAndUpdate(
      { userId: session.user.id },
      {
        ...(analysis && { analysis }),
        ...(aiAnalysis && { aiAnalysis }),
        ...(skillGap && { skillGap }),
        ...(jobMatches && { jobMatches }),
        ...(learningRecommendations && { learningRecommendations }),
        ...(mockInterview && { mockInterview }),
        ...(salaryEstimate && { salaryEstimate }),
        ...(careerPath && { careerPath }),
      },
      { new: true, sort: { createdAt: -1 } }
    );

    if (!cv) {
      return NextResponse.json(
        { error: 'No CV found to update' },
        { status: 404 }
      );
    }

    return NextResponse.json({ cv });
  } catch (error: unknown) {
    console.error('Update CV error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
