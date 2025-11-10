'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export function PrivacySettings() {
  const [consent, setConsent] = useState({
    dataProcessing: true,
    marketing: false,
    analytics: false,
  });
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleExportData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/privacy/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-data-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConsent = async (key: keyof typeof consent, value: boolean) => {
    setConsent((prev) => ({ ...prev, [key]: value }));

    try {
      await fetch('/api/privacy/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (error) {
      console.error('Error updating consent:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/privacy/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediate: true }),
      });

      if (response.ok) {
        // Redirect to home page
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Privacy & Data</h2>
        <p className="text-sm text-gray-600">
          Manage your privacy settings and data
        </p>
      </div>

      {/* Data Export */}
      <div className="space-y-4 border-b pb-6">
        <div>
          <h3 className="text-lg font-semibold">Export Your Data</h3>
          <p className="text-sm text-gray-600">
            Download a copy of all your data in JSON format
          </p>
        </div>
        <Button onClick={handleExportData} disabled={loading} variant="outline">
          {loading ? 'Exporting...' : 'Export Data'}
        </Button>
      </div>

      {/* Consent Management */}
      <div className="space-y-4 border-b pb-6">
        <div>
          <h3 className="text-lg font-semibold">Privacy Preferences</h3>
          <p className="text-sm text-gray-600">
            Control how we use your data
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="data-processing">Data Processing</Label>
              <p className="text-sm text-gray-500">
                Required for the service to function
              </p>
            </div>
            <Switch
              id="data-processing"
              checked={consent.dataProcessing}
              disabled
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing">Marketing Communications</Label>
              <p className="text-sm text-gray-500">
                Receive updates and promotional emails
              </p>
            </div>
            <Switch
              id="marketing"
              checked={consent.marketing}
              onCheckedChange={(checked) => handleUpdateConsent('marketing', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="analytics">Analytics</Label>
              <p className="text-sm text-gray-500">
                Help us improve by sharing usage data
              </p>
            </div>
            <Switch
              id="analytics"
              checked={consent.analytics}
              onCheckedChange={(checked) => handleUpdateConsent('analytics', checked)}
            />
          </div>
        </div>
      </div>

      {/* Data Retention */}
      <div className="space-y-4 border-b pb-6">
        <div>
          <h3 className="text-lg font-semibold">Data Retention</h3>
          <p className="text-sm text-gray-600">
            How long we keep your data
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p>• Active data is retained while your account is active</p>
          <p>• Deleted account data is permanently removed within 30 days</p>
          <p>• Backup data is retained for 90 days for disaster recovery</p>
        </div>
      </div>

      {/* Account Deletion */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-red-600">Delete Account</h3>
          <p className="text-sm text-gray-600">
            Permanently delete your account and all associated data
          </p>
        </div>
        <Button
          onClick={() => setShowDeleteDialog(true)}
          variant="destructive"
        >
          Delete Account
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm">
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="DELETE"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmation('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== 'DELETE' || loading}
            >
              {loading ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
