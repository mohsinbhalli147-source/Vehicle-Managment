'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { useInventory, useCategories, useDeleteInventory } from '@/hooks/useInventory'
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Download
} from 'lucide-react'
import Link from 'next/link'

interface Category {
  id: string
  name: string
}

interface InventoryItem {
  id: string
  brand: string
  model: string
  model_year: number
  color: string
  chassis_number: string
  engine_number: string
  registration_number: string
  purchase_price: number
  sale_price: number
  status: 'available' | 'sold' | 'reserved' | 'maintenance'
  category_name?: string
  vehicle_type: string
}

export default function InventoryPage() {
  const { data: inventoryData, isLoading: inventoryLoading } = useInventory()
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories()
  const deleteMutation = useDeleteInventory()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('all')

  const items = (inventoryData || []).map(item => ({
    ...item,
    category_name: item.categories?.name || null,
  }))

  const categories = categoriesData || []



  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await deleteMutation.mutateAsync(id)
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.chassis_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.engine_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.registration_number?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === 'all' || item.category_name === selectedCategory
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus
    const matchesVehicleType = selectedVehicleType === 'all' || item.vehicle_type === selectedVehicleType

    return matchesSearch && matchesCategory && matchesStatus && matchesVehicleType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'sold': return 'bg-red-100 text-red-800'
      case 'reserved': return 'bg-yellow-100 text-yellow-800'
      case 'maintenance': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (inventoryLoading || categoriesLoading) {
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
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
            <p className="text-gray-600">Manage your vehicle inventory</p>
          </div>
          <Link
            href="/dashboard/inventory/add"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Item
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 border space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by brand, model, chassis, engine, or registration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="reserved">Reserved</option>
              <option value="maintenance">Maintenance</option>
            </select>

            <select
              value={selectedVehicleType}
              onChange={(e) => setSelectedVehicleType(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="Bike">Bikes</option>
              <option value="Rickshaw">Rickshaws</option>
              <option value="Battery">Batteries</option>
              <option value="Body Parts">Body Parts</option>
              <option value="Other">Other</option>
            </select>

            <button className="inline-flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50">
              <Download className="h-5 w-5 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Vehicle</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Details</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Category</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Purchase</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Sale</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{item.brand} {item.model}</p>
                        <p className="text-sm text-gray-500">{item.model_year || 'N/A'} • {item.color || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {item.vehicle_type}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-600">
                        <p>Chassis: {item.chassis_number || 'N/A'}</p>
                        <p>Engine: {item.engine_number || 'N/A'}</p>
                        <p>Reg: {item.registration_number || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">{item.category_name || 'N/A'}</td>
                    <td className="py-4 px-4 text-sm text-gray-900 text-right">
                      {item.purchase_price ? `Rs. ${Number(item.purchase_price).toLocaleString()}` : 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 text-right">
                      {item.sale_price ? `Rs. ${Number(item.sale_price).toLocaleString()}` : 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          href={`/dashboard/inventory/${item.id}`}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/dashboard/inventory/${item.id}/edit`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      No inventory items found
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
