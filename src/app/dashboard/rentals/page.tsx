'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Car, CheckCircle, Clock, Eye } from 'lucide-react'
import Link from 'next/link'

interface Rental {
  id: string
  rental_number: string
  customer_name: string
  item_name: string
  start_date: string
  expected_return_date: string
  actual_return_date: string | null
  rent_amount: number
  received_amount: number
  remaining_amount: number
  status: 'active' | 'returned' | 'overdue'
}

export default function RentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchRentals()
  }, [])

  const fetchRentals = async () => {
    try {
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          *,
          customers(name),
          inventory_items(brand, model)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const today = new Date()

      const rentalsWithStatus = data?.map(rental => {
        let status: 'active' | 'returned' | 'overdue' = 'active'
        
        if (rental.actual_return_date) {
          status = 'returned'
        } else if (rental.expected_return_date) {
          const expectedDate = new Date(rental.expected_return_date)
          if (expectedDate < today) {
            status = 'overdue'
          }
        }

        return {
          id: rental.id,
          rental_number: rental.rental_number,
          customer_name: rental.customers?.name || 'Unknown',
          item_name: `${rental.inventory_items?.brand} ${rental.inventory_items?.model}`,
          start_date: rental.start_date,
          expected_return_date: rental.expected_return_date,
          actual_return_date: rental.actual_return_date,
          rent_amount: Number(rental.rent_amount),
          received_amount: Number(rental.received_amount),
          remaining_amount: Number(rental.remaining_amount),
          status,
        }
      }) || []

      setRentals(rentalsWithStatus)
    } catch (error) {
      console.error('Error fetching rentals:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRentals = rentals.filter(rental => {
    const matchesSearch = 
      rental.rental_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.item_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || rental.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'returned': return 'bg-blue-100 text-blue-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Car className="h-4 w-4" />
      case 'returned': return <CheckCircle className="h-4 w-4" />
      case 'overdue': return <Clock className="h-4 w-4" />
      default: return null
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rentals</h1>
            <p className="text-gray-600">Manage vehicle rentals</p>
          </div>
          <Link
            href="/dashboard/rentals/new"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Rental
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 border space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by rental number, customer, or vehicle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="returned">Returned</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Rentals Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Rental #</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Vehicle</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Start Date</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Expected Return</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Actual Return</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Rent</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Received</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRentals.map((rental) => (
                  <tr key={rental.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">{rental.rental_number}</td>
                    <td className="py-4 px-4 text-sm text-gray-900">{rental.customer_name}</td>
                    <td className="py-4 px-4 text-sm text-gray-900">{rental.item_name}</td>
                    <td className="py-4 px-4 text-sm text-gray-600 text-center">
                      {new Date(rental.start_date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 text-center">
                      {rental.expected_return_date ? new Date(rental.expected_return_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 text-center">
                      {rental.actual_return_date ? new Date(rental.actual_return_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 text-right">
                      Rs. {rental.rent_amount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-green-600 text-right">
                      Rs. {rental.received_amount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rental.status)}`}>
                        {getStatusIcon(rental.status)}
                        <span className="ml-1">{rental.status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          href={`/dashboard/rentals/${rental.id}`}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRentals.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-gray-500">
                      No rentals found
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
