import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { AiAssistant } from "@/components/pitcrew/ai-assistant";
import "./globals.css";

export const metadata: Metadata = {
  title: "PitCrew — Clear repair approvals for shops and drivers",
  description:
    "PitCrew turns technician notes into plain-English repair reports: shops close approvals faster, drivers see photos, severity and price before they say yes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        {children}
        <AiAssistant />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
