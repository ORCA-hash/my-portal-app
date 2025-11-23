import { GoogleGenAI } from "@google/genai";
import { ReportMetric } from '../types';

export const analyzeReportData = async (data: ReportMetric[]) => {
  if (!process.env.API_KEY) {
    console.warn("API Key not found. Returning mock insight.");
    return "API Key missing. Unable to generate AI insights. Please ensure process.env.API_KEY is set.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Format data for the prompt
  const dataSummary = data.slice(0, 30).map(d => 
    `Date: ${d.date}, Spend: $${d.spend}, Impr: ${d.impressions}, Clicks: ${d.clicks}, Conv: ${d.conversions}`
  ).join('\n');

  const prompt = `
    You are a senior marketing analyst. Analyze the following advertising performance data:
    
    ${dataSummary}
    
    Calculate key aggregate metrics like total spend, average CPC, CPA, and ROAS (assume revenue is 3x spend for this exercise if not provided, or just focus on CPA).
    Identify trends (is performance improving or declining?).
    Provide 3 actionable recommendations for optimization.
    Keep it professional, concise, and addressed to the client.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while generating insights. Please try again later.";
  }
};
