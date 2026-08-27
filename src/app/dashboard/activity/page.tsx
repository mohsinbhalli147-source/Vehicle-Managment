'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { Clock, User, RefreshCw } from 'lucide-react'

interface Activity {
  id: string
  action: string
  entity_type: string
  description: string
  created_at: string
  performed_by_name: string
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setActivities(
        data?.map(activity => ({
          id: activity.id,
          action: activity.action,
          entity_type: activity.entity_type,
          description: activity.description || '',
          created_at: activity.created_at,
          performed_by_name: activity.profiles?.full_name || 'Unknown',
        })) || []
      )
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes('Added') || action.includes('Created')) return 'bg-green-100 text-green-800'
    if (action.includes('Sold') || action.includes('Deleted')) return 'bg-red-100 text-red-800'
    if (action.includes('Payment')) return 'bg-blue-100 text-blue-800'
    if (action.includes('Rented')) return 'bg-purple-100 text-purple-800'
    if (action.includes('Returned')) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
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
            <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
            <p className="text-gray-600">Real-time monitoring of all business activities</p>
          </div>
          <button
            onClick={fetchActivities}
            className="inline-flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Refresh
          </button>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(activity.action)}`}>
                      {activity.action}
                    </span>
                    <span className="text-xs text-gray-400">{formatTime(activity.created_at)}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">{activity.description}</p>
                  <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                    <User className="h-3 w-3" />
                    <span>{activity.performed_by_name}</span>
                  </div>
                </div>
              </div>
            ))}

            {activities.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No activity recorded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
