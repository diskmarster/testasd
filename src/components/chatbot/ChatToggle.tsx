"use client"

import { useState } from "react"
import { Chatbot } from "./Chatbot"

export function ChatToggle() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-4 right-4 bg-purple-700 text-white px-4 py-2 rounded-full shadow-xl text-sm"
      >
        FAQ
      </button>

      {open && (
        <div className="fixed bottom-20 right-4">
          <Chatbot />
        </div>
      )}
    </>
  )
}
