
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type CompatibilityBreakdown = {
  budget: number;
  city: number;
  lifestyle: number;
  food: number;
  interests: number;
  university: number;
};

type Match = {
  user_id: string;
  name: string;
  city: string;
  university: string;
  budget_min: number;
  budget_max: number;
  compatibility_score: number;
  compatibility_breakdown: CompatibilityBreakdown;
};

type Profile = {
  age: number;
  gender: string;
  university: string;
  city: string;
  budget_min: number;
  budget_max: number;
  food_preference: string;
  smoking: boolean;
  drinking: boolean;
  sleep_schedule: string;
  interests: string[];
};

type ConnectionRequest = {
  request_id: string;
  sender_id: string;
  sender_name: string;
  recipient_id: string;
  recipient_name: string;
  status: "pending" | "accepted" | "rejected";
  direction: "incoming" | "outgoing";
};

type Connection = {
  user_id: string;
  name: string;
};

const categories = [
  { key: "budget", label: "Budget", icon: "💰", weight: "30%" },
  { key: "city", label: "City", icon: "📍", weight: "20%" },
  { key: "lifestyle", label: "Lifestyle", icon: "🌙", weight: "20%" },
  { key: "food", label: "Food", icon: "🍽️", weight: "10%" },
  { key: "interests", label: "Interests", icon: "🎯", weight: "10%" },
  { key: "university", label: "University", icon: "🎓", weight: "10%" },
] as const;

function ProgressBar({ score }: { score: number }) {
  const safeScore = Math.min(100, Math.max(0, score || 0));

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-700">
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700"
        style={{ width: `${safeScore}%` }}
      />
    </div>
  );
}

function formatMoney(value?: number) {
  return value != null
    ? `₹${value.toLocaleString("en-IN")}`
    : "Not provided";
}

