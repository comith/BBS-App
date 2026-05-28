// app/weather/page.tsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api-fetch";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Wind, Thermometer, CloudFog, Droplets,
  Wifi, Battery, Activity, MapPin, Search, RefreshCw, Cpu, ShieldAlert,
  Settings, Plus, Trash2, Edit3, Save, X, Check, AlertTriangle, Info
} from "lucide-react";

interface StationConfig {
  pm25Key: string;
  pm25Label?: string;
  pm10Key: string;
  pm10Label?: string;
  tempKey: string;
  tempLabel?: string;
  humidityKey: string;
  humidityLabel?: string;
  rssiKey: string;
  rssiLabel?: string;
  snrKey: string;
  snrLabel?: string;
  batteryKey: string;
  batteryLabel?: string;
  currentKey: string;
  currentLabel?: string;
  wifiPowerSaveKey: string;
  wifiPowerSaveLabel?: string;
  showDiagnostics?: boolean;
}

interface Station {
  id: string;
  name: string;
  desc: string;
  active: boolean;
  deviceId: string;
  config: StationConfig;
}

interface TelemetryData {
  pm25: string;
  pm10: string;
  temp: string;
  humidity: string;
  rssi: string;
  snr: string;
  battery: string;
  current: string;
  wifiPowerSave: string;
  lastUpdated?: string;
}

