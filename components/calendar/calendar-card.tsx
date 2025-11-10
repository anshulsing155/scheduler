'use client';

import { CalendarProvider } from '@prisma/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trash2, CheckCircle2 } from 'lucide-react';

interface CalendarCardProps {
  calendar: {
    id: string;
    provider: CalendarProvider;
    calendarName: string;
    calendarId: string;
    isPrimary: boolean;
    createdAt: Date;
  };
  onDisconnect: (calendarId: string) => void;
  isDisconnecting?: boolean;
}

export function CalendarCard({ calendar, onDisconnect, isDisconnecting }: CalendarCardProps) {
  const providerName = calendar.provider === CalendarProvider.GOOGLE 
    ? 'Google Calendar' 
    : 'Microsoft Outlook';

  const providerColor = calendar.provider === CalendarProvider.GOOGLE
    ? 'bg-blue-500'
    : 'bg-orange-500';

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${providerColor} text-white`}>
            <Calendar className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-sm truncate">
                {calendar.calendarName}
              </h3>
              {calendar.isPrimary && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Primary
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">
              {providerName}
            </p>
            
            <p className="text-xs text-muted-foreground mt-1">
              Connected {new Date(calendar.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDisconnect(calendar.id)}
          disabled={isDisconnecting}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
