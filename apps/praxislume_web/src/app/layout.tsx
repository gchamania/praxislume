import type { Metadata } from "next";
import { PraxisProvider } from "@/components/praxis-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "PraxisLume Web",
  description: "PraxisLume Doctor Growth OS web client.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">
        <PraxisProvider>{children}</PraxisProvider>
      </body>
    </html>
  );
}
