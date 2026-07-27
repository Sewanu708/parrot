"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Documentation", href: "#docs" },
  { label: "Pricing", href: "#pricing" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 bg-black transition-all duration-300 ${
        scrolled || menuOpen
          ? "border-b border-[#1A1A1A]"
          : "border-b border-transparent"
      }`}
    >
      {/* Top bar */}
      <div className="flex justify-between items-center w-full px-6 sm:px-8 py-5">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl tracking-tighter text-white"
          onClick={() => setMenuOpen(false)}
        >
          parrot.
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </Link>

        {/* Center Links — desktop only */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-neutral-400 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Login — desktop only */}
          <Link
            href="/auth/login"
            className="hidden md:block text-sm text-neutral-400 hover:text-white font-medium transition-colors"
          >
            Log in
          </Link>

          {/* Hamburger — mobile only */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="md:hidden flex flex-col justify-center gap-[5px] w-8 h-8"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span
              className={`block h-px bg-white transition-all duration-300 origin-center ${
                menuOpen ? "w-5 rotate-45 translate-y-[7px]" : "w-5"
              }`}
            />
            <span
              className={`block h-px bg-white transition-all duration-200 ${
                menuOpen ? "w-0 opacity-0" : "w-4"
              }`}
            />
            <span
              className={`block h-px bg-white transition-all duration-300 origin-center ${
                menuOpen ? "w-5 -rotate-45 -translate-y-[7px]" : "w-5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col px-6 pb-8 pt-2 border-t border-[#1A1A1A]">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm text-neutral-400 hover:text-white transition-colors py-4 border-b border-[#1A1A1A]"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="text-sm text-white font-medium pt-6"
          >
            Log in →
          </Link>
        </nav>
      </div>
    </header>
  );
}
