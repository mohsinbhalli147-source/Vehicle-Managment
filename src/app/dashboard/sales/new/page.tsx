'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Plus } from 'lucide-react'
import Link from 'next/link'

interface Customer {
  id: string
  name: string
  phone: string
}

interface InventoryItem {
  id: string
  brand: string
  model: string
  sale_price: number
  status: string
}

export default function NewSalePage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [formData, setFormData] = useState({
    customer_id: '',
    inventory_item_id: '',
    sale_price: '',
    received_amount: '',
  })
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    cnic: '',
    address: '',
  })

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name')

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchInventoryItems = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInventoryItems(data || [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCustomers()
    fetchInventoryItems()
  }, [])

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: newCustomer.name,
          phone: newCustomer.phone,
          cnic: newCustomer.cnic || null,
          address: newCustomer.address || null,
        })
        .select()
        .single()

      if (error) throw error

      setCustomers([...customers, data])
      setFormData({ ...formData, customer_id: data.id })
      setNewCustomer({ name: '', phone: '', cnic: '', address: '' })
      setShowAddCustomer(false)
    } catch (error) {
      console.error('Error adding customer:', error)
      alert('Failed to add customer')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const salePrice = parseFloat(formData.sale_price)
      const receivedAmount = parseFloat(formData.received_amount)
      const remainingAmount = salePrice - receivedAmount

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      // Generate sale number
      const saleNumber = `SALE-${Date.now()}`

      // Create sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          sale_number: saleNumber,
          customer_id: formData.customer_id,
          inventory_item_id: formData.inventory_item_id,
          sale_price: salePrice,
          received_amount: receivedAmount,
          remaining_amount: remainingAmount,
          created_by: userData.user?.id,
        })
        .select()
        .single()

      if (saleError) throw saleError

      // Update inventory item status
      await supabase
        .from('inventory_items')
        .update({ status: 'sold' })
        .eq('id', formData.inventory_item_id)

      // Log activity
      const selectedItem = inventoryItems.find(item => item.id === formData.inventory_item_id)
      const selectedCustomer = customers.find(c => c.id === formData.customer_id)

      await supabase.rpc('log_activity', {
        p_action: 'Item Sold',
        p_entity_type: 'sale',
        p_entity_id: saleData.id,
        p_description: `${selectedItem?.brand} ${selectedItem?.model} sold to ${selectedCustomer?.name}`,
      })

      // If payment received, log payment
      if (receivedAmount > 0) {
        await supabase.from('payments').insert({
          sale_id: saleData.id,
          customer_id: formData.customer_id,
          amount: receivedAmount,
          received_by: userData.user?.id,
        })

        await supabase.rpc('log_activity', {
          p_action: 'Payment Received',
          p_entity_type: 'payment',
          p_entity_id: null,
          p_description: `Rs. ${receivedAmount.toLocaleString()} received from ${selectedCustomer?.name}`,
        })
      }

      router.push('/dashboard/sales')
    } catch (error) {
      console.error('Error creating sale:', error)
      alert('Failed to create sale. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const salePrice = parseFloat(formData.sale_price) || 0
  const receivedAmount = parseFloat(formData.received_amount) || 0
  const remainingAmount = salePrice - receivedAmount

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard/sales"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Sales
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">New Sale</h1>
          <p className="text-gray-600">Create a new sale record</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 border space-y-6">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer *
            </label>
            <div className="flex space-x-2">
              <select
                required
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowAddCustomer(true)}
                className="inline-flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Customer
              </button>
            </div>
          </div>

          {/* Inventory Item Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Inventory Item *
            </label>
            <select
              required
              value={formData.inventory_item_id}
              onChange={(e) => {
                const item = inventoryItems.find(i => i.id === e.target.value)
                setFormData({
                  ...formData,
                  inventory_item_id: e.target.value,
                  sale_price: item?.sale_price?.toString() || '',
                })
              }}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Item</option>
              {inventoryItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.brand} {item.model} - Rs. {item.sale_price?.toLocaleString() || 'N/A'}
                </option>
              ))}
            </select>
          </div>

          {/* Sale Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sale Price (Rs.) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.sale_price}
              onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., 125000"
            />
          </div>

          {/* Received Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Received Amount (Rs.)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.received_amount}
              onChange={(e) => setFormData({ ...formData, received_amount: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., 50000"
            />
          </div>

          {/* Summary */}
          {formData.sale_price && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sale Price:</span>
                <span className="font-medium">Rs. {salePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Received:</span>
                <span className="font-medium text-green-600">Rs. {receivedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-gray-600">Remaining:</span>
                <span className={`font-medium ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Rs. {remainingAmount.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end space-x-3">
            <Link
              href="/dashboard/sales"
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="h-5 w-5 mr-2" />
              {loading ? 'Creating Sale...' : 'Create Sale'}
            </button>
          </div>
        </form>

        {/* Add Customer Modal */}
        {showAddCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Customer</h2>
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNIC
                  </label>
                  <input
                    type="text"
                    value={newCustomer.cnic}
                    onChange={(e) => setNewCustomer({ ...newCustomer, cnic: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                  >
                    Add Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomer(false)}
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
