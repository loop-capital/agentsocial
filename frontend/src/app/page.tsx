import { CreatePost } from "../components/post/CreatePost";

const ADOBE_EXPRESS_API_KEY = "2cfb2e097e5a4e97b7b09bffdcdc5a79";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              AgentSocial
            </span>
          </div>
          <nav className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
              Dashboard
            </a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
              Calendar
            </a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
              Analytics
            </a>
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <CreatePost apiKey={ADOBE_EXPRESS_API_KEY} />

        {/* Recent Posts Preview */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-zinc-500 mb-4">Recent Posts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { platform: "Twitter", text: "AI is transforming how we approach personal health...", time: "2h ago" },
              { platform: "Instagram", text: "New blog post: 5 evidence-based supplements...", time: "5h ago" },
              { platform: "LinkedIn", text: "Excited to share our latest research findings...", time: "1d ago" },
              { platform: "Twitter", text: "Check out our new AI-powered health platform...", time: "2d ago" },
            ].map((post, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    {post.platform}
                  </span>
                  <span className="text-xs text-zinc-400">{post.time}</span>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">
                  {post.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
