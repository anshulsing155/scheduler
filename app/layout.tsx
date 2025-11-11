import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";

export const metadata: Metadata = {
  title: {
    default: "Calendly Scheduler - Smart Scheduling Made Simple",
    template: "%s | Calendly Scheduler"
  },
  description: "Stop the back-and-forth emails. Let people book time with you seamlessly. Smart scheduling with calendar integration, team coordination, and automated reminders.",
  keywords: ["scheduling", "calendar", "booking", "appointments", "meetings", "calendly", "time management"],
  authors: [{ name: "Calendly Scheduler" }],
  creator: "Calendly Scheduler",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://scheduler.example.com",
    title: "Calendly Scheduler - Smart Scheduling Made Simple",
    description: "Stop the back-and-forth emails. Let people book time with you seamlessly.",
    siteName: "Calendly Scheduler",
  },
  twitter: {
    card: "summary_large_image",
    title: "Calendly Scheduler - Smart Scheduling Made Simple",
    description: "Stop the back-and-forth emails. Let people book time with you seamlessly.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#3B82F6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg"
        >
          Skip to main content
        </a>
        <AuthProvider>
          <div id="main-content">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
