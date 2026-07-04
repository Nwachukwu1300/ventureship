import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Submission Scorer",
  description: "Score candidate submissions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-stone-50 text-stone-900">
        {children}
      </body>
    </html>
  );
}
