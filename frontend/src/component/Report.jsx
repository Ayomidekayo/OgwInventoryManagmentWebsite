import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Download, CalendarDays, Loader2 } from "lucide-react";

const Report = () => {
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async (e) => {
    e.preventDefault();

    if (!month || !year) {
      toast.warning("Please select both month and year");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/report/monthly?month=${month}&year=${year}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Inventory_Report_${month}_${year}.pdf`;
      link.click();

      toast.success("Report generated successfully!");
    } catch (error) {
      console.error("Error generating report:", error.response?.data || error.message);

      if (error.response?.status === 401) {
        toast.error("Unauthorized: Please log in again.");
      } else if (error.response?.status === 404) {
        toast.error("Report route not found.");
      } else {
        toast.error("Failed to generate report");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md">
      <ToastContainer position="top-right" autoClose={2000} />

      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <CalendarDays className="text-blue-600" /> Monthly Inventory Report
      </h2>

      <form
        onSubmit={handleGenerateReport}
        className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4"
      >
        <div className="flex flex-col w-full md:w-1/2">
          <label className="font-semibold mb-1">Select Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className={`border border-gray-300 rounded-lg p-2 ${
              loading ? "animate-shimmer bg-gray-200 text-transparent" : ""
            }`}
            disabled={loading}
          >
            <option value="">-- Choose Month --</option>
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col w-full md:w-1/2">
          <label className="font-semibold mb-1">Select Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="e.g. 2025"
            className={`border border-gray-300 rounded-lg p-2 ${
              loading ? "animate-shimmer bg-gray-200 text-transparent" : ""
            }`}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-70 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          {loading ? "Generating..." : "Generate PDF"}
        </button>
      </form>
    </div>
  );
};

export default Report;
