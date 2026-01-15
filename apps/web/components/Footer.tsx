import Link from 'next/link';

export default function Footer() {
  return (
    <footer id="get-app" className="bg-surface-dark relative overflow-hidden pt-24 pb-12">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
          Start small. Build better money habits.
        </h2>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Join the waitlist today and get an exclusive Early Bird skin for
          Pally when we launch.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20">
          <input
            className="px-6 py-4 rounded-full bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-80"
            placeholder="Enter your email"
            type="email"
          />
          <button className="bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg shadow-primary/25">
            Get Early Access
          </button>
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <img src="/pally-logo.png" alt="PocketPal Logo" className="w-10 h-10" />
            <span className="font-bold text-white text-lg">PocketPal</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a className="hover:text-white transition-colors" href="#">
              Privacy
            </a>
            <a className="hover:text-white transition-colors" href="#">
              Terms
            </a>
            <a className="hover:text-white transition-colors" href="#">
              Twitter
            </a>
            <a className="hover:text-white transition-colors" href="#">
              Instagram
            </a>
          </div>
          <p className="text-gray-600 text-sm">© 2026 PocketPal Inc.</p>
        </div>
      </div>
    </footer>
  );
}
