
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "⌂" },
  { name: "My Profile", href: "/profile", icon: "👤" },
  { name: "Connections", href: "/connections", icon: "🤝" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname === "/") {
    return null;
  }

  function logout() {
    localStorage.removeItem("roomiematch_token");
    setMenuOpen(false);
    router.push("/");
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-5">

        <div className="flex h-18 items-center justify-between">

          {/* Logo */}
          <Link
            href="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="text-2xl font-extrabold tracking-tight text-cyan-400"
          >
            RoomieMatch<span className="text-white">.</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-2 md:flex">
            {navigation.map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "border border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}

            <button
              onClick={logout}
              className="ml-2 rounded-xl border border-red-400/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-400/10"
            >
              Logout ↗
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 text-white transition hover:bg-slate-800 md:hidden"
          >
            {menuOpen ? (
              <span className="text-2xl">×</span>
            ) : (
              <span className="text-2xl">☰</span>
            )}
          </button>

        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="border-t border-slate-800 py-4 md:hidden">
            <div className="flex flex-col gap-2">

              {navigation.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? "bg-cyan-400/10 text-cyan-300"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}

              <button
                onClick={logout}
                className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-300 transition hover:bg-red-400/10"
              >
                Logout ↗
              </button>

            </div>
          </div>
        )}

      </div>
    </nav>
  );
}
