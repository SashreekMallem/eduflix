import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
  }
  try {
    // Call your Python backend to fetch the full onboarding details (which include career_goals)
    const res = await fetch(`http://localhost:8000/onboarding-details?user_id=${userId}`);
    if (!res.ok) {
      console.error("Failed backend fetch:", res.status);
      return NextResponse.json({ error: "Failed to fetch career goals" }, { status: res.status });
    }
    const data = await res.json();
    console.log("Data from /onboarding-details:", data);
    let career_goal = "Your Career Goal";
    if (data.career_goals) {
      if (Array.isArray(data.career_goals) && data.career_goals.length > 0 && data.career_goals[0].trim() !== "") {
        career_goal = data.career_goals[0];
      } else if (typeof data.career_goals === "string" && data.career_goals.trim() !== "") {
        career_goal = data.career_goals;
      }
    }
    return NextResponse.json({ career_goal });
  } catch (error: any) {
    console.error("Error in get-career-goals route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch career goals" },
      { status: 500 }
    );
  }
}
