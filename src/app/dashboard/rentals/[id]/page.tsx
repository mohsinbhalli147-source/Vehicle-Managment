'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Car, Calendar, User, DollarSign, CheckCircle, Plus } from 'lucide-react'
import Link from 'next/link'

interface Rental {
  id: string
  rental_number: string
  customer_name: string
  customer_phone: string
  item_name: string
  item_id: string
  start_date: string
  expected_return_date: string
  actual_return_date: string | null
  rent_amount: number
  security_deposit: number
  received_amount: number
  remaining_amount: number
  status: 'active' | 'returned' | 'overdue'
  notes: string
  created_by_name: string
  payments: Array<{
    id: string
    amount: number
    payment_date: string
    notes: string
    received_by_name: string
  }>
}

export default function RentalDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [rental, setRental] = useState<Rental | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchRental(params.id as string)
    }
  }, [params.id])

  const fetchRental = async (id: string) => {
    try {
      const { data: rentalData, error: rentalError } = await supabase
        .from('rentals')
        .select(`
          *,
          customers(name, phone),
          inventory_items(id, brand, model),
          profiles(full_name)
        `)
        .eq('id', id)
        .single()

      if (rentalError) throw rentalError

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('rental_id', id)
        .order('payment_date', { ascending: false })

      if (paymentsError) throw paymentsError

      const today = new Date()
      let status: 'active' | 'returned' | 'overdue' = 'active'
      
      if (rentalData.actual_return_date) {
        status = 'returned'
      } else if (rentalData.expected_return_date) {
        const expectedDate = new Date(rentalData.expected_return_date)
        if (expectedDate < today) {
          status = 'overdue'
        }
      }

      setRental({
        id: rentalData.id,
        rental_number: rentalData.rental_number,
        customer_name: rentalData.customers?.name || 'Unknown',
        customer_phone: rentalData.customers?.phone || 'N/A',
        item_name: `${rentalData.inventory_items?.brand} ${rentalData.inventory_items?.model}`,
        item_id: rentalData.inventory_items?.id || '',
        start_date: rentalData.start_date,
        expected_return_date: rentalData.expected_return_date,
        actual_return_date: rentalData.actual_return_date,
        rent_amount: Number(rentalData.rent_amount),
        security_deposit: Number(rentalData.security_deposit),
        received_amount: Number(rentalData.received_amount),
        remaining_amount: Number(rentalData.remaining_amount),
        status,
        notes: rentalData.notes || '',
        created_by_name: rentalData.profiles?.full_name || 'Unknown',
        payments: paymentsData?.map(payment => ({
          id: payment.id,
          amount: Number(payment.amount),
          payment_date: payment.payment_date,
          notes: payment.notes || '',
          received_by_name: payment.profiles?.full_name || 'Unknown',
        })) || [],
      })
    } catch (error) {
      console.error('Error fetching rental:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReturnVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)

    try {
      // Update rental
      const { error: rentalError } = await supabase
        .from('rentals')
        .update({
          actual_return_date: returnDate,
          status: 'returned',
        })
        .eq('id', rental?.id)

      if (rentalError) throw rentalError

      // Update inventory item status back to available
      const { error: inventoryError } = await supabase
        .from('inventory_items')
        .update({ status: 'available' })
        .eq('id', rental?.item_id)

      if (inventoryError) throw inventoryError

      // Log activity
      await supabase.rpc('log_activity', {
        p_action: 'Vehicle Returned',
        p_entity_type: 'rental',
        p_entity_id: rental?.id,
        p_description: `${rental?.item_name} returned from rental`,
      })

      setShowReturnModal(false)
      fetchRental(params.id as string)
    } catch (error) {
      console.error('Error returning vehicle:', error)
      alert('Failed to return vehicle')
    } finally {
      setProcessing(false)
    }
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      const amount = parseFloat(paymentAmount)
      
      // Add payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          rental_id: rental?.id,
          customer_id: null,
          amount,
          notes: paymentNotes || null,
          received_by: userData.user?.id,
        })

      if (paymentError) throw paymentError

      // Update rental
      const newReceivedAmount = rental!.received_amount + amount
      const newRemainingAmount = rental!.remaining_amount - amount

      const { error: updateError } = await supabase
        .from('rentals')
        .update({
          received_amount: newReceivedAmount,
          remaining_amount: newRemainingAmount > 0 ? newRemainingAmount : 0,
        })
        .eq('id', rental?.id)

      if (updateError) throw updateError

      // Log activity
      const currentRental = rental
      await supabase.rpc('log_activity', {
        p_action: 'Payment Received',
        p_entity_type: 'payment',
        p_entity_id: null,
        p_description: `Rs. ${amount.toLocaleString()} received for rental ${currentRental?.rental_number}`,
      })

      setPaymentAmount('')
      setPaymentNotes('')
      setShowPaymentModal(false)
      fetchRental(params.id as string)
    } catch (error) {
      console.error('Error recording payment:', error)
      alert('Failed to record payment')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'returned': return 'bg-blue-100 text-blue-800'
      case 'overdue': return 'bg-red-100 text-red-800'
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

  if (!rental) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Rental not found</p>
          <Link
            href="/dashboard/rentals"
            className="inline-flex items-center mt-4 text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rentals
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
              href="/dashboard/rentals"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Rentals
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Rental {rental.rental_number}</h1>
            <p className="text-gray-600">Rental Details</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rental.status)}`}>
              {rental.status}
            </span>
            {rental.status === 'active' && (
              <>
                {rental.remaining_amount > 0 && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Record Payment
                  </button>
                )}
                <button
                  onClick={() => setShowReturnModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Return Vehicle
                </button>
              </>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rent Amount</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  Rs. {rental.rent_amount.toLocaleString()}
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
                  Rs. {rental.received_amount.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Deposit</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  Rs. {rental.security_deposit.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <DollarSign className="h-6 w-6 text-blue-600" />
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
                <span className="font-medium">{rental.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{rental.customer_phone}</span>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Car className="h-5 w-5 mr-2" />
              Vehicle Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicle:</span>
                <span className="font-medium">{rental.item_name}</span>
              </div>
            </div>
          </div>

          {/* Rental Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Rental Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Start Date:</span>
                <span className="font-medium">{new Date(rental.start_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expected Return:</span>
                <span className="font-medium">
                  {rental.expected_return_date ? new Date(rental.expected_return_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Actual Return:</span>
                <span className="font-medium">
                  {rental.actual_return_date ? new Date(rental.actual_return_date).toLocaleDateString() : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {rental.notes && (
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
              <p className="text-gray-700">{rental.notes}</p>
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
            <p className="text-gray-600 text-sm">{rental.payments.length} payment(s)</p>
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
                {rental.payments.map((payment) => (
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
                {rental.payments.length === 0 && (
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

        {/* Return Modal */}
        {showReturnModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Return Vehicle</h2>
              <form onSubmit={handleReturnVehicle} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Return Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={processing}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Return Vehicle'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReturnModal(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
                    max={rental.remaining_amount}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={`Max: Rs. ${rental.remaining_amount.toLocaleString()}`}
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
                    disabled={processing}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {processing ? 'Recording...' : 'Record Payment'}
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
