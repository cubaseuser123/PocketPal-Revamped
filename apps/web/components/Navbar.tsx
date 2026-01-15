"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { smoothScrollTo, smoothScrollToElement } from "../utils/smoothScroll";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleScrollToTop = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      smoothScrollTo(0);
    }
  };

  const handleGetApp = (e: React.MouseEvent) => {
    e.preventDefault();
    // Try to find element first
    const footer = document.getElementById("get-app");
    
    if (footer) {
      smoothScrollToElement("get-app");
    } else {
      // If not on home page, navigate to home with hash (though footer ID usually exists on layout, assumption is landing page)
      // If footer is on every page, this works. If only on landing...
      if (pathname !== "/") {
        router.push("/#get-app");
      }
    }
  };

  return (
    <nav className="fixed w-full z-50 transition-all duration-300 bg-surface-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-gray-200 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" onClick={handleScrollToTop} className="flex items-center space-x-2 relative z-10">
            <img src="/pally-logo.png" alt="PocketPal Logo" className="w-10 h-10" />
            <span className="font-bold text-lg tracking-tight">PocketPal</span>
          </Link>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex space-x-8 text-sm font-medium">
            <Link
              className="text-muted-light dark:text-muted-dark hover:text-primary dark:hover:text-primary transition-colors"
              href="/features"
            >
              Features
            </Link>
            <Link
              className="text-muted-light dark:text-muted-dark hover:text-primary dark:hover:text-primary transition-colors"
              href="/how-it-works"
            >
              How it works
            </Link>
            <Link
              className="text-muted-light dark:text-muted-dark hover:text-primary dark:hover:text-primary transition-colors"
              href="/pally"
            >
              Meet Pally
            </Link>
          </div>
          <div className="flex items-center space-x-4 relative z-10">
            <Link
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-full font-semibold transition-all shadow-lg shadow-primary/20 text-xs"
              href="/#get-app"
              onClick={handleGetApp}
            >
              Get App
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
