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

    const apiKey = process.env.GROQ_API_KEY || process.env.Jobrizza_AI_KEY;
    const model = process.env.GROQ_MODEL || 'qwen/qwen3-32b';

    if (!apiKey) {
      console.error('GROQ_API_KEY/Jobrizza_AI_KEY not set');
      return NextResponse.json({
        reply:
          "I'm currently running in limited mode. Here's some general career advice:\n\n" +
          '**CV Tips:**\n- Keep your CV to 1-2 pages\n- Use bullet points for achievements\n- Tailor your CV to each job\n\n' +
          '**Interview Prep:**\n- Research the company thoroughly\n- Prepare STAR method examples\n- Ask thoughtful questions\n\n' +
          'For personalized AI assistance, please configure the GROQ_API_KEY environment variable.',
      });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        temperature: 0.6,
        top_p: 0.95,
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
      console.error('Groq API error:', response.status, errorData);
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
