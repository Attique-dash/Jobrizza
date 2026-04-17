import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // If no API key, return a helpful fallback response
    if (!apiKey) {
      return NextResponse.json({
        reply: "I'm currently running in limited mode without AI access. Here's some general career advice:\n\n" +
               "**CV Tips:**\n- Keep your CV to 1-2 pages\n- Use bullet points for achievements\n- Tailor your CV to each job\n\n" +
               "**Interview Prep:**\n- Research the company thoroughly\n- Prepare STAR method examples\n- Ask thoughtful questions\n\n" +
               "For personalized AI assistance, please configure the ANTHROPIC_API_KEY environment variable."
      });
    }

    // Call Anthropic Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: messages.map((m: ChatMessage) => ({
          role: m.role,
          content: m.content,
        })),
        system: `You are Jobby, a helpful career AI assistant for Jobrizza, a recruitment platform. 
You help users with CV tips, interview preparation, career advice, and job searching.
Keep responses concise, friendly, and actionable. Use markdown formatting for clarity.
If asked about technical topics, provide practical, up-to-date advice.`
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Anthropic API error:', errorData);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      reply: data.content?.[0]?.text || "I couldn't generate a response. Please try again."
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      reply: "I'm having trouble connecting to the AI service right now. Please try again in a moment."
    }, { status: 200 }); // Return 200 with error message to prevent client-side crash
  }
}
