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
          id: { type: SchemaType.STRING },
          activity: { type: SchemaType.STRING },
          category: { type: SchemaType.STRING },
          co2_kg: { type: SchemaType.NUMBER },
          confidence: { type: SchemaType.NUMBER },
          spend_amount: { type: SchemaType.STRING },
          receipt_date: { type: SchemaType.STRING },
        },
      },
    },
  },
  required: ["total_co2", "breakdown", "receipts", "ai_nudge"],
};

interface Receipt {
  activity: string;
  category: string;
  co2_kg: number;
  confidence: number;
  spend_amount?: string;
  receipt_date?: string;
  id?: string;
}

export async function POST() {
  try {
    const session = await auth0.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const googleTokens = session.accessToken;
    let rawInboxText = '';

    if (googleTokens) {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: googleTokens as string });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 10,
        q: 'subject:(receipt OR order OR flight OR booking OR "ticket")'
      });

      const messages = response.data.messages || [];
      const emailContents = [];

      for (const msg of messages) {
        if (msg.id) {
          const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' });
          const parts = detail.data.payload?.parts || [];
          let body = detail.data.snippet || '';

          const textPart = parts.find(p => p.mimeType === 'text/plain');
          if (textPart?.body?.data) {
             body = Buffer.from(textPart.body.data, 'base64').toString();
          }

          emailContents.push(`--- EMAIL START ---\n${body}\n--- EMAIL END ---`);
        }
      }
      rawInboxText = emailContents.join('\n\n');
    }

    if (!rawInboxText || rawInboxText.trim() === '') {
      return NextResponse.json({ 
        total_co2: 0,
        ai_nudge: "No recent receipts found. Once you travel or shop, your CarbonTrace will update!",
        breakdown: { Travel: 0, Food: 0, Shopping: 0 },
        receipts: []
      }, { status: 200 });
    }

    const model = genAI.getGenerativeModel({
      model: AI_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: scanSchema,
        temperature: 0.1,
      },
      systemInstruction: "You are CarbonTrace AI. Extract purchase data from emails. Calculate kg CO2 based on merchant and items. For Lagos/Nigerian merchants, assume 0.4kg CO2 per kWh. Return valid JSON.",
    });

    const result = await model.generateContent(rawInboxText);
    const payload = JSON.parse(result.response.text());

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('mock')) {
      const dbRows = payload.receipts.map((receipt: Receipt) => ({
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
        console.error("Supabase Error:", dbError);
      }
    }

    return NextResponse.json(payload, { status: 200 });

  } catch (error: any) {
    console.error("Scanning Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}