import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin } from "lucide-react";

const getCustomIcon = (hasAlert, isOffline) => {
  return L.divIcon({
    className: "custom-leaflet-icon",
    html: `<div style="background-color: ${isOffline ? '#4b5563' : hasAlert ? '#ef4444' : '#22c55e'}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

export default function MapComponent({ cameras, alerts }) {
  return (
    <MapContainer 
      center={[23.2599, 77.4126]} // Bhopal
      zoom={13} 
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {cameras.map((cam) => {
        const hasAlert = alerts.some((a) => a.camera === cam.id && !a.resolved);
        const markerLat = cam.lat || 23.2599;
        const markerLng = cam.lng || 77.4126;

        return (
          <Marker
            key={cam.id}
            position={[markerLat, markerLng]}
            icon={getCustomIcon(hasAlert, cam.status === "offline")}
          >
            <Popup>
              <div className="text-black min-w-[150px] p-1">
                <p className="font-bold text-sm flex items-center">
                  <MapPin className="w-3 h-3 mr-1 text-orange-500" />
                  {cam.location}
                </p>
                <p className="text-xs text-gray-500 mt-1 capitalize">
                  {cam.id} • {cam.type} • <span className={cam.status === 'offline' ? 'text-red-500' : 'text-green-500'}>{cam.status}</span>
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}