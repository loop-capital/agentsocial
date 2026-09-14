'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, FileText, BookOpen, Zap, Sparkles, Menu, X } from 'lucide-react';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-serif font-bold text-black">notion</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#" className="text-gray-700 hover:text-black transition text-sm">
                Product
              </Link>
              <Link href="#" className="text-gray-700 hover:text-black transition text-sm">
                Solutions
              </Link>
              <Link href="#" className="text-gray-700 hover:text-black transition text-sm">
                Resources
              </Link>
              <Link href="#" className="text-gray-700 hover:text-black transition text-sm">
                Pricing
              </Link>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="text-gray-700 hover:text-black transition text-sm font-medium">
                Sign In
              </button>
              <button className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition text-sm font-medium">
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-100">
              <Link href="#" className="block py-3 text-gray-700 hover:text-black text-sm">
                Product
              </Link>
              <Link href="#" className="block py-3 text-gray-700 hover:text-black text-sm">
                Solutions
              </Link>
              <Link href="#" className="block py-3 text-gray-700 hover:text-black text-sm">
                Resources
              </Link>
              <Link href="#" className="block py-3 text-gray-700 hover:text-black text-sm">
                Pricing
              </Link>
              <div className="flex flex-col space-y-2 mt-4 pt-4 border-t border-gray-100">
                <button className="text-gray-700 hover:text-black transition text-sm font-medium py-2">
                  Sign In
                </button>
                <button className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition text-sm font-medium w-full">
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-gray-50 rounded-full px-4 py-2 mb-8 border border-gray-200">
              <Sparkles size={16} className="text-gray-600" />
              <span className="text-sm text-gray-600">New: AI-powered features</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold text-black mb-6 leading-tight">
              Write. Plan. Collaborate.
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto">
              One workspace for your docs, wikis, and projects. Notion is the all-in-one workspace where you can write, plan, and collaborate with your team.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button className="bg-black text-white px-8 py-4 rounded-lg hover:bg-gray-900 transition font-medium text-lg w-full sm:w-auto flex items-center justify-center space-x-2 group">
                <span>Get Notion Free</span>
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="border-2 border-gray-200 text-black px-8 py-4 rounded-lg hover:border-gray-400 transition font-medium text-lg w-full sm:w-auto">
                Watch Demo
              </button>
            </div>

            {/* Hero Image */}
            <div className="rounded-2xl overflow-hidden bg-gray-100 shadow-2xl">
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <FileText size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-500 text-sm font-medium mb-12 uppercase tracking-wide">
            Trusted by teams at
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-items-center">
            {['Amazon', 'Nike', 'Toyota', 'Spotify', 'Figma'].map((company) => (
              <div key={company} className="text-gray-400 font-medium text-lg hover:text-gray-600 transition cursor-pointer">
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-black mb-4">
              Everything you need
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features to help you work better
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Feature 1: Docs & Notes */}
            <div className="group">
              <div className="mb-6 inline-flex items-center justify-center w-14 h-14 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition">
                <FileText size={28} className="text-black" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-black mb-3">
                Docs & Notes
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Write beautiful, long-form content with our distraction-free editor. Use rich formatting, embeds, and databases to organize your thoughts.
              </p>
              <Link
                href="#"
                className="inline-flex items-center space-x-2 text-black font-medium mt-6 group/link hover:space-x-3 transition-all"
              >
                <span>Learn more</span>
                <ChevronRight size={18} className="group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Feature 2: Wikis */}
            <div className="group">
              <div className="mb-6 inline-flex items-center justify-center w-14 h-14 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition">
                <BookOpen size={28} className="text-black" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-black mb-3">
                Wikis & Knowledge Base
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Build a centralized wiki for your team. Create interconnected pages, organize information hierarchically, and make knowledge discoverable.
              </p>
              <Link
                href="#"
                className="inline-flex items-center space-x-2 text-black font-medium mt-6 group/link hover:space-x-3 transition-all"
              >
                <span>Learn more</span>
                <ChevronRight size={18} className="group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Feature 3: Projects */}
            <div className="group">
              <div className="mb-6 inline-flex items-center justify-center w-14 h-14 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition">
                <Zap size={28} className="text-black" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-black mb-3">
                Projects & Databases
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Manage projects with powerful databases. Create custom views like lists, boards, calendars, and timelines. Collaborate in real-time.
              </p>
              <Link
                href="#"
                className="inline-flex items-center space-x-2 text-black font-medium mt-6 group/link hover:space-x-3 transition-all"
              >
                <span>Learn more</span>
                <ChevronRight size={18} className="group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Feature 4: AI */}
            <div className="group">
              <div className="mb-6 inline-flex items-center justify-center w-14 h-14 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition">
                <Sparkles size={28} className="text-black" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-black mb-3">
                AI-Powered Assistance
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Harness the power of AI to write better, faster. Generate ideas, summarize content, translate languages, and more with a single click.
              </p>
              <Link
                href="#"
                className="inline-flex items-center space-x-2 text-black font-medium mt-6 group/link hover:space-x-3 transition-all"
              >
                <span>Learn more</span>
                <ChevronRight size={18} className="group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl sm:text-6xl font-serif font-bold text-black mb-6">
            Start creating today
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Join millions of people using Notion to work smarter and faster.
          </p>
          <button className="bg-black text-white px-8 py-4 rounded-lg hover:bg-gray-900 transition font-medium text-lg inline-flex items-center space-x-2 group">
            <span>Get Notion Free</span>
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div>
              <h4 className="font-semibold text-black mb-4">Product</h4>
              <ul className="space-y-2">
                {['Features', 'Pricing', 'Security', 'Roadmap'].map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-gray-600 hover:text-black transition text-sm">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-black mb-4">Company</h4>
              <ul className="space-y-2">
                {['About', 'Blog', 'Careers', 'Press'].map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-gray-600 hover:text-black transition text-sm">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-black mb-4">Resources</h4>
              <ul className="space-y-2">
                {['Help Center', 'API Docs', 'Templates', 'Guides'].map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-gray-600 hover:text-black transition text-sm">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-black mb-4">Community</h4>
              <ul className="space-y-2">
                {['Twitter', 'Discord', 'Forums', 'Events'].map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-gray-600 hover:text-black transition text-sm">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-black mb-4">Legal</h4>
              <ul className="space-y-2">
                {['Privacy', 'Terms', 'Cookies', 'Contact'].map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-gray-600 hover:text-black transition text-sm">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-12 flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-2xl font-serif font-bold text-black">notion</span>
            </div>
            <p className="text-gray-600 text-sm">
              © 2024 Notion Labs, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
