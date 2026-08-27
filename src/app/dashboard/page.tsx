'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { 
  Package, 
  CheckCircle, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  AlertCircle 
} from 'lucide-react'

interface DashboardStats {
  totalInventory: number
  availableStock: number
  todaySales: number
  todayReceived: number
  rentalIncome: number
  outstanding: number
}

interface CategoryStock {
  category: string
  total: number
  available: number
  sold: number
}

interface RecentActivity {
  id: string
  action: string
  description: string
  created_at: string
  performed_by_name: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInventory: 0,
    availableStock: 0,
    todaySales: 0,
    todayReceived: 0,
    rentalIncome: 0,
    outstanding: 0,
  })
  const [categoryStock, setCategoryStock] = useState<CategoryStock[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    if (!supabase) return

    try {
      const today = new Date().toISOString().split('T')[0]

      // Fetch total inventory
      const { count: totalInventory } = await supabase
        .from('inventory_items')
        .select('*', { count: 'exact', head: true })

      // Fetch available stock
      const { count: availableStock } = await supabase
        .from('inventory_items')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available')

      // Fetch today's sales
      const { data: todaySalesData } = await supabase
        .from('sales')
        .select('sale_price')
        .gte('sale_date', today)

      const todaySales = todaySalesData?.reduce((sum, sale) => sum + Number(sale.sale_price), 0) || 0

      // Fetch today's received payments
      const { data: todayPaymentsData } = await supabase
        .from('payments')
        .select('amount')
        .gte('payment_date', today)

      const todayReceived = todayPaymentsData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0

      // Fetch rental income (current month)
      const currentMonth = new Date().toISOString().slice(0, 7)
      const { data: rentalData } = await supabase
        .from('rentals')
        .select('rent_amount')
        .gte('created_at', currentMonth)

      const rentalIncome = rentalData?.reduce((sum, rental) => sum + Number(rental.rent_amount), 0) || 0

      // Fetch outstanding (remaining from sales)
      const { data: outstandingData } = await supabase
        .from('sales')
        .select('remaining_amount')

      const outstanding = outstandingData?.reduce((sum, sale) => sum + Number(sale.remaining_amount), 0) || 0

      setStats({
        totalInventory: totalInventory || 0,
        availableStock: availableStock || 0,
        todaySales,
        todayReceived,
        rentalIncome,
        outstanding,
      })

      // Fetch category stock
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')

      if (categories) {
        const categoryStats = await Promise.all(
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
              total: total || 0,
              available: available || 0,
              sold: sold || 0,
            }
          })
        )

        setCategoryStock(categoryStats.filter(cat => cat.total > 0))
      }

      // Fetch recent activities
      const { data: activities } = await supabase
        .from('activities')
        .select(`
          *,
          profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      setRecentActivities(
        activities?.map(activity => ({
          id: activity.id,
          action: activity.action,
          description: activity.description || '',
          created_at: activity.created_at,
          performed_by_name: activity.profiles?.full_name || 'Unknown',
        })) || []
      )

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {typeof value === 'number' && title.includes('Rs.') 
              ? `Rs. ${value.toLocaleString()}` 
              : value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )

  if (!supabase) {
    return (
      <DashboardLayout>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">Supabase is not configured. Please set up your environment variables.</p>
        </div>
      </DashboardLayout>
    )
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your business performance</p>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Inventory"
            value={stats.totalInventory}
            icon={Package}
            color="bg-blue-500"
          />
          <StatCard
            title="Available Stock"
            value={stats.availableStock}
            icon={CheckCircle}
            color="bg-green-500"
          />
          <StatCard
            title="Today's Sales"
            value={`Rs. ${stats.todaySales.toLocaleString()}`}
            icon={DollarSign}
            color="bg-indigo-500"
          />
          <StatCard
            title="Today's Received"
            value={`Rs. ${stats.todayReceived.toLocaleString()}`}
            icon={TrendingUp}
            color="bg-emerald-500"
          />
          <StatCard
            title="Rental Income"
            value={`Rs. ${stats.rentalIncome.toLocaleString()}`}
            icon={Clock}
            color="bg-purple-500"
          />
          <StatCard
            title="Outstanding"
            value={`Rs. ${stats.outstanding.toLocaleString()}`}
            icon={AlertCircle}
            color="bg-orange-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Overview */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock Overview</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Category</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Total</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Available</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryStock.map((item, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-3 px-4 text-sm text-gray-900">{item.category}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">{item.total}</td>
                      <td className="py-3 px-4 text-sm text-green-600 text-right">{item.available}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 text-right">{item.sold}</td>
                    </tr>
                  ))}
                  {categoryStock.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        No inventory data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-indigo-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.created_at).toLocaleString()} • {activity.performed_by_name}
                    </p>
                  </div>
                </div>
              ))}
              {recentActivities.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
