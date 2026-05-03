"use client";

import { useState, useRef } from "react";
import { AdobeExpressEditor } from "../adobe-express/AdobeExpressEditor";

interface CreatePostProps {
  apiKey: string;
}

export function CreatePost({ apiKey }: CreatePostProps) {
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showCreativeTools, setShowCreativeTools] = useState(false);
  const [platforms, setPlatforms] = useState<string[]>(["twitter"]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const platformOptions = [
    { id: "twitter", label: "Twitter/X", icon: "𝕏" },
    { id: "instagram", label: "Instagram", icon: "📷" },
    { id: "linkedin", label: "LinkedIn", icon: "💼" },
    { id: "facebook", label: "Facebook", icon: "📘" },
    { id: "tiktok", label: "TikTok", icon: "🎵" },
  ];

  const handleImageGenerated = (url: string) => {
    setImageUrl(url);
    setShowCreativeTools(false);
  };

  const togglePlatform = (id: string) => {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSchedule = () => {
    // TODO: Wire to AgentSocial scheduling API
    console.log("Schedule post:", { text, imageUrl, platforms });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Create Post
          </h2>
        </div>

        {/* Text Input */}
        <div className="px-6 py-4">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What do you want to share?"
            className="w-full min-h-[120px] resize-none border-0 bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none text-base leading-relaxed"
            rows={4}
          />
        </div>

        {/* Image Preview */}
        {imageUrl && (
          <div className="px-6 pb-4">
            <div className="relative group">
              <img
                src={imageUrl}
                alt="Post image"
                className="w-full rounded-xl object-cover max-h-[400px]"
              />
              <button
                onClick={() => setImageUrl(null)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Creative Tools Toggle */}
        {showCreativeTools && (
          <div className="px-6 pb-4">
            <AdobeExpressEditor
              apiKey={apiKey}
              appName="AgentSocial"
              onImageGenerated={handleImageGenerated}
              onError={(err) => console.error("Adobe Express error:", err)}
            />
          </div>
        )}

        {/* Actions Bar */}
        <div className="px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Attach Image */}
            <button
              onClick={() => setShowCreativeTools(!showCreativeTools)}
              className={`p-2 rounded-lg transition-colors ${
                showCreativeTools
                  ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
              title="Creative tools"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>

            {/* Emoji */}
            <button
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Emoji"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Character count */}
            <span
              className={`text-xs ${
                text.length > 280
                  ? "text-red-500"
                  : text.length > 250
                  ? "text-yellow-500"
                  : "text-zinc-400"
              }`}
            >
              {text.length}/280
            </span>

            {/* Schedule Button */}
            <button
              onClick={handleSchedule}
              disabled={!text.trim() && !imageUrl}
              className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              Schedule
            </button>
          </div>
        </div>

        {/* Platform Selector */}
        <div className="px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-zinc-500 mr-1">Post to:</span>
            {platformOptions.map((platform) => (
              <button
                key={platform.id}
                onClick={() => togglePlatform(platform.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  platforms.includes(platform.id)
                    ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                }`}
              >
                <span>{platform.icon}</span>
                <span>{platform.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
