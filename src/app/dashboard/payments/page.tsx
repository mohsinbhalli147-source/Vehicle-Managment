'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { Search } from 'lucide-react'

interface Payment {
  id: string
  amount: number
  payment_date: string
  customer_name: string
  sale_number?: string
  rental_number?: string
  notes: string
  received_by_name: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          sales(sale_number),
          rentals(rental_number),
          customers(name),
          profiles(full_name)
        `)
        .order('payment_date', { ascending: false })

      if (error) throw error

      setPayments(
        data?.map(payment => ({
          id: payment.id,
          amount: Number(payment.amount),
          payment_date: payment.payment_date,
          customer_name: payment.customers?.name || 'Unknown',
          sale_number: payment.sales?.sale_number,
          rental_number: payment.rentals?.rental_number,
          notes: payment.notes || '',
          received_by_name: payment.profiles?.full_name || 'Unknown',
        })) || []
      )
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPayments()
  }, [])

  const filteredPayments = payments.filter(payment =>
    payment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.sale_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.rental_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Payment history and records</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer, sale number, or rental number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Reference</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Notes</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Received By</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">{payment.customer_name}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {payment.sale_number || payment.rental_number || 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-sm text-green-600 text-right font-medium">
                      Rs. {payment.amount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{payment.notes || '-'}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">{payment.received_by_name}</td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No payments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
