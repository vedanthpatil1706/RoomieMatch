
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "https://roomiematch-ohpj.onrender.com";

const interestOptions = [
  "Technology",
  "Travel",
  "Reading",
  "Music",
  "Gaming",
  "Sports",
  "Cooking",
  "Fitness",
  "Movies",
  "Photography",
];

export default function ProfilePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    age: "",
    gender: "",
    university: "",
    city: "",
    budget_min: "",
    budget_max: "",
    food_preference: "",
    smoking: "false",
    drinking: "false",
    sleep_schedule: "",
  });

  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("roomiematch_token");

    if (!token) {
      router.push("/");
    }
  }, [router]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function toggleInterest(interest: string) {
    setInterests((previous) =>
      previous.includes(interest)
        ? previous.filter((item) => item !== interest)
        : [...previous, interest]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMessage("");

    const token = localStorage.getItem("roomiematch_token");

    if (!token) {
      setError("Please log in again.");
      router.push("/");
      return;
    }

    if (Number(form.budget_max) < Number(form.budget_min)) {
      setError("Maximum budget must be greater than minimum budget.");
      return;
    }

    setLoading(true);

    const profileData = {
      age: Number(form.age),
      gender: form.gender,
      university: form.university,
      city: form.city,
      budget_min: Number(form.budget_min),
      budget_max: Number(form.budget_max),
      food_preference: form.food_preference,
      smoking: form.smoking === "true",
      drinking: form.drinking === "true",
      sleep_schedule: form.sleep_schedule,
      interests: interests,
    };

    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not save your profile.");
      }

      setMessage("Your profile has been saved successfully!");

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400";

  const labelClass = "mb-2 block text-sm font-medium text-slate-300";

  return (
    <main className="animated-bg relative min-h-screen overflow-hidden px-5 py-12">
      <div className="orb orb-one" />
      <div className="orb orb-two" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mb-3 text-5xl">🏠</div>

          <h1 className="text-3xl font-bold sm:text-4xl">
            Create Your <span className="gradient-text">RoomieMatch</span>{" "}
            Profile
          </h1>

          <p className="mt-3 text-slate-400">
            Tell us about yourself and find your perfect roommate.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-card space-y-7 rounded-3xl p-6 sm:p-9"
        >
          <section>
            <h2 className="mb-5 text-xl font-semibold text-cyan-300">
              Personal Information
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Age</label>
                <input
                  className={inputClass}
                  type="number"
                  name="age"
                  min="18"
                  max="100"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="Enter your age"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Gender</label>
                <select
                  className={inputClass}
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>University</label>
                <input
                  className={inputClass}
                  name="university"
                  value={form.university}
                  onChange={handleChange}
                  placeholder="Your university"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>City</label>
                <input
                  className={inputClass}
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. Pune"
                  required
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-5 text-xl font-semibold text-cyan-300">
              Budget Preferences
            </h2>

            <p className="mb-4 text-sm text-slate-400">
              Enter your monthly accommodation budget in INR.
            </p>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Minimum Budget (₹)</label>
                <input
                  className={inputClass}
                  type="number"
                  name="budget_min"
                  min="0"
                  value={form.budget_min}
                  onChange={handleChange}
                  placeholder="e.g. 8000"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Maximum Budget (₹)</label>
                <input
                  className={inputClass}
                  type="number"
                  name="budget_max"
                  min="0"
                  value={form.budget_max}
                  onChange={handleChange}
                  placeholder="e.g. 15000"
                  required
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-5 text-xl font-semibold text-cyan-300">
              Lifestyle Preferences
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Food Preference</label>
                <select
                  className={inputClass}
                  name="food_preference"
                  value={form.food_preference}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select preference</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="No Preference">No Preference</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Sleep Schedule</label>
                <select
                  className={inputClass}
                  name="sleep_schedule"
                  value={form.sleep_schedule}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select schedule</option>
                  <option value="Regular">Regular</option>
                  <option value="Night Owl">Night Owl</option>
                  <option value="Early Bird">Early Bird</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Smoking</label>
                <select
                  className={inputClass}
                  name="smoking"
                  value={form.smoking}
                  onChange={handleChange}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Drinking</label>
                <select
                  className={inputClass}
                  name="drinking"
                  value={form.drinking}
                  onChange={handleChange}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-cyan-300">
              Your Interests
            </h2>

            <p className="mb-5 text-sm text-slate-400">
              Select interests to help us find compatible roommates.
            </p>

            <div className="flex flex-wrap gap-3">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    interests.includes(interest)
                      ? "border-cyan-400 bg-cyan-400/20 text-cyan-200"
                      : "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-cyan-500"
                  }`}
                >
                  {interests.includes(interest) ? "✓ " : "+ "}
                  {interest}
                </button>
              ))}
            </div>
          </section>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="glow-button w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving Profile..." : "Save My Profile →"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          RoomieMatch · Find your people, find your place.
        </p>
      </div>
    </main>
  );
}
