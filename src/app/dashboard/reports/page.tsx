'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { BarChart3, Download, Calendar } from 'lucide-react'

interface SalesReport {
  total_sales: number
  number_of_sales: number
  total_amount: number
  total_received: number
  total_remaining: number
}

interface StockReport {
  category: string
  total_items: number
  available: number
  sold: number
}

interface RentalReport {
  total_rentals: number
  total_income: number
  active_rentals: number
  returned_rentals: number
}

interface CustomerOutstanding {
  customer_name: string
  customer_phone: string
  outstanding_amount: number
}

export default function ReportsPage() {
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null)
  const [stockReport, setStockReport] = useState<StockReport[]>([])
  const [rentalReport, setRentalReport] = useState<RentalReport | null>(null)
  const [customerOutstanding, setCustomerOutstanding] = useState<CustomerOutstanding[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      // Sales Report
      const { data: salesData } = await supabase
        .from('sales')
        .select('sale_price, received_amount, remaining_amount')

      if (salesData) {
        setSalesReport({
          total_sales: salesData.length,
          number_of_sales: salesData.length,
          total_amount: salesData.reduce((sum, sale) => sum + Number(sale.sale_price), 0),
          total_received: salesData.reduce((sum, sale) => sum + Number(sale.received_amount), 0),
          total_remaining: salesData.reduce((sum, sale) => sum + Number(sale.remaining_amount), 0),
        })
      }

      // Stock Report
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')

      if (categories) {
        const stockData = await Promise.all(
          categories.map(async (category) => {
            const { count: total } = await supabase
              .from('inventory_items')
              .select('*', { count: 'exact', head: true })
              .eq('category_id', category.id)

            const { count: available } = await supabase
              .from('inventory_items')
              .select('*', { count: 'exact', head: true })
              .eq('category_id', category.id)
              .eq('status', 'available')

            const { count: sold } = await supabase
              .from('inventory_items')
              .select('*', { count: 'exact', head: true })
              .eq('category_id', category.id)
              .eq('status', 'sold')

            return {
              category: category.name,
              total_items: total || 0,
              available: available || 0,
              sold: sold || 0,
            }
          })
        )

        setStockReport(stockData.filter(stock => stock.total_items > 0))
      }

      // Rental Report
      const { data: rentalsData } = await supabase
        .from('rentals')
        .select('rent_amount, status')

      if (rentalsData) {
        setRentalReport({
          total_rentals: rentalsData.length,
          total_income: rentalsData.reduce((sum, rental) => sum + Number(rental.rent_amount), 0),
          active_rentals: rentalsData.filter(r => r.status === 'active').length,
          returned_rentals: rentalsData.filter(r => r.status === 'returned').length,
        })
      }

      // Customer Outstanding
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, phone')

      if (customers) {
        const outstandingData = await Promise.all(
          customers.map(async (customer) => {
            const { data: salesData } = await supabase
              .from('sales')
              .select('remaining_amount')
              .eq('customer_id', customer.id)

            const outstanding = salesData?.reduce((sum, sale) => sum + Number(sale.remaining_amount), 0) || 0

            return {
              customer_name: customer.name,
              customer_phone: customer.phone,
              outstanding_amount: outstanding,
            }
          })
        )

        setCustomerOutstanding(outstandingData.filter(c => c.outstanding_amount > 0))
      }

    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600">Business analytics and insights</p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Download className="h-5 w-5 mr-2" />
            Export All
          </button>
        </div>

        {/* Date Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="flex items-center space-x-4">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Report */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Sales Report</h2>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            {salesReport ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Sales:</span>
                  <span className="font-medium">{salesReport.total_sales}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium">Rs. {salesReport.total_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Received:</span>
                  <span className="font-medium text-green-600">Rs. {salesReport.total_received.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Remaining:</span>
                  <span className="font-medium text-red-600">Rs. {salesReport.total_remaining.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No sales data available</p>
            )}
          </div>

          {/* Rental Report */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Rental Report</h2>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            {rentalReport ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Rentals:</span>
                  <span className="font-medium">{rentalReport.total_rentals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Income:</span>
                  <span className="font-medium">Rs. {rentalReport.total_income.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Rentals:</span>
                  <span className="font-medium text-green-600">{rentalReport.active_rentals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Returned Rentals:</span>
                  <span className="font-medium text-blue-600">{rentalReport.returned_rentals}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No rental data available</p>
            )}
          </div>

          {/* Stock Report */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Stock Report</h2>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Category</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600">Total</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600">Available</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600">Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {stockReport.map((stock, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-2 text-sm text-gray-900">{stock.category}</td>
                      <td className="py-2 text-sm text-gray-900 text-right">{stock.total_items}</td>
                      <td className="py-2 text-sm text-green-600 text-right">{stock.available}</td>
                      <td className="py-2 text-sm text-gray-600 text-right">{stock.sold}</td>
                    </tr>
                  ))}
                  {stockReport.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-500 text-sm">
                        No stock data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Outstanding */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Customer Outstanding</h2>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Customer</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Phone</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600">Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {customerOutstanding.map((customer, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-2 text-sm text-gray-900">{customer.customer_name}</td>
                      <td className="py-2 text-sm text-gray-600">{customer.customer_phone}</td>
                      <td className="py-2 text-sm text-red-600 text-right font-medium">
                        Rs. {customer.outstanding_amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {customerOutstanding.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-gray-500 text-sm">
                        No outstanding payments
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
