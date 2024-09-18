'use client'

import React, { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, User, Image as ImageIcon, Zap, Camera } from "lucide-react"
import Image from 'next/image'
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { z } from 'zod'
import { sendMessageToGemini } from '@/app/actions'
import { base64_to_imageUrl } from '@/app/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  image?: string
}

export default function WebcamAiChat() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [imageData, setImageData] = useState<string | null>(null)
  const [peopleCount, setPeopleCount] = useState(0)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const newSocket = io('http://localhost:5000')
    setSocket(newSocket)

    newSocket.on('image_data', (data: { image: string; people_count: number }) => {
      setImageData(data.image)
      setPeopleCount(data.people_count)
    })

    return () => {
      newSocket.disconnect()
    }
  }, [])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])


  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return

    const userMessage: Message = { role: 'user', content: inputMessage }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')

    const param: [{ type: 'text'; text: string }, { type: 'image'; image: string }] = [
      { type: 'text', text: inputMessage },
      { type: 'image', image: base64_to_imageUrl(imageData) || '' }
    ]
    const aiResponse = await sendMessageToGemini(param, messages) as Message
    setMessages(prev => [...prev, aiResponse])
  }

  return (
    <div className="flex flex-wrap h-screen bg-background p-5">
      <div className="w-1/2 pr-2 flex flex-col">
        <Card className="flex-grow flex flex-col overflow-hidden  ">
          <div className="p-4 bg-gradient-to-r from-ring to-primary text-foreground flex items-center justify-between">
            <h2 className="text-2xl font-bold">Live Feed</h2>
            <Camera className="h-6 w-6" />
          </div>
          <div className="flex-grow flex items-center justify-center bg-black relative">
            {imageData ? (
              <Image
                src={`data:image/jpeg;base64,${imageData}`}
                alt="Processed quantum vision feed"
                className="max-w-full max-h-full object-contain"
                fill
              />
            ) : (
              <div className="text-foreground flex flex-col items-center">
                <Zap className="h-16 w-16 mb-4 animate-pulse text-muted-foreground" />
                <p className="text-transparent bg-clip-text bg-gradient-to-r from-ring to-primary">
                  Initializing vision...
                </p>
              </div>
            )}
          </div>
          <div className="p-4 bg-gradient-to-r from-ring to-primary text-foreground flex justify-between items-center">
            <p className="text-lg font-semibold">People detected: {peopleCount}</p>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-400 mr-2 animate-pulse"></div>
              <span>Live</span>
            </div>
          </div>
        </Card>
      </div>
      <div className="w-1/2 pl-2 flex flex-col">
        <Card className="flex-grow flex flex-col overflow-hidden bg-gradient-to-b from-gray-800 to-gray-900  ">
          <div className="p-4 bg-gradient-to-r from-ring to-primary text-foreground flex items-center justify-between">
            <h2 className="text-2xl font-bold">AI Chat</h2>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-400 mr-2 animate-ping"></div>
              <span>AI Active</span>
            </div>
          </div>
          <ScrollArea className="flex-grow p-4" ref={chatRef}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`p-3 rounded-lg max-w-[80%] ${message.role === 'user'
                    ? 'bg-gradient-to-r from-ring to-primary text-foreground'
                    : 'bg-gradient-to-r from-gray-700 to-gray-800 text-blue-100 border border-blue-400'
                    }`}
                >
                  <div className="flex items-center mb-1">
                    {message.role === 'assistant' && <User className="w-4 h-4 mr-2" />}
                    <span className="font-semibold">{message.role === 'user' ? 'You' : 'AI'}</span>
                  </div>
                  <p className='break-words m-2'>{message.content}</p>
                  {message.image && (
                    <div className="mt-2">
                      <Image src={message.image} alt="Generated image" width={300} height={200} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </ScrollArea>
          <div className="p-4 border-t ">
            <div className="flex space-x-2">
              <Input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Transmit your message..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-grow bg-gradient-to-r from-gray-700 to-gray-800 text-blue-100  placeholder-foretext-foreground"
              />
              <Button
                onClick={handleSendMessage}
                disabled={socket === null || inputMessage.length === 0}
                className="bg-gradient-to-r from-primary to-secondary text-foreground"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Transmit message</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}