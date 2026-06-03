"use client";

import React from "react";
import AskAIWidget from "./AskAIWidget";

export default function ByondEduPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Placeholder for actual ByondEdu content */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ByondEdu
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Education beyond boundaries. AI-powered learning for the next generation.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            {
              title: "AI Tutors",
              desc: "Personalized learning with intelligent tutors",
            },
            {
              title: "Live Classes",
              desc: "Interactive sessions with top educators",
            },
            {
              title: "Progress Tracking",
              desc: "Real-time analytics on student performance",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-2xl border border-gray-100 bg-gray-50/50"
            >
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <button className="px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors">
            Get Started
          </button>
        </div>
      </section>

      {/* Ask AI Widget - Styled like Superpower */}
      <section className="border-t border-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <AskAIWidget brandName="ByondEdu" />
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© 2024 ByondEdu. All rights reserved.</p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Contact"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
