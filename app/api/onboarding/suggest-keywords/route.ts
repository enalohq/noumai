import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AiSuggester } from "@/lib/onboarding/keyword-suggester-ai";
import { KeywordSuggestContext } from "@/lib/onboarding/keyword-suggester";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { brandName, industry, description, competitorNames } = body as KeywordSuggestContext;

    if (!brandName || !industry) {
      return NextResponse.json({ error: "brandName and industry are required" }, { status: 400 });
    }

    const suggester = new AiSuggester();
    const suggestions = await suggester.suggest({
      brandName,
      industry,
      description,
      competitorNames,
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("[api/onboarding/suggest-keywords] Error:", error);
    return NextResponse.json({ error: "Failed to suggest keywords" }, { status: 500 });
  }
}
