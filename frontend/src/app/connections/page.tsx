
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "https://roomiematch-ohpj.onrender.com";

type Connection = {
  user_id: string;
  name: string;
  email: string;
  connected_at: string;
};

type ConnectionsResponse = {
  total_connections: number;
  connections: Connection[];
};

export default function ConnectionsPage() {
  const router = useRouter();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadConnections = useCallback(async () => {
    const token = localStorage.getItem("roomiematch_token");

    if (!token) {
      router.replace("/");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/connections`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (response.status === 401) {
        localStorage.removeItem("roomiematch_token");
        localStorage.removeItem("roomiematch_user");
        router.replace("/");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load connections.");
      }

      const result = data as ConnectionsResponse;
      setConnections(result.connections || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  function formatDate(date: string) {
    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "Date unavailable";

    return parsed.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="animated-bg relative min-h-screen overflow-hidden px-5 py-10 text-white">
      <div className="orb orb-one" />
      <div className="orb orb-two" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-wide">
              🏠 <span className="gradient-text">ROOMIEMATCH</span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Your connected roommate community.
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
          >
            ← Dashboard
          </button>
        </header>

        <section className="glass-card rounded-3xl p-7 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-widest text-cyan-300">
                YOUR ROOMMATE NETWORK
              </p>
              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                Connected Roommates
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                People who have mutually accepted your connection requests.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-6 py-4 text-center">
              <p className="text-3xl font-extrabold text-cyan-300">
                {connections.length}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Total Connections
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => void loadConnections()}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "↻ Refresh Connections"}
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
              <p className="text-slate-400">
                Loading your connections...
              </p>
            </div>
          ) : error ? (
            <div className="mt-8 rounded-2xl border border-red-400/30 bg-red-400/10 p-6 text-center">
              <p className="font-semibold text-red-300">
                Unable to load connections
              </p>
              <p className="mt-2 text-sm text-slate-300">{error}</p>
              <button
                onClick={() => void loadConnections()}
                className="mt-5 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-400"
              >
                Try Again
              </button>
            </div>
          ) : connections.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/50 px-6 py-14 text-center">
              <div className="text-6xl">🤝</div>
              <h3 className="mt-5 text-2xl font-bold">
                No connections yet
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
                When someone accepts your connection request, they will appear
                here. Explore your roommate matches to connect with people.
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="mt-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-semibold text-white"
              >
                Explore Matches →
              </button>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {connections.map((connection) => (
                <article
                  key={connection.user_id}
                  className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-6 transition hover:border-cyan-400/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 text-2xl font-bold">
                      {connection.name?.charAt(0)?.toUpperCase() || "R"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-bold">
                        {connection.name}
                      </h3>
                      <p className="mt-1 break-all text-sm text-slate-400">
                        {connection.email}
                      </p>
                    </div>

                    <span className="shrink-0 text-xl text-emerald-400">
                      ✓
                    </span>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-700 pt-4">
                    <span className="text-xs text-slate-400">
                      Connected on
                    </span>
                    <span className="text-xs font-semibold text-cyan-300">
                      {formatDate(connection.connected_at)}
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-center text-sm font-semibold text-emerald-300">
                    ✓ Connected Roommate
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-10 pb-5 text-center text-sm text-slate-500">
          © 2026 RoomieMatch. Find your people, find your place. 🏠
        </footer>
      </div>
    </main>
  );
}
