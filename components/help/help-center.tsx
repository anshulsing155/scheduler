'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  BookOpen, 
  Video, 
  MessageCircle, 
  ExternalLink,
  ChevronRight,
  Calendar,
  Clock,
  Users,
  CreditCard,
  Settings,
  Bell
} from 'lucide-react'
import Link from 'next/link'

interface HelpArticle {
  id: string
  title: string
  description: string
  category: string
  icon: any
}

const helpArticles: HelpArticle[] = [
  {
    id: 'create-event-type',
    title: 'Creating Your First Event Type',
    description: 'Learn how to set up meeting templates with custom durations and settings',
    category: 'getting-started',
    icon: Calendar
  },
  {
    id: 'set-availability',
    title: 'Setting Your Availability',
    description: 'Define your weekly schedule and manage date-specific overrides',
    category: 'getting-started',
    icon: Clock
  },
  {
    id: 'connect-calendar',
    title: 'Connecting External Calendars',
    description: 'Sync with Google Calendar and Outlook to prevent double-bookings',
    category: 'integrations',
    icon: Calendar
  },
  {
    id: 'team-scheduling',
    title: 'Setting Up Team Scheduling',
    description: 'Create team events with round-robin or collective availability',
    category: 'advanced',
    icon: Users
  },
  {
    id: 'payment-setup',
    title: 'Accepting Payments',
    description: 'Configure Stripe to collect payment for your bookings',
    category: 'advanced',
    icon: CreditCard
  },
  {
    id: 'notifications',
    title: 'Managing Notifications',
    description: 'Set up email and SMS reminders for your meetings',
    category: 'settings',
    icon: Bell
  },
  {
    id: 'customize-booking-page',
    title: 'Customizing Your Booking Page',
    description: 'Brand your booking page with custom colors, logos, and layouts',
    category: 'settings',
    icon: Settings
  }
]

const videoTutorials = [
  {
    id: 'quick-start',
    title: 'Quick Start Guide',
    duration: '5:30',
    thumbnail: '/tutorials/quick-start.jpg',
    url: 'https://youtube.com/watch?v=example1'
  },
  {
    id: 'advanced-features',
    title: 'Advanced Features Overview',
    duration: '12:45',
    thumbnail: '/tutorials/advanced.jpg',
    url: 'https://youtube.com/watch?v=example2'
  },
  {
    id: 'team-setup',
    title: 'Setting Up Team Scheduling',
    duration: '8:20',
    thumbnail: '/tutorials/team.jpg',
    url: 'https://youtube.com/watch?v=example3'
  }
]

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredArticles = helpArticles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Help Center</h1>
        <p className="text-gray-600">Find answers and learn how to get the most out of your scheduler</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="text"
          placeholder="Search for help..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 py-6 text-lg"
        />
      </div>

      <Tabs defaultValue="articles" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="articles">
            <BookOpen className="h-4 w-4 mr-2" />
            Articles
          </TabsTrigger>
          <TabsTrigger value="videos">
            <Video className="h-4 w-4 mr-2" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="faq">
            <MessageCircle className="h-4 w-4 mr-2" />
            FAQ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArticles.map((article) => {
              const Icon = article.icon
              return (
                <Link key={article.id} href={`/help/articles/${article.id}`}>
                  <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 flex items-center justify-between">
                          {article.title}
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </h3>
                        <p className="text-sm text-gray-600">{article.description}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="videos" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {videoTutorials.map((video) => (
              <a
                key={video.id}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gray-200 relative flex items-center justify-center">
                    <Video className="h-12 w-12 text-gray-400" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ExternalLink className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1">{video.title}</h3>
                    <p className="text-sm text-gray-600">{video.duration}</p>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="faq" className="space-y-4 mt-6">
          <FAQSection />
        </TabsContent>
      </Tabs>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-4">
          <MessageCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">Still need help?</h3>
            <p className="text-gray-600 mb-4">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <Button>Contact Support</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function FAQSection() {
  const faqs = [
    {
      question: 'How do I share my booking link?',
      answer: 'Your booking link is available at yourdomain.com/your-username. You can find it in your dashboard and share it via email, social media, or embed it on your website.'
    },
    {
      question: 'Can I connect multiple calendars?',
      answer: 'Yes! You can connect multiple Google Calendar and Outlook accounts. The system will check all connected calendars to prevent double-bookings.'
    },
    {
      question: 'How do buffer times work?',
      answer: 'Buffer times add padding before or after your meetings. For example, a 15-minute buffer after meetings ensures you have time to prepare for your next appointment.'
    },
    {
      question: 'Can I accept payments for bookings?',
      answer: 'Yes, you can integrate Stripe to collect payment before confirming bookings. Set up payment in your event type settings and configure your pricing.'
    },
    {
      question: 'How do I cancel or reschedule a booking?',
      answer: 'You can manage bookings from your dashboard. Guests receive unique links in their confirmation emails to reschedule or cancel on their own.'
    },
    {
      question: 'What happens if I delete an event type?',
      answer: 'Deleting an event type will not affect existing bookings. However, guests will no longer be able to book new appointments using that event type.'
    },
    {
      question: 'Can I customize my booking page?',
      answer: 'Yes! You can customize colors, add your logo, choose layouts, and even use a custom domain for a fully branded experience.'
    },
    {
      question: 'How do team events work?',
      answer: 'Team events allow multiple team members to be booked. You can use collective availability (all must be free) or round-robin (distribute evenly among members).'
    }
  ]

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <Card key={index} className="p-4">
          <h3 className="font-semibold mb-2">{faq.question}</h3>
          <p className="text-gray-600 text-sm">{faq.answer}</p>
        </Card>
      ))}
    </div>
  )
}
