import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    // Use default internal worker for serverless compatibility

    const formData = await req.formData();
    const resumeFile = formData.get('resume') as File | null;
    const jobDescription = formData.get('jobDescription') as string | null;

    if (!resumeFile) {
      return NextResponse.json({ error: 'No resume file provided' }, { status: 400 });
    }

    if (resumeFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    // Extract text from PDF
    const arrayBuffer = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parser = new PDFParse({ data: buffer });
    const pdfData = await parser.getText();
    const extractedText = pdfData.text;
    await parser.destroy();

    if (!extractedText || extractedText.trim().length < 100) {
      return NextResponse.json({ 
        error: 'Could not extract sufficient text from the PDF. Please ensure it is not an image-only scan.' 
      }, { status: 400 });
    }

    // --- RESUME VALIDATION HEURISTIC ---
    const textLower = extractedText.toLowerCase();
    const resumeSections = ["experience", "education", "skills", "summary", "projects", "achievements"];
    const sectionMatches = resumeSections.filter(sec => textLower.includes(sec)).length;

    if (sectionMatches < 1 && !textLower.includes('@')) {
      return NextResponse.json({ 
        error: "This document does not appears to be a resume. Please upload a valid PDF resume." 
      }, { status: 400 });
    }

    // --- GEMINI ANALYSIS ---
    let apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) apiKey = apiKey.replace(/['"]+/g, '').trim(); 

    if (!apiKey || apiKey === '' || apiKey.includes('your_')) {
      return NextResponse.json({ 
        error: 'Gemini API Key is missing or invalid in .env file.' 
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelNames = [
      "gemini-2.0-flash",
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-pro-latest",
      "gemini-2.0-flash-lite",
      "gemma-3-12b-it"
    ];
    
    const systemPrompt = `Act as a senior, ruthless FAANG Technical Recruiter and ATS Auditor (like Resume Worded). Your goal is to provide a STERN, industry-standard assessment. 

SCORING RULES (CRITICAL):
- NO quantified metrics (%, $, numbers, or scale) = Score CAP 65.
- Readability must focus on scan-ability and clean formatting.
- Penalize Weak Verbs (e.g., 'assisted', 'responsible for', 'helped', 'worked on').
- Penalize Buzzwords (e.g., 'motivated', 'team player', 'synergy', 'hardworking').
- Growth Signals: Look for mentions of 'leading', 'managing', 'pioneering', 'scaled'.

JSON Structure:
{
  "ats_score": 0-100,
  "score_breakdown": {
    "keyword_match": 0-25, 
    "formatting": 0-10, 
    "quantified_achievements": 0-40, 
    "section_completeness": 0-15, 
    "action_verbs": 0-10
  },
  "detailed_checks": [
    { "name": "Readability", "score": 0-10, "status": "pass", "feedback": "Scanning ease and structure." },
    { "name": "Date Formatting", "score": 0-10, "status": "warning", "feedback": "Consistency in date styles." },
    { "name": "Weak Verbs", "score": 0-10, "status": "fail", "feedback": "Use more powerful action verbs." },
    { "name": "Buzzwords", "score": 0-10, "status": "pass", "feedback": "Avoid overused corporate jargon." },
    { "name": "Growth Signals", "score": 0-10, "status": "fail", "feedback": "Demonstrate leadership or promotion." }
  ],
  "critical_issues": ["Top urgent fixes for metrics and impact"],
  "improvements": [{"category": "Impact", "priority": "High", "issue": "Missing metrics", "suggestion": "Add numbers", "example": "Before/After"}],
  "missing_keywords": ["High-weight industry skills"],
  "strong_points": ["ONLY high-value items"],
  "rewritten_bullets": [{"original": "orig", "improved": "new with metrics"}],
  "overall_verdict": "Realistic, tough recruitment summary",
  "segmented_resume": [
    {
      "text": "original text segment",
      "label": "impactful" | "weak" | "irrelevant" | "neutral",
      "comment": "professional feedback"
    }
  ]
}

Guidelines for 'segmented_resume':
- 'impactful' (Green): ONLY quantify-heavy achievements or technical leadership.
- 'weak' (Amber): Non-quantified descriptions or vague bullets.
- 'irrelevant' (Red): Generic objectives, fluff, unnecessary sections.
- 'neutral' (White): Basic structure/info.`;



    const userPrompt = `RESUME TEXT:\n${extractedText}\n\n${jobDescription ? `JD: ${jobDescription}` : ''}`;

    let result;
    let lastError;

    for (const modelName of modelNames) {
      try {
        console.log(`[Gemini] Attempting content generation with model: ${modelName}`);
        const currentModel = genAI.getGenerativeModel({ model: modelName });
        result = await currentModel.generateContent([systemPrompt, userPrompt]);
        if (result) {
          console.log(`[Gemini] Success with model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini] Model ${modelName} failed: ${err.message}`);
        if (err.message.includes('API key not valid')) {
          console.error('[Gemini] Terminal Error: Invalid API Key');
          break; // Key error is terminal
        }
        continue;
      }
    }

    if (!result) {
      console.error('[Gemini] All generation attempts failed. Diagnosing available models...');
      try {
        // Attempt to list models to see exactly what this key supports
        // Note: listModels is often used to see what the project can access
        // Ref: https://github.com/google-gemini/generative-ai-js
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const modelResp = await fetch(url);
        const modelData = await modelResp.json();
        if (modelData.models) {
          const names = modelData.models.map((m: any) => m.name.replace('models/', ''));
          console.log('[Gemini] Models actually available for this key:', names.join(', '));
        } else {
          console.warn('[Gemini] Could not retrieve available models list:', JSON.stringify(modelData));
        }
      } catch (diagErr: any) {
        console.error('[Gemini] Diagnostics failed:', diagErr.message);
      }
      throw lastError;
    }

    const response = await result.response;
    let text = response.text();
    
    try {
      // More robust JSON extraction: find first '{' and last '}'
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1) {
        console.error('[Gemini] No JSON found in response. Raw text:', text);
        return NextResponse.json({ error: 'AI did not return valid JSON. Please try again.' }, { status: 500 });
      }

      const jsonStr = text.substring(firstBrace, lastBrace + 1);
      const parsedResult = JSON.parse(jsonStr);
      return NextResponse.json(parsedResult);
    } catch (parseError: any) {
      console.error('[Gemini] JSON Parse Error:', parseError.message);
      console.error('[Gemini] Problematic JSON string:', text);
      return NextResponse.json({ error: 'AI output format error. Please try again.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API Error:', error);
    let errorMsg = error.message || 'An error occurred during analysis.';
    if (errorMsg.includes('API key not valid') || errorMsg.includes('400')) {
      errorMsg = 'Invalid Gemini API key. Please check your .env file.';
    } else if (errorMsg.includes('404')) {
      errorMsg = 'Gemini model not found. Ensure you are using a Gemini API key from Google AI Studio.';
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
