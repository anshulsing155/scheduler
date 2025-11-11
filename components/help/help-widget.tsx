'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  HelpCircle, 
  X, 
  Search, 
  BookOpen, 
  MessageCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

const quickLinks = [
  { title: 'Creating Your First Event Type', href: '/help/articles/create-event-type' },
  { title: 'Setting Your Availability', href: '/help/articles/set-availability' },
  { title: 'Connecting External Calendars', href: '/help/articles/connect-calendar' },
  { title: 'Managing Notifications', href: '/help/articles/notifications' }
]

const commonQuestions = [
  { question: 'How do I share my booking link?', answer: 'Your booking link is in your dashboard. Click "Copy Link" to share it.' },
  { question: 'Can I connect multiple calendars?', answer: 'Yes! Go to Settings > Integrations to connect Google Calendar and Outlook.' },
  { question: 'How do I cancel a booking?', answer: 'Open the booking from your dashboard and click "Cancel Booking".' }
]

export function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLinks = quickLinks.filter(link =>
    link.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredQuestions = commonQuestions.filter(q =>
    q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      {/* Help Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <HelpCircle className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Help Panel */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 max-h-[600px] overflow-hidden shadow-2xl z-50 flex flex-col">
          <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <h3 className="font-semibold text-lg mb-1">How can we help?</h3>
            <p className="text-sm text-blue-100">Search for answers or browse articles</p>
          </div>

          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {searchQuery === '' ? (
              <>
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Quick Links
                  </h4>
                  <div className="space-y-1">
                    {quickLinks.map((link, index) => (
                      <Link
                        key={index}
                        href={link.href}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded text-sm group"
                        onClick={() => setIsOpen(false)}
                      >
                        <span>{link.title}</span>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Common Questions
                  </h4>
                  <div className="space-y-2">
                    {commonQuestions.map((q, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                        <p className="font-medium mb-1">{q.question}</p>
                        <p className="text-gray-600 text-xs">{q.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {filteredLinks.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Articles</h4>
                    <div className="space-y-1">
                      {filteredLinks.map((link, index) => (
                        <Link
                          key={index}
                          href={link.href}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded text-sm group"
                          onClick={() => setIsOpen(false)}
                        >
                          <span>{link.title}</span>
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {filteredQuestions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Questions</h4>
                    <div className="space-y-2">
                      {filteredQuestions.map((q, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                          <p className="font-medium mb-1">{q.question}</p>
                          <p className="text-gray-600 text-xs">{q.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filteredLinks.length === 0 && filteredQuestions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No results found</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-4 border-t bg-gray-50 space-y-2">
            <Link href="/help" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full" size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                Visit Help Center
              </Button>
            </Link>
            <Button variant="ghost" className="w-full" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </Card>
      )}
    </>
  )
}
