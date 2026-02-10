import React, { useEffect, useState, useMemo } from 'react'
import axios from 'axios'
import { toast, ToastContainer } from 'react-toastify'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import 'react-toastify/dist/ReactToastify.css'

const Item = () => {
  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
 // name || !category || !measuringUnit || quantity
  const [form, setForm] = useState({ name: '', category: '',measuringUnit: '', quantity: '', description: '' })
  const [editingItem, setEditingItem] = useState(null)
  const [userRole, setUserRole] = useState('user')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) {
      toast.error('Session expired. Please log in again.')
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        const [profileRes, itemsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/users/profile', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/items/get', { headers: { Authorization: `Bearer ${token}` } })
        ])
        setUserRole(profileRes.data.role)
        setItems(itemsRes.data)
        setFilteredItems(itemsRes.data)
      } catch (err) {
        console.error('Data fetch error:', err)
        toast.error('Failed to load data.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token])

  // **Debounced Search**
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setFilteredItems(items)
        return
      }

      const lower = searchQuery.toLowerCase()
      const results = items.filter(
        (i) =>
          i.name.toLowerCase().includes(lower) ||
          i.type.toLowerCase().includes(lower) ||
          (i.currentStatus?.toLowerCase().includes(lower) ?? false)
      )
      setFilteredItems(results)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery, items])

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.category || !form.measuringUnit || !form.quantity) {
      toast.warning('Name, Category, MeasuringUnit and Quantity are required')
      return
    }
    setLoading(true)
    try {
      if (editingItem) {
        await axios.put(`http://localhost:5000/api/items/${editingItem._id}`, form, { headers: { Authorization: `Bearer ${token}` } })
        setItems((prev) => prev.map((i) => (i._id === editingItem._id ? { ...i, ...form } : i)))
        toast.success('Item updated successfully')
      } else {
        const res = await axios.post('http://localhost:5000/api/items/add', form, { headers: { Authorization: `Bearer ${token}` } })
        setItems((prev) => [res.data, ...prev])
        toast.success('Item added successfully')
      }
      setForm({ name: '', category: '',measuringUnit:'',  quantity: '', description: '' })
      setEditingItem(null)
    } catch (err) {
      console.error('Operation failed:', err)
      toast.error('Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setForm({ name: item.name, category: item.category, quantity: item.quantity, description: item.description || '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete permanently?')) return
    try {
      await axios.delete(`http://localhost:5000/api/items/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      setItems((prev) => prev.filter((i) => i._id !== id))
      toast.success('Item deleted successfully')
    } catch (err) {
      console.error('Delete failed:', err)
      toast.error('Delete failed')
    }
  }

  const handleRelease = async (item) => {
    const qtyReleased = Number(prompt('Enter quantity to release:'))
    const releasedTo = prompt('Released to:')
    if (!qtyReleased || !releasedTo) return

    try {
      const res = await axios.post(
        `http://localhost:5000/api/items/release/${item._id}`,
        { qtyReleased, releasedTo },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      )
      toast.success(res.data?.message || 'Item released successfully')
      setItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, quantity: i.quantity - qtyReleased } : i)))
    } catch (err) {
      console.error('Release failed:', err)
      toast.error(err.response?.data?.message || 'Release failed')
    }
  }

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      {Array(6).fill(0).map((_, i) => <td key={i} className="border p-2 bg-gray-200 rounded h-6"></td>)}
    </tr>
  )

  return (
    <motion.div className="p-6" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">Inventory</h1>

      {/* Form */}
      <motion.form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-4">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Item Name" className="border p-2 rounded shadow-sm" />
        <input name="type" value={form.category} onChange={handleChange} placeholder="Item Type" className="border p-2 rounded shadow-sm" />
         <input name="quantity" value={form.measuringUnit} onChange={handleChange} placeholder="Measuring Unit" type="number" className="border p-2 rounded shadow-sm" />
        <input name="quantity" value={form.quantity} onChange={handleChange} placeholder="Quantity" type="number" className="border p-2 rounded shadow-sm" />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description (optional)" rows="1" className="border p-2 rounded shadow-sm col-span-1 sm:col-span-2 resize-none" maxLength="200" />
        <motion.button type="submit" whileTap={{ scale: 0.95 }} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded shadow-md transition col-span-1">{editingItem ? 'Update' : 'Add'}</motion.button>
      </motion.form>

      {/* Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search by name, type, or status..."
        className="border p-2 rounded shadow-sm mb-4 w-full sm:w-1/3"
      />

      {/* Table */}
      {loading ? (
        <SkeletonRow />
      ) : (
        <table className="min-w-full border border-gray-200 text-sm bg-white rounded-lg overflow-hidden shadow-md">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Name</th>
              <th className="border p-2">Category</th>
              <th className="border p-2">Qty</th>
              <th className="border p-2">measuring Uint</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item, idx) => (
                <motion.tr key={item._id} className="text-center hover:bg-gray-50" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                  <td className="border p-2">
                    <Link to={`/items/${item._id}`} className="text-blue-600 hover:underline font-medium">{item.name}</Link>
                  </td>
                  <td className="border p-2">{item.type}</td>
                  <td className="border p-2">{item.quantity}</td>
                  <td className="border p-2">{item.currentStatus}</td>
                  <td className="border p-2 flex justify-center gap-2 flex-wrap">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleEdit(item)} className="bg-yellow-400 px-2 py-1 rounded text-xs font-medium hover:bg-yellow-500 transition">Edit</motion.button>
                    {(userRole === 'admin' || userRole === 'superadmin') && <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleRelease(item)} className="bg-green-500 px-2 py-1 rounded text-xs text-white font-medium hover:bg-green-600 transition">Release</motion.button>}
                    {userRole === 'superadmin' && <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleDelete(item._id)} className="bg-red-700 px-2 py-1 rounded text-xs text-white font-medium hover:bg-red-800 transition">Delete</motion.button>}
                    <Link to={userRole === 'user' ? `/user-dashboard/items/${item._id}` : `/admin-dashboard/items/${item._id}`} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition text-xs font-medium">View</Link>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-gray-500 py-4">No items found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </motion.div>
  )
}

export default Item
