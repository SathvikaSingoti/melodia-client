import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import CommandPalette from "@/components/CommandPalette";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import MiniPlayer from "@/components/MiniPlayer";

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
                background: '#181616',
                color: '#ede8e4',
                border: '1px solid #2c2828',
              },
              success: {
                iconTheme: {
                  primary: '#c4a090',
                  secondary: '#181616',
                },
              },
              error: {
                iconTheme: {
                  primary: '#e87070',
                  secondary: '#181616',
                },
              },
            }}
          />
          <CommandPalette />
          <KeyboardShortcuts />
          <MiniPlayer />
        </AuthProvider>
      </body>
    </html>
  );
}
