'use client'

import { Suspense, useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, DollarSign, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

interface Customer {
  id: string
  name: string
  phone: string
  cnic: string
  address: string
  notes: string
  created_at: string
  total_purchases: number
  total_paid: number
  total_remaining: number
  sales_history: Array<{
    id: string
    sale_number: string
    item_name: string
    sale_price: number
    received_amount: number
    remaining_amount: number
    sale_date: string
  }>
}

function CustomerDetailComponent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCustomer = async (id: string) => {
    try {
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

      if (customerError) throw customerError

      // Fetch sales history
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          inventory_items(brand, model)
        `)
        .eq('customer_id', id)
        .order('sale_date', { ascending: false })

      if (salesError) throw salesError

      const totalPurchases = salesData?.reduce((sum, sale) => sum + Number(sale.sale_price), 0) || 0
      const totalPaid = salesData?.reduce((sum, sale) => sum + Number(sale.received_amount), 0) || 0
      const totalRemaining = salesData?.reduce((sum, sale) => sum + Number(sale.remaining_amount), 0) || 0

      const salesHistory = salesData?.map(sale => ({
        id: sale.id,
        sale_number: sale.sale_number,
        item_name: `${sale.inventory_items?.brand} ${sale.inventory_items?.model}`,
        sale_price: Number(sale.sale_price),
        received_amount: Number(sale.received_amount),
        remaining_amount: Number(sale.remaining_amount),
        sale_date: sale.sale_date,
      })) || []

      setCustomer({
        ...customerData,
        total_purchases: totalPurchases,
        total_paid: totalPaid,
        total_remaining: totalRemaining,
        sales_history: salesHistory,
      })
    } catch (error) {
      console.error('Error fetching customer:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchCustomer(id)
    }
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this customer? This will also delete their sales history.')) return

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customer?.id)

      if (error) throw error
      router.push('/dashboard/customers')
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert('Failed to delete customer')
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

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Customer not found</p>
          <Link
            href="/dashboard/customers"
            className="inline-flex items-center mt-4 text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
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
              href="/dashboard/customers"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Customers
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">{customer.name}</h1>
            <p className="text-gray-600">Customer Details</p>
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/dashboard/customers/edit?id=${customer.id}`}
              className="inline-flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Edit className="h-5 w-5 mr-2" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Delete
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  Rs. {customer.total_purchases.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-indigo-100">
                <ShoppingCart className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  Rs. {customer.total_paid.toLocaleString()}
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
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  Rs. {customer.total_remaining.toLocaleString()}
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
          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
              </div>
              {customer.cnic && (
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">CNIC</p>
                    <p className="font-medium">{customer.cnic}</p>
                  </div>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">{customer.address}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <div className="h-5 w-5 text-gray-400 flex items-center justify-center">
                  📅
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer Since</p>
                  <p className="font-medium">{new Date(customer.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {customer.notes && (
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
              <p className="text-gray-700">{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Sales History */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Sales History</h2>
            <p className="text-gray-600 text-sm">{customer.sales_history.length} purchase(s)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Sale #</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Item</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Sale Price</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Paid</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Remaining</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {customer.sales_history.map((sale) => (
                  <tr key={sale.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">{sale.sale_number}</td>
                    <td className="py-4 px-4 text-sm text-gray-900">{sale.item_name}</td>
                    <td className="py-4 px-4 text-sm text-gray-900 text-right">
                      Rs. {sale.sale_price.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-green-600 text-right">
                      Rs. {sale.received_amount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-red-600 text-right">
                      Rs. {sale.remaining_amount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 text-center">
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {customer.sales_history.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No sales history
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

export default function CustomerDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>}>
      <CustomerDetailComponent />
    </Suspense>
  )
}
