import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import CommandPalette from "@/components/CommandPalette";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Melodia",
  description: "Cloud music streaming app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          {children}
          <Toaster 
            position="bottom-center"
            toastOptions={{
              style: {
                background: '#0c1220',
                color: '#e8f0ff',
                border: '1px solid rgba(168,207,255,0.15)',
              },
              success: {
                iconTheme: {
                  primary: '#A8CFFF',
                  secondary: '#0c1220',
                },
              },
            }}
          />
          <CommandPalette />
          <KeyboardShortcuts />
        </AuthProvider>
      </body>
    </html>
  );
}
