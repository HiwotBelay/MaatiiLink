import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MaatiiLink",
  description:
    "Branch-to-Head Office operations platform for Cooperative Bank of Oromia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
