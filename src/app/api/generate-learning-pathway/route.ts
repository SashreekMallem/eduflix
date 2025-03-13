import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
  }

  try {
    // Call the Python backend endpoint that handles generation and validation of the learning pathway.
    const res = await fetch(`http://localhost:8000/generate-learning-pathway?user_id=${userId}`);
    if (!res.ok) {
      throw new Error(`Python endpoint returned status ${res.status}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error generating learning pathway:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
