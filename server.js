import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GoogleGenAI, ThinkingLevel } from '@google/genai'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

// Remember recent dares so Gemma doesn't keep repeating them
const recentDares = []

const challengeStyles = [
  'physical movement',
  'funny acting',
  'voice or accent',
  'creative storytelling',
  'imagination',
  'social interaction',
  'silly performance',
  'observation',
  'mini competition',
  'word game',
  'improvisation',
  'harmless embarrassment',
  'creative use of an everyday object',
  'funny roleplay',
  'quick challenge',
]

app.get('/api/health', (req, res) => {
  res.json({
    status: 'DareUp server is running!',
  })
})

app.post('/api/dare', async (req, res) => {
  const { mood } = req.body

  try {
    const selectedMood = mood || 'Funny'

    const style =
      challengeStyles[Math.floor(Math.random() * challengeStyles.length)]

    const previousDares =
      recentDares.length > 0
        ? recentDares
            .slice(-15)
            .map((dare, index) => `${index + 1}. ${dare}`)
            .join('\n')
        : 'None yet.'

    const response = await ai.models.generateContent({
      model: 'gemma-4-26b-a4b-it',

      contents: `
Create ONE completely new ${selectedMood} Truth or Dare challenge.

Preferred style: ${style}

RECENT DARES THAT MUST NOT BE REPEATED:
${previousDares}

IMPORTANT:
- The new dare must be genuinely different from every recent dare.
- Do NOT paraphrase, rewrite, shorten, or slightly modify a recent dare.
- Do NOT reuse the same main action as a recent dare.
- Choose a different idea, action, or situation.
- Make it creative and unexpected.
- Keep it safe, playful, consensual, and suitable for friends.
- Keep it very short, like a game-card dare.
- Use 5-15 words.
- Start directly with the action.
- Do not add introductions or explanations.
- Return ONLY the dare.
- Do not explain anything.
`,

      config: {
        systemInstruction:
          'You are DareUp, an AI Truth or Dare generator. Every response must be one original challenge. Never repeat or paraphrase a previous challenge. Prefer completely different actions and situations.',

        maxOutputTokens: 60,

        temperature: 1.0,
        topP: 0.95,

        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL,
        },
      },
    })

    const dare = response.text?.trim()

    if (!dare) {
      throw new Error('Gemma returned no text')
    }

    // Store the new dare
    recentDares.push(dare)

    // Keep only the latest 15
    if (recentDares.length > 15) {
      recentDares.shift()
    }

    res.json({
      dare,
    })
  } catch (error) {
    console.error('AI error:', error)

    res.status(500).json({
      error: 'Could not generate an AI dare.',
    })
  }
})

const PORT = 3001

app.listen(PORT, () => {
  console.log(`DareUp server running at http://localhost:${PORT}`)
})