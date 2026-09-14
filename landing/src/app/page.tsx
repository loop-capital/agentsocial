export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section style={{
        textAlign: "center",
        padding: "5rem 2rem",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "#fff",
      }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem", fontWeight: 800 }}>
          Social Media, Supercharged by AI
        </h1>
        <p style={{ fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto 2rem", opacity: 0.9 }}>
          AgentSocial helps creators and businesses manage, schedule, and grow their social media presence across all platforms — powered by intelligent automation.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <a href="#" style={{
            background: "#fff",
            color: "#764ba2",
            padding: "0.75rem 2rem",
            borderRadius: "8px",
            fontWeight: 600,
            textDecoration: "none",
            fontSize: "1rem",
          }}>
            Get Started Free
          </a>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "4rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", marginBottom: "3rem", fontSize: "1.8rem" }}>
          Everything you need to grow
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem" }}>
          {[
            { title: "Multi-Platform Publishing", desc: "Schedule and publish to Instagram, TikTok, X, LinkedIn, Facebook, and more — all from one dashboard." },
            { title: "AI Content Generation", desc: "Generate captions, hashtags, and post ideas tailored to your brand voice with built-in AI tools." },
            { title: "Analytics & Insights", desc: "Track engagement, follower growth, and content performance across all your connected accounts." },
            { title: "Team Collaboration", desc: "Invite your team, assign roles, and manage approval workflows for seamless content production." },
            { title: "Smart Scheduling", desc: "AI-optimized posting times based on your audience's activity patterns for maximum reach." },
            { title: "Secure & Reliable", desc: "Enterprise-grade security with encrypted credentials and 99.9% uptime guarantee." },
          ].map((f, i) => (
            <div key={i} style={{
              padding: "1.5rem",
              border: "1px solid #eee",
              borderRadius: "12px",
              background: "#fafafa",
            }}>
              <h3 style={{ marginBottom: "0.5rem", fontSize: "1.1rem" }}>{f.title}</h3>
              <p style={{ color: "#666", fontSize: "0.95rem", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        textAlign: "center",
        padding: "4rem 2rem",
        background: "#f8f9fa",
      }}>
        <h2 style={{ marginBottom: "1rem" }}>Ready to level up your social presence?</h2>
        <p style={{ color: "#666", marginBottom: "2rem" }}>Join thousands of creators and businesses using AgentSocial.</p>
        <a href="#" style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#fff",
          padding: "0.75rem 2rem",
          borderRadius: "8px",
          fontWeight: 600,
          textDecoration: "none",
          fontSize: "1rem",
        }}>
          Start Free Trial
        </a>
      </section>
    </main>
  );
}
