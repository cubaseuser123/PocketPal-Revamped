"use client";

import { useState } from "react";
import { smoothScrollToElement } from "../utils/smoothScroll";
import Toast from "./Toast";

export default function LandingHero() {
  const [showToast, setShowToast] = useState(false);

  const handleStartPlaying = (e: React.MouseEvent) => {
    e.preventDefault();
    smoothScrollToElement("get-app");
  };

  const handleViewDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowToast(true);
  };

  return (
    <header className="relative overflow-hidden pb-20 pt-24 lg:pb-32 lg:pt-32">
      <Toast
        message="Demo is under construction!"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      <div className="bg-primary/20 pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/3 rounded-full blur-[120px]"></div>
      <div className="bg-accent-gold/10 pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/4 translate-y-1/4 rounded-full blur-[100px]"></div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Left Content */}
          <div className="max-w-2xl">
            <div className="bg-primary/10 border-primary/20 mb-6 inline-flex items-center space-x-2 rounded-full border px-4 py-1.5">
              <span className="bg-primary h-2 w-2 animate-pulse rounded-full"></span>
              <span className="text-primary text-xs font-semibold uppercase tracking-wide">
                Beta Available Now
              </span>
            </div>

            <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight text-gray-900 lg:text-7xl dark:text-white">
              Turn saving money into a{" "}
              <span className="text-gradient-orange">game.</span>
            </h1>

            <p className="text-muted-light dark:text-muted-dark mb-10 max-w-lg text-lg leading-relaxed lg:text-xl">
              Stop dreading your budget. Level up your finances, earn rewards,
              and keep Pally happy with every rupee you save.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                className="bg-primary hover:bg-primary-hover shadow-primary/25 flex transform cursor-pointer items-center justify-center gap-2 rounded-full px-8 py-4 text-lg font-bold text-white shadow-xl transition-all hover:-translate-y-1"
                onClick={handleStartPlaying}
              >
                Start Playing
                <span className="material-icons-round text-xl">
                  sports_esports
                </span>
              </a>
              <a
                className="glass-panel text-text-light hover:bg-surface-light flex cursor-pointer items-center justify-center gap-2 rounded-full border border-gray-200 px-8 py-4 text-lg font-semibold transition-all dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                onClick={handleViewDemo}
              >
                View Demo
                <span className="material-icons-round text-xl">play_arrow</span>
              </a>
            </div>

            <div className="text-muted-light dark:text-muted-dark mt-12 flex items-center gap-4 text-sm">
              <div className="flex -space-x-3">
                <img
                  src="https://i.pravatar.cc/100?img=33"
                  alt="User"
                  className="border-background-light dark:border-background-dark h-10 w-10 rounded-full border-2 object-cover"
                />
                <img
                  src="https://i.pravatar.cc/100?img=47"
                  alt="User"
                  className="border-background-light dark:border-background-dark h-10 w-10 rounded-full border-2 object-cover"
                />
                <img
                  src="https://i.pravatar.cc/100?img=12"
                  alt="User"
                  className="border-background-light dark:border-background-dark h-10 w-10 rounded-full border-2 object-cover"
                />
                <div className="border-background-light dark:border-background-dark flex h-10 w-10 items-center justify-center rounded-full border-2 bg-gray-200 text-xs font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  +2k
                </div>
              </div>
              <p>Join 10,000+ students saving smarter.</p>
            </div>
          </div>

          {/* Right Image/Animation */}
          <div className="relative flex items-center justify-center lg:h-[700px]">
            <div className="from-primary/30 absolute inset-0 scale-75 transform rounded-full bg-gradient-to-b to-transparent opacity-50 blur-3xl"></div>
            <div className="relative z-20 aspect-[9/19.5] w-[320px] rotate-[-6deg] overflow-hidden rounded-[3rem] border-8 border-gray-900 bg-gray-900 shadow-2xl ring-1 ring-white/10 transition-transform duration-700 ease-out hover:rotate-0 sm:w-[350px] dark:border-gray-800">
              <img
                alt="PocketPal Dashboard Screen"
                className="h-full w-full object-cover"
                src="/simulator.png"
              />
              <div className="pointer-events-none absolute right-0 top-0 h-full w-full bg-gradient-to-tr from-white/5 to-transparent"></div>
            </div>

            {/* Floating Cards */}
            <div className="glass-panel floating border-l-primary absolute -right-4 top-1/4 z-30 rounded-2xl border-l-4 p-4 shadow-xl duration-[3000ms]">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-500/20 p-2">
                  <span className="material-icons-round text-green-500">
                    trending_up
                  </span>
                </div>
                <div>
                  <p className="text-muted-dark text-xs font-medium">
                    Weekly Savings
                  </p>
                  <p className="text-sm font-bold dark:text-white">+ ₹112.00</p>
                </div>
              </div>
            </div>

            <div className="glass-panel floating-delayed border-l-accent-gold absolute -left-8 bottom-1/4 z-30 rounded-2xl border-l-4 p-4 shadow-xl duration-[4000ms]">
              <div className="flex items-center gap-3">
                <div className="bg-accent-gold/20 rounded-lg p-2">
                  <span className="material-icons-round text-accent-gold">
                    emoji_events
                  </span>
                </div>
                <div>
                  <p className="text-muted-dark text-xs font-medium">
                    New Achievement
                  </p>
                  <p className="text-sm font-bold dark:text-white">
                    Level 16 Unlocked!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
