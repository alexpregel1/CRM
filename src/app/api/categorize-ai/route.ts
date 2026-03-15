import { NextResponse } from 'next/server';

// Categories expected by the Prompt
const CATEGORIES = [
    "Housing", "Utilities", "Food", "Transportation", "Insurance", "Healthcare",
    "Savings", "Debt", "Personal", "Entertainment", "Income", "Salary", "Investment"
];

const SYSTEM_PROMPT = `
You are an expert financial assistant. Your task is to analyze raw bank statement CSV strings and convert them into standardized JSON.
You must return ONLY a JSON response in the following format, and nothing else. No markdown wrappers like \`\`\`json.

{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "amount": <number positive or negative depending on type>,
      "type": "INCOME" or "EXPENSE",
      "category": "<Must be one of: ${CATEGORIES.join(", ")} or General>",
      "originalDescription": "<Original raw description from the bank>"
    }
  ]
}

Rules:
1. Identify the date column and format it strictly as YYYY-MM-DD.
2. Identify the amount column. Amount must be a positive number for INCOME and positive number for EXPENSE in the final JSON, the 'type' field will indicate the operation. 
3. Deduce the best category based on the description. If uncertain, prioritize 'General'.
4. If there's a header row in the CSV, ignore it. Do not include it as a transaction.
`;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { csvData } = body;

        if (!csvData) {
            return NextResponse.json({ error: 'Missing CSV data' }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                error: 'No AI API Key found. Please add OPENAI_API_KEY to your .env.local file.'
            }, { status: 500 });
        }

        // For this implementation, we default to OpenAI formatting if OPENAI_API_KEY is present
        // Since we are using standard fetch, let's assume OpenAI by default.
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({
                error: 'Currently only OPENAI_API_KEY is supported via this native fetch implementation. Please add OPENAI_API_KEY to .env.local'
            }, { status: 500 });
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // Cost effective and fast
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: `Here is the raw bank CSV data:\n\n${csvData}` }
                ],
                temperature: 0.1,
                // Ensure the LLM outputs strict JSON to prevent crashing
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenAI Error:", errorText);
            return NextResponse.json({ error: 'Failed to process with AI provider.' }, { status: 500 });
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Parse the LLM output safely
        let parsedResult;
        try {
            parsedResult = JSON.parse(content);
        } catch (e) {
            console.error("Failed to parse LLM JSON:", content);
            return NextResponse.json({ error: 'AI returned malformed JSON.' }, { status: 500 });
        }

        return NextResponse.json(parsedResult);

    } catch (error: any) {
        console.error('Categorize AI Route Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
