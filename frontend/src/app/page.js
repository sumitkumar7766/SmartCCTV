"use client";
import React, { useState, useEffect } from "react";
import {
  Camera,
  AlertTriangle,
  Activity,
  Map,
  Users,
  Settings,
  Bell,
  ShieldAlert,
  Video,
  TrendingUp,
  Search,
  Menu,
  X,
  Maximize2,
  Car,
  Flame,
  UserX,
  CheckCircle2,
  Clock,
  Radio,
  MapPin,
  Filter,
  Download,
  Sliders,
  HardDrive,
  Eye,
  Lock,
  Zap,
} from "lucide-react";
import axios from "axios";
import io from "socket.io-client";
import dynamic from "next/dynamic";

// Map ko dynamically load karo taaki SSR bypass ho jaye
const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

// 1. Apne backend ka URL define karein (Port 5300)
const API_URL = "http://localhost:5300/api";
const SOCKET_URL = "http://localhost:5300";

const normalizeCameras = (items) =>
  items.map((cam) => ({
    ...cam,
    id: cam.id || cam.cameraId || cam._id,
    image:
      cam.image ||
      "https://images.unsplash.com/photo-1517732306149-e8f829eb588a?auto=format&fit=crop&w=800&q=80",
    mapX: cam.mapX ?? 50,
    mapY: cam.mapY ?? 50,
    detections: cam.detections || [],
  }));

const normalizeAlerts = (items) =>
  items.map((alert) => ({
    ...alert,
    id: alert.id || alert._id,
  }));

// --- MOCK DATA ---
const INITIAL_CAMERAS = [
  {
    id: "CAM-01",
    location: "MP Nagar Zone 1",
    status: "online",
    type: "PTZ",
    aiActive: true,
    lat: 23.2332,
    lng: 77.4343,
    image:
      "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&w=800&q=80",
    detections: [{ type: "vehicle", x: 20, y: 30, w: 15, h: 20 }],
  },
  {
    id: "CAM-02",
    location: "DB City Mall Square",
    status: "online",
    type: "Fixed",
    aiActive: true,
    lat: 23.2325,
    lng: 77.4288,
    image:
      "https://images.unsplash.com/photo-1517732306149-e8f829eb588a?auto=format&fit=crop&w=800&q=80",
    detections: [{ type: "crowd", x: 40, y: 40, w: 30, h: 30 }],
  },
  {
    id: "CAM-03",
    location: "VIP Road",
    status: "online",
    type: "Thermal",
    aiActive: true,
    lat: 23.2625,
    lng: 77.38,
    image:
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    detections: [{ type: "speeding", x: 70, y: 65, w: 15, h: 15 }],
  },
  {
    id: "CAM-04",
    location: "New Market",
    status: "online",
    type: "PTZ",
    aiActive: true,
    lat: 23.242,
    lng: 77.4015,
    image:
      "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80",
    detections: [{ type: "unattended_bag", x: 80, y: 80, w: 8, h: 8 }],
  },
];

const INITIAL_ALERTS = [];

const ZONES = [
  { name: "North District", health: 98, activeCameras: 142, incidents: 2 },
  { name: "Downtown", health: 85, activeCameras: 310, incidents: 12 },
  { name: "East Side", health: 100, activeCameras: 85, incidents: 0 },
  { name: "Industrial", health: 92, activeCameras: 110, incidents: 4 },
];

