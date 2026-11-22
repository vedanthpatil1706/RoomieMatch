
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type RoommateProfile = {
  age?: number;
  budget_min?: number;
  budget_max?: number;
  city?: string;
  drinking?: boolean;
  food_preference?: string;
  gender?: string;
  interests?: string[];
  sleep_schedule?: string;
  smoking?: boolean;
  university?: string;
};

type RoommateData = {
  name: string;
  email: string;
  profile: RoommateProfile;
};

function RoommateProfileContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [roommate, setRoommate] = useState<RoommateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchRoommate() {
      const token = localStorage.getItem("roomiematch_token");

      if (!token) {
        router.push("/");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/connections/profile/${id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to load roommate profile."
          );
        }

        setRoommate(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchRoommate();
    }
  }, [id, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-cyan-300 text-lg animate-pulse">
          Loading roommate profile...
        </p>
      </main>
    );
  }

  if (error || !roommate) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <button
          onClick={() => router.back()}
          className="mb-6 text-cyan-300 hover:text-cyan-200"
        >
          ← Go Back
        </button>

        <div className="mx-auto max-w-xl rounded-2xl border border-red-500/30 bg-slate-900 p-6">
          <h1 className="text-xl font-bold text-red-400">
            Unable to load profile
          </h1>
          <p className="mt-3 text-slate-300">
            {error || "Profile not found."}
          </p>
        </div>
      </main>
    );
  }

  const p = roommate.profile;

  const InfoCard = ({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }) => (
    <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 font-semibold text-white break-words">
        {value}
      </p>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-3xl">

        <button
          onClick={() => router.back()}
          className="mb-8 text-cyan-300 transition hover:text-cyan-200"
        >
          ← Back to Connections
        </button>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">

          <div className="border-b border-slate-800 bg-gradient-to-r from-cyan-950/60 to-slate-900 p-7">
            <p className="text-sm font-semibold tracking-widest text-cyan-400">
              CONNECTED ROOMMATE
            </p>

            <h1 className="mt-3 text-3xl font-bold">
              {roommate.name}
            </h1>

            <p className="mt-2 text-slate-400">
              {roommate.email}
            </p>
          </div>

          <div className="p-7">

            <h2 className="mb-5 text-xl font-bold">
              Personal Details
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard
                label="Age"
                value={p.age ?? "Not provided"}
              />

              <InfoCard
                label="Gender"
                value={p.gender ?? "Not provided"}
              />

              <InfoCard
                label="City"
                value={p.city ?? "Not provided"}
              />

              <InfoCard
                label="University"
                value={p.university ?? "Not provided"}
              />
            </div>

            <h2 className="mb-5 mt-9 text-xl font-bold">
              Room Preferences
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard
                label="Minimum Budget"
                value={
                  p.budget_min != null
                    ? `₹${p.budget_min}`
                    : "Not provided"
                }
              />

              <InfoCard
                label="Maximum Budget"
                value={
                  p.budget_max != null
                    ? `₹${p.budget_max}`
                    : "Not provided"
                }
              />

              <InfoCard
                label="Food Preference"
                value={p.food_preference ?? "Not provided"}
              />

              <InfoCard
                label="Sleep Schedule"
                value={p.sleep_schedule ?? "Not provided"}
              />

              <InfoCard
                label="Smoking"
                value={
                  p.smoking == null
                    ? "Not provided"
                    : p.smoking
                    ? "Yes"
                    : "No"
                }
              />

              <InfoCard
                label="Drinking"
                value={
                  p.drinking == null
                    ? "Not provided"
                    : p.drinking
                    ? "Yes"
                    : "No"
                }
              />
            </div>

            <h2 className="mb-5 mt-9 text-xl font-bold">
              Interests & Hobbies
            </h2>

            <div className="flex flex-wrap items centre gap-3">
              {p.interests && p.interests.length > 0 ? (
                p.interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300"
                  >
                    {interest}
                  </span>
                ))
              ) : (
                <p className="text-slate-400">
                  No interests added.
                </p>
              )}
            </div>

          </div>
        </section>

        <p className="mt-6 text-center text-sm text-slate-500">
          RoomieMatch · Connected Roommate Profile
        </p>

      </div>
    </main>
  );
}

export default function RoommateProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 text-cyan-300">
          Loading roommate profile...
        </main>
      }
    >
      <RoommateProfileContent />
    </Suspense>
  );
}
