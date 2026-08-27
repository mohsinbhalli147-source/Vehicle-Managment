'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Package, Calendar, DollarSign, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface InventoryItem {
  id: string
  brand: string
  model: string
  model_year: number
  color: string
  chassis_number: string
  engine_number: string
  registration_number: string
  mileage: number
  supplier: string
  purchase_date: string
  purchase_price: number
  sale_price: number
  status: string
  category_name?: string
  notes: string
  images: string[]
  documents: string[]
  created_at: string
}

export default function InventoryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchItem(params.id as string)
    }
  }, [params.id])

  const fetchItem = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          categories(name)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      setItem({
        ...data,
        category_name: data.categories?.name,
      })
    } catch (error) {
      console.error('Error fetching item:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', item?.id)

      if (error) throw error
      router.push('/dashboard/inventory')
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'sold': return 'bg-red-100 text-red-800'
      case 'reserved': return 'bg-yellow-100 text-yellow-800'
      case 'maintenance': return 'bg-gray-100 text-gray-800'
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

  if (!item) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Item not found</p>
          <Link
            href="/dashboard/inventory"
            className="inline-flex items-center mt-4 text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
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
              href="/dashboard/inventory"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Inventory
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              {item.brand} {item.model}
            </h1>
            <p className="text-gray-600">Vehicle Details</p>
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/dashboard/inventory/${item.id}/edit`}
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

        {/* Status Badge */}
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
          {item.category_name && (
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
              {item.category_name}
            </span>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Basic Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Brand:</span>
                <span className="font-medium">{item.brand}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Model:</span>
                <span className="font-medium">{item.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Year:</span>
                <span className="font-medium">{item.model_year || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Color:</span>
                <span className="font-medium">{item.color || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mileage:</span>
                <span className="font-medium">{item.mileage ? `${item.mileage.toLocaleString()} km` : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Vehicle Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Chassis Number:</span>
                <span className="font-medium">{item.chassis_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Engine Number:</span>
                <span className="font-medium">{item.engine_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Registration:</span>
                <span className="font-medium">{item.registration_number || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Purchase Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Purchase Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Supplier:</span>
                <span className="font-medium">{item.supplier || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Purchase Date:</span>
                <span className="font-medium">
                  {item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Purchase Price:</span>
                <span className="font-medium">
                  {item.purchase_price ? `Rs. ${item.purchase_price.toLocaleString()}` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sale Price:</span>
                <span className="font-medium">
                  {item.sale_price ? `Rs. ${item.sale_price.toLocaleString()}` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Additional Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Added On:</span>
                <span className="font-medium">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
              {item.notes && (
                <div>
                  <span className="text-gray-600 block mb-1">Notes:</span>
                  <p className="text-sm text-gray-800">{item.notes}</p>
                </div>
              )}
              {item.images && item.images.length > 0 && (
                <div>
                  <span className="text-gray-600 block mb-1">Images:</span>
                  <p className="text-sm text-gray-800">{item.images.length} image(s)</p>
                </div>
              )}
              {item.documents && item.documents.length > 0 && (
                <div>
                  <span className="text-gray-600 block mb-1">Documents:</span>
                  <p className="text-sm text-gray-800">{item.documents.length} document(s)</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
