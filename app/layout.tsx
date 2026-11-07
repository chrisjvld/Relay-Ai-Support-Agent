import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Relay — AI Support Agent",
  description: "Grounded, tool-using customer support for Fjellvik Gear.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
