import { NextResponse } from 'next/server'
import { aiPlanSchema, buildFallbackAiPlan, normalizeAiPlan, type AiPlannerRequest } from '../../../utils/aiPlanner'

export async function POST(request: Request) {
  const body = await request.json() as AiPlannerRequest
  if (!body.destination?.trim()) {
    return NextResponse.json({ error: 'destination is required' }, { status: 400 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(normalizeAiPlan(buildFallbackAiPlan(body), body))
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        input: [
          {
            role: 'system',
            content: 'You are a Taiwan-friendly travel itinerary planner. Return only realistic, editable itinerary JSON matching the schema. Include meal/rest stops, practical stay durations, and concise reasoning in Traditional Chinese.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              destination: body.destination,
              daysCount: body.daysCount,
              style: body.style,
              budget: body.budget,
              startDate: body.startDate,
              accommodation: body.accommodation,
              notes: body.notes,
              mode: body.mode,
              currentDays: body.currentDays?.map(day => ({
                title: day.title,
                date: day.date,
                startTime: day.startTime,
                items: day.items.map(item => ({ name: item.name, address: item.address, notes: item.notes, stayDuration: item.stayDuration })),
              })),
            }),
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'travel_plan',
            schema: aiPlanSchema,
          },
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText || 'AI request failed' }, { status: 502 })
    }

    const data = await response.json()
    const outputText = data.output_text || data.output?.flatMap((entry: any) => entry.content || []).find((content: any) => content.type === 'output_text')?.text
    const parsed = outputText ? JSON.parse(outputText) : buildFallbackAiPlan(body)
    return NextResponse.json(normalizeAiPlan(parsed, body))
  } catch (error) {
    return NextResponse.json(normalizeAiPlan(buildFallbackAiPlan(body), body), { status: 200 })
  }
}
