'use client'

import { askFaqAction } from '@/app/actions'
import { useState } from 'react'
import { ChatInput } from './ChatInput'
import { ChatMessageBubble } from './ChatMessage'

type LocalMessage = {
	id: string
	sender: 'user' | 'bot'
	text: string
}

export function Chatbot() {
	const [messages, setMessages] = useState<LocalMessage[]>([])
	const [loading, setLoading] = useState(false)

	async function handleSend(text: string) {
		const userMsg: LocalMessage = {
			id: crypto.randomUUID(),
			sender: 'user',
			text,
		}
		setMessages(prev => [...prev, userMsg])
		setLoading(true)

		const res = await askFaqAction({ message: text })
		setLoading(false)

		const botMsg: LocalMessage = {
			id: crypto.randomUUID(),
			sender: 'bot',
			text: res?.data?.answer || 'Error: No response',
		}

		setMessages(prev => [...prev, botMsg])
	}

	return (
		<div className='w-full max-w-md border rounded p-4 bg-white shadow-lg'>
			<div className='h-64 overflow-y-auto border-b mb-3 pb-3'>
				{messages.map(m => (
					<ChatMessageBubble key={m.id} sender={m.sender} text={m.text} />
				))}
				{loading && <div className='text-xs text-gray-500 mt-2'>Tænker…</div>}
			</div>
			<ChatInput onSend={handleSend} />
		</div>
	)
}
