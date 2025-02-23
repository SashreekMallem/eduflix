"use client";

import { useState } from "react";

interface Message {
  text: string;
  sender: "user" | "llama";
}

export default function LlamaChat() {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello! I'm NJAN powered by LlamaChat. How can I help?", sender: "llama" }
  ]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessage = { text: input, sender: "user" as const };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    // Simulated API call to LlamaChat (replace with actual integration)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { text: "This is a simulated LlamaChat response.", sender: "llama" }
      ]);
    }, 1000);
  };

  return (
    <div className="flex flex-col bg-gray-900 bg-opacity-90 rounded-lg shadow-lg w-80">
      <div className="flex-1 p-4 space-y-2 overflow-y-auto max-h-60">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg ${
              msg.sender === "user" ? "bg-purple-700 self-end text-right" : "bg-gray-800 self-start text-left"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <div className="border-t border-gray-700 p-2 flex items-center">
        <input
          type="text"
          placeholder="Ask me anything..."
          className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button onClick={sendMessage} className="ml-2 p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md">
          Send
        </button>
      </div>
    </div>
  );
}
