import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Users, Zap, Shield, BarChart } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold">Calendly Scheduler</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/help">
                <Button variant="ghost">Help</Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Scheduling made <span className="text-blue-600">simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Stop the back-and-forth emails. Let people book time with you seamlessly.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/help">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="py-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to schedule smarter
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Clock className="h-8 w-8 text-blue-600" />}
              title="Smart Availability"
              description="Set your availability once and let guests book when you're free. Syncs with your existing calendars."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8 text-blue-600" />}
              title="Team Scheduling"
              description="Coordinate team meetings with collective or round-robin scheduling. Perfect for sales and support teams."
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8 text-blue-600" />}
              title="Automated Reminders"
              description="Reduce no-shows with automatic email and SMS reminders sent to your guests."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-blue-600" />}
              title="Secure & Private"
              description="Enterprise-grade security with 2FA, audit logs, and GDPR compliance built-in."
            />
            <FeatureCard
              icon={<BarChart className="h-8 w-8 text-blue-600" />}
              title="Analytics & Insights"
              description="Track booking trends, popular time slots, and optimize your availability."
            />
            <FeatureCard
              icon={<Calendar className="h-8 w-8 text-blue-600" />}
              title="Calendar Integration"
              description="Connect Google Calendar and Outlook to prevent double-bookings automatically."
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 text-center">
          <div className="bg-blue-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to simplify your scheduling?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of professionals who save time with smart scheduling.
            </p>
            <Link href="/auth/register">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="font-bold">Calendly Scheduler</span>
              </div>
              <p className="text-sm text-gray-600">
                Modern scheduling made simple.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/help" className="hover:text-blue-600">Features</Link></li>
                <li><Link href="/help" className="hover:text-blue-600">Pricing</Link></li>
                <li><Link href="/help" className="hover:text-blue-600">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/help" className="hover:text-blue-600">Help Center</Link></li>
                <li><Link href="/help/articles/getting-started" className="hover:text-blue-600">Getting Started</Link></li>
                <li><Link href="/help" className="hover:text-blue-600">API Docs</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/help" className="hover:text-blue-600">About</Link></li>
                <li><Link href="/help" className="hover:text-blue-600">Privacy</Link></li>
                <li><Link href="/help" className="hover:text-blue-600">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
            © {new Date().getFullYear()} Calendly Scheduler. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-lg border bg-white hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
