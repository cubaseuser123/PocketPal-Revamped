import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import TypewriterQuote from '../../components/TypewriterQuote';

export default function PallyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 min-h-screen bg-background-dark">
        <section className="text-center mb-16 px-4">
             <div className="inline-block relative">
                 <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8 mx-auto hover:scale-105 transition-transform duration-500 cursor-pointer z-10">
                    <img src="/pally-mascot-0.png" alt="Pally Mascot" className="w-full h-full object-contain drop-shadow-2xl" />
                 </div>
                 <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-12 bg-black/40 blur-xl rounded-full"></div>
             </div>
             <h1 className="text-4xl lg:text-7xl font-extrabold tracking-tight mb-6 text-white mt-8">
                Say hello to <span className="text-primary">Pally.</span>
            </h1>
            <p className="text-xl text-muted-dark max-w-2xl mx-auto">
                Your new financial best friend. He's here to help you save more, spend less, and look good doing it.
            </p>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Card 1 */}
                <div className="bg-surface-dark border border-white/5 rounded-3xl p-8 text-center hover:bg-white/5 transition-colors group">
                    <div className="text-5xl mb-6 group-hover:scale-125 transition-transform duration-300">📢</div>
                    <h3 className="text-2xl font-bold text-white mb-3">Daily Nudges</h3>
                    <p className="text-muted-dark">
                        "Hey, maybe skip that third coffee?" Pally gives you friendly reminders to keep your budget on track.
                    </p>
                </div>
                 {/* Card 2 */}
                <div className="bg-surface-dark border border-white/5 rounded-3xl p-8 text-center hover:bg-white/5 transition-colors group">
                    <div className="text-5xl mb-6 group-hover:scale-125 transition-transform duration-300">🧢</div>
                    <h3 className="text-2xl font-bold text-white mb-3">Style Your Squirrel</h3>
                    <p className="text-muted-dark">
                        Unlock hats, glasses, and outfits as you reach your savings goals. Your success looks good on him.
                    </p>
                </div>
                 {/* Card 3 */}
                <div className="bg-surface-dark border border-white/5 rounded-3xl p-8 text-center hover:bg-white/5 transition-colors group">
                    <div className="text-5xl mb-6 group-hover:scale-125 transition-transform duration-300">🧠</div>
                    <h3 className="text-2xl font-bold text-white mb-3">Smart Insights</h3>
                    <p className="text-muted-dark">
                        Pally learns your habits and gives you personalized tips to stretch your allowance further.
                    </p>
                </div>
            </div>
        </section>

        <section className="py-20">
             <TypewriterQuote />
        </section>
      </main>
      <Footer />
    </>
  );
}
