'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Download, Eye } from 'lucide-react'
import Link from 'next/link'

interface Sale {
  id: string
  sale_number: string
  customer_name: string
  item_name: string
  sale_price: number
  received_amount: number
  remaining_amount: number
  sale_date: string
  status: 'completed' | 'partial' | 'pending'
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customers(name),
          inventory_items(brand, model)
        `)
        .order('sale_date', { ascending: false })

      if (error) throw error

      const salesWithDetails = data?.map(sale => {
        const status: Sale['status'] = sale.remaining_amount === 0 ? 'completed' :
                       sale.received_amount > 0 ? 'partial' : 'pending'

        return {
          id: sale.id,
          sale_number: sale.sale_number,
          customer_name: sale.customers?.name || 'Unknown',
          item_name: `${sale.inventory_items?.brand} ${sale.inventory_items?.model}`,
          sale_price: Number(sale.sale_price),
          received_amount: Number(sale.received_amount),
          remaining_amount: Number(sale.remaining_amount),
          sale_date: sale.sale_date,
          status,
        }
      }) || []

      setSales(salesWithDetails)
    } catch (error) {
      console.error('Error fetching sales:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSales()
  }, [])

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.item_name.toLowerCase().includes(searchTerm.toLowerCase())

    if (dateFilter === 'all') return matchesSearch

    const saleDate = new Date(sale.sale_date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateFilter === 'today') {
      return matchesSearch && saleDate.toDateString() === today.toDateString()
    }
    if (dateFilter === 'yesterday') {
      return matchesSearch && saleDate.toDateString() === yesterday.toDateString()
    }
    if (dateFilter === 'week') {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      return matchesSearch && saleDate >= weekAgo
    }
    if (dateFilter === 'month') {
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return matchesSearch && saleDate >= monthAgo
    }

    return matchesSearch
  })

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
            <p className="text-gray-600">Manage your sales and payments</p>
          </div>
          <Link
            href="/dashboard/sales/new"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Sale
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 border space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by sale number, customer, or item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            <button className="inline-flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50">
              <Download className="h-5 w-5 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Sale #</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Item</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Sale Price</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Received</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Remaining</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">{sale.sale_number}</td>
                    <td className="py-4 px-4 text-sm text-gray-900">{sale.customer_name}</td>
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
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 text-center">
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          href={`/dashboard/sales/view?id=${sale.id}`}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      No sales found
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
