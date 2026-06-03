"use client";

import React from "react";

// Grok Logo (starburst/spiral)
const GrokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 50 50" className={className}>
    <path
      fill="currentColor"
      d="M25 5 L28 15 L35 8 L32 18 L42 15 L34 22 L45 25 L34 28 L42 35 L32 32 L35 42 L28 35 L25 45 L22 35 L15 42 L18 32 L8 35 L16 28 L5 25 L16 22 L8 15 L18 18 L15 8 L22 15 Z"
      opacity="0.8"
    />
  </svg>
);

// Gemini Logo (stacked diamonds)
const GeminiIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path
      fill="currentColor"
      d="M12 2L2 12l10 10 10-10L12 2zm0 3.5L18.5 12 12 18.5 5.5 12 12 5.5z"
      opacity="0.85"
    />
    <path
      fill="currentColor"
      d="M12 7l-4 4 4 4 4-4-4-4z"
      opacity="0.6"
    />
  </svg>
);

// Perplexity Logo (lightning bolt / search icon)
const PerplexityIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className}>
    <path
      fill="currentColor"
      d="M24 4L6 16v16l18 12 18-12V16L24 4zm0 4l14 9.33v13.34L24 40 10 30.67V17.33L24 8z"
      opacity="0.8"
    />
    <path
      fill="currentColor"
      d="M24 14l-8 10h6v10l8-10h-6V14z"
      opacity="0.9"
    />
  </svg>
);

// Claude Logo (geometric flower/rosette)
const ClaudeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path
      fill="currentColor"
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
      opacity="0.7"
    />
    <path
      fill="currentColor"
      d="M12 6l3 5h5l-4 3.5L17 20l-5-3.5L7 20l1.5-5.5L4.5 11h5z"
      opacity="0.9"
    />
  </svg>
);

// OpenAI Logo (geometric lattice/interwoven)
const OpenAIIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 256 260" className={className}>
    <path
      fill="currentColor"
      d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803z"
      opacity="0.85"
    />
  </svg>
);

// AI Providers configuration — matches the 5 logos in the screenshot
const AI_PROVIDERS = [
  {
    name: "Grok",
    icon: GrokIcon,
    url: "https://grok.x.ai/?q=What+is+ByondEdu",
    brandColor: "hover:text-gray-800",
  },
  {
    name: "Gemini",
    icon: GeminiIcon,
    url: "https://gemini.google.com/app?q=What+is+ByondEdu",
    brandColor: "hover:text-blue-600",
  },
  {
    name: "Perplexity",
    icon: PerplexityIcon,
    url: "https://www.perplexity.ai/?q=What+is+ByondEdu",
    brandColor: "hover:text-teal-600",
  },
  {
    name: "Claude",
    icon: ClaudeIcon,
    url: "https://claude.ai/new?q=What+is+ByondEdu",
    brandColor: "hover:text-orange-600",
  },
  {
    name: "ChatGPT",
    icon: OpenAIIcon,
    url: "https://chat.openai.com/?q=What+is+ByondEdu",
    brandColor: "hover:text-green-600",
  },
];

interface AskAIWidgetProps {
  brandName?: string;
  className?: string;
}

export default function AskAIWidget({ brandName = "ByondEdu", className = "" }: AskAIWidgetProps) {
  return (
    <div className={`flex flex-col items-center gap-5 ${className}`}>
      <p className="text-base font-medium text-gray-700 tracking-tight">
        Ask AI about {brandName}
      </p>

      <div className="flex items-center gap-3">
        {AI_PROVIDERS.map((provider) => {
          const Icon = provider.icon;
          return (
            <a
              key={provider.name}
              href={provider.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ask ${provider.name} about ${brandName}`}
              className={`
                group relative flex items-center justify-center
                w-14 h-14 rounded-2xl
                bg-gray-50 border border-gray-200
                transition-all duration-300 ease-out
                hover:shadow-lg hover:border-gray-300 hover:scale-110
                hover:bg-white
                active:scale-95
                ${provider.brandColor}
              `}
            >
              <Icon className="w-6 h-6 text-gray-400 group-hover:text-current transition-colors duration-300" />

              {/* Tooltip */}
              <span
                className="
                  absolute -top-9 left-1/2 -translate-x-1/2
                  px-2.5 py-1 rounded-lg bg-gray-900 text-white text-xs font-medium
                  opacity-0 group-hover:opacity-100
                  transition-all duration-200
                  whitespace-nowrap pointer-events-none
                  shadow-lg
                "
              >
                {provider.name}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// Full footer variant
export function AskAIFooter({ brandName = "ByondEdu" }: { brandName?: string }) {
  return (
    <footer className="w-full py-10 px-4 border-t border-gray-100 bg-white">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
        <AskAIWidget brandName={brandName} />

        <p className="text-xs text-gray-400">
          Click any AI assistant to learn more about {brandName}
        </p>
      </div>
    </footer>
  );
}
