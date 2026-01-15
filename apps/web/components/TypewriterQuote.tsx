"use client";

import { useState, useEffect } from "react";

const QUOTES = [
  "Start small. That's how habits stick.",
  "Small saves beat big regrets.",
  "Consistency is the secret sauce.",
  "Every Rupee saved is a level up.",
  "Treat your savings like high score."
];

export default function TypewriterQuote() {
  const [text, setText] = useState("");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    const currentQuote = QUOTES[quoteIndex] || "";

    const handleTyping = () => {
      if (isDeleting) {
        setText((prev) => currentQuote.substring(0, prev.length - 1));
        setTypingSpeed(50); // Faster deleting
      } else {
        setText((prev) => currentQuote.substring(0, prev.length + 1));
        setTypingSpeed(100); // Normal typing
      }

      if (!isDeleting && text === currentQuote) {
        // Finished typing entire quote
        setTimeout(() => setIsDeleting(true), 2000); // Wait before deleting
      } else if (isDeleting && text === "") {
        // Finished deleting
        setIsDeleting(false);
        setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, quoteIndex, typingSpeed]);

  return (
    <div className="max-w-4xl mx-auto px-4 bg-gradient-to-r from-primary/20 to-accent-gold/20 rounded-3xl p-12 text-center border border-white/10 relative overflow-hidden min-h-[300px] flex flex-col justify-center items-center">
      <div className="absolute top-0 right-0 p-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 p-32 bg-accent-gold/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

      <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 relative z-10 min-h-[3.5rem]">
        "{text}"
        <span className="animate-pulse text-primary">|</span>
      </h2>
      <p className="text-accent-gold font-bold uppercase tracking-widest relative z-10">
        - Pally
      </p>
    </div>
  );
}
