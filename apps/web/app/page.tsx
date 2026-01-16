/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LandingHero from "../components/LandingHero";

export default function Home() {
  return (
    <>
      <Navbar />
      <LandingHero />
      <section className="dark:bg-surface-dark border-y border-gray-200 bg-white py-20 dark:border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold dark:text-white">
              Why PocketPal?
            </h2>
            <p className="text-muted-light dark:text-muted-dark">
              Traditional banking apps are boring. We built something that
              actually keeps you engaged with your money.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="bg-background-light dark:bg-background-dark hover:border-primary/50 group rounded-3xl border border-gray-200 p-8 transition-all dark:border-white/5">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 transition-colors group-hover:bg-blue-500/20">
                <span className="material-icons-round text-3xl text-blue-500">
                  psychology
                </span>
              </div>
              <h3 className="mb-3 text-xl font-bold dark:text-white">
                Smart Predictions
              </h3>
              <p className="text-muted-light dark:text-muted-dark leading-relaxed">
                Know when you are about to overspend before it happens. Our AI
                analyzes your habits.
              </p>
            </div>
            <div className="bg-background-light dark:bg-background-dark hover:border-primary/50 group relative overflow-hidden rounded-3xl border border-gray-200 p-8 transition-all dark:border-white/5">
              <div className="bg-primary/5 absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full blur-2xl"></div>
              <div className="bg-primary/10 group-hover:bg-primary/20 mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors">
                <span className="material-icons-round text-primary text-3xl">
                  videogame_asset
                </span>
              </div>
              <h3 className="mb-3 text-xl font-bold dark:text-white">
                Gamified Savings
              </h3>
              <p className="text-muted-light dark:text-muted-dark leading-relaxed">
                Complete daily quests, earn XP, and level up your financial
                profile. Saving is now fun.
              </p>
            </div>
            <div className="bg-background-light dark:bg-background-dark hover:border-primary/50 group rounded-3xl border border-gray-200 p-8 transition-all dark:border-white/5">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 transition-colors group-hover:bg-purple-500/20">
                <span className="material-icons-round text-3xl text-purple-500">
                  shield
                </span>
              </div>
              <h3 className="mb-3 text-xl font-bold dark:text-white">
                Student Friendly
              </h3>
              <p className="text-muted-light dark:text-muted-dark leading-relaxed">
                Built for campus life. Track split bills, canteen spends, and
                weekend outings easily.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="relative overflow-hidden py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 flex flex-col items-center justify-between md:flex-row">
            <h2 className="text-3xl font-bold md:text-4xl dark:text-white">
              Simple as <span className="text-primary">1, 2, 3</span>
            </h2>
            <a
              className="text-primary hidden items-center font-semibold transition-all hover:gap-2 md:flex"
              href="#"
            >
              See full guide{" "}
              <span className="material-icons-round ml-1">arrow_forward</span>
            </a>
          </div>
          <div className="relative">
            <div className="absolute left-0 top-1/2 z-0 hidden h-1 w-full -translate-y-1/2 bg-gray-200 md:block dark:bg-gray-800"></div>
            <div className="relative z-10 grid grid-cols-1 gap-12 md:grid-cols-3">
              <div className="dark:bg-surface-dark flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-lg md:block md:text-left dark:border-white/10">
                <div className="shadow-glow mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-xl font-bold text-white dark:bg-white dark:text-gray-900">
                  1
                </div>
                <h4 className="mb-2 text-lg font-bold dark:text-white">
                  Setup Wallet
                </h4>
                <p className="text-muted-light dark:text-muted-dark text-sm">
                  Complete your Min. KYC in under 2 minutes. Secure, fast, and
                  fully digital.
                </p>
              </div>
              <div className="dark:bg-surface-dark flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-lg md:block md:text-left dark:border-white/10">
                <div className="bg-accent-gold shadow-glow mb-6 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-gray-900">
                  2
                </div>
                <h4 className="mb-2 text-lg font-bold dark:text-white">
                  Set Goals
                </h4>
                <p className="text-muted-light dark:text-muted-dark text-sm">
                  Tell Pally what you re saving for: a trip, a laptop, or just
                  rainy days.
                </p>
              </div>
              <div className="dark:bg-surface-dark flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-lg md:block md:text-left dark:border-white/10">
                <div className="bg-primary shadow-glow mb-6 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-white">
                  3
                </div>
                <h4 className="mb-2 text-lg font-bold dark:text-white">
                  Earn & Grow
                </h4>
                <p className="text-muted-light dark:text-muted-dark text-sm">
                  Spend wisely, save automatically, and watch your virtual world
                  grow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-surface-dark relative overflow-hidden py-20">
        <div className="from-primary/5 absolute inset-0 bg-gradient-to-br to-transparent"></div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col-reverse items-center gap-16 lg:flex-row">
            <div className="lg:w-1/2">
              <div className="group relative">
                <div className="rotate-3 rounded-[40px] bg-gradient-to-br from-gray-800 to-black p-1 shadow-2xl transition-transform duration-500 group-hover:rotate-0">
                  <div className="bg-surface-dark relative overflow-visible rounded-[36px] border border-white/10 p-8">
                    <div className="relative mx-auto mb-6 h-24 w-24">
                      <div className="bg-accent-gold/20 absolute inset-0 rounded-full"></div>
                      <img
                        src="/pally-mascot-1.png"
                        alt="Pally Mascot"
                        className="absolute -bottom-8 left-1/2 z-10 w-36 max-w-none -translate-x-1/2 drop-shadow-2xl transition-transform duration-300 hover:scale-110"
                      />
                    </div>
                    <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                      <p className="text-accent-gold mb-1 text-xs font-bold uppercase tracking-wider">
                        Pally Tip
                      </p>
                      <p className="font-medium text-white">
                        Small saves beat big regrets. Let's go! You saved ₹50 on
                        coffee today.
                      </p>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
                      <div className="bg-primary h-full w-3/4 rounded-full"></div>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-gray-400">
                      <span>XP: 750/1000</span>
                      <span>Level 1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-left lg:w-1/2">
              <span className="text-accent-gold mb-2 block text-sm font-bold uppercase tracking-wider">
                Your Financial Companion
              </span>
              <h2 className="mb-6 text-4xl font-extrabold text-white lg:text-5xl">
                Meet Pally.
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-gray-400">
                Pally isn t just a mascot. He's your coach. He celebrates your
                wins, nudges you when you're off track, and gives you
                personalized tips to stretch your budget further.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="material-icons-round text-primary mt-1">
                    check_circle
                  </span>
                  <span className="text-gray-300">
                    Daily nudges to keep you on track without being annoying.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-icons-round text-primary mt-1">
                    check_circle
                  </span>
                  <span className="text-gray-300">
                    Unlock new outfits and accessories for Pally as you save.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-icons-round text-primary mt-1">
                    check_circle
                  </span>
                  <span className="text-gray-300">
                    Get plain English explanations for confusing financial
                    terms.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-background-light dark:bg-background-dark py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold dark:text-white">
              Everything you need to grow
            </h2>
            <p className="text-muted-light dark:text-muted-dark mt-4">
              Packed with features designed for the modern student lifestyle.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="dark:bg-surface-dark hover:border-primary/50 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-colors dark:border-white/5">
              <div className="mb-8 flex items-start justify-between">
                <div className="rounded-xl bg-green-500/10 p-3">
                  <span className="material-icons-round text-2xl text-green-500">
                    track_changes
                  </span>
                </div>
                <span className="rounded-md bg-green-500/20 px-2 py-1 text-xs font-bold text-green-500">
                  ON TRACK
                </span>
              </div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                Weekly Goals
              </h3>
              <p className="text-muted-light dark:text-muted-dark">
                Set realistic weekly spending limits. Visualize your progress
                with simple bars and get alerts before you hit the limit.
              </p>
            </div>
            <div className="dark:bg-surface-dark hover:border-primary/50 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-colors dark:border-white/5">
              <div className="mb-8 flex items-start justify-between">
                <div className="bg-primary/10 rounded-xl p-3">
                  <span className="material-icons-round text-primary text-2xl">
                    insights
                  </span>
                </div>
              </div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                Deep Insights
              </h3>
              <p className="text-muted-light dark:text-muted-dark">
                See exactly where your money goes. Food? Projected to be 15%
                higher this weekend? We'll let you know.
              </p>
            </div>
            <div className="dark:bg-surface-dark hover:border-primary/50 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-colors dark:border-white/5">
              <div className="mb-8 flex items-start justify-between">
                <div className="rounded-xl bg-blue-500/10 p-3">
                  <span className="material-icons-round text-2xl text-blue-500">
                    account_balance_wallet
                  </span>
                </div>
              </div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                Smart Wallets
              </h3>
              <p className="text-muted-light dark:text-muted-dark">
                Create separate digital envelopes for Rent, Food, and Fun. Keep
                your money organized automatically.
              </p>
            </div>
            <div className="dark:bg-surface-dark hover:border-primary/50 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-colors dark:border-white/5">
              <div className="mb-8 flex items-start justify-between">
                <div className="bg-accent-gold/10 rounded-xl p-3">
                  <span className="material-icons-round text-accent-gold text-2xl">
                    sports_esports
                  </span>
                </div>
                <span className="bg-accent-gold/20 text-accent-gold rounded-md px-2 py-1 text-xs font-bold">
                  NEW
                </span>
              </div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                Arcade Mode
              </h3>
              <p className="text-muted-light dark:text-muted-dark">
                Compete with friends on who can save the most percentage of
                their income. Winner gets bragging rights (and XP).
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="border-t border-gray-200 bg-white py-16 dark:border-white/5 dark:bg-black/20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl dark:bg-gray-800">
            🔒
          </div>
          <h2 className="mb-8 text-2xl font-bold dark:text-white">
            Built with trust in mind
          </h2>
          <div className="text-muted-light dark:text-muted-dark flex flex-wrap justify-center gap-8 text-sm font-medium md:gap-12">
            <div className="flex items-center gap-2">
              <span className="material-icons-round text-green-500">
                verified_user
              </span>
              256-bit Encryption
            </div>
            <div className="flex items-center gap-2">
              <span className="material-icons-round text-green-500">
                verified_user
              </span>
              Bank-grade Security
            </div>
            <div className="flex items-center gap-2">
              <span className="material-icons-round text-green-500">
                verified_user
              </span>
              No Data Selling
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
