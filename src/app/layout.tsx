import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import AuthWatcher from "@/components/auth-watcher";

export const viewport: Viewport = { themeColor: "#0b0b0d" };

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: { default: "Minute Mystery", template: "%s • Minute Mystery" },
  description: "60-second character guessing across fandoms.",
  applicationName: "Minute Mystery",
  keywords: ["guessing", "trivia", "fandom", "timer"],
  icons: { icon: [{ url: "/favicon.svg" }] },
  openGraph: { images: ["/opengraph-image.svg"] },
  twitter: { images: ["/opengraph-image.svg"] }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="accent-none">
        <AuthWatcher/>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