export default function DashboardPage() {
  const router = useRouter();

  const [userName, setUserName] = useState("RoomieMatch User");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [connectionRequests, setConnectionRequests] =
    useState<ConnectionRequest[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionBusy, setConnectionBusy] = useState<string | null>(null);
  const [connectionMessage, setConnectionMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const token = localStorage.getItem("roomiematch_token");

      if (!token) {
        router.push("/");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      try {
        const [userResponse, profileResponse, matchesResponse] =
          await Promise.all([
            fetch(`${API_URL}/me`, { headers }),
            fetch(`${API_URL}/profile`, { headers }),
            fetch(`${API_URL}/matches`, { headers }),
          ]);

        if (
          userResponse.status === 401 ||
          profileResponse.status === 401 ||
          matchesResponse.status === 401
        ) {
          localStorage.removeItem("roomiematch_token");
          localStorage.removeItem("roomiematch_user");
          router.push("/");
          return;
        }

        if (
          !userResponse.ok ||
          !profileResponse.ok ||
          !matchesResponse.ok
        ) {
          throw new Error("Unable to load dashboard. Please try again.");
        }

        const userData = await userResponse.json();
        const profileData = await profileResponse.json();
        const matchesData = await matchesResponse.json();

        setUserName(userData.name || "RoomieMatch User");
        setProfile(profileData);
        setMatches(matchesData.matches || []);

        await refreshConnections(token);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  async function refreshConnections(token?: string) {
    const activeToken =
      token || localStorage.getItem("roomiematch_token");

    if (!activeToken) return;

    const headers = {
      Authorization: `Bearer ${activeToken}`,
    };

    try {
      const [requestsResponse, connectionsResponse] = await Promise.all([
        fetch(`${API_URL}/connections/requests`, { headers }),
        fetch(`${API_URL}/connections`, { headers }),
      ]);

      if (requestsResponse.ok) {
        const data = await requestsResponse.json();
        setConnectionRequests(data.requests || []);
      }

      if (connectionsResponse.ok) {
        const data = await connectionsResponse.json();
        setConnections(data.connections || []);
      }
    } catch (err) {
      console.error("Unable to load connections:", err);
    }
  }

  async function sendConnectionRequest(recipientUserId: string) {
    const token = localStorage.getItem("roomiematch_token");

    if (!token) {
      router.push("/");
      return;
    }

    setConnectionBusy(recipientUserId);
    setConnectionMessage("");

    try {
      const response = await fetch(
        `${API_URL}/connections/request/${recipientUserId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || data.message || "Could not send request."
        );
      }

      setConnectionMessage(data.message || "Connection request sent!");
      await refreshConnections(token);
    } catch (err) {
      setConnectionMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setConnectionBusy(null);
    }
  }

  async function respondToRequest(
    requestId: string,
    action: "accepted" | "rejected"
  ) {
    const token = localStorage.getItem("roomiematch_token");

    if (!token) {
      router.push("/");
      return;
    }

    setConnectionBusy(requestId);
    setConnectionMessage("");

    try {
      const response = await fetch(
        `${API_URL}/connections/respond/${requestId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || data.message || "Could not update request."
        );
      }

      setConnectionMessage(data.message || `Request ${action}.`);
      await refreshConnections(token);
    } catch (err) {
      setConnectionMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setConnectionBusy(null);
    }
  }

  const pendingIncoming = connectionRequests.filter(
    (request) =>
      request.direction === "incoming" &&
      request.status === "pending"
  ).length;

  const profileFields = profile
    ? [
        profile.age,
        profile.gender,
        profile.university,
        profile.city,
        profile.budget_min,
        profile.budget_max,
        profile.food_preference,
        profile.sleep_schedule,
        profile.interests?.length,
      ]
    : [];

  const completedFields = profileFields.filter(
    (value) => value !== null && value !== undefined && value !== ""
  ).length;

  const profileCompletion = profile
    ? Math.round((completedFields / profileFields.length) * 100)
    : 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-24 text-white">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-800 bg-slate-900 p-16 text-center">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          <h2 className="text-xl font-bold">
            Preparing your dashboard...
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Finding your roommate matches.
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-20 text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-400/20 bg-slate-900 p-10 text-center">
          <div className="text-4xl">⚠️</div>
          <h2 className="mt-4 text-xl font-bold">
            Unable to load dashboard
          </h2>
          <p className="mt-3 text-slate-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-white hover:bg-cyan-400"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-9 text-white">
      <div className="mx-auto max-w-7xl">

        {/* WELCOME */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/50 p-7 sm:p-10">
          <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-bold tracking-[0.2em] text-cyan-300">
                YOUR PERSONAL DASHBOARD
              </p>

              <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">
                Welcome back, {userName}! 👋
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
                Your next great living experience starts here.
                Discover people who match your lifestyle.
              </p>

              <button
                onClick={() => router.push("/profile")}
                className="mt-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Complete / Edit Profile →
              </button>
            </div>

            <div className="hidden text-8xl sm:block">🏠</div>
          </div>
        </section>

        {/* STATISTICS */}
        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Potential Matches",
              value: matches.length,
              icon: "👥",
              note: "Compatible roommates",
            },
            {
              label: "Connections",
              value: connections.length,
              icon: "🤝",
              note: "Accepted connections",
            },
            {
              label: "Incoming Requests",
              value: pendingIncoming,
              icon: "📩",
              note: "Waiting for your response",
            },
            {
              label: "Profile Completion",
              value: `${profileCompletion}%`,
              icon: "👤",
              note: "Based on available profile fields",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition hover:-translate-y-1 hover:border-cyan-400/40"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{stat.label}</p>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <p className="mt-4 text-3xl font-extrabold text-white">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{stat.note}</p>
            </div>
          ))}
        </section>

        {/* PROFILE SUMMARY */}
        {profile && (
          <section className="mb-10 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-widest text-cyan-300">
                  YOUR INFORMATION
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  Profile Overview
                </h2>
              </div>

              <button
                onClick={() => router.push("/profile")}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400"
              >
                Edit Profile →
              </button>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Age", value: profile.age },
                { label: "Gender", value: profile.gender },
                { label: "City", value: profile.city },
                { label: "University", value: profile.university },
                {
                  label: "Monthly Budget",
                  value: `${formatMoney(profile.budget_min)} – ${formatMoney(profile.budget_max)}`,
                },
                { label: "Food Preference", value: profile.food_preference },
                { label: "Sleep Schedule", value: profile.sleep_schedule },
                {
                  label: "Lifestyle",
                  value: `Smoking: ${profile.smoking ? "Yes" : "No"} · Drinking: ${profile.drinking ? "Yes" : "No"}`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="mt-2 break-words text-sm font-semibold text-white">
                    {item.value ?? "Not provided"}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <p className="mb-3 text-sm font-semibold text-slate-300">
                Your Interests
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.interests?.length ? (
                  profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-200"
                    >
                      {interest}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">
                    No interests added yet.
                  </span>
                )}
              </div>
            </div>
          </section>
        )}

        {/* MATCHES */}
        <section className="mb-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-cyan-300">
                COMPATIBILITY DISCOVERY
              </p>
              <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
                Your Roommate Matches
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Find people who could be your perfect flatmate.
              </p>
            </div>

            <button
              onClick={() => router.push("/connections")}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              My Connections →
            </button>
          </div>

          {connectionMessage && (
            <div
              role="status"
              className="mb-5 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200"
            >
              {connectionMessage}
            </div>
          )}

          {matches.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-12 text-center">
              <div className="text-5xl">🔎</div>
              <h3 className="mt-5 text-xl font-bold">No matches yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                We haven't found another roommate profile yet.
                Invite your friends to join RoomieMatch!
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {matches.map((match) => {
                const score = Math.min(
                  100,
                  Math.max(0, match.compatibility_score || 0)
                );

                const isConnected = connections.some(
                  (connection) => connection.user_id === match.user_id
                );

                const outgoingRequest = connectionRequests.find(
                  (request) =>
                    request.recipient_id === match.user_id &&
                    request.direction === "outgoing" &&
                    request.status === "pending"
                );

                const incomingRequest = connectionRequests.find(
                  (request) =>
                    request.sender_id === match.user_id &&
                    request.direction === "incoming" &&
                    request.status === "pending"
                );

                return (
                  <article
                    key={match.user_id}
                    className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-xl hover:shadow-cyan-950/20"
                  >
                    <div className="p-6 sm:p-8">

                      {/* MATCH HEADER */}
                      <div className="flex flex-wrap items-center justify-between gap-5">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 text-3xl font-extrabold shadow-lg shadow-cyan-500/20">
                            {match.name?.charAt(0)?.toUpperCase() || "R"}
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-xl font-bold">
                              {match.name}
                            </h3>
                            <p className="mt-1 truncate text-sm text-slate-400">
                              {match.university || "University not provided"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              📍 {match.city || "City not provided"}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-center">
                          <p className="text-3xl font-extrabold text-cyan-300">
                            {score.toFixed(1)}%
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Compatibility
                          </p>
                        </div>
                      </div>

                      {/* MATCH DETAILS */}
                      <div className="mt-7 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-slate-950/70 p-4">
                          <p className="text-xs text-slate-500">📍 City</p>
                          <p className="mt-2 font-semibold">
                            {match.city || "Not provided"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-950/70 p-4">
                          <p className="text-xs text-slate-500">🎓 University</p>
                          <p className="mt-2 break-words text-sm font-semibold">
                            {match.university || "Not provided"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-950/70 p-4">
                          <p className="text-xs text-slate-500">💰 Monthly Budget</p>
                          <p className="mt-2 text-sm font-semibold">
                            {formatMoney(match.budget_min)} – {formatMoney(match.budget_max)}
                          </p>
                        </div>
                      </div>

                      {/* OVERALL COMPATIBILITY */}
                      <div className="mt-7">
                        <div className="mb-3 flex justify-between">
                          <span className="text-sm font-semibold">
                            Overall Compatibility
                          </span>
                          <span className="text-sm font-bold text-cyan-300">
                            {score.toFixed(1)}%
                          </span>
                        </div>
                        <ProgressBar score={score} />
                      </div>

                      {/* BREAKDOWN */}
                      <div className="mt-7 border-t border-slate-800 pt-6">
                        <h4 className="text-lg font-bold">
                          Compatibility Breakdown
                        </h4>
                        <p className="mt-1 text-sm text-slate-400">
                          See how your preferences compare.
                        </p>

                        {match.compatibility_breakdown ? (
                          <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                            {categories.map((category) => {
                              const value =
                                match.compatibility_breakdown?.[category.key] ?? 0;

                              return (
                                <div key={category.key}>
                                  <div className="mb-2 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                      <span>{category.icon}</span>
                                      <div>
                                        <p className="text-sm font-semibold">
                                          {category.label}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                          Weight: {category.weight}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="text-sm font-bold text-cyan-300">
                                      {Number(value).toFixed(1)}%
                                    </span>
                                  </div>
                                  <ProgressBar score={value} />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="mt-4 text-sm text-slate-500">
                            Compatibility breakdown is unavailable.
                          </p>
                        )}
                      </div>

                      {/* CONNECTION ACTION */}
                      <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-slate-800 pt-6">
                        {isConnected ? (
                          <>
                            <span className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-300">
                              ✓ Connected
                            </span>
                            <button
                              onClick={() =>
                                router.push(`/roommate/${match.user_id}`)
                              }
                              className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-400"
                            >
                              View Profile →
                            </button>
                          </>
                        ) : outgoingRequest ? (
                          <span className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-300">
                            ◷ Request Pending
                          </span>
                        ) : incomingRequest ? (
                          <>
                            <button
                              onClick={() =>
                                respondToRequest(
                                  incomingRequest.request_id,
                                  "accepted"
                                )
                              }
                              disabled={connectionBusy === incomingRequest.request_id}
                              className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-400 disabled:opacity-50"
                            >
                              {connectionBusy === incomingRequest.request_id
                                ? "Please wait..."
                                : "Accept Request"}
                            </button>

                            <button
                              onClick={() =>
                                respondToRequest(
                                  incomingRequest.request_id,
                                  "rejected"
                                )
                              }
                              disabled={connectionBusy === incomingRequest.request_id}
                              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-red-400 hover:text-red-300 disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => sendConnectionRequest(match.user_id)}
                            disabled={connectionBusy === match.user_id}
                            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-950/30 transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {connectionBusy === match.user_id
                              ? "Sending..."
                              : "＋ Connect"}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="border-t border-slate-800 py-7 text-center text-xs text-slate-500">
          © 2026 RoomieMatch · Find your people, find your place. 🏠
        </footer>
      </div>
    </main>
  );
}
