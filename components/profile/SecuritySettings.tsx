'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';

interface LoginHistoryItem {
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface SecurityEvent {
  action: string;
  resource: string;
  ipAddress: string | null;
  createdAt: string;
  metadata?: any;
}

export function SecuritySettings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const response = await fetch('/api/audit/security');
      if (response.ok) {
        const data = await response.json();
        setLoginHistory(data.loginHistory);
        setSecurityEvents(data.securityEvents);
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) {
      return;
    }

    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
      });

      if (response.ok) {
        setTwoFactorEnabled(false);
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionLabel = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Security Settings</h2>
        <p className="text-sm text-gray-600">
          Manage your account security and view activity
        </p>
      </div>

      {/* Two-Factor Authentication */}
      <div className="space-y-4 border-b pb-6">
        <div>
          <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
          <p className="text-sm text-gray-600">
            Add an extra layer of security to your account
          </p>
        </div>

        {twoFactorEnabled ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-green-600 font-medium">✓ Enabled</span>
            <Button onClick={handleDisable2FA} variant="outline" size="sm">
              Disable 2FA
            </Button>
          </div>
        ) : (
          <Button onClick={() => setShowTwoFactorSetup(true)}>
            Enable Two-Factor Authentication
          </Button>
        )}
      </div>

      {/* Login History */}
      <div className="space-y-4 border-b pb-6">
        <div>
          <h3 className="text-lg font-semibold">Login History</h3>
          <p className="text-sm text-gray-600">
            Recent login attempts to your account
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : loginHistory.length > 0 ? (
          <div className="space-y-2">
            {loginHistory.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        item.action === 'LOGIN_SUCCESS'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {item.action === 'LOGIN_SUCCESS' ? '✓ Success' : '✗ Failed'}
                    </span>
                    {item.ipAddress && (
                      <span className="text-xs text-gray-500">
                        from {item.ipAddress}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No login history available</p>
        )}
      </div>

      {/* Security Events */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Security Events</h3>
          <p className="text-sm text-gray-600">
            Important security-related activities
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : securityEvents.length > 0 ? (
          <div className="space-y-2">
            {securityEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{getActionLabel(event.action)}</p>
                  <p className="text-xs text-gray-500">{formatDate(event.createdAt)}</p>
                  {event.ipAddress && (
                    <p className="text-xs text-gray-500">IP: {event.ipAddress}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No security events</p>
        )}
      </div>

      {/* Two-Factor Setup Dialog */}
      <TwoFactorSetup
        isOpen={showTwoFactorSetup}
        onClose={() => setShowTwoFactorSetup(false)}
        onSuccess={() => {
          setTwoFactorEnabled(true);
          fetchSecurityData();
        }}
      />
    </div>
  );
}
