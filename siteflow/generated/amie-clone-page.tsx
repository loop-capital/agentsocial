# Amie.so Clone - Next.js Landing Page

```tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Calendar, Users, Clock, Zap, Check, ArrowRight } from 'lucide-react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Amie</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition">Pricing</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition">Docs</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition">Blog</a>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-gray-600 hover:text-gray-900 transition font-medium">Sign in</button>
            <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg hover:shadow-purple-500/30 transition">
              Try Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 md:pt-48 md:pb-32">
        {/* Gradient Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-transparent rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200 to-transparent rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-pink-200 to-transparent rounded-full opacity-20 blur-3xl"></div>
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 bg-purple-50 rounded-full border border-purple-200">
            <span className="w-2 h-2 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full"></span>
            <span className="text-sm font-medium text-purple-900">Introducing the calendar reimagined</span>
            <ChevronRight className="w-4 h-4 text-purple-600" />
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 bg-clip-text text-transparent">
              The calendar that works for you
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Amie is the calendar that adapts to your workflow. Smart scheduling, team coordination, and focus time all in one beautiful app.
          </p>

          {/* CTA Section */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <form onSubmit={handleSubmit} className="w-full sm:w-auto flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="px-6 py-4 rounded-full border border-gray-200 focus:border-purple-500 focus:outline-none w-full sm:w-72 transition"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-2xl hover:shadow-purple-500/30 transition disabled:opacity-70 flex items-center gap-2 whitespace-nowrap"
              >
                {isSubmitting ? 'Starting...' : 'Try Amie Free'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
            <p className="text-sm text-gray-500">No credit card required • 14-day free trial</p>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col items-center gap-6">
            <p className="text-sm text-gray-600 font-medium">Trusted by leading teams</p>
            <div className="flex items-center justify-center gap-8 flex-wrap">
              {['Stripe', 'Figma', 'Notion', 'Slack', 'Vercel'].map((brand) => (
                <div key={brand} className="text-gray-400 font-semibold text-sm">
                  {brand}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative mt-20 max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-500/10 to-blue-600/10 rounded-3xl blur-2xl"></div>
          <div className="relative bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-3xl border border-purple-200/50 p-8 md:p-12 shadow-2xl">
            <div className="aspect-video bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <Calendar className="w-16 h-16 text-purple-600 mx-auto mb-4 opacity-50" />
                <p className="text-gray-600 font-medium">Calendar Preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 px-6 bg-gradient-to-b from-transparent to-purple-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powerful features for smarter scheduling
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage your time, coordinate with your team, and stay focused on what matters.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Feature 1 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-200/30 to-blue-200/30 rounded-3xl blur-xl group-hover:blur-2xl transition opacity-0 group-hover:opacity-100"></div>
              <div className="relative bg-white rounded-3xl border border-gray-200 p-8 md:p-10 hover:border-purple-300 transition">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center mb-6">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart Scheduling</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  AI-powered scheduling suggests the best times for meetings. Let Amie handle the coordination while you focus on what matters.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Smart time suggestions</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Timezone aware</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Buffer time management</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-3xl blur-xl group-hover:blur-2xl transition opacity-0 group-hover:opacity-100"></div>
              <div className="relative bg-white rounded-3xl border border-gray-200 p-8 md:p-10 hover:border-pink-300 transition">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Team Coordination</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Collaborate seamlessly with your team. Share availability, manage group events, and keep everyone on the same page.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Team calendar sharing</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Group scheduling</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Real-time updates</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200/30 to-pink-200/30 rounded-3xl blur-xl group-hover:blur-2xl transition opacity-0 group-hover:opacity-100"></div>
              <div className="relative bg-white rounded-3xl border border-gray-200 p-8 md:p-10 hover:border-blue-300 transition">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-pink-500 rounded-2xl flex items-center justify-center mb-6">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Focus Time Blocks</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Protect your deep work time. Create uninterrupted focus blocks and let Amie automatically decline conflicting meetings.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Recurring focus sessions</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Do Not Disturb mode</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Smart conflict handling</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-3xl blur-xl group-hover:blur-2xl transition opacity-0 group-hover:opacity-100"></div>
              <div className="relative bg-white rounded-3xl border border-gray-200 p-8 md:p-10 hover:border-purple-300 transition">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">100+ Integrations</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Connect with your favorite tools. Sync with Gmail, Slack, Notion, and 100+ other apps you already use.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Email synchronization</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Workflow automation</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>API access</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free and upgrade as you grow. Always fair pricing, no hidden fees.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="relative bg-white rounded-3xl border border-gray-200 p-8 hover:border-gray-300 transition">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
              <p className="text-gray-600 mb-6">Perfect for individuals</p>
              <div className="mb-8">
                <span className="text-4xl font-bold text-gray-900">Free</span>
                <p className="text-gray-600 mt-2">Forever free</p>
              </div>
              <button className="w-full px-6 py-3 border-2 border-gray-200 text-gray-900 rounded-full font-semibold hover:border-gray-300 transition mb-8">
                Get Started
              </button>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Up to 1 calendar</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Basic integrations</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Mobile app</span>
                </li>
              </ul>
            </div>

            {/* Pro - Featured */}
            <div className="relative md:scale-105 md:-my-4">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              </div>
              <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl border-2 border-purple-300 p-8 shadow-2xl shadow-purple-500/20">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                <p className="text-gray-600 mb-6">For power users and teams</p>
                <div className="mb-8">
                  <span className="text-4xl font-bold text-gray-900">$12</span>
                  <span className="text-gray-600">/month</span>
                  <p className="text-gray-600 mt-2">Billed annually</p>
                </div>
                <button className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg transition mb-8">
                  Start Free Trial
                </button>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Unlimited calendars</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>All integrations</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>AI scheduling</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Focus blocks</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Team */}
            <div className="relative bg-white rounded-3xl border border-gray-200 p-8 hover:border-gray-300 transition">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Team</h3>
              <p className="text-gray-600 mb-6">For growing teams</p>
              <div className="mb-8">
                <span className="text-4xl font-bold text-gray-900">$20</span>
                <span className="text-gray-600">/user/month</span>
                <p className="text-gray-600 mt-2">Billed annually</p>
              </div>
              <button className="w-full px-6 py-3 border-2 border-gray-200 text-gray-900 rounded-full font-semibold hover:border-gray-300 transition mb-8">
                Contact Sales
              </button>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-
