"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CreativeEngineSettings from "./CreativeEngineSettings";
import ImageGenerationUI from "./ImageGenerationUI";
import BatchGenerationUI from "./BatchGenerationUI";
import SiteFlowImageIntegration, { TemplateSlot } from "./SiteFlowImageIntegration";
import { GeneratedImage, UserCreativeSettings } from "./creative-api";

type Tab = "generate" | "batch" | "siteflow" | "settings";

export interface CreativeStudioPageProps {
  /** SiteFlow mode: pre-defined slots for a template */
  siteFlowSlots?: TemplateSlot[];
  siteName?: string;
  /** Called when SiteFlow images complete */
  onSiteFlowComplete?: (images: Record<string, GeneratedImage>) => void;
}

export default function CreativeStudioPage({
  siteFlowSlots,
  siteName,
  onSiteFlowComplete,
}: CreativeStudioPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>(
    siteFlowSlots ? "siteflow" : "generate"
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  const tabs: { id: Tab; label: string }[] = [
    { id: "generate", label: "Generate" },
    { id: "batch", label: "Batch" },
    { id: "siteflow", label: "SiteFlow" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <svg
              className="h-7 w-7 text-purple-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
            Creative Engine
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered image generation for social content and websites
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen((v) => !v)}
          >
            <svg
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {settingsOpen ? "Close Settings" : "Settings"}
          </Button>
        </div>
      </div>

      {/* Settings drawer */}
      {settingsOpen && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <CreativeEngineSettings />
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "generate" && (
          <ImageGenerationUI />
        )}

        {activeTab === "batch" && (
          <BatchGenerationUI />
        )}

        {activeTab === "siteflow" && (
          <SiteFlowImageIntegration
            slots={siteFlowSlots || EXAMPLE_SLOTS}
            siteName={siteName || "My Website"}
            onComplete={onSiteFlowComplete}
          />
        )}

        {activeTab === "settings" && (
          <CreativeEngineSettings />
        )}
      </div>
    </div>
  );
}

/** Example slots for demo/standalone usage */
const EXAMPLE_SLOTS: TemplateSlot[] = [
  {
    id: "hero-bg",
    label: "Hero Background",
    prompt: "Stunning hero background for a modern SaaS website, abstract gradient with soft purple and blue tones, clean and minimal, no text",
    size: "1792x1024",
  },
  {
    id: "feature-1",
    label: "Feature Illustration 1",
    prompt: "Flat vector illustration of team collaboration, modern UI/UX style, vibrant colors, clean lines",
    size: "1024x1024",
  },
  {
    id: "feature-2",
    label: "Feature Illustration 2",
    prompt: "Flat vector illustration of data analytics dashboard, modern UI/UX style, vibrant colors, clean lines",
    size: "1024x1024",
  },
  {
    id: "testimonial-bg",
    label: "Testimonial Section",
    prompt: "Warm and friendly abstract background for testimonials section, soft pastel colors, organic shapes",
    size: "1024x1024",
  },
  {
    id: "cta-bg",
    label: "CTA Background",
    prompt: "Bold and energetic background for call-to-action section, gradient with orange and pink tones, dynamic shapes",
    size: "1792x1024",
  },
];
