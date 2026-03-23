import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 });
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio');

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    // Forward the audio to Groq Whisper API
    const groqForm = new FormData();
    groqForm.append('file', audioFile, 'audio.webm');
    groqForm.append('model', 'whisper-large-v3');
    groqForm.append('language', 'es');
    groqForm.append('response_format', 'json');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: groqForm,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq Whisper Error:', errorText);
      return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
