import type { Metadata, Viewport } from "next";
import { MotionProvider } from "@/components/motion/motion-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Relay — AI Support Agent",
  description: "Grounded, tool-using customer support for Fjellvik Gear.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
