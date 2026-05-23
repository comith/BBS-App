import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:14b';

// กรองอักษรต่างดาว (combining marks จากภาษาอื่น เช่น Arabic/Hebrew) ที่ AI มักแทรกมาปนกับข้อความไทย
// เก็บเฉพาะ: Thai block (U+0E00-U+0E7F), ASCII printable, Latin-1 Supplement, whitespace
function sanitizeText(text: unknown): any {
  if (typeof text !== 'string') return text;
  return text
    .normalize('NFC')
    .replace(/[^฀-๿ -~ -ÿ\n\r\t]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function sanitizeInsight(insight: any) {
  return {
    category: sanitizeText(insight.category),
    ai_severity_score: typeof insight.ai_severity_score === 'number'
      ? insight.ai_severity_score
      : parseFloat(insight.ai_severity_score) || 0,
    root_cause_analysis: sanitizeText(insight.root_cause_analysis),
    recommendations: Array.isArray(insight.recommendations)
      ? insight.recommendations.map(sanitizeText).filter((s: string) => s && s.length > 0)
      : [],
    predictive_warning: sanitizeText(insight.predictive_warning),
  };
}

async function analyzeWithOllama(observedWork: string, departNotice: string) {
  const prompt = `
คุณคือผู้เชี่ยวชาญด้านความปลอดภัยในโรงงานอุตสาหกรรม (Safety Officer Expert)
กรุณาวิเคราะห์ข้อความรายงานปัญหาด้านความปลอดภัยต่อไปนี้ และสกัดข้อมูลออกมาเป็นรูปแบบ JSON เท่านั้น ห้ามมีข้อความอื่นปะปน

ข้อมูลจากพนักงาน: "${observedWork || '-'}"
ข้อสังเกตเพิ่มเติมจากแผนก: "${departNotice || '-'}"

รูปแบบ JSON ที่ต้องการ:
{
  "category": "ชื่อหมวดหมู่ปัญหา (เช่น Ergonomics, PPE, Electrical, Housekeeping, etc.)",
  "ai_severity_score": ตัวเลขคะแนนความรุนแรงจาก 1.0 ถึง 10.0 (ประเมินความเสี่ยงต่อชีวิตและทรัพย์สิน),
  "root_cause_analysis": "อธิบายสาเหตุที่แท้จริงที่ทำให้เกิดปัญหานี้สั้นๆ (ภาษาไทย)",
  "recommendations": ["ข้อเสนอแนะที่ 1", "ข้อเสนอแนะที่ 2", "ข้อเสนอแนะที่ 3"],
  "predictive_warning": "คำเตือนล่วงหน้าหากปล่อยปัญหานี้ทิ้งไว้ (ภาษาไทย)"
}
`;

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      format: 'json',
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`);
  }

  const data = await response.json();
  const aiResponseText = data.message.content;

  let insightData;
  try {
    insightData = JSON.parse(aiResponseText);
  } catch {
    const match = aiResponseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      insightData = JSON.parse(match[1]);
    } else {
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  return insightData;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 50; // จำนวนสูงสุดที่จะ process ต่อครั้ง

    // 1. หา Records ของพนักงานทั่วไป (BBS) ที่ยังไม่มี AI Insight
    const unprocessedBBS = await prisma.record.findMany({
      where: {
        aiInsight: null,
        observedWork: { not: null },
      },
      select: {
        id: true,
        observedWork: true,
        departNotice: true,
      },
      take: Math.ceil(limit / 2),
      orderBy: { createdAt: 'desc' },
    });

    // 2. หา Records ของเจ้าหน้าที่ SHE ที่ยังไม่มี AI Insight
    const unprocessedSHE = await prisma.recordShe.findMany({
      where: {
        aiInsight: null,
        observedWork: { not: null },
      },
      select: {
        id: true,
        observedWork: true,
        departNotice: true,
      },
      take: Math.ceil(limit / 2),
      orderBy: { createdAt: 'desc' },
    });

    const pendingBBSCount = await prisma.record.count({
      where: {
        aiInsight: null,
        observedWork: { not: null },
      }
    });

    const pendingSHECount = await prisma.recordShe.count({
      where: {
        aiInsight: null,
        observedWork: { not: null },
      }
    });

    const totalPending = pendingBBSCount + pendingSHECount;
    const batchTotal = unprocessedBBS.length + unprocessedSHE.length;

    if (totalPending === 0) {
      return NextResponse.json({
        message: 'ไม่มีรายงานที่ต้องวิเคราะห์เพิ่มเติม (ทุกรายงานถูก AI ประมวลผลหมดแล้ว)',
        processed: 0,
        errors: 0,
        totalPending: 0
      });
    }

    let processed = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    // 3. ประมวลผล BBS Records
    for (const record of unprocessedBBS) {
      try {
        const insightData = await analyzeWithOllama(
          record.observedWork || '',
          record.departNotice || ''
        );

        await prisma.aiInsight.upsert({
          where: { recordId: record.id },
          update: {
            category: insightData.category,
            severityScore: insightData.ai_severity_score,
            rootCause: insightData.root_cause_analysis,
            recommendations: insightData.recommendations,
            predictiveWarning: insightData.predictive_warning,
          },
          create: {
            recordId: record.id,
            category: insightData.category,
            severityScore: insightData.ai_severity_score,
            rootCause: insightData.root_cause_analysis,
            recommendations: insightData.recommendations,
            predictiveWarning: insightData.predictive_warning,
          },
        });

        processed++;
        console.log(`✅ [BBS] Processed ${record.id} (${processed}/${batchTotal})`);
      } catch (err: any) {
        errors++;
        errorDetails.push(`BBS ${record.id}: ${err.message}`);
        console.error(`❌ [BBS] Error processing ${record.id}:`, err.message);
      }
    }

    // 4. ประมวลผล SHE Records
    for (const record of unprocessedSHE) {
      try {
        const insightData = await analyzeWithOllama(
          record.observedWork || '',
          record.departNotice || ''
        );

        await prisma.aiInsight.upsert({
          where: { recordSheId: record.id },
          update: {
            category: insightData.category,
            severityScore: insightData.ai_severity_score,
            rootCause: insightData.root_cause_analysis,
            recommendations: insightData.recommendations,
            predictiveWarning: insightData.predictive_warning,
          },
          create: {
            recordSheId: record.id,
            category: insightData.category,
            severityScore: insightData.ai_severity_score,
            rootCause: insightData.root_cause_analysis,
            recommendations: insightData.recommendations,
            predictiveWarning: insightData.predictive_warning,
          },
        });

        processed++;
        console.log(`✅ [SHE] Processed ${record.id} (${processed}/${batchTotal})`);
      } catch (err: any) {
        errors++;
        errorDetails.push(`SHE ${record.id}: ${err.message}`);
        console.error(`❌ [SHE] Error processing ${record.id}:`, err.message);
      }
    }

    return NextResponse.json({
      message: `ประมวลผลเสร็จสิ้น`,
      processed,
      errors,
      totalPending,
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
    });

  } catch (error: any) {
    console.error('Batch Process Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
