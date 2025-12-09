"use client"

import { useState } from "react"

export function ChatInput({ onSend }: { onSend: (msg: string) => void }) {
  const [value, setValue] = useState("")

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue("")
  }

  return (
    <div className="flex gap-2 mt-2">
      <input
        className="flex-1 border rounded px-2 py-1 text-sm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Skriv et spørgsmål..."
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />
      <button
        className="bg-purple-600 text-white px-3 py-1 rounded text-sm"
        onClick={handleSend}
      >
        Send
      </button>
    </div>
  )
}
