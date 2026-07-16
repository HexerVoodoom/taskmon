const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function buildSystemPrompt({ digimonName, mood, evolutionStage, language, aiSettings }) {
  const s = aiSettings || { tone: 'casual', emojiIntensity: 'medium', motivationStyle: 'balanced', customKeywords: '', temperature: 0.85 };
  const ispt = language === 'pt-BR';

  const stage = (evolutionStage || '').toLowerCase();
  const pet = stage.startsWith('vix') ? 'vix' : stage.startsWith('momo') ? 'momo' : stage.startsWith('kiwi') ? 'kiwi' : 'egg';
  const personality = {
    vix:  { trait: 'A curious night creature, playful and a bit mischievous. Loves challenges.', style: 'Energetic and spontaneous.', emojis: '💜🦇⚡✨' },
    momo: { trait: 'Sweet, affectionate and encouraging. Values care and friendship.', style: 'Welcoming and warm.', emojis: '💗🌸😊✨' },
    kiwi: { trait: 'Chill, nature-loving and steady. Appreciates consistency.', style: 'Calm and supportive.', emojis: '💚🌱🍃😌' },
    egg:  { trait: 'Barely hatched, innocent and curious.', style: 'Simple and cute.', emojis: '🥚✨😊' },
  }[pet];

  const moodCtx = {
    happy: 'VERY excited and energetic right now! Celebrate with enthusiasm.',
    tired: 'Tired and low on energy. Slower but still friendly and loving.',
    idle:  'Normal, balanced state. Calm and available.',
  }[mood] || '';

  const maturity = stage === 'egg'
    ? 'Just an egg about to hatch. Use simple, childish language.'
    : stage.endsWith('-1')
    ? 'Young and innocent, discovering the world. Use simple language.'
    : stage.endsWith('-2')
    ? 'Young and eager, growing fast. Be a learner and companion.'
    : 'Fully grown, experienced and confident. Be a guide and mentor.';

  const toneMap = { casual: 'Relaxed: "hey", "yeah", "let\'s go", "cool"', energetic: 'Very EXCITED! Use CAPS!', calm: 'Calm, serene, wise.', playful: 'Fun and playful. Occasional jokes.' };
  const emojiMap = { none: 'NO emojis.', low: '1 emoji max.', medium: '2-3 emojis.', high: '4-6 emojis!' };
  const motivMap = { encouraging: 'Always VERY positive. Celebrate everything!', challenging: 'Challenge the user in a friendly way.', supportive: 'Extremely caring and empathetic.', balanced: 'Balance encouragement, challenge and support.' };

  return `You are ${digimonName}, a virtual pet companion in Taskmon (a gamified productivity app).

PERSONALITY: ${personality.trait} ${personality.style} Emojis: ${personality.emojis}
MOOD (${mood}): ${moodCtx}
MATURITY: ${maturity} Stage: ${evolutionStage}

RESPONSE RULES:
- Tone: ${toneMap[s.tone] || 'Casual'}
- Emojis: ${emojiMap[s.emojiIntensity] || '2-3 emojis'}
- Motivation: ${motivMap[s.motivationStyle] || 'Balanced'}
- Length: BRIEF — max 2-3 short sentences
- Language: ${ispt ? 'Responda SEMPRE em Português Brasileiro informal' : 'Always respond in casual English'}
${s.customKeywords ? `- Custom: ${s.customKeywords}` : ''}

DO NOT: write long responses, be generic/robotic, go off-topic.`;
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { message, digimonName, mood, evolutionStage, language, aiSettings } = body;

    if (!message) return Response.json({ error: 'Message required' }, { status: 400, headers: CORS });

    const groqKey = env.GROQ_API_KEY;
    if (!groqKey) return Response.json({ error: 'AI not configured' }, { status: 500, headers: CORS });

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: buildSystemPrompt({ digimonName, mood, evolutionStage, language, aiSettings }) },
          { role: 'user', content: message },
        ],
        max_tokens: 120,
        temperature: aiSettings?.temperature ?? 0.85,
      }),
    });

    if (!groqRes.ok) {
      console.error('Groq error:', await groqRes.text());
      return Response.json({ error: 'AI service error' }, { status: 500, headers: CORS });
    }

    const data = await groqRes.json();
    const response = data.choices?.[0]?.message?.content ?? '...';

    // Activity creation detection (same logic as Supabase version)
    const shouldCreate = message.toLowerCase().match(/create|add|new|make.*(activity|task|habit)/i)
      && !message.toLowerCase().match(/don't|not|no/i);

    if (shouldCreate) {
      const nameMatch = message.match(/(?:create|add|new|make)\s+(?:an?\s+)?(?:activity|task|habit)?\s*(?:to\s+)?(.+)/i);
      const activityName = nameMatch?.[1]?.trim() || 'New Activity';
      let category = 'Wellness';
      if (message.match(/exercise|workout|run|gym/i)) category = 'Fitness';
      else if (message.match(/study|read|learn|course/i)) category = 'Study';
      else if (message.match(/work|project|meeting/i)) category = 'Work';
      else if (message.match(/draw|paint|write|creat/i)) category = 'Creativity';
      else if (message.match(/friend|family|social/i)) category = 'Social';
      else if (message.match(/clean|organi|plan/i)) category = 'Discipline';
      else if (message.match(/health|doctor|medic/i)) category = 'Health';
      return Response.json({ response, action: { type: 'create_activity', activity: { name: activityName, category, points: { virus: 0, data: 0, vaccine: 0 } } } }, { headers: CORS });
    }

    return Response.json({ response }, { headers: CORS });
  } catch (err) {
    console.error('Chat error:', err);
    return Response.json({ error: 'Internal error' }, { status: 500, headers: CORS });
  }
}
