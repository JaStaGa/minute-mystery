import type { Metadata, Viewport } from "next";
import "./globals.css";
import UserMenu from "@/components/user-menu";
import Link from "next/link";

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
      <body>
        <header className="p-4 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight hover:opacity-80">
            Minute Mystery
          </Link>
          <UserMenu />
        </header>
        {children}
      </body>
    </html>
  );
}
