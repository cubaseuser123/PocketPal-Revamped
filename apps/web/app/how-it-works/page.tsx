import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function HowItWorks() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 min-h-screen bg-background-dark">
        <section className="text-center mb-20 px-4">
             <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight mb-6 text-white">
                How <span className="text-gradient-orange">PocketPal</span> Works
            </h1>
            <p className="text-lg text-muted-dark max-w-2xl mx-auto">
                No complex setups. No confusing jargon. Just 3 simple steps to effective saving.
            </p>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-white/5 -translate-x-1/2"></div>

            {/* Step 1 */}
            <div className="relative flex flex-col md:flex-row items-center justify-between mb-24 md:mb-32">
                 <div className="order-2 md:order-1 md:w-5/12 text-center md:text-right">
                    <h2 className="text-3xl font-bold text-white mb-4">1. Complete KYC</h2>
                    <p className="text-muted-dark text-lg">
                        Verify your identity securely using your PAN card. We use regulated PPI technology to create your personal digital wallet instantly without linking your main bank account.
                    </p>
                 </div>
                 <div className="order-1 md:order-2 z-10 mb-8 md:mb-0">
                    <div className="w-16 h-16 bg-gray-900 border-4 border-surface-dark rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-glow">
                        1
                    </div>
                 </div>
                 <div className="order-3 md:w-5/12 pl-0 md:pl-12">
                     <div className="bg-surface-dark p-6 rounded-2xl border border-white/5 shadow-lg transform rotate-2 hover:rotate-0 transition-transform duration-500">
                         <div className="flex items-center gap-4 mb-4">
                             <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                                 <span className="material-icons-round text-white">verified_user</span>
                             </div>
                             <div>
                                 <div className="h-2 w-24 bg-white/20 rounded mb-2"></div>
                                 <div className="h-2 w-16 bg-white/10 rounded"></div>
                             </div>
                         </div>
                         <div className="h-2 w-full bg-green-500/20 rounded overflow-hidden">
                             <div className="h-full w-full bg-green-500 animate-pulse"></div>
                         </div>
                         <p className="text-green-500 text-xs font-bold mt-2 text-right">VERIFIED</p>
                     </div>
                 </div>
            </div>

            {/* Step 2 */}
             <div className="relative flex flex-col md:flex-row items-center justify-between mb-24 md:mb-32">
                 <div className="order-2 md:w-5/12 pr-0 md:pr-12">
                      <div className="bg-surface-dark p-6 rounded-2xl border border-white/5 shadow-lg transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                         <div className="flex justify-between items-center mb-4">
                             <span className="text-white font-bold">New Laptop Goal</span>
                             <span className="text-primary font-bold">₹45,000</span>
                         </div>
                         <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden mb-2">
                             <div className="h-full w-1/3 bg-primary rounded-full"></div>
                         </div>
                         <p className="text-muted-dark text-xs">Target: Dec 2024</p>
                     </div>
                 </div>
                 <div className="order-1 z-10 mb-8 md:mb-0">
                    <div className="w-16 h-16 bg-primary border-4 border-surface-dark rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-glow">
                        2
                    </div>
                 </div>
                 <div className="order-3 md:w-5/12 text-center md:text-left">
                    <h2 className="text-3xl font-bold text-white mb-4">2. Set Your Goals</h2>
                    <p className="text-muted-dark text-lg">
                        Tell Pally what you're saving for. Whether it's a new laptop, a weekend trip, or just a rainy day fund. We'll help you break it down into manageable weekly chunks.
                    </p>
                 </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col md:flex-row items-center justify-between">
                 <div className="order-2 md:order-1 md:w-5/12 text-center md:text-right">
                    <h2 className="text-3xl font-bold text-white mb-4">3. Save, Earn & Grow</h2>
                    <p className="text-muted-dark text-lg">
                        Every time you come under budget, you earn XP and Pocket Coins. Watch your savings grow in real life while you level up in the app. It's a win-win.
                    </p>
                 </div>
                 <div className="order-1 md:order-2 z-10 mb-8 md:mb-0">
                    <div className="w-16 h-16 bg-accent-gold border-4 border-surface-dark rounded-full flex items-center justify-center text-gray-900 font-bold text-2xl shadow-glow">
                        3
                    </div>
                 </div>
                 <div className="order-3 md:w-5/12 pl-0 md:pl-12">
                     <div className="bg-surface-dark p-6 rounded-2xl border border-white/5 shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-500 text-center">
                         <img src="/pally-mascot-2.png" alt="Level Up Mascot" className="w-24 h-24 object-contain drop-shadow-lg mx-auto mb-2" />
                         <p className="text-white font-bold text-xl">Level Up!</p>
                         <p className="text-accent-gold text-base font-bold">+500 XP Earned</p>
                     </div>
                 </div>
            </div>

        </section>

         <section className="py-20 text-center mt-12">
             <div className="max-w-4xl mx-auto px-4">
                <a
                  className="inline-flex bg-primary hover:bg-primary-hover text-white px-10 py-5 rounded-full font-bold text-xl transition-all shadow-xl shadow-primary/25 items-center justify-center gap-2 transform hover:scale-105"
                  href="#"
                >
                  Start Your Journey
                </a>
             </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
