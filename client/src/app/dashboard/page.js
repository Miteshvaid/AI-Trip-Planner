"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await api.get("/trips");
        setTrips(res.data);
      } catch (err) {
        setError("Failed to load trips");
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">✈️ AI Trip Planner</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Hi, {user?.name}</span>
          <button
            onClick={logout}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Your Trips</h2>
          <Link
            href="/trips/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition"
          >
            + New Trip
          </Link>
        </div>

        {loading && <p className="text-gray-500">Loading trips...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && trips.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <p className="text-gray-500 mb-4">
              No trips yet. Start planning your first adventure!
            </p>
            <Link
              href="/trips/new"
              className="text-blue-600 font-semibold hover:underline"
            >
              Create your first trip →
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <Link
              key={trip._id}
              href={`/trips/${trip._id}`}
              className="bg-white rounded-2xl shadow hover:shadow-lg transition p-6 block"
            >
              <h3 className="text-lg font-bold text-gray-900">
                {trip.destination}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {trip.days} days · {trip.budgetType} budget
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {trip.interests?.map((i) => (
                  <span
                    key={i}
                    className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full"
                  >
                    {i}
                  </span>
                ))}
              </div>
              {trip.budgetEstimate?.total && (
                <p className="text-gray-700 font-semibold mt-4">
                  Est. Budget: ${trip.budgetEstimate.total}
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
