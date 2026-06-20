"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

export default function TripDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [newActivity, setNewActivity] = useState({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user]);

  const fetchTrip = async () => {
    try {
      const res = await api.get(`/trips/${id}`);
      setTrip(res.data);
    } catch (err) {
      setError("Failed to load trip");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrip();
  }, [id]);

  const handleAddActivity = async (dayNumber) => {
    const activity = newActivity[dayNumber];
    if (!activity) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/trips/${id}/day/${dayNumber}/activity`, {
        activity,
      });
      setTrip(res.data);
      setNewActivity((prev) => ({ ...prev, [dayNumber]: "" }));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add activity");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveActivity = async (dayNumber, activityIndex) => {
    setActionLoading(true);
    try {
      const res = await api.delete(`/trips/${id}/day/${dayNumber}/activity`, {
        data: { activityIndex },
      });
      setTrip(res.data);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to remove activity");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerateDay = async (dayNumber) => {
    const preferences = window.prompt(
      "Any preferences for this day? (optional)",
      "",
    );
    setActionLoading(true);
    try {
      const res = await api.post(`/trips/${id}/day/${dayNumber}/regenerate`, {
        preferences,
      });
      setTrip(res.data);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to regenerate day");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGetHotels = async () => {
    setActionLoading(true);
    try {
      const res = await api.get(`/trips/${id}/hotels`);
      setTrip(res.data);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to fetch hotels");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center text-gray-500">Loading trip...</div>
    );
  if (error)
    return <div className="p-10 text-center text-red-600">{error}</div>;
  if (!trip) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-blue-600 font-semibold">
          ← Back to Dashboard
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {trip.destination}
          </h1>
          <p className="text-gray-500 mt-1">
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
        </div>

        {trip.budgetEstimate?.total && (
          <div className="bg-white rounded-2xl shadow p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              💰 Estimated Budget
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-gray-500 text-sm">Flights</p>
                <p className="text-gray-900 font-semibold">
                  ${trip.budgetEstimate.flights}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Stay</p>
                <p className="text-gray-900 font-semibold">
                  ${trip.budgetEstimate.accommodation}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Food</p>
                <p className="text-gray-900 font-semibold">
                  ${trip.budgetEstimate.food}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Activities</p>
                <p className="text-gray-900 font-semibold">
                  ${trip.budgetEstimate.activities}
                </p>
              </div>
            </div>
            <div className="border-t mt-4 pt-4 text-center">
              <p className="text-gray-700 font-bold text-lg">
                Total: ${trip.budgetEstimate.total}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900">🗺️ Itinerary</h2>
          {trip.itinerary?.map((day) => (
            <div key={day.day} className="bg-white rounded-2xl shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">Day {day.day}</h3>
                <button
                  onClick={() => handleRegenerateDay(day.day)}
                  disabled={actionLoading}
                  className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                >
                  🔄 Regenerate
                </button>
              </div>

              <ul className="space-y-2 mb-4">
                {day.activities.map((activity, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-2"
                  >
                    <span className="text-gray-800">{activity}</span>
                    <button
                      onClick={() => handleRemoveActivity(day.day, idx)}
                      disabled={actionLoading}
                      className="text-red-500 hover:text-red-700 text-sm ml-3 disabled:opacity-50"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newActivity[day.day] || ""}
                  onChange={(e) =>
                    setNewActivity((prev) => ({
                      ...prev,
                      [day.day]: e.target.value,
                    }))
                  }
                  placeholder="Add an activity..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleAddActivity(day.day)}
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              🏨 Hotel Suggestions
            </h2>
            <button
              onClick={handleGetHotels}
              disabled={actionLoading}
              className="text-sm text-blue-600 hover:underline disabled:opacity-50"
            >
              {trip.hotels?.length > 0 ? "Refresh" : "Get Suggestions"}
            </button>
          </div>

          {trip.hotels?.length > 0 ? (
            <div className="grid sm:grid-cols-3 gap-4">
              {trip.hotels.map((hotel, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-xl p-4"
                >
                  <p className="font-semibold text-gray-900">{hotel.name}</p>
                  <p className="text-sm text-gray-500">{hotel.category}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hotel suggestions yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
