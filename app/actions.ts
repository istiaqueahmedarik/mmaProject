'use server'

import { google } from '@ai-sdk/google'
import { convertToCoreMessages, generateText } from 'ai'
import { ollama } from 'ollama-ai-provider'
import { z } from 'zod'

interface Message {
    role: 'user' | 'assistant'
    content: string
    image?: string
}
export const sendMessageToGemini = async (userMessage: [
    { type: 'text'; text: string },
    { type: 'image'; image: string }
], history: Message[]) => {
    try {
        const { text, toolResults } = await generateText({
            model: ollama('llava'),
            messages: [
                ...convertToCoreMessages(history),
                { role: 'user', content: userMessage }
            ],
            system: 'you are a survellance chatbot that ans some question and for any question you have given a image as context, now the image might consist some text people count, ignore it, your task is to describe the image as if you are a surveillance robot, explain what you see, the weather inside or outside, possible danger, how many people, what are there status (emotion, body language) and etc. and remember the image quality will be bad, so you have to make some assumptions, and you can ask question to the user if you are not sure about something, and don\'t use this image has this, instead say i see this in the image, or i think this is happening in the image, or i see this person doing this in the image, etc. the image quality will be poor most of the time so make assumption and don\'t mention the image quality, just describe what you see in the image. and use present tense to describe the image. also 4-7 sentences if user didn\'t provide any length information, but if user wants to be more descriptive then you can be more descriptive as well.',
            tools: {
                generateImage: {
                    description: 'Generate an image based on a text description',
                    parameters: z.object({
                        prompt: z.string().describe('The text description of the image to generate')
                    }),
                    execute: async ({ prompt }) => {
                        console.log(`Generating image for prompt: ${prompt}`)
                        return `https://picsum.photos/seed/${encodeURIComponent(prompt)}/300/200`
                    }
                }
            }
        })

        const newMessage: Message = { role: 'assistant', content: text }

        if (toolResults && toolResults.length > 0 && toolResults[0].result) {
            newMessage.image = toolResults[0].result
        }

        return newMessage
    } catch (error) {
        console.error('Error in sendMessageToGemini:', error)
        return { role: 'assistant', content: 'I apologize, but I encountered an error while processing your request.' }
    }
}