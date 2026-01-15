import type { Metadata } from "next";
/* eslint-disable @next/next/no-sync-scripts */

export const metadata: Metadata = {
  title: "PocketPal - Turn Saving Into a Game",
  description: "Stop dreading your budget. Level up your finances, earn rewards, and keep Pally happy with every rupee you save.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                darkMode: "class",
                theme: {
                  extend: {
                    colors: {
                      primary: "#FF8C32",
                      "primary-hover": "#e67319",
                      "accent-gold": "#FFD166",
                      "background-light": "#F8FAFC",
                      "background-dark": "#0F0F14",
                      "surface-dark": "#18181F",
                      "surface-light": "#FFFFFF",
                      "text-light": "#1E293B",
                      "text-dark": "#F8FAFC",
                      "muted-light": "#64748B",
                      "muted-dark": "#94A3B8",
                    },
                    fontFamily: {
                      sans: ["Inter", "sans-serif"],
                    },
                    borderRadius: {
                      DEFAULT: "12px",
                      "xl": "24px",
                      "2xl": "32px",
                    },
                  },
                },
              };
            `,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .glass-panel {
                background: rgba(24, 24, 31, 0.7);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.08);
              }
              .glow-effect {
                box-shadow: 0 0 40px -10px rgba(255, 140, 50, 0.3);
              }
              .text-gradient {
                background: linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
              }
              .text-gradient-orange {
                background: linear-gradient(135deg, #FF8C32 0%, #FFD166 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
              }
              .floating {
                animation: float 6s ease-in-out infinite;
              }
              .floating-delayed {
                animation: float 6s ease-in-out 3s infinite;
              }
              @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
                100% { transform: translateY(0px); }
              }
            `,
          }}
        />
      </head>
      <body className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-sans transition-colors duration-300 antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