export default function WeatherDashboard() {
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [telemetryMap, setTelemetryMap] = useState<Record<string, TelemetryData>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Admin and Editor Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check authorizations on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("bbs_employee_data");
      if (stored) {
        const empData = JSON.parse(stored);
        if (empData?.employeerId && empData?.fullName) {
          setEmployee(empData);
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } else {
        setAuthorized(false);
      }
    }
  }, []);

  const isAdmin = employee?.employeerId === "3ST19686";

  // Fetch telemetry from ThingsBoard for active devices
  const fetchTelemetry = useCallback(async (stationList: Station[], isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const activeStations = stationList.filter(s => s.active && s.deviceId);
      const newTelemetryMap: Record<string, TelemetryData> = {};

      await Promise.all(
        activeStations.map(async (station) => {
          try {
            const res = await apiFetch(`/api/getdata-thingsboard?deviceId=${station.deviceId}`);
            if (!res.ok) throw new Error(`Telemetry request failed for ${station.name}`);
            const data = await res.json();

            const c = station.config || {
              pm25Key: "pm2_5_1",
              pm10Key: "pm10_1",
              tempKey: "temperature_1",
              humidityKey: "humidity_1",
              rssiKey: "rssi_1",
              snrKey: "snr_1",
              batteryKey: "busvoltage_1",
              currentKey: "current_mA_1",
              wifiPowerSaveKey: "wifi_power_save_1"
            };

            const rawPm25 = data[c.pm25Key]?.[0]?.value;
            const rawPm10 = data[c.pm10Key]?.[0]?.value;
            const rawTemp = data[c.tempKey]?.[0]?.value;
            const rawHumidity = data[c.humidityKey]?.[0]?.value;
            const rawRssi = data[c.rssiKey]?.[0]?.value;
            const rawSnr = data[c.snrKey]?.[0]?.value;
            const rawBattery = data[c.batteryKey]?.[0]?.value;
            const rawCurrent = data[c.currentKey]?.[0]?.value;
            const rawWifiPS = data[c.wifiPowerSaveKey]?.[0]?.value;

            const newPm25 = rawPm25 ? parseFloat(rawPm25) : 0;
            const newPm10 = rawPm10 ? parseFloat(rawPm10) : 0;
            const newTemp = rawTemp ? parseFloat(rawTemp) : 0;
            const newHumidity = rawHumidity ? parseFloat(rawHumidity) : 0;

            // Preservation rule: If current telemetry is 0, preserve previous value > 0
            setTelemetryMap(prevMap => {
              const prev = prevMap[station.id];

              const now = new Date();
              const dateStr = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
              const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
              const lastUpdatedStr = `${dateStr} เวลา ${timeStr} น.`;

              newTelemetryMap[station.id] = {
                pm25: newPm25 > 0 ? newPm25.toFixed(1) : (prev?.pm25 && prev.pm25 !== "-" ? prev.pm25 : (rawPm25 ? parseFloat(rawPm25).toFixed(1) : "-")),
                pm10: newPm10 > 0 ? newPm10.toFixed(1) : (prev?.pm10 && prev.pm10 !== "-" ? prev.pm10 : (rawPm10 ? parseFloat(rawPm10).toFixed(1) : "-")),
                temp: newTemp > 0 ? newTemp.toFixed(1) : (prev?.temp && prev.temp !== "-" ? prev.temp : (rawTemp ? parseFloat(rawTemp).toFixed(1) : "-")),
                humidity: newHumidity > 0 ? newHumidity.toFixed(1) : (prev?.humidity && prev.humidity !== "-" ? prev.humidity : (rawHumidity ? parseFloat(rawHumidity).toFixed(1) : "-")),
                rssi: rawRssi !== undefined ? String(rawRssi) : "-",
                snr: rawSnr !== undefined ? String(rawSnr) : "-",
                battery: rawBattery !== undefined ? parseFloat(rawBattery).toFixed(2) : "-",
                current: rawCurrent !== undefined ? parseFloat(rawCurrent).toFixed(1) : "-",
                wifiPowerSave: rawWifiPS !== undefined ? String(rawWifiPS) : "-",
                lastUpdated: lastUpdatedStr
              };
              return prevMap;
            });

          } catch (e) {
            console.error(`Telemetry error [${station.id}]:`, e);
          }
        })
      );

      setTelemetryMap(prev => ({
        ...prev,
        ...newTelemetryMap
      }));
    } catch (err) {
      console.error("Error fetching multi-station telemetry:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load active stations configuration from PostgreSQL database
  const loadStations = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await apiFetch("/api/stations");
      if (!res.ok) throw new Error("Could not load weather stations configuration");
      const list: Station[] = await res.json();
      setStations(list);
      await fetchTelemetry(list, isSilent);
    } catch (err) {
      console.error("Stations loading error:", err);
      if (!isSilent) setLoading(false);
    }
  }, [fetchTelemetry]);

  // Main polling scheduler (Runs every 25 minutes)
  useEffect(() => {
    if (authorized === true) {
      loadStations();
      const interval = setInterval(() => loadStations(true), 1500000); // 25 min polling
      return () => clearInterval(interval);
    }
  }, [authorized, loadStations]);

  // Thai AQI standards styling builder
  const getPm25Status = (valStr: string) => {
    const val = parseFloat(valStr);
    if (isNaN(val)) return { label: "ไม่มีข้อมูล", color: "text-slate-400 bg-slate-100 border-slate-200" };
    if (val <= 15.0) return { label: "ดีมาก", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (val <= 25.0) return { label: "ดี", color: "text-green-700 bg-green-50 border-green-200" };
    if (val <= 37.5) return { label: "ปานกลาง", color: "text-yellow-700 bg-yellow-50 border-yellow-200" };
    if (val <= 75.0) return { label: "เริ่มมีผลกระทบ", color: "text-orange-700 bg-orange-50 border-orange-200" };
    return { label: "มีผลกระทบต่อสุขภาพ", color: "text-red-700 bg-red-50 border-red-200" };
  };

  const handleBack = () => {
    router.push("/");
  };

  // Open and configure modal states for specific stations
  const handleOpenManager = () => {
    if (!isAdmin) return;
    setEditingStation(stations[0] || getNewStationTemplate());
    setIsEditModalOpen(true);
  };

  const getNewStationTemplate = (): Station => ({
    id: `st-${Date.now().toString().slice(-4)}`,
    name: "สถานีใหม่",
    desc: "รายละเอียดตำแหน่งหรือข้อมูลการติดตั้งเซ็นเซอร์",
    active: true,
    deviceId: "",
    config: {
      pm25Key: "pm2_5_1",
      pm25Label: "PM 2.5",
      pm10Key: "pm10_1",
      pm10Label: "PM 10",
      tempKey: "temperature_1",
      tempLabel: "Temperature",
      humidityKey: "humidity_1",
      humidityLabel: "Humidity",
      rssiKey: "rssi_1",
      rssiLabel: "Wi-Fi RSSI",
      snrKey: "snr_1",
      snrLabel: "คลื่นรบกวน SNR",
      batteryKey: "busvoltage_1",
      batteryLabel: "แรงดันแบตเตอรี่",
      currentKey: "current_mA_1",
      currentLabel: "การใช้กระแสไฟฟ้า",
      wifiPowerSaveKey: "wifi_power_save_1",
      wifiPowerSaveLabel: "โหมด Power Save",
      showDiagnostics: true
    }
  });

  const handleAddNewStation = () => {
    const template = getNewStationTemplate();
    setEditingStation(template);
  };

  const handleSelectStation = (station: Station) => {
    setEditingStation({ ...station });
    setDeleteConfirmId(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Local Form Mutators
  const updateEditingField = (field: keyof Station, val: any) => {
    if (!editingStation) return;
    setEditingStation(prev => prev ? ({ ...prev, [field]: val }) : null);
  };

  const updateEditingConfig = (key: keyof StationConfig, val: any) => {
    if (!editingStation) return;
    setEditingStation(prev => {
      if (!prev) return null;
      return {
        ...prev,
        config: {
          ...prev.config,
          [key]: val
        }
      };
    });
  };

  // Inline delete handlers
  const requestDeleteStation = (id: string) => {
    setDeleteConfirmId(id);
  };

  const cancelDeleteStation = () => {
    setDeleteConfirmId(null);
  };

  const executeDeleteStation = (id: string) => {
    const filtered = stations.filter(s => s.id !== id);
    saveStationsToDatabase(filtered, "ลบสถานีเรียบร้อยแล้ว");
    setDeleteConfirmId(null);
    if (editingStation?.id === id) {
      setEditingStation(filtered[0] || null);
    }
  };

  // Persists the whole modified array to PostgreSQL
  const saveStationsToDatabase = async (updatedList: Station[], successMsg: string) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await apiFetch("/api/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedList)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update configuration");
      }

      const resData = await res.json();
      setStations(updatedList);
      setSuccessMessage(successMsg);

      // Auto-trigger dynamic refresh of telemetry
      await fetchTelemetry(updatedList, true);

      // Dismiss success state after delay
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || "เกิดข้อผิดพลาดในการเซฟข้อมูลลงดาต้าเบส");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCurrentForm = () => {
    if (!editingStation) return;

    // Field Validation
    if (!editingStation.id.trim()) {
      setErrorMessage("กรุณากรอกรหัสสถานี (Station ID)");
      return;
    }
    if (!editingStation.name.trim()) {
      setErrorMessage("กรุณากรอกชื่อสถานี (Station Name)");
      return;
    }

    // Check unique ID constraint for new stations
    const isNew = !stations.some(s => s.id === editingStation.id);
    let updatedList: Station[];

    if (isNew) {
      updatedList = [...stations, editingStation];
    } else {
      updatedList = stations.map(s => s.id === editingStation.id ? editingStation : s);
    }

    saveStationsToDatabase(updatedList, "บันทึกการตั้งค่าสถานีตรวจวัดเรียบร้อยแล้ว");
  };

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto" />
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6 border border-red-100">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">เข้าถึงข้อมูลถูกปฏิเสธ</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            เฉพาะพนักงานของ ITH Group ที่ลงทะเบียนยืนยันตัวตนในหน้าแรกแล้วเท่านั้น จึงจะสามารถเข้าถึงแดชบอร์ดสภาพอากาศและสิ่งแวดล้อมได้
          </p>
          <button
            onClick={handleBack}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-orange-500/10"
          >
            ย้อนกลับไปหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  const filteredStations = stations.filter(st =>
    st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    st.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50 relative overflow-hidden">
      {/* Dynamic ambient backgrounds */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-100/30 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-orange-100/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Layout Container */}
      <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">

        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_12px_rgb(0,0,0,0.02)] flex items-center justify-center text-slate-600 hover:text-slate-800 hover:shadow-[0_4px_16px_rgb(0,0,0,0.04)] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Environmental Monitoring</span>
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">ระบบติดตามสภาพอากาศและฝุ่น</h1>
            </div>
          </div>

          {/* User profile, refresh & Admin Widget Settings */}
          <div className="flex flex-wrap items-center gap-4 bg-white/60 border border-white p-3 rounded-2xl backdrop-blur-md shadow-[0_4px_15px_rgb(0,0,0,0.02)]">
            <div className="text-right pl-2">
              <p className="text-sm font-bold text-slate-800">{employee?.fullName}</p>
              <p className="text-xs text-slate-400">{employee?.department} • {employee?.employeerId}</p>
            </div>
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            {/* Sync Telemetry */}
            <button
              onClick={() => loadStations(true)}
              disabled={refreshing || loading}
              className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
              title="รีเฟรชข้อมูลล่าสุด"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>

            {/* Admin Settings (Strictly 3ST19686 validation) */}
            {isAdmin && (
              <button
                onClick={handleOpenManager}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/10 active:scale-95 transition-all cursor-pointer group"
              >
                <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
                <span>จัดการ Widget</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters and Searches */}
        <div className="bg-white/80 border border-slate-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] backdrop-blur-lg mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ค้นหารหัส หรือชื่อสถานีตรวจวัด..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3.5 pl-12 pr-6 bg-slate-50/50 rounded-2xl border border-transparent focus:bg-white focus:border-orange-500 outline-none text-slate-700 font-medium transition-all"
            />
          </div>
          <div className="text-sm text-slate-400 font-medium bg-slate-50 px-4 py-2 rounded-xl border border-slate-100/50">
            กำลังแสดง {filteredStations.length} จากทั้งหมด {stations.length} สถานี
          </div>
        </div>

        {/* Stations Loop */}
        <div className="grid grid-cols-1 gap-8">
          {loading ? (
            <div className="py-24 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto mb-4" />
              <p className="text-slate-400 font-semibold text-sm">กำลังเชื่อมต่อข้อมูลสถานีในฐานข้อมูล...</p>
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="bg-white/80 border border-slate-100 rounded-3xl p-16 text-center shadow-sm">
              <Cpu className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">ไม่พบสถานีตรวจวัด</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                ยังไม่มีข้อมูลสถานีที่บันทึกไว้ในฐานข้อมูล หรือข้อมูลที่คุณค้นหาไม่ถูกต้อง
              </p>
            </div>
          ) : (
            filteredStations.map((station) => {
              const telemetry = telemetryMap[station.id];
              const isOnline = station.active && telemetry;

              return (
                <div
                  key={station.id}
                  className="bg-white/90 border border-slate-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)] transition-all duration-300"
                >
                  {/* Station Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100/80 mb-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${station.active ? "bg-orange-50 text-orange-500 border-orange-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}>
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-1">{station.name}</h2>
                        <p className="text-sm text-slate-400 font-medium">{station.desc}</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl">
                        <span className={`w-3 h-3 rounded-full ${station.active ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                        <span className="text-xs font-bold text-slate-600">
                          {station.active ? "ระบบออนไลน์" : "ยังไม่เปิดใช้งาน"}
                        </span>
                      </div>
                      {isOnline && telemetry.lastUpdated && (
                        <span className="text-[13px] text-slate-400 font-medium px-2">อัพเดทล่าสุด: {telemetry.lastUpdated}</span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  {!isOnline ? (
                    <div className="py-12 text-center max-w-sm mx-auto">
                      <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-slate-600 mb-1">ยังไม่มีการส่งสัญญาณข้อมูล</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        สถานีนี้ปิดใช้งานอยู่ หรืออยู่ในขั้นตอนระหว่างทดสอบเกตเวย์รับส่งข้อมูล (IoT Gateway Config)
                      </p>
                    </div>
                  ) : (
                    <div>
                      {/* Telemetry Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                        {/* PM 2.5 Card */}
                        <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-slate-500 text-[13px] font-extrabold tracking-wider uppercase">{station.config?.pm25Label || "PM 2.5"}</span>
                            <span className={`px-2.5 py-0.5 rounded text-[13px] font-bold border ${getPm25Status(telemetry.pm25).color}`}>
                              {getPm25Status(telemetry.pm25).label}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5 mb-1">
                            <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{telemetry.pm25}</span>
                            <span className="text-slate-400 text-xs font-semibold">μg/m³</span>
                          </div>
                          <p className="text-[13px] text-slate-400 font-medium">เกณฑ์ปริมาณฝุ่น PM2.5 ในพื้นที่</p>
                        </div>

                        {/* PM 10 Card */}
                        <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-slate-500 text-[13px] font-extrabold tracking-wider uppercase">{station.config?.pm10Label || "PM 10"}</span>
                            <span className="px-2.5 py-0.5 rounded text-[13px] font-bold border text-slate-600 bg-slate-100 border-slate-200">
                              ฝุ่นขนาดใหญ่
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5 mb-1">
                            <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{telemetry.pm10}</span>
                            <span className="text-slate-400 text-xs font-semibold">μg/m³</span>
                          </div>
                          <p className="text-[13px] text-slate-400 font-medium">เกณฑ์ปริมาณฝุ่น PM10 ในพื้นที่</p>
                        </div>

                        {/* Temperature Card */}
                        <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-slate-500 text-[13px] font-extrabold tracking-wider uppercase">{station.config?.tempLabel || "Temperature"}</span>
                            <span className="px-2.5 py-0.5 rounded text-[13px] font-bold border text-red-600 bg-red-50 border-red-100">
                              อุณหภูมิ
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5 mb-1">
                            <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{telemetry.temp}</span>
                            <span className="text-slate-400 text-xs font-semibold">°C</span>
                          </div>
                          <p className="text-[13px] text-slate-400 font-medium">ระดับอุณหภูมิอากาศปัจจุบัน</p>
                        </div>

                        {/* Humidity Card */}
                        <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-slate-500 text-[13px] font-extrabold tracking-wider uppercase">{station.config?.humidityLabel || "Humidity"}</span>
                            <span className="px-2.5 py-0.5 rounded text-[13px] font-bold border text-blue-600 bg-blue-50 border-blue-100">
                              ความชื้น
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5 mb-1">
                            <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{telemetry.humidity}</span>
                            <span className="text-slate-400 text-xs font-semibold">% RH</span>
                          </div>
                          <p className="text-[13px] text-slate-400 font-medium">ระดับความชื้นสัมพัทธ์ในอากาศ</p>
                        </div>

                      </div>

                      {/* Connection Details & Diagnostics */}
                      {station.config?.showDiagnostics !== false && (
                        <div className="mt-8 pt-6 border-t border-slate-100/80">
                          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-slate-400" />
                            IoT Gateway Diagnostics (ข้อมูลวิเคราะห์และฮาร์ดแวร์ล่าสุด)
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                              <Wifi className="w-5 h-5 text-slate-400 flex-shrink-0" />
                              <div>
                                <p className="text-[13px] text-slate-400 font-semibold">{station.config?.rssiLabel || "Wi-Fi RSSI"}</p>
                                <p className="font-bold text-slate-700">{telemetry.rssi} dBm</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Activity className="w-5 h-5 text-slate-400 flex-shrink-0" />
                              <div>
                                <p className="text-[13px] text-slate-400 font-semibold">{station.config?.snrLabel || "คลื่นรบกวน SNR"}</p>
                                <p className="font-bold text-slate-700">{telemetry.snr} dB</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Battery className="w-5 h-5 text-slate-400 flex-shrink-0" />
                              <div>
                                <p className="text-[13px] text-slate-400 font-semibold">{station.config?.batteryLabel || "แรงดันแบตเตอรี่"}</p>
                                <p className="font-bold text-slate-700">{telemetry.battery} V</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Cpu className="w-5 h-5 text-slate-400 flex-shrink-0" />
                              <div>
                                <p className="text-[13px] text-slate-400 font-semibold">{station.config?.currentLabel || "การใช้กระแสไฟฟ้า"}</p>
                                <p className="font-bold text-slate-700">{telemetry.current} mA</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Info className="w-5 h-5 text-slate-400 flex-shrink-0" />
                              <div>
                                <p className="text-[13px] text-slate-400 font-semibold">{station.config?.wifiPowerSaveLabel || "โหมด Power Save"}</p>
                                <p className="font-bold text-slate-700">{telemetry.wifiPowerSave === "1" ? "เปิดใช้งาน" : "ปิดใช้งาน"}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* ============================================================ */}
      {/* MANAGE STATIONS MODAL PANEL (ONLY ACCESSIBLE TO 3ST19686) */}
      {/* ============================================================ */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-xl border border-slate-100 rounded-3xl w-full max-w-5xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col max-h-[90vh] overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex justify-between items-start p-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-orange-50 border border-orange-100 text-[13px] font-black text-orange-500 rounded-md tracking-widest uppercase">Admin Config Panel</span>
                  <span className="text-xs text-slate-400 font-medium">• รหัสพนักงานผู้ปรับปรุง: {employee?.employeerId}</span>
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <Settings className="w-6 h-6 text-orange-500" />
                  จัดการตั้งค่าการ์ด Widget / สถานีตรวจวัดสภาพอากาศ
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/50 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split Screen Modal Body */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

              {/* Left Column - Stations List Sidebar */}
              <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 p-6 flex flex-col max-h-[50vh] md:max-h-none overflow-y-auto">
                <button
                  onClick={handleAddNewStation}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-bold text-sm shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer mb-5"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มสถานีตรวจวัดใหม่
                </button>

                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">รายชื่อสถานีที่กำหนดค่าไว้</div>
                <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                  {stations.map(st => {
                    const isSelected = editingStation?.id === st.id;
                    const isDeleting = deleteConfirmId === st.id;

                    return (
                      <div
                        key={st.id}
                        onClick={() => !isDeleting && handleSelectStation(st)}
                        className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between group ${isSelected ? "bg-orange-50/50 border-orange-200 shadow-sm" : "bg-white hover:bg-slate-50 border-slate-100"}`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className={`font-bold text-sm truncate ${isSelected ? "text-orange-600" : "text-slate-700"}`}>{st.name}</p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">ID: {st.id} • Key: {st.config?.pm25Key || "pm2_5_1"}</p>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* Online indicator */}
                          <span className={`w-2 h-2 rounded-full ${st.active ? "bg-emerald-500" : "bg-slate-300"}`} />

                          {/* Quick Actions inside Sidebar */}
                          {!isDeleting ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                requestDeleteStation(st.id);
                              }}
                              className="p-2 rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-500 text-slate-400 transition-all border border-slate-100 md:opacity-0 group-hover:opacity-100 cursor-pointer"
                              title="ลบสถานีนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-100 scale-95" onClick={e => e.stopPropagation()}>
                              <span className="text-[13px] font-bold text-red-600 px-1">ยืนยัน?</span>
                              <button
                                onClick={() => executeDeleteStation(st.id)}
                                className="p-1 rounded bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={cancelDeleteStation}
                                className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-600 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column - Configurations Form Editor */}
              <div className="w-full md:w-2/3 p-6 overflow-y-auto max-h-[80vh] md:max-h-none flex flex-col">
                {editingStation ? (
                  <div className="space-y-6">
                    <div className="pb-4 border-b border-slate-100">
                      <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-orange-500" />
                        {stations.some(s => s.id === editingStation.id)
                          ? `แก้ไขสถานี: ${editingStation.name}`
                          : "✨ กำลังสร้างสถานีตรวจวัดใหม่"}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">ระบุค่าพื้นฐานของอุปกรณ์และเซ็นเซอร์รับข้อมูลในดาต้าเบส</p>
                    </div>

                    {/* Messages Banner */}
                    {errorMessage && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 text-red-600 text-xs font-semibold animate-in slide-in-from-top-2 duration-300">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <div>{errorMessage}</div>
                      </div>
                    )}

                    {successMessage && (
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5 text-emerald-700 text-xs font-semibold animate-in slide-in-from-top-2 duration-300">
                        <Check className="w-4 h-4 flex-shrink-0" />
                        <div>{successMessage}</div>
                      </div>
                    )}

                    {/* Form Layout Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Station ID */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">รหัสสถานี (Station ID)</label>
                        <input
                          type="text"
                          value={editingStation.id}
                          onChange={(e) => updateEditingField("id", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                          disabled={stations.some(s => s.id === editingStation.id)}
                          className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200/60 focus:bg-white focus:border-orange-500 outline-none text-slate-700 font-semibold disabled:bg-slate-100 disabled:text-slate-400 transition-all text-sm"
                          placeholder="เช่น st-03"
                        />
                      </div>

                      {/* ThingsBoard Device ID */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ThingsBoard Device ID</label>
                        <input
                          type="text"
                          value={editingStation.deviceId}
                          onChange={(e) => updateEditingField("deviceId", e.target.value.trim())}
                          className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200/60 focus:bg-white focus:border-orange-500 outline-none text-slate-700 font-semibold transition-all text-sm"
                          placeholder="เช่น d26d5f60-a302-11ef-a358-3ba4df6c3d74"
                        />
                      </div>

                      {/* Station Name */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ชื่อสถานีการ์ด (Station Name)</label>
                        <input
                          type="text"
                          value={editingStation.name}
                          onChange={(e) => updateEditingField("name", e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200/60 focus:bg-white focus:border-orange-500 outline-none text-slate-700 font-semibold transition-all text-sm"
                          placeholder="เช่น Station 03 (คลังสินค้า A)"
                        />
                      </div>

                      {/* Station Description */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">รายละเอียด / สถานที่ตั้ง (Description)</label>
                        <textarea
                          value={editingStation.desc}
                          onChange={(e) => updateEditingField("desc", e.target.value)}
                          rows={2}
                          className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200/60 focus:bg-white focus:border-orange-500 outline-none text-slate-700 font-semibold transition-all text-sm resize-none"
                          placeholder="เช่น ติดตั้งบริเวณหน้าบอร์ดประกาศ คลังสินค้าตึก A เพื่อวัดค่าฝุ่นก่อนเข้าพื้นที่ควบคุม"
                        />
                      </div>

                      {/* Active Status Switch */}
                      <div className="sm:col-span-2 flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div>
                          <p className="text-sm font-bold text-slate-700">สถานะเปิดใช้งานสถานี (Active Status)</p>
                          <p className="text-xs text-slate-400 font-medium">เปิดเพื่อให้ระบบทำการดึงข้อมูลและแสดงผลเป็น Live Card ทันที</p>
                        </div>
                        <button
                          onClick={() => updateEditingField("active", !editingStation.active)}
                          className={`w-12 h-7 rounded-full transition-all duration-300 relative ${editingStation.active ? "bg-emerald-500" : "bg-slate-300"}`}
                        >
                          <span className={`absolute w-5  h-5 rounded-full bg-white top-1 transition-all duration-300 shadow-sm ${editingStation.active ? "left-6" : "left-1"}`} />
                        </button>
                      </div>

                      {/* Show Diagnostics Switch */}
                      <div className="sm:col-span-2 flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div>
                          <p className="text-sm font-bold text-slate-700">แสดงข้อมูล IoT Gateway Diagnostics</p>
                          <p className="text-xs text-slate-400 font-medium">เปิดเพื่อให้แสดงแถบข้อมูลการเชื่อมต่อและฮาร์ดแวร์ของการ์ดนี้</p>
                        </div>
                        <button
                          onClick={() => updateEditingConfig("showDiagnostics", editingStation.config?.showDiagnostics === false ? true : false)}
                          className={`w-12 h-7 rounded-full transition-all duration-300 relative ${editingStation.config?.showDiagnostics !== false ? "bg-blue-500" : "bg-slate-300"}`}
                        >
                          <span className={`absolute w-5  h-5 rounded-full bg-white top-1 transition-all duration-300 shadow-sm ${editingStation.config?.showDiagnostics !== false ? "left-6" : "left-1"}`} />
                        </button>
                      </div>
                    </div>

                    {/* Sensor Config Mappings section */}
                    <div className="pt-6 border-t border-slate-100">
                      <div className="flex items-center gap-2 mb-3 bg-blue-50 border border-blue-100/50 p-3.5 rounded-2xl text-blue-800 text-xs font-medium leading-relaxed">
                        <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div>
                          <strong>JSON Telemetry Keys Config:</strong> สำหรับจับคู่ (Map) ตัวแปรข้อมูลเซ็นเซอร์จากบอร์ด ESP32 ที่ส่งไปถึง ThingsBoard ให้มาแสดงผลตรงกับการ์ดของทาง BBS-App
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* PM 2.5 */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">PM 2.5 Label</label>
                            <input type="text" value={editingStation.config?.pm25Label || "PM 2.5"} onChange={(e) => updateEditingConfig("pm25Label", e.target.value)} className="w-full px-3 py-2.5 bg-slate-50/50 rounded-lg border border-slate-200 focus:bg-white focus:border-orange-500 outline-none text-slate-600 font-semibold text-xs transition-all" placeholder="เช่น PM 2.5" />
                          </div>
                          <div>
                            <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">PM 2.5 Key</label>
                            <input type="text" value={editingStation.config?.pm25Key || "pm2_5_1"} onChange={(e) => updateEditingConfig("pm25Key", e.target.value.trim())} className="w-full px-3 py-2.5 bg-slate-50/50 rounded-lg border border-slate-200 focus:bg-white focus:border-orange-500 outline-none text-slate-600 font-semibold text-xs transition-all" placeholder="เช่น pm2_5_1" />
                          </div>
                        </div>

                        {/* PM 10 */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">PM 10 Label</label>
                            <input type="text" value={editingStation.config?.pm10Label || "PM 10"} onChange={(e) => updateEditingConfig("pm10Label", e.target.value)} className="w-full px-3 py-2.5 bg-slate-50/50 rounded-lg border border-slate-200 focus:bg-white focus:border-orange-500 outline-none text-slate-600 font-semibold text-xs transition-all" placeholder="เช่น PM 10" />
                          </div>
                          <div>
                            <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">PM 10 Key</label>
                            <input type="text" value={editingStation.config?.pm10Key || "pm10_1"} onChange={(e) => updateEditingConfig("pm10Key", e.target.value.trim())} className="w-full px-3 py-2.5 bg-slate-50/50 rounded-lg border border-slate-200 focus:bg-white focus:border-orange-500 outline-none text-slate-600 font-semibold text-xs transition-all" placeholder="เช่น pm10_1" />
                          </div>
                        </div>

                        {/* Temperature */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Temperature Label</label>
                            <input type="text" value={editingStation.config?.tempLabel || "Temperature"} onChange={(e) => updateEditingConfig("tempLabel", e.target.value)} className="w-full px-3 py-2.5 bg-slate-50/50 rounded-lg border border-slate-200 focus:bg-white focus:border-orange-500 outline-none text-slate-600 font-semibold text-xs transition-all" placeholder="เช่น Temperature" />
                          </div>
                          <div>
                            <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Temperature Key</label>
                            <input type="text" value={editingStation.config?.tempKey || "temperature_1"} onChange={(e) => updateEditingConfig("tempKey", e.target.value.trim())} className="w-full px-3 py-2.5 bg-slate-50/50 rounded-lg border border-slate-200 focus:bg-white focus:border-orange-500 outline-none text-slate-600 font-semibold text-xs transition-all" placeholder="เช่น temperature_1" />
                          </div>
                        </div>

                        {/* Humidity */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Humidity Label</label>
                            <input type="text" value={editingStation.config?.humidityLabel || "Humidity"} onChange={(e) => updateEditingConfig("humidityLabel", e.target.value)} className="w-full px-3 py-2.5 bg-slate-50/50 rounded-lg border border-slate-200 focus:bg-white focus:border-orange-500 outline-none text-slate-600 font-semibold text-xs transition-all" placeholder="เช่น Humidity" />
                          </div>
                          <div>
                            <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Humidity Key</label>
                            <input type="text" value={editingStation.config?.humidityKey || "humidity_1"} onChange={(e) => updateEditingConfig("humidityKey", e.target.value.trim())} className="w-full px-3 py-2.5 bg-slate-50/50 rounded-lg border border-slate-200 focus:bg-white focus:border-orange-500 outline-none text-slate-600 font-semibold text-xs transition-all" placeholder="เช่น humidity_1" />
                          </div>
                        </div>

                        {/* WiFi RSSI */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">WiFi RSSI Label</label>
                            <input type="text" value={editingStation.config?.rssiLabel || "Wi-Fi RSSI"} onChange={(e) => updateEditingConfig("rssiLabel", e.target.value)} className="w-full px-3 py-2.5 bg-slate-50/50 rounded-lg border border-slate-200 focus:bg-white focus:border-orange-500 outline-none text-slate-600 font-semibold text-xs transition-all" placeholder="เช่น Wi-Fi RSSI" />
                          </div>
                          <div>
                            <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">WiFi RSSI Key</label>
                            <input type="text" value={editingStation.config?.rssiKey || "rssi_1"} onChange={(e) => updateEditingConfig("rssiKey", e.target.value.trim())} className="w-full px-3 py-2.5 bg-slate-50/50 rounded-lg border border-slate-200 focus:bg-white focus:border-orange-500 outline-none text-slate-600 font-semibold text-xs transition-all" placeholder="เช่น rssi_1" />
                          </div>
                        </div>

                        {/* SNR */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">SNR Label</label>
                            <input type="text" value={editingStation.config?.snrLabel || "คลื่นรบกวน SNR"} onChange={(e) => updateEditingConfig("snrLabel", e.target.value)} className="w-full px-3 py-2.5 bg-slate-50/50 rounded-lg border border-slate-200 focus:bg-white focus:border-orange-500 outline-none text-slate-600 font-semibold text-xs transition-all" placeholder="เช่น คลื่นรบกวน SNR" />
                          </div>
                          <div>
                            <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">SNR Key</label>
                            <input type="text" value={editingStation.config?.snrKey || "snr_1"} onChange={(e) => updateEditingConfig("snrKey", e.target.value.trim())} className="w-full px-3 py-2.5 bg-slate-50/50 rounded-lg border border-slate-200 focus:bg-white focus:border-orange-500 outline-none text-slate-600 font-semibold text-xs transition-all" placeholder="เช่น snr_1" />
                          </div>
                        </div>

                        {/* Battery Voltage */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Battery Label</label>
                            <input type="text" value={editingStation.config?.batteryLabel || "แรงดันแบตเตอรี่"} onChange={(e) => updateEditingConfig("batteryLabel", e.target.value)} className="w-full px-3 py-2.5 bg-slate-50/50 rounded-lg border border-slate-200 focus:bg-white focus:border-orange-500 outline-none text-slate-600 font-semibold text-xs transition-all" placeholder="เช่น แรงดันแบตเตอรี่" />
                          </div>
                          <div>
                            <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Battery Key</label>
                            <input type="text" value={editingStation.config?.batteryKey || "busvoltage_1"} onChange={(e) => updateEditingConfig("batteryKey", e.target.value.trim())} className="w-full px-3 py-2.5 bg-slate-50/50 rounded-lg border border-slate-200 focus:bg-white focus:border-orange-500 outline-none text-slate-600 font-semibold text-xs transition-all" placeholder="เช่น busvoltage_1" />
                          </div>
                        </div>

                        {/* Current Usage */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Current Label</label>
                            <input type="text" value={editingStation.config?.currentLabel || "การใช้กระแสไฟฟ้า"} onChange={(e) => updateEditingConfig("currentLabel", e.target.value)} className="w-full px-3 py-2.5 bg-slate-50/50 rounded-lg border border-slate-200 focus:bg-white focus:border-orange-500 outline-none text-slate-600 font-semibold text-xs transition-all" placeholder="เช่น การใช้กระแสไฟฟ้า" />
                          </div>
                          <div>
                            <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Current Key</label>
                            <input type="text" value={editingStation.config?.currentKey || "current_mA_1"} onChange={(e) => updateEditingConfig("currentKey", e.target.value.trim())} className="w-full px-3 py-2.5 bg-slate-50/50 rounded-lg border border-slate-200 focus:bg-white focus:border-orange-500 outline-none text-slate-600 font-semibold text-xs transition-all" placeholder="เช่น current_mA_1" />
                          </div>
                        </div>

                        {/* WiFi Power Save */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Power Save Label</label>
                            <input type="text" value={editingStation.config?.wifiPowerSaveLabel || "โหมด Power Save"} onChange={(e) => updateEditingConfig("wifiPowerSaveLabel", e.target.value)} className="w-full px-3 py-2.5 bg-slate-50/50 rounded-lg border border-slate-200 focus:bg-white focus:border-orange-500 outline-none text-slate-600 font-semibold text-xs transition-all" placeholder="เช่น โหมด Power Save" />
                          </div>
                          <div>
                            <label className="block text-[13px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Power Save Key</label>
                            <input type="text" value={editingStation.config?.wifiPowerSaveKey || "wifi_power_save_1"} onChange={(e) => updateEditingConfig("wifiPowerSaveKey", e.target.value.trim())} className="w-full px-3 py-2.5 bg-slate-50/50 rounded-lg border border-slate-200 focus:bg-white focus:border-orange-500 outline-none text-slate-600 font-semibold text-xs transition-all" placeholder="เช่น wifi_power_save_1" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Save Action buttons */}
                    <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                      <button
                        onClick={() => setIsEditModalOpen(false)}
                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-all cursor-pointer"
                      >
                        ปิดหน้าต่าง
                      </button>
                      <button
                        onClick={handleSaveCurrentForm}
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold text-sm shadow-md shadow-orange-500/10 hover:shadow-lg disabled:opacity-60 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="my-auto py-24 text-center">
                    <Cpu className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-600 mb-1">ยินดีต้อนรับสู่แผงควบคุม</h3>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto">
                      คลิกเลือกสถานีทางซ้ายมือ หรือคลิกปุ่มเพื่อสร้างสถานีตรวจวัดความชื้นและฝุ่นใหม่ลงฐานข้อมูล
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
