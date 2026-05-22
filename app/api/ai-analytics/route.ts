import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. ดึงข้อมูล AI Insights ทั้งหมด พร้อม Record/RecordShe
    const allInsights = await prisma.aiInsight.findMany({
      include: {
        record: { select: { id: true, date: true, observedWork: true, employeeId: true, departNotice: true } },
        recordShe: { select: { id: true, date: true, observedWork: true, employeeId: true, group: true, departNotice: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. ดึง Records ทั้งหมด (ทั้ง BBS และ SHE) เพื่อนับจำนวนรวม
    const [totalRecords, totalRecordsShe] = await Promise.all([
      prisma.record.count(),
      prisma.recordShe.count(),
    ]);

    // 3. คำนวณ KPIs
    const totalProcessed = allInsights.length;
    const totalReports = totalRecords + totalRecordsShe;
    const avgSeverity = totalProcessed > 0
      ? allInsights.reduce((sum, i) => sum + (i.severityScore || 0), 0) / totalProcessed
      : 0;

    // 4. หาแผนกที่มีความเสี่ยงสูงสุด
    const groupRiskMap: Record<string, { totalScore: number; count: number }> = {};
    allInsights.forEach((insight) => {
      let group = insight.recordShe?.departNotice || insight.record?.departNotice || 'ไม่ระบุแผนก';
      // Clean up the string if it's empty or whitespace
      if (group.trim() === '') group = 'ไม่ระบุแผนก';
      if (!groupRiskMap[group]) {
        groupRiskMap[group] = { totalScore: 0, count: 0 };
      }
      groupRiskMap[group].totalScore += insight.severityScore || 0;
      groupRiskMap[group].count += 1;
    });

    const departmentRisk = Object.entries(groupRiskMap)
      .map(([name, data]) => ({
        name,
        riskLevel: Math.round((data.totalScore / data.count) * 10),
        incidentCount: data.count,
      }))
      .sort((a, b) => b.riskLevel - a.riskLevel)
      .slice(0, 5);

    const topRiskArea = departmentRisk.length > 0 ? departmentRisk[0].name : 'N/A';

    // 5. จัดกลุ่มตาม Category
    const categoryMap: Record<string, number> = {};
    allInsights.forEach((insight) => {
      const cat = insight.category || 'Uncategorized';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    const COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899', '#14b8a6'];
    const sortedCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
    const topCategories = sortedCategories.slice(0, 6);
    const othersCount = sortedCategories.slice(6).reduce((sum, [_, count]) => sum + count, 0);

    const categoryDistribution = topCategories.map(([name, value], idx) => ({
      name,
      value: value, // Raw count
      percentOfTotal: Math.round((value / totalProcessed) * 100) || 0,
      color: COLORS[idx % COLORS.length],
    }));

    if (othersCount > 0) {
      categoryDistribution.push({
        name: 'อื่นๆ',
        value: othersCount,
        percentOfTotal: Math.round((othersCount / totalProcessed) * 100) || 0,
        color: '#94a3b8', // slate-400
      });
    }

    // 6. สรุป Root Cause ที่พบบ่อย (สกัดจากข้อความ)
    // จะเก็บ rootCause ทุกอันแล้วจัดกลุ่มคร่าวๆ ตาม keyword
    const rootCauseKeywords = [
      { key: 'ความเคยชิน', label: 'พฤติกรรมความเคยชิน (Shortcut)' },
      { key: 'อบรม', label: 'ขาดความรู้/การอบรม (Lack of training)' },
      { key: 'อุปกรณ์', label: 'อุปกรณ์ไม่พร้อมใช้งาน (Defective tools)' },
      { key: 'สภาพแวดล้อม', label: 'สภาพแวดล้อมไม่เหมาะสม (Poor environment)' },
      { key: 'ขาดการตรวจสอบ', label: 'ขาดการตรวจสอบ/กำกับดูแล (Lack of supervision)' },
    ];

    const rootCauseCount: Record<string, number> = {};
    allInsights.forEach((insight) => {
      const text = insight.rootCause || '';
      let matched = false;
      for (const kw of rootCauseKeywords) {
        if (text.includes(kw.key)) {
          rootCauseCount[kw.label] = (rootCauseCount[kw.label] || 0) + 1;
          matched = true;
          break;
        }
      }
      if (!matched) {
        rootCauseCount['อื่นๆ (Others)'] = (rootCauseCount['อื่นๆ (Others)'] || 0) + 1;
      }
    });

    const topRootCauses = Object.entries(rootCauseCount)
      .map(([cause, count]) => ({
        cause,
        percentage: totalProcessed > 0 ? Math.round((count / totalProcessed) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    // 7. สรุปเทรนด์รายเดือน (จากวันที่ใน record)
    const monthlyMap: Record<string, { count: number; totalSeverity: number }> = {};
    allInsights.forEach((insight) => {
      const dateStr = insight.recordShe?.date || insight.record?.date;
      if (!dateStr) return;
      try {
        const d = new Date(dateStr);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { count: 0, totalSeverity: 0 };
        }
        monthlyMap[monthKey].count += 1;
        monthlyMap[monthKey].totalSeverity += insight.severityScore || 0;
      } catch {}
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const predictiveTrends = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, data]) => {
        const month = parseInt(key.split('-')[1]) - 1;
        return {
          month: monthNames[month],
          actual: data.count,
          predicted: null,
          riskScore: data.totalSeverity / data.count,
        };
      });

    const recentInsights = allInsights.map(insight => ({
      id: insight.id,
      category: insight.category || 'N/A',
      severityScore: insight.severityScore || 0,
      rootCause: insight.rootCause || '-',
      recommendations: insight.recommendations || [],
      predictiveWarning: insight.predictiveWarning || '-',
      createdAt: insight.createdAt,
      recordDate: insight.record?.date || insight.recordShe?.date || '-',
      employeeId: insight.record?.employeeId || insight.recordShe?.employeeId || '-',
      group: insight.recordShe?.group || insight.record?.departNotice || '-',
      observedWork: insight.record?.observedWork || insight.recordShe?.observedWork || '-',
    }));

    return NextResponse.json({
      kpis: {
        aiRiskIndex: Number(avgSeverity.toFixed(1)),
        totalProcessed,
        totalReports,
        topRiskArea,
      },
      predictiveTrends,
      categoryDistribution,
      departmentRisk,
      topRootCauses,
      recentInsights,
    });

  } catch (error: any) {
    console.error('AI Analytics API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
