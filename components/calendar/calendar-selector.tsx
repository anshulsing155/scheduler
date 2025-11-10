'use client';

import { useState, useEffect } from 'react';
import { CalendarProvider } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';

interface ConnectedCalendar {
  id: string;
  provider: CalendarProvider;
  calendarName: string;
  calendarId: string;
  isPrimary: boolean;
}

interface CalendarSelectorProps {
  value?: string;
  onChange: (calendarId: string) => void;
  placeholder?: string;
}

export function CalendarSelector({ value, onChange, placeholder = 'Select calendar' }: CalendarSelectorProps) {
  const [calendars, setCalendars] = useState<ConnectedCalendar[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCalendars();
  }, []);

  const fetchCalendars = async () => {
    try {
      const response = await fetch('/api/calendar/list');
      if (response.ok) {
        const data = await response.json();
        setCalendars(data.calendars);
        
        // Auto-select primary calendar if no value is set
        if (!value && data.calendars.length > 0) {
          const primary = data.calendars.find((cal: ConnectedCalendar) => cal.isPrimary);
          if (primary) {
            onChange(primary.id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4 animate-pulse" />
        Loading calendars...
      </div>
    );
  }

  if (calendars.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No calendars connected. Connect a calendar in settings.
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {calendars.map((calendar) => (
          <SelectItem key={calendar.id} value={calendar.id}>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{calendar.calendarName}</span>
              {calendar.isPrimary && (
                <span className="text-xs text-muted-foreground">(Primary)</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
