'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Eye, Phone } from 'lucide-react'
import Link from 'next/link'

interface Customer {
  id: string
  name: string
  phone: string
  cnic: string
  address: string
  total_purchases: number
  total_paid: number
  total_remaining: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name')

      if (error) throw error

      // Calculate totals for each customer
      const customersWithTotals = await Promise.all(
        (data || []).map(async (customer) => {
          const { data: salesData } = await supabase
            .from('sales')
            .select('sale_price, received_amount, remaining_amount')
            .eq('customer_id', customer.id)

          const totalPurchases = salesData?.reduce((sum, sale) => sum + Number(sale.sale_price), 0) || 0
          const totalPaid = salesData?.reduce((sum, sale) => sum + Number(sale.received_amount), 0) || 0
          const totalRemaining = salesData?.reduce((sum, sale) => sum + Number(sale.remaining_amount), 0) || 0

          return {
            ...customer,
            total_purchases: totalPurchases,
            total_paid: totalPaid,
            total_remaining: totalRemaining,
          }
        })
      )

      setCustomers(customersWithTotals)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCustomers()
  }, [])

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.cnic?.includes(searchTerm)
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600">Manage your customer database</p>
          </div>
          <Link
            href="/dashboard/customers/add"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Customer
          </Link>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or CNIC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Contact</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Total Purchases</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Total Paid</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Outstanding</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.cnic || 'No CNIC'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{customer.phone}</span>
                      </div>
                      {customer.address && (
                        <p className="text-sm text-gray-500 mt-1">{customer.address}</p>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 text-right">
                      Rs. {customer.total_purchases.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-green-600 text-right">
                      Rs. {customer.total_paid.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-red-600 text-right font-medium">
                      Rs. {customer.total_remaining.toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          href={`/dashboard/customers/${customer.id}`}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No customers found
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
