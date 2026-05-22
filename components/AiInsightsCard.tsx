"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BrainCircuit, AlertTriangle, Lightbulb, Activity, CheckCircle2, RefreshCw } from "lucide-react";

// Types for AI Insight Data
export interface AiInsightData {
  category: string;
  ai_severity_score: number; // 0 to 10
  root_cause_analysis: string;
  recommendations: string[];
  predictive_warning: string;
}

interface AiInsightsCardProps {
  recordId: string;
  recordType: 'SHE' | 'BBS';
  reportText: string;
  departmentNotice: string;
}

export function AiInsightsCard({ recordId, recordType, reportText, departmentNotice }: AiInsightsCardProps) {
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<AiInsightData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // ยกเลิก request ก่อนหน้า (ป้องกัน React Strict Mode ยิงซ้ำ)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchInsight = async () => {
      if (!recordId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch('/api/ai-evaluation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recordId,
            recordType,
            observedWork: reportText,
            departNotice: departmentNotice
          }),
          signal: controller.signal,
        });
        
        if (!res.ok) {
          throw new Error('Failed to analyze with AI');
        }
        
        const data = await res.json();
        
        // ตรวจสอบว่ายังไม่ถูก abort ก่อน setState
        if (!controller.signal.aborted) {
          setInsight({
            category: data.category || 'Uncategorized',
            ai_severity_score: data.severityScore || 0,
            root_cause_analysis: data.rootCause || 'N/A',
            recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
            predictive_warning: data.predictiveWarning || ''
          });
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return; // ไม่ต้องแสดง error ถ้าเป็นการยกเลิก
        console.error('Error fetching AI insight:', err);
        if (!controller.signal.aborted) {
          setError(err.message || 'Error occurred');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchInsight();

    return () => {
      controller.abort();
    };
  }, [recordId, recordType, reportText, departmentNotice]);

  if (loading) {
    return (
      <Card className="border-indigo-100 shadow-sm bg-indigo-50/30">
        <CardContent className="p-8 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
          <p className="text-sm font-medium text-indigo-700 animate-pulse">
            AI กำลังวิเคราะห์ข้อความรายงาน...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-100 shadow-sm bg-red-50/30">
        <CardContent className="p-6 flex flex-col items-center justify-center space-y-2">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <p className="text-sm font-medium text-red-700 text-center">
            ไม่สามารถติดต่อ AI Server ได้
          </p>
          <p className="text-xs text-red-500 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!insight) return null;

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-rose-600 bg-rose-100 border-rose-200";
    if (score >= 5) return "text-amber-600 bg-amber-100 border-amber-200";
    return "text-emerald-600 bg-emerald-100 border-emerald-200";
  };

  const getProgressColor = (score: number) => {
    if (score >= 8) return "bg-rose-500";
    if (score >= 5) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <Card className="border-indigo-100 shadow-md overflow-hidden relative">
      {/* Decorative top border */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
      
      <CardHeader className="bg-slate-50 border-b pb-4 pt-5">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
              <BrainCircuit className="h-5 w-5 text-indigo-600" />
              AI Insights
              <Badge variant="outline" className="ml-2 text-xs bg-white text-indigo-600 border-indigo-200">
                Automated Analysis
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              ผลการประเมินจากระบบ AI โดยวิเคราะห์จากข้อความที่พนักงานแจ้ง
            </CardDescription>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-500 font-medium mb-1">AI Severity Score</span>
            <Badge className={`text-sm px-3 py-1 font-bold ${getScoreColor(insight.ai_severity_score)} hover:${getScoreColor(insight.ai_severity_score)}`}>
              {insight.ai_severity_score} / 10
            </Badge>
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-3">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full ${getProgressColor(insight.ai_severity_score)}`} 
              style={{ width: `${(insight.ai_severity_score / 10) * 100}%` }}
            ></div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-b">
          
          {/* Left Column */}
          <div className="p-5 space-y-5">
            <div>
              <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-blue-500" />
                Category (จัดหมวดหมู่โดย AI)
              </h4>
              <p className="text-sm text-gray-900 font-medium bg-blue-50 text-blue-800 py-1.5 px-3 rounded-md inline-block">
                {insight.category}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                Root Cause Analysis (สาเหตุที่แท้จริง)
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed bg-slate-50 p-3 rounded-lg border">
                {insight.root_cause_analysis}
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="p-5 space-y-5">
            <div>
              <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Actionable Recommendations
              </h4>
              <ul className="space-y-2">
                {insight.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 bg-amber-50/50 p-2 rounded-md">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {insight.ai_severity_score >= 6 && (
              <div className="bg-rose-50 border border-rose-100 rounded-lg p-3">
                <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Predictive Warning
                </h4>
                <p className="text-sm text-rose-700 font-medium">
                  {insight.predictive_warning}
                </p>
              </div>
            )}
          </div>
          
        </div>
      </CardContent>
    </Card>
  );
}
