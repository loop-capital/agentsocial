import Link from "next/link";
import "./globals.css";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center space-y-6 px-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold text-white tracking-tight">
            AgentSocial
          </h1>
          <p className="text-xl text-gray-400">AI-powered social media management</p>
        </div>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            Get Started
          </Link>
        </div>
        <div className="pt-8 text-gray-500 text-sm">
          <p>Built with Fastify + Next.js + PostgreSQL + Redis</p>
        </div>
      </div>
    </main>
  );
}