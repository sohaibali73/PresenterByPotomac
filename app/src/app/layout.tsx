import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Potomac Presentation Generator",
  description: "Generate brand-compliant Potomac PowerPoint presentations using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-potomac-lightgray antialiased">
        {children}
      </body>
    </html>
  );
}
