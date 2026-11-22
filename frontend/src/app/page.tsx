
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://127.0.0.1:8000";

type User = {
  id: string;
  name: string;
  email: string;
};

function AnimatedParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${(i * 37 + 8) % 100}%`,
            top: `${(i * 23 + 12) % 100}%`,
            animationDelay: `${-i * 0.7}s`,
            animationDuration: `${6 + (i % 5)}s`,
          }}
        />
      ))}
    </div>
  );
}

function MatchingAnimation() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="absolute inset-10 rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="glass-card animated-border relative overflow-hidden rounded-[2rem] p-5 md:p-8">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-300">
            Your ideal living match
          </span>
          <span className="rounded-full bg-green-400/10 px-3 py-1 text-xs text-green-300">
            ● Live concept
          </span>
        </div>

        <div className="py-5">
          <div className="orbit-stage">
            <div className="orbit">
              <div className="orbit-avatar avatar-one">👨🏻</div>
              <div className="orbit-avatar avatar-two">👩🏻</div>
              <div className="orbit-avatar avatar-three">👨🏽</div>
              <div className="orbit-avatar avatar-four">👩🏽</div>
            </div>

            <div className="orbit orbit-two">
              <div className="orbit-avatar avatar-one">🎓</div>
            </div>

            <div className="match-core">
              <span className="floating-house text-5xl">🏠</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="gradient-text text-2xl font-extrabold">
            Better together.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Find your people. Find your place.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400">Lifestyle</p>
            <p className="mt-2 font-bold text-cyan-300">Compatible</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400">Interests</p>
            <p className="mt-2 font-bold text-purple-300">Connected</p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
          <div className="score-ring flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-cyan-300">
              91%
            </div>
          </div>
          <div>
            <p className="font-bold text-white">Compatibility score</p>
            <p className="mt-1 text-xs text-slate-400">
              A smarter way to find your flatmate.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card absolute -left-4 top-24 rounded-xl p-3 shadow-xl md:-left-9">
        <span className="text-xl">✨</span>
        <p className="mt-1 text-xs font-semibold">Find your vibe</p>
      </div>

      <div className="glass-card absolute -right-3 bottom-24 rounded-xl p-3 shadow-xl md:-right-7">
        <span className="text-xl">💙</span>
        <p className="mt-1 text-xs font-semibold">Live better</p>
      </div>
    </div>
  );
}

export default function Home() {

  const router = useRouter();

  const [showLogin, setShowLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  

  useEffect(() => {
    const savedUser = localStorage.getItem("roomiematch_user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("roomiematch_user");
        localStorage.removeItem("roomiematch_token");
      }
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const endpoint = showLogin ? "/login" : "/register";

      const body = showLogin
        ? { email, password }
        : { name, email, password };

      const response = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Please check your details and try again."
        );
      }

      if (showLogin) {
        localStorage.setItem("roomiematch_token", data.access_token);
        localStorage.setItem("roomiematch_user", JSON.stringify(data.user));
        router.push("/dashboard");
        } else {

        setMessage("Account created successfully! Please log in.");
        setShowLogin(true);
        setPassword("");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("roomiematch_token");
    localStorage.removeItem("roomiematch_user");
    setUser(null);
    setPassword("");
    setMessage("");
  }

  if (user) {
    return (
      <main className="animated-bg relative flex min-h-screen items-center justify-center overflow-hidden px-6 text-white">
        <div className="orb orb-one" />
        <div className="orb orb-two" />
        <AnimatedParticles />

        <div className="glass-card animated-border fade-up relative z-10 w-full max-w-lg rounded-3xl p-10 text-center">
          <div className="floating-house text-7xl">🏠</div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
            ROOMIEMATCH
          </p>
          <h1 className="mt-4 text-4xl font-bold">
            Welcome, <span className="gradient-text">{user.name}!</span>
          </h1>
          <p className="mt-4 text-slate-400">
            Your next great living experience starts here.
          </p>
          <p className="mt-3 text-sm text-cyan-300">{user.email}</p>

          <button
            onClick={logout}
            className="glow-button mt-9 rounded-xl bg-cyan-400 px-10 py-3 font-bold text-slate-950"
          >
            Logout
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="animated-bg relative min-h-screen overflow-hidden text-white">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <AnimatedParticles />

      <nav className="relative z-10 flex items-center justify-between px-6 py-7 md:px-14">
        <a href="#" className="text-2xl font-extrabold tracking-tight">
          Roomie<span className="gradient-text">Match.</span>
        </a>

        <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <a href="#features" className="transition hover:text-cyan-300">
            Features
          </a>
          <a href="#auth" className="transition hover:text-cyan-300">
            Get started
          </a>
        </div>

        <a
          href="#auth"
          className="glow-button rounded-full border border-cyan-400/40 px-5 py-2 text-sm font-semibold text-cyan-300"
        >
          Find your match ↗
        </a>
      </nav>

      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-12 md:grid-cols-2 md:px-14 md:pt-20">
        <div className="reveal-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold tracking-wide text-cyan-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
            SMARTER FLATMATE MATCHING
          </div>

          <h1 className="mt-8 text-5xl font-black leading-[1.12] tracking-tight md:text-7xl">
            Your next home.
            <br />
            Your next
            <br />
            <span className="gradient-text">roommate.</span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-8 text-slate-400 md:text-lg">
            More than just finding a room. Discover people who match your
            lifestyle, budget and energy. Make shared living feel like home.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <a
              href="#auth"
              className="glow-button rounded-xl bg-cyan-400 px-7 py-4 font-bold text-slate-950"
            >
              Find your roommate →
            </a>
            <a
              href="#features"
              className="rounded-xl border border-white/15 px-7 py-4 font-semibold text-white transition hover:border-cyan-400/60 hover:bg-white/5"
            >
              Explore features
            </a>
          </div>

          <div className="mt-12 flex flex-wrap gap-7 text-sm text-slate-400">
            <span>✦ Smart compatibility</span>
            <span>✦ Lifestyle matching</span>
            <span>✦ Better living</span>
          </div>
        </div>

        <div className="reveal-right relative">
          <MatchingAnimation />
        </div>
      </section>

      <section
        id="features"
        className="relative z-10 mx-auto max-w-7xl px-6 py-16 md:px-14"
      >
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold tracking-[0.25em] text-cyan-400">
            THE ROOMIEMATCH DIFFERENCE
          </p>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">
            Shared spaces.{" "}
            <span className="gradient-text">Better connections.</span>
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["🎯", "Smart Matching", "Find people with compatible budgets and lifestyles."],
            ["🏙️", "Location & Budget", "Discover flatmates aligned with your living plans."],
            ["💫", "Shared Interests", "Connect through hobbies, habits and common interests."],
          ].map(([icon, title, description]) => (
            <div
              key={title}
              className="glass-card rounded-2xl p-7 transition duration-500 hover:-translate-y-3 hover:border-cyan-400/40 hover:shadow-[0_15px_45px_rgba(6,182,212,0.12)]"
            >
              <div className="text-4xl">{icon}</div>
              <h3 className="mt-5 text-xl font-bold">{title}</h3>
              <p className="mt-3 leading-7 text-slate-400">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="auth"
        className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:px-14"
      >
        <div className="glass-card animated-border mx-auto grid max-w-5xl overflow-hidden rounded-3xl md:grid-cols-2">
          <div className="flex flex-col justify-center bg-gradient-to-br from-cyan-600/30 to-blue-900/40 p-10 md:p-12">
            <span className="floating-house text-6xl">🏠</span>
            <h2 className="mt-7 text-4xl font-bold leading-tight">
              Find your place.
              <br />
              Find your people.
            </h2>
            <p className="mt-5 leading-7 text-slate-300">
              Join a community where finding a compatible flatmate is easier,
              smarter and more personal.
            </p>
          </div>

          <div className="p-8 md:p-12">
            <div className="mb-8 flex gap-7">
              <button
                onClick={() => {
                  setShowLogin(true);
                  setError("");
                  setMessage("");
                }}
                className={`pb-2 font-semibold transition ${
                  showLogin
                    ? "border-b-2 border-cyan-400 text-cyan-300"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Login
              </button>

              <button
                onClick={() => {
                  setShowLogin(false);
                  setError("");
                  setMessage("");
                }}
                className={`pb-2 font-semibold transition ${
                  !showLogin
                    ? "border-b-2 border-cyan-400 text-cyan-300"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Register
              </button>
            </div>

            <h3 className="text-2xl font-bold">
              {showLogin ? "Welcome back!" : "Create your account"}
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              {showLogin
                ? "Login to discover your next flatmate."
                : "Start your RoomieMatch journey today."}
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {!showLogin && (
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 p-4 text-white outline-none transition focus:border-cyan-400"
                />
              )}

              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 p-4 text-white outline-none transition focus:border-cyan-400"
              />

              <input
                type="password"
                placeholder="Password (minimum 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 p-4 text-white outline-none transition focus:border-cyan-400"
              />

              {error && <p className="text-sm text-red-400">{error}</p>}
              {message && <p className="text-sm text-green-400">{message}</p>}

              <button
                type="submit"
                disabled={loading}
                className="glow-button w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 py-4 font-bold text-slate-950 disabled:opacity-50"
              >
                {loading
                  ? "Please wait..."
                  : showLogin
                    ? "Login to RoomieMatch →"
                    : "Create my account →"}
              </button>
            </form>

            <p className="mt-7 text-center text-xs text-slate-500">
              Smart matching. Better living.
            </p>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-6 py-8 text-center text-sm text-slate-500">
        © 2026 RoomieMatch. Find your people. Find your place.
      </footer>
    </main>
  );
}
