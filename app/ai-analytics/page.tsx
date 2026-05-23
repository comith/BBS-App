"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LabelList
} from "recharts";
import { useRouter } from "next/navigation";
import {
  BrainCircuit, TrendingUp, AlertTriangle, ShieldAlert, Activity,
  ArrowUpRight, Sparkles, RefreshCw, DatabaseZap, Search, Check, ChevronsUpDown, Clock, ArrowLeft
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded-lg shadow-md">
        <p className="font-medium text-slate-800">{data.name}</p>
        <div className="flex flex-col mt-1 text-sm text-slate-600">
          <span>จำนวน: <span className="font-bold">{data.value}</span> รายการ</span>
          <span>สัดส่วน: <span className="font-bold">{data.percentOfTotal}%</span> (จากข้อมูลทั้งหมด)</span>
        </div>
      </div>
    );
  }
  return null;
};

interface AnalyticsData {
  kpis: {
    aiRiskIndex: number;
    totalProcessed: number;
    totalReports: number;
    topRiskArea: string;
  };
  predictiveTrends: any[];
  categoryDistribution: any[];
  departmentRisk: any[];
  topRootCauses: any[];
  recentInsights?: Array<{
    id: number;
    category: string;
    severityScore: number;
    rootCause: string;
    recommendations: any;
    predictiveWarning: string;
    createdAt: string;
    recordDate: string;
    employeeId: string;
    group: string;
    observedWork: string;
  }>;
}

