import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";

import { Bar, Line } from "react-chartjs-2";

// Register charts
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const [summary, setSummary] = useState({});
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [topProviders, setTopProviders] = useState([]);

  useEffect(() => {
    fetchSummary();
    fetchRevenueTrend();
    fetchTopProviders();
  }, []);

  async function fetchSummary() {
    const res = await fetch("/api/admin/summary");
    const data = await res.json();
    setSummary(data);
  }

  async function fetchRevenueTrend() {
    const res = await fetch("/api/admin/reports/revenue");
    const data = await res.json();
    setRevenueTrend(data.items || []);
  }

  async function fetchTopProviders() {
    const res = await fetch("/api/admin/reports/providers");
    const data = await res.json();
    setTopProviders(data.providers || []);
  }

  return (
    <div className="p-6 space-y-6">

      {/* =========================== */}
      {/* SUMMARY CARDS */}
      {/* =========================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard title="Total Users" value={summary.totalUsers} />
        <SummaryCard title="Total Providers" value={summary.totalProviders} />
        <SummaryCard title="Total Listings" value={summary.totalListings} />
        <SummaryCard title="Total Bookings" value={summary.totalBookings} />
        <SummaryCard title="Total Revenue" value={`$${summary.totalRevenue}`} />
      </div>


      {/* =========================== */}
      {/* REVENUE TREND CHART */}
      {/* =========================== */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Monthly Revenue Trend</h2>

        <Line
          data={{
            labels: revenueTrend.map((x) => x.month),
            datasets: [
              {
                label: "Revenue",
                data: revenueTrend.map((x) => x.revenue),
                borderColor: "#FF6B00",
                backgroundColor: "rgba(255,122,0,0.2)",
                tension: 0.3
              }
            ]
          }}
        />
      </div>


      {/* =========================== */}
      {/* TOP PROVIDERS BAR CHART */}
      {/* =========================== */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Top 10 Providers</h2>

        <Bar
          data={{
            labels: topProviders.map((p) => p._id),
            datasets: [
              {
                label: "Revenue",
                data: topProviders.map((p) => p.totalRevenue),
                backgroundColor: "#0077FF",
              }
            ]
          }}
        />
      </div>

    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
      <p className="text-gray-500 font-medium">{title}</p>
      <h2 className="text-3xl font-bold text-gray-800 mt-1">{value ?? "—"}</h2>
    </div>
  );
}