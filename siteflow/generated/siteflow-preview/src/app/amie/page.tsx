'use client';

import { Calendar, Users, Clock, Zap, ArrowRight, Check } from 'lucide-react';

export default function AmieClone() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
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
            <a href="#" className="text-gray-600 hover:text-gray-900 transition">Blog</a>
            <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/30 transition">
              Try Amie Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl" />
        <div className="max-w-4xl mx-auto text-center relative">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            The calendar that{' '}
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 bg-clip-text text-transparent">
              works for you
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Amie is a beautiful calendar app that helps you schedule smarter, protect focus time, and coordinate with your team effortlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-2xl font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/30 transition-transform hover:-translate-y-0.5">
              Try Amie Free <ArrowRight className="inline w-5 h-5 ml-1" />
            </button>
            <button className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-semibold text-lg border-2 border-gray-200 hover:border-gray-300 transition">
              Watch Demo
            </button>
          </div>
          {/* Calendar mockup */}
          <div className="mt-16 rounded-2xl bg-white shadow-2xl shadow-purple-200/50 p-8 border border-gray-100">
            <div className="grid grid-cols-7 gap-2 text-center text-sm">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <div key={d} className="font-medium text-gray-400 py-2">{d}</div>
              ))}
              {[...Array(35)].map((_, i) => (
                <div key={i} className={`py-2 rounded-lg ${i === 15 || i === 16 ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium' : i === 14 ? 'bg-purple-50 text-purple-600 font-medium' : 'text-gray-600 hover:bg-gray-50'} transition`}>
                  {i + 1 <= 31 ? i + 1 : ''}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
            Everything you need to own your time
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Clock, title: 'Smart Scheduling', desc: 'AI finds the best time for meetings based on your preferences and habits.', color: 'from-purple-500 to-purple-600' },
              { icon: Users, title: 'Team Coordination', desc: 'See team availability at a glance and schedule without back-and-forth.', color: 'from-pink-500 to-pink-600' },
              { icon: Zap, title: 'Focus Time', desc: 'Protect deep work blocks automatically. No interruptions during flow.', color: 'from-blue-500 to-blue-600' },
              { icon: Calendar, title: 'Integrations', desc: 'Connect with Google, Notion, Zoom, Slack, and 50+ other tools.', color: 'from-violet-500 to-violet-600' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-300 hover:-translate-y-1">
                <div className={`w-12 h-12 bg-gradient-to-br ${f.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
            Simple, transparent pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Free', price: '$0', desc: '/month', features: ['Personal calendar', 'Basic scheduling', 'Focus time alerts'], highlight: false },
              { name: 'Pro', price: '$12', desc: '/month', features: ['Smart scheduling AI', 'Team coordination', 'Unlimited integrations', 'Priority support'], highlight: true },
              { name: 'Team', price: '$20', desc: '/user/month', features: ['Everything in Pro', 'Team analytics', 'Admin controls', 'SSO & SAML'], highlight: false },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-8 ${plan.highlight ? 'bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-xl shadow-purple-500/30' : 'bg-white border border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-2 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? 'text-purple-200' : 'text-gray-500'}`}>{plan.desc}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className={`w-5 h-5 ${plan.highlight ? 'text-purple-200' : 'text-purple-500'}`} />
                      <span className={`text-sm ${plan.highlight ? 'text-purple-100' : 'text-gray-600'}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-xl font-semibold transition ${plan.highlight ? 'bg-white text-purple-600 hover:bg-purple-50' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                  {plan.highlight ? 'Start Free Trial' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">Amie</span>
          </div>
          <p className="text-gray-400 text-sm">© 2026 Amie. Made with ♥ for your calendar.</p>
        </div>
      </footer>
    </div>
  );
}
