"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "bot" | "user";
  content: string;
  timestamp: Date;
  quickReplies?: string[];
}

export interface ChatWidgetProps {
  /** Agent display name */
  agentName?: string;
  /** Agent title/subtitle shown in header */
  agentTitle?: string;
  /** URL to agent avatar image */
  agentAvatar?: string;
  /** Initial greeting message */
  greeting?: string;
  /** Quick reply suggestions shown after greeting */
  quickReplies?: string[];
  /** Brand color for accents (hex) */
  brandColor?: string;
  /** Position on screen */
  position?: "bottom-right" | "bottom-left";
  /** API endpoint for chat messages */
  apiEndpoint?: string;
  /** Whether to show the widget (for conditional rendering) */
  show?: boolean;
  /** Override locale for time formatting */
  locale?: string;
}

// ─── State ────────────────────────────────────────────────────

type WidgetState = "closed" | "open" | "minimized";

// ─── Component ────────────────────────────────────────────────

export function ChatWidget({
  agentName = "Gisele",
  agentTitle = "PLEIJ Salon · Online",
  agentAvatar = "/assets/chat-widget/gisele-avatar.webp",
  greeting = "Hi! I'm Gisele, your digital stylist at PLEIJ. How can I help you today?",
  quickReplies = ["Book appointment", "Hours & location", "Pricing", "Services"],
  brandColor = "#3b82f6",
  position = "bottom-right",
  apiEndpoint = "/api/v1/chat",
  show = true,
  locale = "en-US",
}: ChatWidgetProps) {
  const [state, setState] = React.useState<WidgetState>("closed");
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const [hasGreeted, setHasGreeted] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when widget opens
  React.useEffect(() => {
    if (state === "open") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [state]);

  // Send greeting on first open
  const sendGreeting = React.useCallback(() => {
    if (hasGreeted) return;
    setHasGreeted(true);
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "bot",
        content: greeting,
        timestamp: new Date(),
        quickReplies,
      },
    ]);
  }, [greeting, quickReplies, hasGreeted]);

  const handleOpen = () => {
    setState("open");
    sendGreeting();
  };

  const handleClose = () => {
    setState("closed");
  };

  const handleMinimize = () => {
    setState("minimized");
  };

  const addBotMessage = React.useCallback(
    (content: string, replies?: string[]) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "bot",
          content,
          timestamp: new Date(),
          quickReplies: replies,
        },
      ]);
      setIsTyping(false);
    },
    []
  );

  const sendMessage = React.useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      try {
        const res = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            brand_id: "pleij",
            context: "salon_chat",
          }),
        });

        if (!res.ok) throw new Error(`Chat API error: ${res.status}`);

        const data = await res.json();
        addBotMessage(
          data.response || data.message || "I'm not sure about that. Let me connect you with our team.",
          data.quickReplies
        );
      } catch {
        // Fallback: local keyword matching
        const lower = text.toLowerCase();
        if (/hour|open|close|time/.test(lower)) {
          addBotMessage(
            "PLEIJ is open Tuesday–Saturday 9AM–7PM, and Sunday 10AM–5PM. We're closed Mondays. Want me to book you an appointment?",
            ["Book appointment", "Directions"]
          );
        } else if (/book|appointment|schedule|reserve/.test(lower)) {
          addBotMessage(
            "I'd love to help you book! You can book online at pleijsalon.com/book or call us at (614) 665-1751. What service are you looking for?",
            ["Haircut", "Color", "Styling", "All services"]
          );
        } else if (/price|cost|how much|pricing/.test(lower)) {
          addBotMessage(
            "Our prices vary by stylist and service. Haircuts start at $45, color services from $85. Want me to show you the full menu?",
            ["Show services", "Book appointment"]
          );
        } else if (/service|menu|offer|haircut|color|style/.test(lower)) {
          addBotMessage(
            "We offer haircuts, color, highlights, balayage, styling, treatments, and more! Each of our 10 stylists specializes in different areas. What are you most interested in?",
            ["Haircuts", "Color & highlights", "Styling", "Full service menu"]
          );
        } else if (/location|address|directions|where/.test(lower)) {
          addBotMessage(
            "We're at 6800 N High St, Columbus, OH 43214. Free parking available! Need directions?",
            ["Get directions", "Book appointment"]
          );
        } else if (/thank|bye|goodbye/.test(lower)) {
          addBotMessage("You're welcome! Feel free to reach out anytime. Have a beautiful day! 💇‍♀️");
        } else {
          addBotMessage(
            "That's a great question! Let me connect you with our team for the best answer. You can also call us at (614) 665-1751. Is there anything else I can help with?",
            ["Book appointment", "Hours & location", "Services"]
          );
        }
      }
    },
    [apiEndpoint, addBotMessage]
  );

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!show) return null;

  const unreadCount = state === "minimized" ? messages.filter((m) => m.role === "bot").length : 0;

  return (
    <>
      {/* ── Launcher Bubble (closed state) ── */}
      {(state === "closed" || state === "minimized") && (
        <button
          onClick={handleOpen}
          className={cn(
            "fixed z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg",
            "transition-all duration-300 hover:scale-110 hover:shadow-xl",
            "group cursor-pointer border-2 border-white/20",
            position === "bottom-right" ? "bottom-6 right-6" : "bottom-6 left-6"
          )}
          style={{ backgroundColor: brandColor }}
          aria-label={`Chat with ${agentName}`}
        >
          {/* Gisele avatar in the bubble */}
          <div className="relative w-10 h-10 rounded-full overflow-hidden">
            <img
              src={agentAvatar}
              alt={agentName}
              className="w-full h-full object-cover"
              style={{ filter: "grayscale(100%) contrast(1.1)" }}
            />
          </div>

          {/* Pulse ring animation */}
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ backgroundColor: brandColor }}
          />

          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}

          {/* Hover tooltip */}
          <span
            className={cn(
              "absolute whitespace-nowrap bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none",
              position === "bottom-right" ? "right-16" : "left-16"
            )}
          >
            Chat with {agentName}
          </span>
        </button>
      )}

      {/* ── Chat Panel (open state) ── */}
      {state === "open" && (
        <div
          className={cn(
            "fixed z-50 flex flex-col w-[380px] max-w-[calc(100vw-48px)] h-[560px] max-h-[calc(100vh-96px)]",
            "rounded-2xl shadow-2xl overflow-hidden",
            "bg-white border border-gray-200",
            "animate-in slide-in-from-bottom-4 fade-in duration-300",
            position === "bottom-right" ? "bottom-24 right-6" : "bottom-24 left-6"
          )}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center gap-3 px-4 py-3 text-white shrink-0"
            style={{ backgroundColor: brandColor }}
          >
            {/* Gisele avatar in header */}
            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/30 shrink-0">
              <img
                src={agentAvatar}
                alt={agentName}
                className="w-full h-full object-cover"
                style={{ filter: "grayscale(100%) contrast(1.1)" }}
              />
              {/* Online indicator */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full ring-1 ring-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm leading-tight">{agentName}</h3>
              <p className="text-xs opacity-80">{agentTitle}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleMinimize}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Minimize"
              >
                <MinusIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {/* Bot avatar next to bot messages */}
                {msg.role === "bot" && (
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 mt-1">
                    <img
                      src={agentAvatar}
                      alt={agentName}
                      className="w-full h-full object-cover"
                      style={{ filter: "grayscale(100%) contrast(1.1)" }}
                    />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-blue-500 text-white rounded-br-sm"
                      : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"
                  )}
                >
                  <p>{msg.content}</p>
                  <span
                    className={cn(
                      "text-[10px] mt-1 block",
                      msg.role === "user" ? "text-blue-200" : "text-gray-400"
                    )}
                  >
                    {msg.timestamp.toLocaleTimeString(locale, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 mt-1">
                  <img
                    src={agentAvatar}
                    alt={agentName}
                    className="w-full h-full object-cover"
                    style={{ filter: "grayscale(100%) contrast(1.1)" }}
                  />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Quick Replies ── */}
          {messages.length > 0 &&
            messages[messages.length - 1].quickReplies &&
            !isTyping && (
              <div className="flex flex-wrap gap-1.5 px-4 py-2 border-t border-gray-100 bg-white">
                {messages[messages.length - 1].quickReplies!.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => handleQuickReply(reply)}
                    className="px-3 py-1.5 text-xs font-medium rounded-full border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

          {/* ── Input ── */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-white"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition-colors placeholder:text-gray-400"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2.5 rounded-full text-white transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
              style={{ backgroundColor: brandColor }}
              aria-label="Send message"
            >
              <SendIcon className="w-4 h-4" />
            </button>
          </form>

          {/* ── Footer ── */}
          <div className="px-4 py-1.5 text-center border-t border-gray-100 bg-gray-50">
            <span className="text-[10px] text-gray-400">
              Powered by AgentSocial
            </span>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Inline SVG Icons (no lucide dependency) ──────────────────

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

// ─── CSS to add to globals.css ────────────────────────────────
// Add this to your globals.css or as a <style> tag:
//
// @keyframes slide-in-from-bottom-4 {
//   from { transform: translateY(16px); opacity: 0; }
//   to { transform: translateY(0); opacity: 1; }
// }
// @keyframes fade-in {
//   from { opacity: 0; }
//   to { opacity: 1; }
// }
// .animate-in.slide-in-from-bottom-4.fade-in {
//   animation: slide-in-from-bottom-4 0.3s ease-out, fade-in 0.3s ease-out;
// }