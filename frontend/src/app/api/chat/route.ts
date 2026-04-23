import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        reply:
          "I'm currently running in limited mode. Here's some general career advice:\n\n" +
          '**CV Tips:**\n- Keep your CV to 1-2 pages\n- Use bullet points for achievements\n- Tailor your CV to each job\n\n' +
          '**Interview Prep:**\n- Research the company thoroughly\n- Prepare STAR method examples\n- Ask thoughtful questions\n\n' +
          'For personalized AI assistance, please configure the OPENROUTER_API_KEY environment variable.',
      });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'Jobrizza',
      },
      body: JSON.stringify({
        model: 'google/gemma-4-31b-it:free',
        max_tokens: 1024,
        messages: [
          {
            role: 'system',
            content: `You are Jobby, a helpful career AI assistant for Jobrizza, a recruitment platform.
You help users with CV tips, interview preparation, career advice, and job searching.
Keep responses concise, friendly, and actionable. Use markdown formatting for clarity.
If asked about technical topics, provide practical, up-to-date advice.`,
          },
          ...messages.map((m: ChatMessage) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API error:', response.status, errorData);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content ||
      "I couldn't generate a response. Please try again.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        reply:
          "I'm having trouble connecting to the AI service right now. Please try again in a moment.",
      },
      { status: 200 }
    );
  }
}
