import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── Room groups ────────────────────────────────────────────────────────────
const ROOM_GROUPS = [
  { label: "Floor 1 — Rooms 101–109", rooms: Array.from({ length: 9 }, (_, i) => `10${i + 1}`) },
  { label: "Floor 2 — Rooms 201–210", rooms: Array.from({ length: 10 }, (_, i) => `2${String(i + 1).padStart(2, "0")}`) },
  { label: "Floor 3 — Rooms 301–310", rooms: Array.from({ length: 10 }, (_, i) => `3${String(i + 1).padStart(2, "0")}`) },
  { label: "Floor 4 — Rooms 401–410", rooms: Array.from({ length: 10 }, (_, i) => `4${String(i + 1).padStart(2, "0")}`) },
];

// ─── Tiny Leaflet-free interactive map using OpenStreetMap tiles ─────────────
function InteractiveMap({ lat, lng, onLocationChange }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    // Dynamically load Leaflet CSS + JS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const loadLeaflet = () => {
      if (window.L) return initMap();
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (leafletRef.current || !mapRef.current) return;
      const L = window.L;
      const initialLat = lat || 9.0579;
      const initialLng = lng || 7.4951;

      const map = L.map(mapRef.current, { zoomControl: true }).setView([initialLat, initialLng], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      // Custom green marker icon
      const icon = L.divIcon({
        html: `<div style="
          width:32px;height:32px;background:#16a34a;border:3px solid #fff;
          border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        className: "",
      });

      const marker = L.marker([initialLat, initialLng], { icon, draggable: true }).addTo(map);
      markerRef.current = marker;
      leafletRef.current = map;

      marker.on("dragend", (e) => {
        const { lat, lng } = e.target.getLatLng();
        reverseGeocode(lat, lng);
      });

      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        reverseGeocode(lat, lng);
      });
    };

    loadLeaflet();

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Update marker when lat/lng props change (e.g. geolocation)
  useEffect(() => {
    if (leafletRef.current && markerRef.current && lat && lng) {
      markerRef.current.setLatLng([lat, lng]);
      leafletRef.current.setView([lat, lng], 15);
    }
  }, [lat, lng]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      onLocationChange({ lat, lng, address: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
    } catch {
      onLocationChange({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
    }
  };

  return (
    <div
      ref={mapRef}
      style={{ height: "280px", width: "100%", borderRadius: "12px", overflow: "hidden", zIndex: 0 }}
    />
  );
}

// ─── Main DeliverySelector component ────────────────────────────────────────
export default function DeliverySelector({
  orderType,
  setOrderType,
  address,
  setAddress,
  receiverPhone,
  setReceiverPhone,
  roomNumber,
  setRoomNumber,
  // Optional extras exposed for parent
  deliveryCoords,
  setDeliveryCoords,
}) {
  const [geoStatus, setGeoStatus] = useState("idle"); // idle | loading | success | error
  const [mapLocation, setMapLocation] = useState(null);
  const [manualAddress, setManualAddress] = useState(address || "");
  const [showMap, setShowMap] = useState(false);

  // Sync manual address back up
  useEffect(() => {
    if (manualAddress) setAddress(manualAddress);
  }, [manualAddress]);

  const handleLocationChange = useCallback(({ lat, lng, address: addr }) => {
    setMapLocation({ lat, lng });
    setDeliveryCoords?.({ lat, lng });
    setManualAddress(addr);
    setAddress(addr);
    setGeoStatus("success");
  }, []);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    setShowMap(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        handleLocationChange({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
        // Reverse geocode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          handleLocationChange({ lat, lng, address: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
        } catch {
          setGeoStatus("success");
        }
      },
      () => setGeoStatus("error"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="space-y-4">
      {/* ── Section Header ── */}
      <div>
        <h2 className="text-base font-bold text-gray-800 mb-1">Delivery Method</h2>
        <p className="text-xs text-gray-400">Choose how you'd like your order delivered</p>
      </div>

      {/* ── Option Cards ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Home Delivery Card */}
        <button
          type="button"
          onClick={() => setOrderType("Home Delivery")}
          className={`relative flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
            orderType === "Home Delivery"
              ? "border-green-500 bg-green-50 shadow-md"
              : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
          }`}
        >
          {orderType === "Home Delivery" && (
            <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
          <span className="text-2xl">🏠</span>
          <div>
            <p className={`text-sm font-bold ${orderType === "Home Delivery" ? "text-green-700" : "text-gray-700"}`}>
              Home Delivery
            </p>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">Delivered to your door</p>
          </div>
        </button>

        {/* Room Service Card */}
        <button
          type="button"
          onClick={() => setOrderType("Room Service")}
          className={`relative flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
            orderType === "Room Service"
              ? "border-amber-500 bg-amber-50 shadow-md"
              : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
          }`}
        >
          {orderType === "Room Service" && (
            <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
          <span className="text-2xl">🛎️</span>
          <div>
            <p className={`text-sm font-bold ${orderType === "Room Service" ? "text-amber-700" : "text-gray-700"}`}>
              Room Service
            </p>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">Served to your room</p>
          </div>
        </button>
      </div>

      {/* ── Home Delivery Panel ── */}
      {orderType === "Home Delivery" && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm animate-fadeIn">
          {/* Panel header */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-green-50 border-b border-green-100">
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-sm">📍</div>
            <div>
              <p className="text-sm font-bold text-green-800">Delivery Location</p>
              <p className="text-xs text-green-600">Pin your location on the map or enter your address</p>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Geolocation Button */}
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={geoStatus === "loading"}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {geoStatus === "loading" ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Detecting location…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="3" />
                    <path strokeLinecap="round" d="M12 2v2M12 20v2M2 12h2M20 12h2" />
                    <path strokeLinecap="round" d="M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                  Use Current Location
                </>
              )}
            </button>

            {geoStatus === "error" && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 text-center">
                Location access denied. Please enter your address manually below.
              </p>
            )}

            {/* Map toggle */}
            <button
              type="button"
              onClick={() => setShowMap((v) => !v)}
              className="w-full flex items-center justify-between py-2 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium transition"
            >
              <span className="flex items-center gap-2">
                <span>🗺️</span>
                {showMap ? "Hide map" : "Pick on map"}
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${showMap ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Map */}
            {showMap && (
              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                <InteractiveMap
                  lat={mapLocation?.lat}
                  lng={mapLocation?.lng}
                  onLocationChange={handleLocationChange}
                />
                <p className="text-xs text-gray-400 text-center py-2 bg-gray-50 border-t border-gray-100">
                  Click or drag the pin to adjust your location
                </p>
              </div>
            )}

            {/* Selected location pill */}
            {geoStatus === "success" && manualAddress && (
              <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
                <span className="text-green-500 text-sm mt-0.5 shrink-0">✓</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-green-700">Location selected</p>
                  <p className="text-xs text-green-600 break-words leading-relaxed mt-0.5">
                    {manualAddress}
                  </p>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or type address</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Manual Address Input */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Street address, landmark, city…"
                value={manualAddress}
                onChange={(e) => {
                  setManualAddress(e.target.value);
                  setAddress(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
              />
            </div>

            {/* Phone input */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              <input
                type="tel"
                placeholder="Receiver's phone number"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Room Service Panel ── */}
      {orderType === "Room Service" && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm animate-fadeIn">
          {/* Panel header */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border-b border-amber-100">
            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-sm">🛎️</div>
            <div>
              <p className="text-sm font-bold text-amber-800">Room Selection</p>
              <p className="text-xs text-amber-600">Select your room number for service</p>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* Room Dropdown */}
            <div className="relative">
              <select
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className={`w-full appearance-none pl-11 pr-10 py-3 bg-white border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition cursor-pointer ${
                  roomNumber
                    ? "border-amber-300 text-gray-800"
                    : "border-gray-200 text-gray-400"
                }`}
              >
                <option value="">Select your room number…</option>
                {ROOM_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.rooms.map((room) => (
                      <option key={room} value={room}>
                        Room {room}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {/* Left icon */}
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>

              {/* Right chevron */}
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>

            {/* Floor quick-select pills */}
            <div>
              <p className="text-xs text-gray-400 mb-2">Quick select by floor</p>
              <div className="flex flex-wrap gap-2">
                {ROOM_GROUPS.map((group, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRoomNumber(group.rooms[0])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      roomNumber && group.rooms.includes(roomNumber)
                        ? "bg-amber-500 border-amber-500 text-white"
                        : "bg-white border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600"
                    }`}
                  >
                    Floor {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected room confirmation */}
            {roomNumber && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">{roomNumber}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-800">Delivering to Room {roomNumber}</p>
                  <p className="text-xs text-amber-600">
                    Floor {roomNumber.charAt(0)} · {
                      ROOM_GROUPS.find(g => g.rooms.includes(roomNumber))?.label || ""
                    }
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRoomNumber("")}
                  className="ml-auto text-amber-400 hover:text-amber-600 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Service info */}
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <span className="text-blue-400 shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <p className="text-xs text-blue-600 leading-relaxed">
                A 5% service charge applies to room service orders. Your meal will be delivered within 20–35 minutes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
