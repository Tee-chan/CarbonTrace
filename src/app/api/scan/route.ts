import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';
import { google } from 'googleapis';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const AI_MODEL = 'gemini-2.5-flash';

const scanSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    total_co2: { type: SchemaType.NUMBER, description: "Total footprint of all parsed activities in kg CO2." },
    ai_nudge: { type: SchemaType.STRING, description: "An actionable, specific, encouraging insight based exactly on the parsed footprint." },
    breakdown: {
      type: SchemaType.OBJECT,
      properties: {
        Travel: { type: SchemaType.NUMBER },
        Food: { type: SchemaType.NUMBER },
        Shopping: { type: SchemaType.NUMBER },
      },
    },
    receipts: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: "Unique UUID" },
          activity: { type: SchemaType.STRING, description: "Specific name of the activity, e.g. 'Uber Ride to SFO'" },
          category: { type: SchemaType.STRING, description: "One of: Travel, Food, Shopping" },
          co2_kg: { type: SchemaType.NUMBER, description: "Estimated kg of CO2" },
          confidence: { type: SchemaType.NUMBER, description: "Decimal from 0.0 to 1.0 showing AI confidence" },
          spend_amount: { type: SchemaType.STRING, description: "The original transaction cost exactly as found in text, e.g. '$14.99' or '£102'" },
          receipt_date: { type: SchemaType.STRING, description: "Chronological date of the receipt, e.g. 'April 14, 2026' or 'Not Found'" },
          date: { type: SchemaType.STRING, description: "Legacy date key (leave empty)" },
        },
      },
    },
  },
  required: ["total_co2", "breakdown", "receipts", "ai_nudge"],
};

export async function POST() {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const googleTokens = undefined; 
    let rawInboxText = '';

    if (googleTokens) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.AUTH0_CLIENT_ID || '',
        process.env.AUTH0_CLIENT_SECRET || ''
      );
      oauth2Client.setCredentials({ access_token: googleTokens as string });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 10,
        q: 'subject:receipt OR subject:order OR subject:flight OR subject:booking'
      });

      const messages = response.data.messages || [];
      const emailContents = [];

      for (const msg of messages) {
        if (msg.id) {
          const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id });
          emailContents.push(detail.data.snippet || '');
        }
      }

      rawInboxText = emailContents.join('\n\n');
    } else {
      rawInboxText = `
        User: ${session.user.name || session.user.email}
        Recent Activities to simulate based on typical Earth Day hacking profiles: 
        Generate 3 to 5 realistic email receipts that this user might have received in the last 7 days. Include 1 flight or ride, 1 food order, and 1 shopping purchase. CRITICAL: Every single receipt must include a realistic financial cost string (e.g. "Total: $34.50" or "$450.00") so the parsing schema securely captures 'spend_amount'.
      `;
    }

    const model = genAI.getGenerativeModel({
      model: AI_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: scanSchema,
        temperature: 0.7,
      },
      systemInstruction: "You are the CarbonTrace AI agent. Extract activities from the user's inbox text, estimate realistic kg CO2 values for each, and sum them. Return strictly following the output schema.",
    });

    const prompt = `Analyze the following user inbox data and calculate the carbon footprint:\n${rawInboxText}`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const payload = JSON.parse(text);

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('mock')) {
      const dbRows = payload.receipts.map((receipt: any) => ({
        user_email: session.user.email,
        activity: receipt.activity,
        category: receipt.category,
        co2_kg: receipt.co2_kg,
        confidence: receipt.confidence.toString(),
        spend_amount: receipt.spend_amount || null,
        receipt_date: receipt.receipt_date || null,
      }));

      const { error: dbError } = await supabase.from('carbon_logs').insert(dbRows);
      
      if (dbError) {
        console.error("Supabase Error during insert:", dbError);
        throw new Error(`Supabase RLS Error: ${dbError.message}`);
      }
    }

    return NextResponse.json(payload, { status: 200 });

  } catch (error: any) {
    console.error("Scanning Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

