import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function Features() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 min-h-screen bg-background-dark">
        <section className="relative overflow-hidden mb-20">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight mb-6 text-white">
                    More than just a <span className="text-gradient-orange">savings app.</span>
                </h1>
                <p className="text-lg text-muted-dark max-w-2xl mx-auto">
                    PocketPal gives you the tools to take control of your finances without the boredom. 
                    It's built for your lifestyle.
                </p>
            </div>
        </section>

        <section className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Feature 1 */}
                    <div className="bg-surface-dark border border-white/5 rounded-3xl p-8 lg:p-12 hover:border-primary/30 transition-all duration-300 group">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                             <span className="material-icons-round text-blue-500 text-4xl">account_balance_wallet</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Total Control</h3>
                        <p className="text-muted-dark text-lg leading-relaxed">
                            Control your allowance, not your entire bank balance. Set specific spending limits for different categories like food, transport, and fun.
                        </p>
                    </div>

                     {/* Feature 2 */}
                    <div className="bg-surface-dark border border-white/5 rounded-3xl p-8 lg:p-12 hover:border-primary/30 transition-all duration-300 group">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                             <span className="material-icons-round text-primary text-4xl">local_fire_department</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Streaks & Challenges</h3>
                        <p className="text-muted-dark text-lg leading-relaxed">
                            Turn consistency into a habit. Maintain your weekly saving streaks and participate in community challenges to prove your skills.
                        </p>
                    </div>

                     {/* Feature 3 */}
                    <div className="bg-surface-dark border border-white/5 rounded-3xl p-8 lg:p-12 hover:border-primary/30 transition-all duration-300 group">
                        <div className="w-16 h-16 bg-accent-gold/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                             <span className="material-icons-round text-accent-gold text-4xl">emoji_events</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Real Rewards</h3>
                        <p className="text-muted-dark text-lg leading-relaxed">
                            Earn Pocket Coins for every goal achieved. Use them to unlock exclusive skins for Pally or redeem them for real campus perks.
                        </p>
                    </div>

                     {/* Feature 4 */}
                    <div className="bg-surface-dark border border-white/5 rounded-3xl p-8 lg:p-12 hover:border-primary/30 transition-all duration-300 group">
                        <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                             <span className="material-icons-round text-green-500 text-4xl">lock_open</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Always Flexible</h3>
                        <p className="text-muted-dark text-lg leading-relaxed">
                            Your money stays yours. Withdraw anytime back to your linked bank account instantly. No lock-in periods, no hidden fees.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <section className="py-20 text-center">
             <div className="max-w-4xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-white mb-8">Ready to level up?</h2>
                <a
                  className="inline-flex bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-primary/25 items-center justify-center gap-2 transform hover:-translate-y-1"
                  href="#"
                >
                  Get the App
                  <span className="material-icons-round text-xl">arrow_forward</span>
                </a>
             </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