export default function AiAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, show: false });
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("1m");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [openCategoryFilter, setOpenCategoryFilter] = useState(false);
  const [reanalyzingId, setReanalyzingId] = useState<number | null>(null);
  const itemsPerPage = 10;
  const { success, error: toastError } = useToast();
  const router = useRouter();

  const handleReanalyze = async (insight: any) => {
    if (!insight.recordId) {
      toastError('เกิดข้อผิดพลาด', 'ไม่พบรหัสข้อมูลต้นฉบับ ไม่สามารถวิเคราะห์ใหม่ได้');
      return;
    }

    setReanalyzingId(insight.id);
    try {
      const res = await fetch('/api/ai-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: insight.recordId,
          recordType: insight.recordType,
          observedWork: insight.observedWork,
          departNotice: insight.departNotice,
          forceReanalyze: true
        })
      });

      if (!res.ok) throw new Error('Failed to re-analyze');
      
      success('วิเคราะห์ใหม่สำเร็จ', 'อัปเดตผลการวิเคราะห์เรียบร้อยแล้ว');
      fetchData(); // Refresh table
    } catch (err: any) {
      toastError('วิเคราะห์ใหม่ล้มเหลว', err.message || 'เกิดข้อผิดพลาดในการวิเคราะห์');
    } finally {
      setReanalyzingId(null);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai-analytics');
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBatchProcess = async () => {
    setIsProcessing(true);
    setProgress({ current: 0, total: 0, show: true });

    let totalProcessed = 0;
    let keepProcessing = true;
    let initialTotal = 0;

    try {
      while (keepProcessing) {
        // ประมวลผลทีละ 20 รายการเพื่อไม่ให้ Browser ติด Timeout
        const res = await fetch('/api/ai-batch-process', {
          method: 'POST',
          body: JSON.stringify({ limit: 60 })
        });

        if (!res.ok) throw new Error('Network response was not ok');

        const result = await res.json();

        if (initialTotal === 0) {
          initialTotal = result.totalPending;
          setProgress(prev => ({ ...prev, total: initialTotal }));
        }

        totalProcessed += result.processed;
        setProgress(prev => ({ ...prev, current: totalProcessed }));

        // Update Dashboard Data periodically
        fetchData();

        if (result.totalPending <= result.processed || result.processed === 0) {
          keepProcessing = false;
        }
      }

      success('ประมวลผลเสร็จสิ้น', `วิเคราะห์ข้อมูลทั้งหมด ${totalProcessed} รายการเรียบร้อยแล้ว`);
    } catch (err: any) {
      toastError('เกิดข้อผิดพลาด', `การประมวลผลหยุดชะงัก: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress({ current: 0, total: 0, show: false }), 3000);
    }
  };

  const kpis = data?.kpis;
  const predictiveTrends = data?.predictiveTrends || [];
  const categoryDistribution = data?.categoryDistribution || [];
  const departmentRisk = data?.departmentRisk || [];
  const topRootCauses = data?.topRootCauses || [];
  const recentInsights = data?.recentInsights || [];

  const filteredInsights = recentInsights.filter((insight: any) => {
    if (!insight) return false;
    const work = typeof insight.observedWork === 'string' ? insight.observedWork : '';
    const group = typeof insight.group === 'string' ? insight.group : '';
    const query = typeof searchQuery === 'string' ? searchQuery.toLowerCase() : '';

    const matchesSearch = 
      work.toLowerCase().includes(query) || 
      group.toLowerCase().includes(query);
    
    const matchesCategory = filterCategory === "all" || insight.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredInsights.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInsights = filteredInsights.slice(startIndex, startIndex + itemsPerPage);

  const hasData = (kpis?.totalProcessed || 0) > 0;

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2 hover:bg-slate-100">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Button>
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-inner hidden sm:flex">
                <BrainCircuit className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-2">
                  AI Safety Analytics
                  <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 text-xs sm:text-sm hidden sm:flex">Live</Badge>
                </h1>
                <p className="text-gray-500 text-xs sm:text-sm mt-1 hidden sm:block">
                  ระบบประเมินและคาดการณ์ความเสี่ยงด้วยปัญญาประดิษฐ์ (ข้อมูลจริงจาก Ollama AI)
                </p>
              </div>
            </div>
            <div className="flex flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[140px] sm:w-36 bg-white shrink-0">
                  <SelectValue placeholder="ช่วงเวลา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 เดือนที่ผ่านมา</SelectItem>
                  <SelectItem value="3m">3 เดือนที่ผ่านมา</SelectItem>
                  <SelectItem value="6m">6 เดือนที่ผ่านมา</SelectItem>
                  <SelectItem value="1y">1 ปีที่ผ่านมา</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2">
                <div className="flex flex-row gap-2 shrink-0">
                  <Button
                    variant="default"
                    onClick={handleBatchProcess}
                    disabled={isProcessing || loading}
                    className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4"
                    title="วิเคราะห์ข้อมูลที่เหลือทั้งหมด"
                  >
                    <BrainCircuit className={`h-4 w-4 ${isProcessing ? 'animate-pulse' : ''}`} />
                    <span className="hidden sm:inline">
                      {isProcessing ? 'กำลังวิเคราะห์ด้วย AI...' : 'วิเคราะห์ข้อมูลที่เหลือทั้งหมด'}
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={fetchData}
                    disabled={loading || isProcessing}
                    className="gap-2 px-3 sm:px-4"
                    title="รีเฟรชข้อมูล"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">รีเฟรชข้อมูล</span>
                  </Button>
                </div>

                <div className="hidden sm:block w-full text-right mt-1">
                  {progress.show ? (
                    <>
                      <div className="flex justify-between text-xs text-gray-500 mb-1 font-medium">
                        <span>กำลังดำเนินการ...</span>
                        <span>{progress.current} / {progress.total > 0 ? progress.total : '?'} รายการ</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 w-48 ml-auto">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${progress.total > 0 ? Math.min((progress.current / progress.total) * 100, 100) : 0}%` }}
                        ></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs text-gray-500 mb-1 font-medium">
                        <span>วิเคราะห์แล้ว</span>
                        <span>{kpis?.totalProcessed || 0} / {kpis?.totalReports || 0} รายการ</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 w-48 ml-auto">
                        <div
                          className="bg-indigo-400 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${(kpis?.totalReports || 0) > 0 ? Math.min(((kpis?.totalProcessed || 0) / (kpis?.totalReports || 1)) * 100, 100) : 0}%` }}
                        ></div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Empty State */}
        {!loading && !error && !hasData && (
          <Card className="shadow-sm border-dashed border-2 border-indigo-200 bg-indigo-50/30">
            <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
              <DatabaseZap className="h-16 w-16 text-indigo-300" />
              <h2 className="text-xl font-bold text-gray-700">ยังไม่มีข้อมูลการวิเคราะห์จาก AI</h2>
              <p className="text-gray-500 max-w-md mb-6">
                ระบบยังไม่ได้วิเคราะห์รายงานใดๆ คุณสามารถกดปุ่มเริ่มวิเคราะห์ด้านล่าง เพื่อให้ AI ทยอยประมวลผลรายงานทั้งหมดที่มีในฐานข้อมูลได้ทันที
              </p>
              <Button
                onClick={handleBatchProcess}
                disabled={isProcessing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <BrainCircuit className="h-4 w-4 mr-2" />
                {isProcessing ? 'กำลังประมวลผล...' : 'เริ่มวิเคราะห์รายงานทั้งหมดตอนนี้'}
              </Button>

              {progress.show && (
                <div className="w-full max-w-md mt-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2 font-medium">
                    <span>ความคืบหน้าการวิเคราะห์...</span>
                    <span>{progress.current} / {progress.total > 0 ? progress.total : '?'} รายการ</span>
                  </div>
                  <div className="w-full bg-indigo-100 rounded-full h-2.5">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 relative overflow-hidden"
                      style={{ width: `${progress.total > 0 ? Math.min((progress.current / progress.total) * 100, 100) : 0}%` }}
                    >
                      <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    อาจใช้เวลาสักครู่ กรุณาอย่าเพิ่งปิดหน้านี้
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="shadow-sm border-red-200 bg-red-50/30">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-2">
              <AlertTriangle className="h-8 w-8 text-red-400" />
              <p className="text-red-700 font-medium">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
              <p className="text-red-500 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Top KPIs */}
        {(loading || hasData) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-indigo-500 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">AI Risk Index</p>
                  <div className="flex items-end gap-2">
                    {loading ? (
                      <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <h3 className="text-3xl font-bold text-gray-900">
                        {kpis?.aiRiskIndex || 0}<span className="text-sm font-normal text-gray-400">/10</span>
                      </h3>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">ดัชนีความเสี่ยงเฉลี่ยจาก AI</p>
                </div>
                <div className="bg-indigo-50 p-3 rounded-full">
                  <Activity className="h-6 w-6 text-indigo-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">AI Processed</p>
                  <div className="flex items-end gap-2">
                    {loading ? (
                      <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <>
                        <h3 className="text-3xl font-bold text-gray-900">{kpis?.totalProcessed || 0}</h3>
                        <span className="text-sm text-gray-400 mb-1">/ {kpis?.totalReports || 0}</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">รายงานที่ AI วิเคราะห์แล้ว / ทั้งหมด</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-full">
                  <BrainCircuit className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Top Risk Area</p>
                  {loading ? (
                    <div className="h-7 w-32 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <h3 className="text-lg font-bold text-gray-900 truncate max-w-[150px]">
                      {kpis?.topRiskArea || 'N/A'}
                    </h3>
                  )}
                  <p className="text-xs text-amber-600 mt-2 font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> กลุ่มที่มีคะแนนเสี่ยงสูงสุด
                  </p>
                </div>
                <div className="bg-amber-50 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Coverage</p>
                  {loading ? (
                    <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <h3 className="text-3xl font-bold text-gray-900">
                      {kpis && kpis.totalReports > 0
                        ? Math.round((kpis.totalProcessed / kpis.totalReports) * 100)
                        : 0}
                      <span className="text-sm font-normal text-gray-400">%</span>
                    </h3>
                  )}
                  <p className="text-xs text-gray-400 mt-2">อัตราการครอบคลุมการวิเคราะห์</p>
                </div>
                <div className="bg-green-50 p-3 rounded-full">
                  <Sparkles className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Charts */}
        {hasData && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trend */}
              <Card className="lg:col-span-2 shadow-sm pt-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-500" />
                    AI Incident Trend (Monthly)
                  </CardTitle>
                  <CardDescription>จำนวนรายงานที่ AI วิเคราะห์แล้วจำแนกรายเดือน</CardDescription>
                </CardHeader>
                <CardContent>
                  {predictiveTrends.length > 0 ? (
                    <div className="h-[300px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={predictiveTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Area type="monotone" dataKey="actual" name="จำนวนรายงาน" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)">
                            <LabelList dataKey="actual" position="top" fill="#6366f1" fontSize={12} fontWeight={600} />
                          </Area>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-400">
                      ยังไม่มีข้อมูลเทรนด์เพียงพอ
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category Pie */}
              <Card className="shadow-sm pt-2">
                <CardHeader>
                  <CardTitle className="text-lg">AI Category Distribution</CardTitle>
                  <CardDescription>หมวดหมู่ความเสี่ยงจัดกลุ่มโดย AI</CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryDistribution.length > 0 ? (
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={categoryDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" labelLine={false} label={renderCustomizedLabel}>
                            {categoryDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                          <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-400">
                      ยังไม่มีข้อมูลหมวดหมู่
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department Risk */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 pt-2">
                    <ShieldAlert className="h-5 w-5 text-rose-500" />
                    Department Risk Hotspots
                  </CardTitle>
                  <CardDescription>กลุ่มที่มีความเสี่ยงสะสมสูงสุด (จาก AI Severity Score)</CardDescription>
                </CardHeader>
                <CardContent>
                  {departmentRisk.length > 0 ? (
                    <div className="h-[250px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={departmentRisk} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                          <XAxis type="number" domain={[0, 100]} hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 12 }} width={120} />
                          <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="riskLevel" name="Risk Score (0-100)" radius={[0, 4, 4, 0]}>
                            <LabelList dataKey="riskLevel" position="insideRight" fill="white" fontSize={12} fontWeight="bold" />
                            {departmentRisk.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.riskLevel > 70 ? '#ef4444' : entry.riskLevel > 40 ? '#f59e0b' : '#10b981'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-gray-400">
                      ยังไม่มีข้อมูลกลุ่ม
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Root Cause */}
              <Card className="shadow-sm overflow-hidden flex flex-col">
                <CardHeader className="bg-slate-50 border-b pt-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    AI Root Cause Summary
                  </CardTitle>
                  <CardDescription>วิเคราะห์สาเหตุเชิงลึกที่พบบ่อยจากข้อความรายงาน</CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col justify-center">
                  {topRootCauses.length > 0 ? (
                    <div className="divide-y">
                      {topRootCauses.map((cause: any, idx: number) => (
                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm
                              ${idx === 0 ? 'bg-rose-100 text-rose-700' :
                                idx === 1 ? 'bg-orange-100 text-orange-700' :
                                  'bg-slate-100 text-slate-700'}`}
                            >
                              #{idx + 1}
                            </div>
                            <span className="font-medium text-gray-800">{cause.cause}</span>
                          </div>
                          <div className="flex items-center gap-3 w-1/3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${idx === 0 ? 'bg-rose-500' : idx === 1 ? 'bg-orange-500' : 'bg-slate-500'}`}
                                style={{ width: `${cause.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-gray-600 w-10 text-right">{cause.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full min-h-[200px] flex items-center justify-center text-gray-400">
                      ยังไม่มีข้อมูลสาเหตุ
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Recent AI Analysis Table */}
        {hasData && recentInsights.length > 0 && (
          <Card className="shadow-sm mt-6">
            <CardHeader className="border-b bg-slate-50 pt-3 pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DatabaseZap className="h-5 w-5 text-indigo-500" />
                    AI Analysis History
                  </CardTitle>
                  <CardDescription>ประวัติการวิเคราะห์ล่าสุดโดย AI</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="ค้นหาข้อความ หรือแผนก..."
                      className="pl-8 bg-white"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                  <Popover open={openCategoryFilter} onOpenChange={setOpenCategoryFilter}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCategoryFilter}
                        className="w-full sm:w-[220px] justify-between bg-white font-normal"
                      >
                        <span className="truncate flex-1 text-left">
                          {filterCategory === "all" ? "ทุกหมวดหมู่" : filterCategory}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[220px] p-0">
                      <Command>
                        <CommandInput placeholder="ค้นหาหมวดหมู่..." />
                        <CommandList>
                          <CommandEmpty>ไม่พบหมวดหมู่</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="all"
                              onSelect={() => {
                                setFilterCategory("all");
                                setOpenCategoryFilter(false);
                                setCurrentPage(1);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filterCategory === "all" ? "opacity-100" : "opacity-0"
                                )}
                              />
                              ทุกหมวดหมู่
                            </CommandItem>
                            {Array.from(new Set(recentInsights.filter(Boolean).map((i: any) => i.category))).filter(Boolean).map((cat: any) => (
                              <CommandItem
                                key={String(cat)}
                                value={String(cat)}
                                onSelect={(currentValue) => {
                                  setFilterCategory(currentValue === filterCategory ? "all" : currentValue);
                                  setOpenCategoryFilter(false);
                                  setCurrentPage(1);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    filterCategory === cat ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {String(cat)}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่รายงาน</TableHead>
                    <TableHead>แผนก</TableHead>
                    <TableHead>หมวดหมู่ความเสี่ยง</TableHead>
                    <TableHead>ความรุนแรง</TableHead>
                    <TableHead className="w-[30%]">ข้อความรายงาน</TableHead>
                    <TableHead className="text-right">รายละเอียด</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInsights.map((insight) => (
                    <TableRow key={insight.id}>
                      <TableCell className="whitespace-nowrap">
                        {insight.recordDate ? new Date(insight.recordDate).toLocaleDateString('th-TH') : '-'}
                      </TableCell>
                      <TableCell>{insight.group}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                          {insight.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${insight.severityScore >= 8 ? 'text-red-600' : insight.severityScore >= 5 ? 'text-orange-500' : 'text-green-600'}`}>
                            {insight.severityScore}/10
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate" title={insight.observedWork}>
                        {insight.observedWork}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50">
                              ดูผลวิเคราะห์
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-xl flex items-center gap-2">
                                <BrainCircuit className="h-6 w-6 text-indigo-600" />
                                ผลการวิเคราะห์จาก AI
                              </DialogTitle>
                              <DialogDescription>
                                <span className="block mb-1">
                                  รายงานวันที่ {insight.recordDate ? new Date(insight.recordDate).toLocaleDateString('th-TH') : '-'} โดย {insight.employeeId} ({insight.group})
                                </span>
                                {insight.createdAt && (
                                  <span className="flex items-center gap-1 text-indigo-600">
                                    <Clock className="w-3 h-3" />
                                    <span>วิเคราะห์เมื่อ: {new Date(insight.createdAt).toLocaleString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                  </span>
                                )}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div className="p-4 bg-slate-50 rounded-lg border">
                                <h4 className="text-sm font-semibold text-gray-500 mb-1">ข้อความที่พนักงานรายงาน:</h4>
                                <p className="text-gray-800 text-sm">{insight.observedWork}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 border rounded-lg">
                                  <h4 className="text-sm font-semibold text-gray-500 mb-1">หมวดหมู่</h4>
                                  <p className="font-medium text-indigo-700">{insight.category}</p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                  <h4 className="text-sm font-semibold text-gray-500 mb-1">ระดับความรุนแรง (Severity)</h4>
                                  <p className={`font-bold text-lg ${insight.severityScore >= 8 ? 'text-red-600' : insight.severityScore >= 5 ? 'text-orange-500' : 'text-green-600'}`}>
                                    {insight.severityScore} / 10
                                  </p>
                                </div>
                              </div>
                              <div className="p-4 border border-rose-100 bg-rose-50 rounded-lg">
                                <h4 className="text-sm font-semibold text-rose-700 mb-2 flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4" /> Root Cause Analysis
                                </h4>
                                <p className="text-rose-900 text-sm">{insight.rootCause}</p>
                              </div>
                              <div className="p-4 border border-blue-100 bg-blue-50 rounded-lg">
                                <h4 className="text-sm font-semibold text-blue-700 mb-2">คำแนะนำ / Recommendations</h4>
                                <ul className="list-disc pl-5 text-sm text-blue-900 space-y-1">
                                  {Array.isArray(insight.recommendations) ? (
                                    insight.recommendations.map((rec: string, i: number) => (
                                      <li key={i}>{rec}</li>
                                    ))
                                  ) : (
                                    <li>{String(insight.recommendations || '-')}</li>
                                  )}
                                </ul>
                              </div>
                              <div className="p-4 border border-amber-100 bg-amber-50 rounded-lg">
                                <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                                  <ShieldAlert className="h-4 w-4" /> Predictive Warning
                                </h4>
                                <p className="text-amber-900 text-sm">{insight.predictiveWarning}</p>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-6">
                              <Button
                                variant="outline"
                                onClick={() => handleReanalyze(insight)}
                                disabled={reanalyzingId === insight.id}
                                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                              >
                                <RefreshCw className={`mr-2 h-4 w-4 ${reanalyzingId === insight.id ? 'animate-spin' : ''}`} />
                                {reanalyzingId === insight.id ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ใหม่'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Pagination Controls */}
              {filteredInsights.length > 0 && (
                <div className="p-4 border-t flex items-center justify-between bg-white rounded-b-xl">
                  <div className="text-sm text-gray-500">
                    แสดง {startIndex + 1} ถึง {Math.min(startIndex + itemsPerPage, filteredInsights.length)} จาก {filteredInsights.length} รายการ
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      ก่อนหน้า
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage >= totalPages || totalPages === 0}
                    >
                      ถัดไป
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
