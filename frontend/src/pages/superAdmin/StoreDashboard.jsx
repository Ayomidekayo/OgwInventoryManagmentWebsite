import { useState } from 'react';
import { LayoutDashboard, Package, Users, Settings, BarChart3, Bell, LogOut, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StoreDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
    { name: 'Items', icon: Package, id: 'items' },
    { name: 'Users', icon: Users, id: 'users' },
    { name: 'Reports', icon: BarChart3, id: 'reports' },
    { name: 'Settings', icon: Settings, id: 'settings' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 250 : 80 }}
        className="bg-white border-r shadow-sm flex flex-col transition-all duration-300"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h1 className={`text-xl font-bold text-blue-600 ${!sidebarOpen && 'hidden'}`}>Store Admin</h1>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500">
            <Menu size={22} />
          </button>
        </div>

        <nav className="flex-1 mt-4 space-y-2">
          {menuItems.map(({ name, icon: Icon, id }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center w-full px-4 py-2 text-sm font-medium transition rounded-lg hover:bg-blue-50 hover:text-blue-600 ${
                activeTab === id ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
              }`}
            >
              <Icon size={20} className="mr-3" />
              {sidebarOpen && name}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600">
            <LogOut size={20} className="mr-2" />
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow flex items-center justify-between px-6 py-3 border-b">
          <h2 className="text-xl font-semibold text-gray-800 capitalize">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <button className="relative text-gray-600 hover:text-blue-600">
              <Bell size={22} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">3</span>
            </button>
            <div className="flex items-center gap-2">
              <img
                src="https://i.pravatar.cc/40"
                alt="admin avatar"
                className="w-9 h-9 rounded-full border"
              />
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-800">Admin User</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <section>
              <h3 className="text-lg font-semibold mb-4">Quick Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Items', value: 1200, color: 'bg-blue-500' },
                  { label: 'Low Stock', value: 24, color: 'bg-yellow-500' },
                  { label: 'Registered Users', value: 89, color: 'bg-green-500' },
                  { label: 'Pending Orders', value: 14, color: 'bg-red-500' },
                ].map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition"
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-600">{card.label}</p>
                      <span className={`w-3 h-3 rounded-full ${card.color}`}></span>
                    </div>
                    <h4 className="text-2xl font-bold text-gray-800 mt-2">{card.value}</h4>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'items' && (
            <section>
              <h3 className="text-lg font-semibold mb-4">Items Management</h3>
              <div className="bg-white p-6 rounded-xl shadow">
                <p className="text-gray-500">Here you can view, add, or edit items in the inventory.</p>
              </div>
            </section>
          )}

          {activeTab === 'users' && (
            <section>
              <h3 className="text-lg font-semibold mb-4">User Management</h3>
              <div className="bg-white p-6 rounded-xl shadow">
                <p className="text-gray-500">Manage admin and staff roles, permissions, and access levels.</p>
              </div>
            </section>
          )}

          {activeTab === 'reports' && (
            <section>
              <h3 className="text-lg font-semibold mb-4">Reports</h3>
              <div className="bg-white p-6 rounded-xl shadow">
                <p className="text-gray-500">Generate monthly summaries, item trends, and low stock alerts.</p>
              </div>
            </section>
          )}

          {activeTab === 'settings' && (
            <section>
              <h3 className="text-lg font-semibold mb-4">Settings</h3>
              <div className="bg-white p-6 rounded-xl shadow">
                <p className="text-gray-500">Configure email notifications, thresholds, and user preferences.</p>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
