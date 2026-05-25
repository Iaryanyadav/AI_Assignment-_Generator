import Groq from 'groq-sdk';
import { IAssignment, IGeneratedPaper } from '../models/Assignment';

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

function buildPrompt(assignment: IAssignment): string {
  const questionBreakdown = assignment.questionTypes
    .map(
      (qt) =>
        `- ${qt.count} ${qt.type} question(s), each worth ${qt.marks} mark(s)`
    )
    .join('\n');

  const totalQuestions = assignment.questionTypes.reduce((sum, qt) => sum + qt.count, 0);
  const totalMarks = assignment.questionTypes.reduce((sum, qt) => sum + qt.count * qt.marks, 0);

  const fileContext = assignment.uploadedFileContent
    ? `\n\nReference Material (use this to generate contextually relevant questions):\n${assignment.uploadedFileContent.slice(0, 3000)}`
    : '';

  return `You are an expert educational assessment creator. Generate a structured question paper based on the following details.

Subject: ${assignment.subject}
Class: ${assignment.className}
Total Questions: ${totalQuestions}
Total Marks: ${totalMarks}
Question Breakdown:
${questionBreakdown}
${assignment.additionalInstructions ? `\nAdditional Instructions: ${assignment.additionalInstructions}` : ''}${fileContext}

Generate a complete question paper in valid JSON format. The JSON must follow this EXACT structure with no deviation:

{
  "schoolName": "Delhi Public School, Sector-4, Bokaro",
  "subject": "${assignment.subject}",
  "className": "${assignment.className}",
  "timeAllowed": "calculated based on total marks (roughly 1 min per mark)",
  "maxMarks": ${totalMarks},
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries X marks.",
      "questions": [
        {
          "text": "Question text here?",
          "difficulty": "easy",
          "marks": 1,
          "section": "A",
          "answerKey": "Brief answer for teacher reference"
        }
      ]
    }
  ]
}

Rules:
1. Group questions by type into sections (Section A = Multiple Choice, Section B = Short Answer, etc.)
2. Difficulty must be exactly one of: "easy", "moderate", "hard" — distribute evenly
3. Question texts must be academically rigorous and specific to the subject
4. Include an answerKey for every question
5. Marks per question must match the breakdown provided
6. Return ONLY valid JSON, no markdown, no explanation text
7. Make questions curriculum-appropriate for class ${assignment.className}`;
}

function parseJsonResponse(raw: string): IGeneratedPaper {
  let jsonText = raw.trim();
  jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');

  let parsed: IGeneratedPaper;
  try {
    parsed = JSON.parse(jsonText) as IGeneratedPaper;
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${jsonText.slice(0, 200)}`);
  }

  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('Invalid paper structure: missing sections');
  }

  return parsed;
}

export async function generateQuestionPaper(
  assignment: IAssignment
): Promise<IGeneratedPaper> {
  const prompt = buildPrompt(assignment);

  const completion = await client.chat.completions.create({
    model: GROQ_MODEL,
    max_tokens: 8000,
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You output only valid JSON matching the requested question paper schema. No markdown or extra text.',
      },
      { role: 'user', content: prompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error('Empty response from Groq');
  }

  return parseJsonResponse(raw);
}