// --- MAIN DASHBOARD COMPONENT ---
export default function SmartCCTVDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [cameras, setCameras] = useState(INITIAL_CAMERAS);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [zones, setZones] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(null);

  useEffect(() => {
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // 3. Database (MongoDB) se initial data fetch karna
    const fetchInitialData = async () => {
      try {
        const [camRes, alertRes, zoneRes] = await Promise.all([
          axios.get(`${API_URL}/cameras`),
          axios.get(`${API_URL}/alerts`),
          axios.get(`${API_URL}/zones`),
        ]);
        // setCameras(normalizeCameras(camRes.data));
        setAlerts(normalizeAlerts(alertRes.data));
        setZones(zoneRes.data);
      } catch (error) {
        console.error("Backend se connect nahi ho paya:", error);
      }
    };

    fetchInitialData();

    // 4. Socket.io ke zariye LIVE connection establish karna
    const socket = io(SOCKET_URL);

    // Jab backend se naya AI alert aaye, toh list update kar do
    socket.on("new_incident", (newAlert) => {
      setAlerts((prevAlerts) => [newAlert, ...prevAlerts]);
    });

    // Clean up jab component unmount ho
    return () => socket.disconnect();
  }, []);

  // --- CAMERA CRUD OPERATIONS ---

  // 1. ADD: Naya Camera add karna (POST)
  const handleAddCamera = async (newCameraData) => {
    try {
      const response = await axios.post(`${API_URL}/cameras`, newCameraData);
      setCameras((prevCameras) => [
        ...prevCameras,
        normalizeCameras([response.data])[0],
      ]);
      alert("Naya Camera Add Ho Gaya!");
    } catch (error) {
      console.error("Camera add error:", error);
    }
  };

  // 2. EDIT: Camera update karna (PUT)
  const handleEditCamera = async (id, updatedData) => {
    try {
      const response = await axios.put(`${API_URL}/cameras/${id}`, updatedData);
      setCameras(cameras.map((cam) => (cam._id === id ? response.data : cam)));
    } catch (error) {
      console.error("Camera edit error:", error);
    }
  };

  // 3. DELETE: Camera remove karna (DELETE)
  const handleDeleteCamera = async (id) => {
    if (
      window.confirm("Kkya aap sach mein yeh camera delete karna chahte hain?")
    ) {
      try {
        await axios.delete(`${API_URL}/cameras/${id}`);
        setCameras(cameras.filter((cam) => cam._id !== id));
      } catch (error) {
        console.error("Camera delete error:", error);
      }
    }
  };

  const saveSettings = async (settingsData) => {
    try {
      await axios.put(`${API_URL}/settings`, settingsData);
      alert("Settings Saved Successfully!");
    } catch (error) {
      console.error("Settings save error:", error);
    }
  };

  // 5. User Action: Kisi alert ko MongoDB mein 'Resolved' mark karna
  const resolveAlert = async (id) => {
    try {
      await axios.patch(`${API_URL}/alerts/${id}/resolve`);
      // UI ko turant update karein bina refresh kiye
      setAlerts(
        alerts.map((a) =>
          a._id === id || a.id === id ? { ...a, resolved: true } : a,
        ),
      );
    } catch (error) {
      console.error("Alert update karne mein error:", error);
    }
  };

  // Clock tick & random event simulator
  useEffect(() => {
    const simulator = setInterval(() => {
      if (Math.random() > 0.8) {
        // Reduced freq for UI stability
        const cam = INITIAL_CAMERAS[Math.floor(Math.random() * 4)];
        const newAlert = {
          id: Date.now(),
          type: [
            "Speeding Vehicle",
            "Loitering",
            "Jaywalking",
            "Unattended Object",
          ][Math.floor(Math.random() * 4)],
          location: cam.location,
          time: "Just now",
          severity: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
          camera: cam.id,
          resolved: false,
        };
        setAlerts((prev) => [newAlert, ...prev].slice(0, 20)); // Keep last 20
      }
    }, 20000);

    return () => {
      clearInterval(simulator);
    };
  }, []);
  const activeAlertsCount = alerts.filter((a) => !a.resolved).length;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside
        className={`${isSidebarOpen ? "w-64" : "w-20"} transition-all duration-300 bg-orange-600 text-white flex flex-col shadow-xl z-20 shrink-0`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-orange-500/50">
          {isSidebarOpen && (
            <div className="flex items-center space-x-2 font-bold text-xl tracking-wide">
              <ShieldAlert className="w-6 h-6" />
              <span>CityVision AI</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-orange-500 rounded-lg transition-colors mx-auto"
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-3 overflow-y-auto custom-scrollbar">
          <NavItem
            icon={<Activity />}
            label="Dashboard"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
            isOpen={isSidebarOpen}
          />
          <NavItem
            icon={<Camera />}
            label="Live Feeds"
            active={activeTab === "feeds"}
            onClick={() => setActiveTab("feeds")}
            isOpen={isSidebarOpen}
          />
          <NavItem
            icon={<AlertTriangle />}
            label="Incidents"
            badge={activeAlertsCount}
            active={activeTab === "incidents"}
            onClick={() => setActiveTab("incidents")}
            isOpen={isSidebarOpen}
          />
          <NavItem
            icon={<Map />}
            label="City Map"
            active={activeTab === "map"}
            onClick={() => setActiveTab("map")}
            isOpen={isSidebarOpen}
          />
          <NavItem
            icon={<TrendingUp />}
            label="Analytics"
            active={activeTab === "analytics"}
            onClick={() => setActiveTab("analytics")}
            isOpen={isSidebarOpen}
          />
        </nav>

        <div className="p-4 border-t border-orange-500/50">
          <NavItem
            icon={<Settings />}
            label="Settings"
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
            isOpen={isSidebarOpen}
          />
          {isSidebarOpen && (
            <div className="mt-4 flex items-center space-x-3 bg-orange-700/50 p-3 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-white text-orange-600 flex items-center justify-center font-bold text-lg shadow-inner">
                AD
              </div>
              <div className="text-sm">
                <p className="font-semibold">Administrator</p>
                <p className="text-orange-200 text-xs">ID: 9942-X</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* TOP BAR */}
        <header className="h-16 bg-white border-b border-orange-100 flex items-center justify-between px-6 shadow-sm z-10 shrink-0">
          <div className="flex items-center text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 w-64 focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-transparent transition-all">
            <Search className="w-4 h-4 mr-2" />
            <input
              type="text"
              placeholder="Search cameras, zones..."
              className="bg-transparent border-none outline-none text-sm w-full text-gray-800"
            />
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
              <span className="text-sm font-medium text-orange-800">
                System Online
              </span>
            </div>
            <div className="text-right text-sm text-gray-600 font-medium hidden sm:block">
              {currentTime
                ? currentTime.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                : ""}
              <br />
              <span className="text-gray-900 font-bold">
                {currentTime ? currentTime.toLocaleTimeString() : ""}
              </span>
            </div>
            <button className="relative p-2 text-gray-400 hover:text-orange-500 transition-colors">
              <Bell className="w-6 h-6" />
              {activeAlertsCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          </div>
        </header>

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
          {/* --- TAB: DASHBOARD --- */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    City Overview
                  </h1>
                  <p className="text-gray-500 text-sm">
                    Real-time surveillance and AI analytics
                  </p>
                </div>
                <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-lg border border-orange-100 shadow-sm">
                  <span className="text-sm font-bold text-gray-700">
                    Global AI Processing
                  </span>
                  <button
                    onClick={() => setAiEnabled(!aiEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${aiEnabled ? "bg-orange-500" : "bg-gray-300"}`}
                  >
                    <span
                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${aiEnabled ? "translate-x-6" : "translate-x-0"}`}
                    ></span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Active Cameras"
                  value="1,248"
                  subtitle="Out of 1,250 total"
                  icon={<Video className="text-orange-500" />}
                  trend="+3"
                />
                <StatCard
                  title="AI Detections (24h)"
                  value="84.2K"
                  subtitle="Vehicles & Pedestrians"
                  icon={<Activity className="text-orange-500" />}
                  trend="+12%"
                />
                <StatCard
                  title="Critical Alerts"
                  value={activeAlertsCount}
                  subtitle="Require immediate action"
                  icon={
                    <ShieldAlert
                      className={
                        activeAlertsCount > 0
                          ? "text-red-500"
                          : "text-green-500"
                      }
                    />
                  }
                  isAlert={activeAlertsCount > 0}
                />
                <StatCard
                  title="System Health"
                  value="98.5%"
                  subtitle="Network operational"
                  icon={<Radio className="text-orange-500" />}
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center">
                      <Camera className="w-5 h-5 mr-2 text-orange-500" />{" "}
                      Priority Feeds
                    </h2>
                    <button
                      onClick={() => setActiveTab("feeds")}
                      className="text-orange-600 text-sm font-bold hover:underline"
                    >
                      View All Grid
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cameras.slice(0, 4).map((cam) => (
                      <CameraCard
                        key={cam.id}
                        camera={cam}
                        aiEnabled={aiEnabled}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden flex flex-col h-[400px]">
                    <div className="p-4 border-b border-orange-100 bg-orange-50/50 flex justify-between items-center">
                      <h2 className="text-lg font-bold text-gray-800 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />{" "}
                        Active Incidents
                      </h2>
                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-md font-bold">
                        {activeAlertsCount} New
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                      {alerts
                        .filter((a) => !a.resolved)
                        .map((alert) => (
                          <AlertItem
                            key={alert.id}
                            alert={alert}
                            onResolve={resolveAlert}
                          />
                        ))}
                      {activeAlertsCount === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                          <CheckCircle2 className="w-10 h-10 mb-2 text-green-400" />
                          <p>All clear. No active incidents.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-4">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <Map className="w-5 h-5 mr-2 text-orange-500" /> Zone
                      Status
                    </h2>
                    <div className="space-y-4">
                      {ZONES.map((zone) => (
                        <div key={zone.name}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700">
                              {zone.name}
                            </span>
                            <span
                              className={
                                zone.health < 90
                                  ? "text-orange-600 font-bold"
                                  : "text-green-600 font-bold"
                              }
                            >
                              {zone.health}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-1000 ${zone.health < 90 ? "bg-orange-500" : "bg-green-500"}`}
                              style={{ width: `${zone.health}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showAddModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
              <div className="bg-white p-6 rounded-2xl w-96 shadow-2xl border border-orange-100">
                {/* Header */}
                <h2 className="text-xl font-bold text-gray-800 mb-5">
                  Add New Camera
                </h2>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    handleAddCamera({
                      cameraId: formData.get("cameraId"),
                      location: formData.get("location"),
                      type: formData.get("type"),
                      status: "online",
                      aiActive: true,
                    });
                    setShowAddModal(false);
                  }}
                >
                  {/* Inputs */}
                  <div className="space-y-4">
                    <input
                      name="cameraId"
                      placeholder="Camera ID (e.g. CAM-10)"
                      className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg focus:ring-2 focus:ring-orange-400 focus:bg-white outline-none transition text-black"
                      required
                    />

                    <input
                      name="location"
                      placeholder="Location"
                      className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg focus:ring-2 focus:ring-orange-400 focus:bg-white outline-none transition text-black"
                      required
                    />

                    <select
                      name="type"
                      className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg focus:ring-2 focus:ring-orange-400 focus:bg-white outline-none transition text-black"
                    >
                      <option value="PTZ">PTZ</option>
                      <option value="Fixed">Fixed</option>
                      <option value="Thermal">Thermal</option>
                    </select>
                  </div>

                  {/* Buttons */}
                  <div className="mt-6 flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition shadow-md"
                    >
                      Save Camera
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* --- TAB: LIVE FEEDS --- */}
          {activeTab === "feeds" && (
            <div className="h-full flex flex-col animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    CCTV Wall
                  </h1>
                  <p className="text-gray-500 text-sm">
                    Monitoring all active sector feeds
                  </p>
                </div>
                <div className="flex space-x-2 bg-white p-1 rounded-lg border border-orange-100 shadow-sm">
                  <button className="bg-orange-50 text-orange-600 px-4 py-2 rounded-md text-sm font-bold">
                    Grid: 2x3
                  </button>
                  <button className="text-gray-500 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    Grid: 3x3
                  </button>
                  <button className="text-gray-500 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    Grid: 4x4
                  </button>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-bold shadow-sm"
                  >
                    + Add New Camera
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                {cameras.map((cam) => (
                  <CameraCard
                    key={cam.id}
                    camera={cam}
                    aiEnabled={aiEnabled}
                    expand
                  />
                ))}
              </div>
            </div>
          )}

          {/* --- TAB: INCIDENTS --- */}
          {activeTab === "incidents" && (
            <div className="h-full flex flex-col animate-fade-in space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Incident Management
                  </h1>
                  <p className="text-gray-500 text-sm">
                    Log and track AI-flagged alerts
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <Filter className="w-4 h-4 mr-2" /> Filter
                  </button>
                  <button className="flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold transition-colors shadow-sm">
                    <Download className="w-4 h-4 mr-2" /> Export Log
                  </button>
                </div>
              </div>

              <div className="bg-white border border-orange-100 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-orange-50 border-b border-orange-100 text-orange-800 text-sm">
                        <th className="p-4 font-bold">ID / Camera</th>
                        <th className="p-4 font-bold">Incident Type</th>
                        <th className="p-4 font-bold">Location</th>
                        <th className="p-4 font-bold">Time</th>
                        <th className="p-4 font-bold">Severity</th>
                        <th className="p-4 font-bold">Status</th>
                        <th className="p-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-100">
                      {alerts.map((alert) => (
                        <tr
                          key={alert.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="p-4">
                            <span className="font-mono font-medium text-gray-700">
                              #{alert.id.toString().slice(-4)}
                            </span>
                            <br />
                            <span className="text-xs text-gray-500">
                              {alert.camera}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-gray-800">
                            {alert.type}
                          </td>
                          <td className="p-4 text-gray-600">
                            {alert.location}
                          </td>
                          <td className="p-4 text-gray-500">{alert.time}</td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                alert.severity === "high"
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : alert.severity === "medium"
                                    ? "bg-orange-100 text-orange-700 border-orange-200"
                                    : "bg-yellow-100 text-yellow-700 border-yellow-200"
                              }`}
                            >
                              {alert.severity.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4">
                            {alert.resolved ? (
                              <span className="flex items-center text-green-600 font-medium text-xs">
                                <CheckCircle2 className="w-4 h-4 mr-1" />{" "}
                                Resolved
                              </span>
                            ) : (
                              <span className="flex items-center text-orange-600 font-bold text-xs">
                                <Radio className="w-4 h-4 mr-1 animate-pulse" />{" "}
                                Active
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {!alert.resolved ? (
                              <button
                                onClick={() => resolveAlert(alert.id)}
                                className="text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded border border-orange-200 font-medium transition-colors text-xs"
                              >
                                Mark Resolved
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs italic">
                                Archived
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: MAP --- */}
          {activeTab === "map" && (
            <div className="h-full flex flex-col animate-fade-in space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    City Map Topology
                  </h1>
                  <p className="text-gray-500 text-sm">
                    Spatial distribution of nodes and active alerts
                  </p>
                </div>
                <div className="flex items-center space-x-4 text-sm bg-white p-2 rounded-lg border border-orange-100 shadow-sm">
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>{" "}
                    Online Camera
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>{" "}
                    Offline
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-ping"></span>{" "}
                    Active Alert
                  </div>
                </div>
              </div>

              {/* Abstract CSS Grid Map */}
              {/* Real Free OpenStreetMap (Leaflet) */}
              {/* Real Free OpenStreetMap (Leaflet) */}
              <div className="flex-1 rounded-xl border border-gray-200 relative overflow-hidden shadow-sm z-0">
                <MapComponent cameras={cameras} alerts={alerts} />
              </div>
            </div>
          )}

          {/* --- TAB: ANALYTICS --- */}
          {activeTab === "analytics" && (
            <div className="space-y-6 animate-fade-in pb-10">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    AI Analytics
                  </h1>
                  <p className="text-gray-500 text-sm">
                    Historical data and predictive insights
                  </p>
                </div>
                <select className="bg-white border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium shadow-sm outline-none focus:ring-2 focus:ring-orange-500">
                  <option>Last 24 Hours</option>
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm col-span-2">
                  <h3 className="font-bold text-gray-800 mb-6 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-orange-500" />{" "}
                    Alert Frequency Overview
                  </h3>
                  {/* CSS Line Chart Representation */}
                  <div className="relative h-48 w-full flex items-end justify-between px-2">
                    {/* Y-axis lines */}
                    <div className="absolute inset-0 flex flex-col justify-between border-l border-b border-gray-200 pb-6 pl-1 text-[10px] text-gray-400">
                      <span>100</span>
                      <span>75</span>
                      <span>50</span>
                      <span>25</span>
                      <span>0</span>
                    </div>
                    {/* Bars */}
                    {[40, 65, 30, 80, 50, 95, 60, 40, 85, 35, 70, 50].map(
                      (h, i) => (
                        <div
                          key={i}
                          className="relative w-full mx-1 flex justify-center group h-full items-end pb-6 z-10"
                        >
                          <div
                            className="w-full bg-orange-400 hover:bg-orange-600 rounded-t-sm transition-all duration-300"
                            style={{ height: `${h}%` }}
                          ></div>
                          <span className="absolute -bottom-1 text-[10px] text-gray-400">
                            {i * 2}h
                          </span>
                          <div className="absolute bottom-[calc(100%-1.5rem)] opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-[10px] py-1 px-2 rounded pointer-events-none transition-opacity">
                            {h} alerts
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm flex flex-col">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-orange-500" /> Object
                    Classifications
                  </h3>
                  <div className="flex-1 flex flex-col justify-center space-y-4">
                    {[
                      { label: "Vehicles", color: "bg-orange-500", pct: 65 },
                      { label: "Pedestrians", color: "bg-orange-300", pct: 25 },
                      { label: "Animals", color: "bg-orange-200", pct: 7 },
                      { label: "Anomalies", color: "bg-red-500", pct: 3 },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">
                            {item.label}
                          </span>
                          <span className="font-bold text-gray-800">
                            {item.pct}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${item.color}`}
                            style={{ width: `${item.pct}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-orange-50 p-5 rounded-xl border border-orange-200">
                  <p className="text-sm text-orange-800 font-medium mb-1">
                    Total Processed Frames
                  </p>
                  <h4 className="text-3xl font-bold text-orange-600">14.2M</h4>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 font-medium mb-1">
                    Average Response Time
                  </p>
                  <h4 className="text-3xl font-bold text-gray-800">1.2m</h4>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 font-medium mb-1">
                    False Positive Rate
                  </p>
                  <h4 className="text-3xl font-bold text-green-500">
                    {"<"} 2.4%
                  </h4>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 font-medium mb-1">
                    Compute Load
                  </p>
                  <h4 className="text-3xl font-bold text-gray-800">76%</h4>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: SETTINGS --- */}
          {activeTab === "settings" && (
            <div className="animate-fade-in max-w-5xl mx-auto pb-10">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                  System Configuration
                </h1>
                <p className="text-gray-500 text-sm">
                  Manage global settings, AI thresholds, and users
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
                {/* Settings Sidebar */}
                <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 p-4 space-y-2">
                  <button className="w-full flex items-center px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-bold text-sm">
                    <Sliders className="w-4 h-4 mr-3" /> General
                  </button>
                  <button className="w-full flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors">
                    <Zap className="w-4 h-4 mr-3" /> AI & Analysis
                  </button>
                  <button className="w-full flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors">
                    <Bell className="w-4 h-4 mr-3" /> Notifications
                  </button>
                  <button className="w-full flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors">
                    <Lock className="w-4 h-4 mr-3" /> Security
                  </button>
                  <button className="w-full flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors">
                    <HardDrive className="w-4 h-4 mr-3" /> Storage
                  </button>
                </div>

                {/* Settings Form Content */}
                <div className="flex-1 p-8">
                  <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
                    General Settings
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        City/Agency Name
                      </label>
                      <input
                        type="text"
                        defaultValue="Metropolis Dept of Transportation"
                        className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Timezone
                      </label>
                      <select className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-orange-500 text-sm">
                        <option>Eastern Time (US & Canada)</option>
                        <option>Central Time (US & Canada)</option>
                        <option>Pacific Time (US & Canada)</option>
                        <option>UTC (Coordinated Universal Time)</option>
                      </select>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <h3 className="text-sm font-bold text-gray-800 mb-4">
                        Interface Options
                      </h3>

                      <div className="space-y-4">
                        {/* Toggle 1 */}
                        <label className="flex items-center cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              defaultChecked
                            />
                            <div className="block bg-gray-200 w-10 h-6 rounded-full peer-checked:bg-orange-500 transition-colors"></div>
                            <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4"></div>
                          </div>
                          <div className="ml-3 text-sm font-medium text-gray-700">
                            Enable Dark Mode (Night Shift) automatically
                          </div>
                        </label>

                        {/* Toggle 2 */}
                        <label className="flex items-center cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              defaultChecked
                            />
                            <div className="block bg-gray-200 w-10 h-6 rounded-full peer-checked:bg-orange-500 transition-colors"></div>
                            <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4"></div>
                          </div>
                          <div className="ml-3 text-sm font-medium text-gray-700">
                            Display Bounding Boxes on Live Feeds by default
                          </div>
                        </label>

                        {/* Toggle 3 */}
                        <label className="flex items-center cursor-pointer">
                          <div className="relative">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="block bg-gray-200 w-10 h-6 rounded-full peer-checked:bg-orange-500 transition-colors"></div>
                            <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4"></div>
                          </div>
                          <div className="ml-3 text-sm font-medium text-gray-700">
                            Auto-archive resolved alerts after 24 hours
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md">
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* GLOBAL STYLES */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(249, 115, 22, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(249, 115, 22, 0.4); }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `,
        }}
      />
    </div>
  );
}

// --- SUBCOMPONENTS ---

const NavItem = ({ icon, label, active, onClick, isOpen, badge }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center ${isOpen ? "justify-start px-4" : "justify-center px-0"} py-3 rounded-xl transition-all duration-200 group relative
      ${active ? "bg-white text-orange-600 shadow-md font-bold" : "text-orange-100 hover:bg-orange-500/50 hover:text-white"}`}
    title={!isOpen ? label : ""}
  >
    <span
      className={`${active ? "text-orange-600" : "text-orange-200 group-hover:text-white"} transition-colors`}
    >
      {React.cloneElement(icon, { className: "w-5 h-5" })}
    </span>
    {isOpen && <span className="ml-3 truncate">{label}</span>}
    {badge > 0 && isOpen && (
      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
        {badge}
      </span>
    )}
    {badge > 0 && !isOpen && (
      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
    )}
  </button>
);

const StatCard = ({ title, value, subtitle, icon, trend, isAlert }) => (
  <div
    className={`bg-white p-5 rounded-xl border shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${isAlert ? "border-red-300 bg-red-50" : "border-orange-100"}`}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <h3
          className={`text-3xl font-bold mt-1 ${isAlert ? "text-red-600" : "text-gray-800"}`}
        >
          {value}
        </h3>
      </div>
      <div
        className={`p-3 rounded-lg ${isAlert ? "bg-red-100" : "bg-orange-50"}`}
      >
        {icon}
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      {trend && <span className="text-green-500 font-bold mr-2">{trend}</span>}
      <span className="text-gray-400">{subtitle}</span>
    </div>
  </div>
);

const CameraCard = ({ camera, aiEnabled, expand }) => {
  const isOffline = camera.status === "offline";

  return (
    <div
      className={`bg-black rounded-xl overflow-hidden relative group border-2 ${isOffline ? "border-gray-800" : "border-gray-900"} shadow-lg flex flex-col ${expand ? "h-full min-h-[300px]" : "aspect-video"}`}
    >
      <div className="flex-1 relative w-full h-full bg-gray-900">
        {isOffline ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 font-mono">
            <Video className="w-12 h-12 mb-2 opacity-50" />
            <p>NO SIGNAL</p>
            <p className="text-xs mt-1 text-gray-600">
              ERR_CONNECTION_TIMED_OUT
            </p>
          </div>
        ) : (
          <>
            <img
              src={camera.image}
              alt={camera.location}
              className="w-full h-full object-cover opacity-80 mix-blend-luminosity"
            />
            <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')] opacity-20 pointer-events-none"></div>

            {aiEnabled &&
              camera.aiActive &&
              camera.detections.map((det, idx) => (
                <div
                  key={idx}
                  className="absolute border-2 border-orange-500 bg-orange-500/10 transition-all duration-1000 ease-in-out"
                  style={{
                    top: `${det.y}%`,
                    left: `${det.x}%`,
                    width: `${det.w}%`,
                    height: `${det.h}%`,
                    boxShadow: "0 0 10px rgba(249, 115, 22, 0.5)",
                  }}
                >
                  <div className="absolute -top-6 left-[-2px] bg-orange-500 text-white text-[10px] font-mono px-1 py-0.5 whitespace-nowrap flex items-center">
                    {det.type === "vehicle" && <Car className="w-3 h-3 mr-1" />}
                    {det.type === "pedestrian" || det.type === "crowd" ? (
                      <Users className="w-3 h-3 mr-1" />
                    ) : null}
                    {det.type.toUpperCase()} 98%
                  </div>
                </div>
              ))}

            <div className="absolute top-3 right-3 flex items-center space-x-2">
              <span className="text-white text-xs font-mono drop-shadow-md font-bold">
                REC
              </span>
              <span className="animate-pulse w-3 h-3 bg-red-600 rounded-full border border-white"></span>
            </div>
            <div className="absolute bottom-3 right-3 text-white text-xs font-mono drop-shadow-md opacity-80">
              {new Date().toISOString().replace("T", " ").substring(0, 19)}
            </div>
          </>
        )}
      </div>

      <div className="bg-gray-900 text-white p-3 flex justify-between items-center border-t border-gray-800">
        <div>
          <h4 className="font-medium text-sm flex items-center">
            {camera.location}
            {isOffline && (
              <span className="ml-2 text-[10px] bg-red-900/50 text-red-400 px-1.5 py-0.5 rounded border border-red-800">
                OFFLINE
              </span>
            )}
          </h4>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            {camera.id} • {camera.type}
          </p>
        </div>
        <div className="flex space-x-2">
          <button className="p-1.5 text-gray-400 hover:text-orange-400 hover:bg-gray-800 rounded transition">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const AlertItem = ({ alert, onResolve }) => {
  const getSeverityColor = (sev) => {
    switch (sev) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "low":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getIcon = (type) => {
    if (
      type.toLowerCase().includes("fire") ||
      type.toLowerCase().includes("smoke")
    )
      return <Flame className="w-4 h-4" />;
    if (
      type.toLowerCase().includes("vehicle") ||
      type.toLowerCase().includes("parking") ||
      type.toLowerCase().includes("speeding")
    )
      return <Car className="w-4 h-4" />;
    if (
      type.toLowerCase().includes("loitering") ||
      type.toLowerCase().includes("unauthorized") ||
      type.toLowerCase().includes("jaywalking")
    )
      return <UserX className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  return (
    <div
      className={`p-3 rounded-lg border ${alert.resolved ? "bg-gray-50 border-gray-200 opacity-60" : "bg-white shadow-sm hover:border-orange-300"} transition-all`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          <span
            className={`p-1.5 rounded-md border ${getSeverityColor(alert.severity)}`}
          >
            {getIcon(alert.type)}
          </span>
          <div>
            <h4
              className={`text-sm font-bold ${alert.resolved ? "text-gray-500 line-through" : "text-gray-800"}`}
            >
              {alert.type}
            </h4>
            <p className="text-xs text-gray-500 flex items-center mt-0.5">
              <MapPin className="w-3 h-3 mr-1" /> {alert.location}
            </p>
          </div>
        </div>
        <span className="text-xs text-gray-400 flex items-center">
          <Clock className="w-3 h-3 mr-1" /> {alert.time}
        </span>
      </div>

      {!alert.resolved && (
        <div className="mt-3 flex space-x-2">
          <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs py-1.5 rounded-md font-medium transition-colors shadow-sm">
            Dispatch Team
          </button>
          <button
            onClick={() => onResolve(alert.id)}
            className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs py-1.5 rounded-md font-medium transition-colors"
          >
            Mark Resolved
          </button>
        </div>
      )}
    </div>
  );
};
