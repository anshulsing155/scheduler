'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarCard } from '@/components/calendar/calendar-card';
import { CalendarProvider } from '@prisma/client';
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ConnectedCalendar {
  id: string;
  provider: CalendarProvider;
  calendarName: string;
  calendarId: string;
  isPrimary: boolean;
  createdAt: Date;
}

export default function CalendarSettingsPage() {
  const searchParams = useSearchParams();
  const [calendars, setCalendars] = useState<ConnectedCalendar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Check for OAuth callback messages
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success) {
      setMessage({ type: 'success', text: 'Calendar connected successfully!' });
      // Clear URL params
      window.history.replaceState({}, '', '/dashboard/settings/calendars');
    } else if (error) {
      const errorMessages: Record<string, string> = {
        missing_params: 'Missing required parameters',
        invalid_state: 'Invalid authentication state',
        connection_failed: 'Failed to connect calendar',
      };
      setMessage({ 
        type: 'error', 
        text: errorMessages[error] || 'An error occurred while connecting calendar' 
      });
      window.history.replaceState({}, '', '/dashboard/settings/calendars');
    }

    fetchCalendars();
  }, [searchParams]);

  const fetchCalendars = async () => {
    try {
      const response = await fetch('/api/calendar/list');
      if (response.ok) {
        const data = await response.json();
        setCalendars(data.calendars);
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (provider: 'google' | 'outlook') => {
    setIsConnecting(provider);
    setMessage(null);

    try {
      const response = await fetch(`/api/calendar/${provider}/connect`);
      const data = await response.json();

      if (data.url) {
        // Redirect to OAuth provider
        window.location.href = data.url;
      } else {
        setMessage({ type: 'error', text: 'Failed to initiate connection' });
        setIsConnecting(null);
      }
    } catch (error) {
      console.error('Error connecting calendar:', error);
      setMessage({ type: 'error', text: 'Failed to connect calendar' });
      setIsConnecting(null);
    }
  };

  const handleDisconnect = async (calendarId: string) => {
    if (!confirm('Are you sure you want to disconnect this calendar?')) {
      return;
    }

    setDisconnectingId(calendarId);
    setMessage(null);

    try {
      const response = await fetch('/api/calendar/disconnect', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Calendar disconnected successfully' });
        fetchCalendars();
      } else {
        setMessage({ type: 'error', text: 'Failed to disconnect calendar' });
      }
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      setMessage({ type: 'error', text: 'Failed to disconnect calendar' });
    } finally {
      setDisconnectingId(null);
    }
  };

  const hasGoogleCalendar = calendars.some(cal => cal.provider === CalendarProvider.GOOGLE);
  const hasOutlookCalendar = calendars.some(cal => cal.provider === CalendarProvider.OUTLOOK);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Calendar Integration</h1>
        <p className="text-muted-foreground">
          Connect your calendars to check availability and prevent double bookings
        </p>
      </div>

      {message && (
        <Card className={`p-4 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {message.text}
            </p>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Connect Calendar</h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500 text-white">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Google Calendar</h3>
                <p className="text-sm text-muted-foreground">
                  Sync with your Google Calendar
                </p>
              </div>
            </div>
            
            {hasGoogleCalendar ? (
              <Button variant="outline" disabled>
                Connected
              </Button>
            ) : (
              <Button
                onClick={() => handleConnect('google')}
                disabled={isConnecting === 'google'}
              >
                {isConnecting === 'google' ? 'Connecting...' : 'Connect'}
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500 text-white">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Microsoft Outlook</h3>
                <p className="text-sm text-muted-foreground">
                  Sync with your Outlook Calendar
                </p>
              </div>
            </div>
            
            {hasOutlookCalendar ? (
              <Button variant="outline" disabled>
                Connected
              </Button>
            ) : (
              <Button
                onClick={() => handleConnect('outlook')}
                disabled={isConnecting === 'outlook'}
              >
                {isConnecting === 'outlook' ? 'Connecting...' : 'Connect'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {calendars.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Connected Calendars</h2>
          <div className="space-y-3">
            {calendars.map((calendar) => (
              <CalendarCard
                key={calendar.id}
                calendar={calendar}
                onDisconnect={handleDisconnect}
                isDisconnecting={disconnectingId === calendar.id}
              />
            ))}
          </div>
        </div>
      )}

      {!isLoading && calendars.length === 0 && (
        <Card className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No calendars connected</h3>
          <p className="text-muted-foreground">
            Connect your calendar to automatically check availability and prevent double bookings
          </p>
        </Card>
      )}
    </div>
  );
}
