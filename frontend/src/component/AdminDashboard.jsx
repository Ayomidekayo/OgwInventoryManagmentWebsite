import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import ReactApexChart from "react-apexcharts";
import CountUp from "react-countup";

// Premium Skeleton Loader (Shimmer Effect)
const SkeletonLoader = ({ height = "h-6", width = "w-full", rounded = "rounded-md" }) => (
  <div
    className={`relative overflow-hidden bg-gray-200 dark:bg-gray-700 ${height} ${width} ${rounded}`}
  >
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
  </div>
);


//  Dashboard KPI Card Component
const DashboardCard = ({ title, value, hint, color, loading }) => (
  <div
    className="rounded-xl shadow p-5 text-white transition-all hover:scale-[1.03] duration-200"
    style={{ backgroundColor: color }}
  >
    {loading ? (
      <>
        <SkeletonLoader height="h-4" width="w-20" />
        <SkeletonLoader height="h-8" width="w-24" className="mt-3" />
        <SkeletonLoader height="h-3" width="w-16" className="mt-2" />
      </>
    ) : (
      <>
        <div className="text-sm opacity-80">{title}</div>
        <div className="text-3xl font-bold mt-2">
          <CountUp end={value || 0} duration={1.5} separator="," />
        </div>
        {hint && <div className="text-xs opacity-80 mt-1">{hint}</div>}
      </>
    )}
  </div>
);

export default function AdminDashboard() {
  const token = localStorage.getItem("token");
  const [summary, setSummary] = useState({
    counts: { totalItems: 0, totalUsers: 0, totalDeletedItems: 0 },
    lowStock: [],
    topReleased: [],
    threshold: 0,
    trendData: [],
  });
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastLowStockIdsRef = useRef(new Set());

  const fetchProfile = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.user ?? res.data;
      setUserRole(data?.role || null);
    } catch (err) {
      console.error("Profile fetch error", err);
    }
  };

  const fetchSummary = async (notifyNewLow = true) => {
    try {
      const res = await axios.get("http://localhost:5000/api/dashboard/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const serverSummary = res.data;
      setSummary(serverSummary);

      // Low-stock notifications
      if (notifyNewLow && serverSummary.lowStock?.length) {
        const currentIds = new Set(serverSummary.lowStock.map((i) => i._id));
        const prev = lastLowStockIdsRef.current;
        for (const id of currentIds) {
          if (!prev.has(id)) {
            const item = serverSummary.lowStock.find((x) => x._id === id);
            toast(`Low stock: ${item.name} (${item.quantity})`, { icon: "⚠️" });
          }
        }
        lastLowStockIdsRef.current = currentIds;
      }
    } catch (err) {
      console.error("Error fetching dashboard summary", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchSummary();
    const id = setInterval(() => fetchSummary(true), 25000);
    return () => clearInterval(id);
  }, []);

  const { counts, lowStock, topReleased, threshold, trendData } = summary;

  const topReleasedChart = {
    series: [
      {
        name: "Released Quantity",
        data: (topReleased || [])
          .filter((i) => i && i.totalReleased != null)
          .map((i) => Number(i.totalReleased)),
      },
    ],
    options: {
      chart: { type: "bar", toolbar: { show: false } },
      plotOptions: { bar: { distributed: true, borderRadius: 6, columnWidth: "55%" } },
      colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
      dataLabels: { enabled: false },
      xaxis: {
        categories: (topReleased || [])
          .filter((i) => i && i.name)
          .map((i) => i.name.toString()),
        labels: { rotate: -45 },
      },
      yaxis: { title: { text: "Qty Released" } },
      title: {
        text: "Top Released Items",
        align: "center",
        style: { fontSize: "16px", fontWeight: 600 },
      },
    },
  };

  const trendChart = {
    series: [
      {
        name: "Total Stock",
        data: (trendData || [])
          .filter((t) => t && t.totalStock != null)
          .map((t) => Number(t.totalStock)),
      },
      {
        name: "Items Released",
        data: (trendData || [])
          .filter((t) => t && t.released != null)
          .map((t) => Number(t.released)),
      },
    ],
    options: {
      chart: { type: "line", toolbar: { show: false } },
      stroke: { curve: "smooth", width: 3 },
      colors: ["#3B82F6", "#EF4444"],
      xaxis: {
        categories: (trendData || [])
          .filter((t) => t && t.dateLabel)
          .map((t) => t.dateLabel.toString()),
        title: { text: "Date" },
      },
      yaxis: { title: { text: "Quantity" } },
      title: {
        text: "Inventory Trend (Past 30 Days)",
        align: "center",
        style: { fontSize: "16px", fontWeight: 600 },
      },
      legend: { position: "top" },
    },
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <DashboardCard
          title="Total Items"
          value={counts?.totalItems ?? 0}
          hint="All inventory items"
          color="#3B82F6"
          loading={loading}
        />
        <DashboardCard
          title="Total Users"
          value={counts?.totalUsers ?? 0}
          hint="Registered users"
          color="#10B981"
          loading={loading}
        />
        <DashboardCard
          title="Deleted Items"
          value={counts?.totalDeletedItems ?? 0}
          hint="Soft or permanently deleted"
          color="#EF4444"
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow p-5">
          {loading ? (
            <SkeletonLoader height="h-[350px]" rounded="rounded-xl" />
          ) : topReleased?.length ? (
            <ReactApexChart
              options={topReleasedChart.options}
              series={topReleasedChart.series}
              type="bar"
              height={350}
            />
          ) : (
            <div className="text-gray-500">No release data yet.</div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          {loading ? (
            <SkeletonLoader height="h-[350px]" rounded="rounded-xl" />
          ) : trendData?.length ? (
            <ReactApexChart
              options={trendChart.options}
              series={trendChart.series}
              type="line"
              height={350}
            />
          ) : (
            <div className="text-gray-500">No trend data available.</div>
          )}
        </div>
      </div>

      {/* Low Stock List */}
      <div className="bg-white rounded-xl shadow p-5 mb-8">
        <h2 className="font-semibold text-lg mb-3 text-gray-700">
          Low Stock (Threshold: {threshold})
        </h2>
        {loading ? (
          <ul className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <li
                key={i}
                className="flex justify-between items-center border rounded-lg p-3"
              >
                <div className="flex-1">
                  <SkeletonLoader height="h-4" width="w-32" />
                  <SkeletonLoader height="h-3" width="w-20" className="mt-2" />
                </div>
                <SkeletonLoader height="h-4" width="w-8" />
              </li>
            ))}
          </ul>
        ) : lowStock?.length ? (
          <ul className="space-y-2">
            {lowStock.map((it) => (
              <li
                key={it._id}
                className="flex justify-between items-center border rounded-lg p-2 hover:bg-gray-50 transition"
              >
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs text-gray-500">
                    Qty: {it.quantity} • Added by: {it.addedBy?.name || "Unknown"}
                  </div>
                </div>
                <div className="text-sm font-semibold text-red-600">{it.quantity}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-500">No low-stock items.</div>
        )}
      </div>

      {(userRole === "admin" || userRole === "superadmin") && !loading && (
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold mb-2 text-gray-700">Admin Actions</h3>
          <p className="text-sm text-gray-600">
            Manage, release, or delete items in the Inventory Management section.
          </p>
        </div>
      )}
    </div>
  );
}
