'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface CalendarSyncStatusProps {
  userId: string;
}

export function CalendarSyncStatus({ userId }: CalendarSyncStatusProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [eventCount, setEventCount] = useState(0);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');

    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setEventCount(data.eventCount || 0);
        setLastSync(new Date());
        setSyncStatus('success');
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Error syncing calendars:', error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {syncStatus === 'success' && (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            )}
            {syncStatus === 'error' && (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            
            <div>
              <h3 className="font-medium text-sm">Calendar Sync</h3>
              {lastSync ? (
                <p className="text-xs text-muted-foreground">
                  Last synced: {lastSync.toLocaleTimeString()}
                  {eventCount > 0 && ` • ${eventCount} events`}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Not synced yet
                </p>
              )}
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </div>

      {syncStatus === 'error' && (
        <p className="text-xs text-red-600 mt-2">
          Failed to sync calendars. Please try again.
        </p>
      )}
    </Card>
  );
}
