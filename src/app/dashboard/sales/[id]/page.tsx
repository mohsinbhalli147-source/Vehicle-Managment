'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { ArrowLeft, DollarSign, Calendar, User, Package, CreditCard, Plus } from 'lucide-react'
import Link from 'next/link'

interface Sale {
  id: string
  sale_number: string
  customer_name: string
  customer_phone: string
  item_name: string
  item_details: {
    brand: string
    model: string
    color: string
    chassis_number: string
  }
  sale_price: number
  received_amount: number
  remaining_amount: number
  sale_date: string
  status: 'completed' | 'partial' | 'pending'
  created_by_name: string
  payments: Array<{
    id: string
    amount: number
    payment_date: string
    notes: string
    received_by_name: string
  }>
}

export default function SaleDetailPage() {
  const params = useParams()
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [recordingPayment, setRecordingPayment] = useState(false)

  const fetchSale = async (id: string) => {
    try {
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select(`
          *,
          customers(name, phone),
          inventory_items(brand, model, color, chassis_number),
          profiles(full_name)
        `)
        .eq('id', id)
        .single()

      if (saleError) throw saleError

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('sale_id', id)
        .order('payment_date', { ascending: false })

      if (paymentsError) throw paymentsError

      const status = saleData.remaining_amount === 0 ? 'completed' : 
                     saleData.received_amount > 0 ? 'partial' : 'pending'

      setSale({
        id: saleData.id,
        sale_number: saleData.sale_number,
        customer_name: saleData.customers?.name || 'Unknown',
        customer_phone: saleData.customers?.phone || 'N/A',
        item_name: `${saleData.inventory_items?.brand} ${saleData.inventory_items?.model}`,
        item_details: {
          brand: saleData.inventory_items?.brand || '',
          model: saleData.inventory_items?.model || '',
          color: saleData.inventory_items?.color || '',
          chassis_number: saleData.inventory_items?.chassis_number || '',
        },
        sale_price: Number(saleData.sale_price),
        received_amount: Number(saleData.received_amount),
        remaining_amount: Number(saleData.remaining_amount),
        sale_date: saleData.sale_date,
        status,
        created_by_name: saleData.profiles?.full_name || 'Unknown',
        payments: paymentsData?.map(payment => ({
          id: payment.id,
          amount: Number(payment.amount),
          payment_date: payment.payment_date,
          notes: payment.notes || '',
          received_by_name: payment.profiles?.full_name || 'Unknown',
        })) || [],
      })
    } catch (error) {
      console.error('Error fetching sale:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchSale(params.id as string)
    }
  }, [params.id])

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setRecordingPayment(true)

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      const amount = parseFloat(paymentAmount)
      
      // Add payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          sale_id: sale?.id,
          customer_id: null, // Will be linked via sale
          amount,
          notes: paymentNotes || null,
          received_by: userData.user?.id,
        })

      if (paymentError) throw paymentError

      // Update sale
      const newReceivedAmount = sale!.received_amount + amount
      const newRemainingAmount = sale!.remaining_amount - amount

      const { error: updateError } = await supabase
        .from('sales')
        .update({
          received_amount: newReceivedAmount,
          remaining_amount: newRemainingAmount > 0 ? newRemainingAmount : 0,
        })
        .eq('id', sale?.id)

      if (updateError) throw updateError

      // Log activity
      const currentSale = sale
      await supabase.rpc('log_activity', {
        p_action: 'Payment Received',
        p_entity_type: 'payment',
        p_entity_id: null,
        p_description: `Rs. ${amount.toLocaleString()} received for sale ${currentSale?.sale_number}`,
      })

      // Reset and refresh
      setPaymentAmount('')
      setPaymentNotes('')
      setShowPaymentModal(false)
      fetchSale(params.id as string)
    } catch (error) {
      console.error('Error recording payment:', error)
      alert('Failed to record payment')
    } finally {
      setRecordingPayment(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      case 'pending': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!sale) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Sale not found</p>
          <Link
            href="/dashboard/sales"
            className="inline-flex items-center mt-4 text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sales
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/dashboard/sales"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Sales
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Sale {sale.sale_number}</h1>
            <p className="text-gray-600">Sale Details</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(sale.status)}`}>
              {sale.status}
            </span>
            {sale.remaining_amount > 0 && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Record Payment
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sale Price</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  Rs. {sale.sale_price.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-indigo-100">
                <DollarSign className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Received</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  Rs. {sale.received_amount.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Remaining</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  Rs. {sale.remaining_amount.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-100">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{sale.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{sale.customer_phone}</span>
              </div>
            </div>
          </div>

          {/* Item Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Item Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicle:</span>
                <span className="font-medium">{sale.item_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Color:</span>
                <span className="font-medium">{sale.item_details.color || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Chassis:</span>
                <span className="font-medium">{sale.item_details.chassis_number || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Sale Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Sale Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Sale Date:</span>
                <span className="font-medium">{new Date(sale.sale_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created By:</span>
                <span className="font-medium">{sale.created_by_name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
            <p className="text-gray-600 text-sm">{sale.payments.length} payment(s)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Notes</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Received By</th>
                </tr>
              </thead>
              <tbody>
                {sale.payments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-green-600 text-right font-medium">
                      Rs. {payment.amount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{payment.notes || '-'}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">{payment.received_by_name}</td>
                  </tr>
                ))}
                {sale.payments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No payments recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Record Payment</h2>
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (Rs.) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    max={sale.remaining_amount}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={`Max: Rs. ${sale.remaining_amount.toLocaleString()}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    placeholder="Payment notes..."
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={recordingPayment}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {recordingPayment ? 'Recording...' : 'Record Payment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false)
                      setPaymentAmount('')
                      setPaymentNotes('')
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
