'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { 
  CreditCard, 
  Download, 
  Filter, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  RefreshCw,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { paymentService, PaymentWithRelations } from '@/services/payment-service'
import { PaymentStatus } from '@prisma/client'

interface PaymentHistoryProps {
  userId: string
}

/**
 * Payment history component
 * Displays a list of all payments with filtering and export options
 */
export function PaymentHistory({ userId }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<PaymentWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL')

  useEffect(() => {
    loadPayments()
  }, [userId, statusFilter])

  const loadPayments = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const filters: any = {}
      if (statusFilter !== 'ALL') {
        filters.status = statusFilter
      }

      const result = await paymentService.getPaymentHistory(userId, filters)

      if (result.success && result.data) {
        setPayments(result.data)
      } else {
        setError(result.error || 'Failed to load payment history')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment history')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    // Create CSV content
    const headers = ['Date', 'Amount', 'Currency', 'Status', 'Booking ID', 'Guest Name', 'Guest Email']
    const rows = payments.map(payment => [
      format(new Date(payment.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      payment.amount.toString(),
      payment.currency,
      payment.status,
      payment.booking?.id || 'N/A',
      payment.booking?.guestName || 'N/A',
      payment.booking?.guestEmail || 'N/A',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payment-history-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'SUCCEEDED':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'REFUNDED':
      case 'PARTIALLY_REFUNDED':
        return <RefreshCw className="h-4 w-4 text-blue-600" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: PaymentStatus) => {
    const variants: Record<PaymentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      SUCCEEDED: 'default',
      FAILED: 'destructive',
      PENDING: 'secondary',
      REFUNDED: 'outline',
      PARTIALLY_REFUNDED: 'outline',
    }

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const calculateTotalRevenue = () => {
    return payments
      .filter(p => p.status === 'SUCCEEDED')
      .reduce((sum, p) => sum + Number(p.amount), 0)
  }

  const calculateRefundedAmount = () => {
    return payments
      .filter(p => p.status === 'REFUNDED' || p.status === 'PARTIALLY_REFUNDED')
      .reduce((sum, p) => sum + Number(p.amount), 0)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment History
            </CardTitle>
            <CardDescription>
              View and manage all your payment transactions
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={payments.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="text-sm text-muted-foreground mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-green-600">
                ${calculateTotalRevenue().toFixed(2)}
              </div>
            </div>
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="text-sm text-muted-foreground mb-1">Total Refunded</div>
              <div className="text-2xl font-bold text-red-600">
                ${calculateRefundedAmount().toFixed(2)}
              </div>
            </div>
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="text-sm text-muted-foreground mb-1">Total Transactions</div>
              <div className="text-2xl font-bold">
                {payments.length}
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as PaymentStatus | 'ALL')}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="SUCCEEDED">Succeeded</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="PARTIALLY_REFUNDED">Partially Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-muted-foreground">
              <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <p>{error}</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4" />
              <p>No payment transactions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: payment.currency,
                        }).format(Number(payment.amount))}
                      </span>
                      {getStatusBadge(payment.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(payment.createdAt), 'MMM dd, yyyy • HH:mm')}
                    </div>
                    {payment.booking && (
                      <div className="text-sm text-muted-foreground">
                        {payment.booking.guestName} • {payment.booking.guestEmail}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div className="font-mono text-xs">
                      {payment.id.slice(0, 8)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
