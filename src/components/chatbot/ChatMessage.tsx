"use client"

import type { FC } from "react"

type ChatMessageProps = {
  sender: "user" | "bot"
  text: string
}

export const ChatMessageBubble: FC<ChatMessageProps> = ({ sender, text }) => {
  const isUser = sender === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`px-3 py-2 rounded-lg max-w-[80%] text-sm ${
          isUser
            ? "bg-purple-600 text-white"
            : "bg-gray-200 text-gray-900"
        }`}
      >
        {text}
      </div>
    </div>
  )
}
