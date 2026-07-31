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

async function analyzeWithOllama(record: any) {
  const prompt = `
คุณคือผู้เชี่ยวชาญด้านความปลอดภัยและพฤติกรรมศาสตร์ในเหมืองแร่และโรงงานอุตสาหกรรมหนัก (Mining & Heavy Industry Safety Expert)
ระบบนี้คือระบบ BBSO (Behavior-Based Safety Observation - เพื่อนช่วยเตือนเพื่อน) ที่เน้นการสังเกตพฤติกรรมการทำงานในพื้นที่เสี่ยงสูง เช่น เหมืองแร่, Workshop, งานช่างกล, งานช่างเชื่อม, งานช่างไฟฟ้า และ Operator ประจำสายพานลำเลียง

กรุณาวิเคราะห์รายงานการสังเกตพฤติกรรมด้านความปลอดภัยต่อไปนี้ และสกัดข้อมูลออกมาเป็นรูปแบบ JSON เท่านั้น ห้ามมีข้อความอื่นปะปน

[คำสั่งเพิ่มเติมสำคัญมาก]
- ห้ามใช้ตัวอักษรภาษาจีน (Chinese Characters), ญี่ปุ่น, เกาหลี หรือภาษาอื่นๆ โดยเด็ดขาด!
- ให้ตอบกลับโดยใช้ "ภาษาไทย" เป็นหลัก และใช้ "ภาษาอังกฤษ" ได้เฉพาะคำศัพท์ทางเทคนิคเท่านั้น (เช่น LOTO, PPE, Safety)
- หากข้อมูลมีคำแปลกปลอม ให้คุณใช้คำภาษาไทยที่ถูกต้องแทนเสมอ

[กรณีพฤติกรรมปลอดภัย (Safe Actions > 0 และ Unsafe Actions = 0)]
- หากพบว่าไม่มีพนักงานทำผิดกฎเลย (Unsafe Actions = 0) แสดงว่าเป็นรายงาน "เชิงบวก" (Positive Observation)
- ให้ ai_severity_score เป็น 0
- root_cause_analysis: ให้วิเคราะห์ "ปัจจัยความสำเร็จ" (Success Factor) ที่ทำให้พนักงานทำงานได้ปลอดภัย (เช่น มีวินัย, เตรียมพร้อมดี)
- recommendations: แนะนำเพื่อ "รักษามาตรฐาน" และชื่นชม (Positive Reinforcement)
- predictive_warning: คาดการณ์เชิงบวก (เช่น "หากรักษามาตรฐานนี้ไว้ จะเป็นแบบอย่างที่ดีและเกิดวัฒนธรรมความปลอดภัยอย่างยั่งยืน")

[ข้อมูลการสังเกตการณ์]
1. งานที่สังเกต: "${record.observedWork || '-'}"
2. แผนกที่ถูกสังเกต: "${record.departNotice || '-'}"
3. หมวดหมู่หลักความปลอดภัย: "${record.safetyCategory || '-'}"
4. หมวดหมู่ย่อย: "${record.subSafetyCategory || '-'}"

[ข้อมูลพฤติกรรมและการจัดการ]
5. จำนวนพนักงานที่ปฏิบัติถูกต้อง (Safe Actions): ${record.safeActionCount || 0} คน
6. จำนวนพนักงานที่ปฏิบัติไม่ถูกต้อง (Unsafe Actions): ${record.unsafeActionCount || 0} คน
7. การดำเนินการเบื้องต้นของผู้แจ้ง (Action Taken): "${record.actionTypeUnsafe || '-'}"

[รูปแบบ JSON ที่ต้องการให้ตอบกลับ]
{
  "category": "หมวดหมู่ความเสี่ยง (ประเมินให้สอดคล้องกับ หมวดหมู่หลัก/ย่อย ที่ให้ไป เช่น การตัดแยกพลังงาน (LOTO), การทำงานบนที่สูง, ความร้อน/ประกายไฟ, เครื่องจักร/สายพาน ฯลฯ)",
  "ai_severity_score": ตัวเลขคะแนนความรุนแรงจาก 1.0 ถึง 10.0 (ประเมินจากโอกาสเกิดอุบัติเหตุร้ายแรงในเหมือง/โรงงาน หักลบด้วย การดำเนินการเบื้องต้น หากผู้แจ้งแก้ไขได้ดีความรุนแรงอาจลดลง),
  "root_cause_analysis": "อธิบายสาเหตุรากเหง้า (Root Cause) ที่คาดว่าทำให้พนักงานมีพฤติกรรม Unsafe Action สั้นๆ เป็นภาษาไทย (เช่น ความเร่งรีบ, ขาดความตระหนัก, หรือข้อจำกัดด้านเครื่องมือ)",
  "recommendations": [
    "ข้อเสนอแนะเชิงพฤติกรรมหรือวิศวกรรมที่ 1 (เน้นการป้องกันไม่ให้เกิดซ้ำ)",
    "ข้อเสนอแนะที่ 2 (การให้ความรู้ การฝึกอบรม หรือการปรับปรุงพื้นที่)",
    "ข้อเสนอแนะที่ 3"
  ],
  "predictive_warning": "คำเตือนล่วงหน้าหากพฤติกรรมหรือสภาพแวดล้อมนี้ยังดำเนินต่อไปในพื้นที่อุตสาหกรรมหนักนี้ (ภาษาไทย)"
}
`;

  const response = await fetch(`${OLLAMA_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.API_HERMES_KEY || 'API_HERMES_KEY'}`,
      // 'X-Hermes-Session-Id': 'api-d8a144e45bfb7cd7'  //ปิดเพราะ session มันบวมแล้วจะทำให้การติดต่อกับ ai ช้าขึ้น
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: 'user', content: prompt }]
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const aiResponseText = data.choices?.[0]?.message?.content || data.message?.content;

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

async function isOllamaOnline(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_URL}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.API_HERMES_KEY || 'API_HERMES_KEY'}`
      },
      signal: AbortSignal.timeout(2500),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 50; // จำนวนสูงสุดที่จะ process ต่อครั้ง

    // ตรวจสอบความพร้อมใช้งานของ Ollama AI Server
    const online = await isOllamaOnline();
    if (!online) {
      return NextResponse.json(
        { error: 'Ollama AI Server is offline or unreachable' },
        { status: 503 }
      );
    }

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
        safetyCategory: true,
        subSafetyCategory: true,
        safeActionCount: true,
        unsafeActionCount: true,
        actionTypeUnsafe: true,
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
        safetyCategory: true,
        subSafetyCategory: true,
        safeActionCount: true,
        unsafeActionCount: true,
        actionTypeUnsafe: true,
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
        const insightData = await analyzeWithOllama(record);

        // ใช้ sanitizeInsight เพื่อกรองตัวอักษรแปลกประหลาดที่หลุดมา (ถ้ามี)
        const sanitizedData = sanitizeInsight(insightData);

        await prisma.aiInsight.upsert({
          where: { recordId: record.id },
          update: {
            category: sanitizedData.category,
            severityScore: sanitizedData.ai_severity_score,
            rootCause: sanitizedData.root_cause_analysis,
            recommendations: sanitizedData.recommendations,
            predictiveWarning: sanitizedData.predictive_warning,
          },
          create: {
            recordId: record.id,
            category: sanitizedData.category,
            severityScore: sanitizedData.ai_severity_score,
            rootCause: sanitizedData.root_cause_analysis,
            recommendations: sanitizedData.recommendations,
            predictiveWarning: sanitizedData.predictive_warning,
          },
        });

        processed++;
        console.log(`✅ [BBS] Processed ${record.id} (${processed}/${batchTotal})`);
      } catch (err: any) {
        errors++;
        errorDetails.push(`BBS ${record.id}: ${err.message}`);
        console.error(`❌ [BBS] Error processing ${record.id}:`, err.message);

        // บันทึกสถานะการประมวลผลล้มเหลวเพื่อป้องกันการค้างในคิว
        try {
          await prisma.aiInsight.upsert({
            where: { recordId: record.id },
            update: {
              category: 'FAILED',
              severityScore: 0,
              rootCause: `Failed to analyze: ${err.message}`,
              recommendations: [],
              predictiveWarning: 'N/A',
            },
            create: {
              recordId: record.id,
              category: 'FAILED',
              severityScore: 0,
              rootCause: `Failed to analyze: ${err.message}`,
              recommendations: [],
              predictiveWarning: 'N/A',
            },
          });
        } catch (dbErr: any) {
          console.error(`❌ [BBS] Failed to write fallback error status for ${record.id}:`, dbErr.message);
        }
      }
    }

    // 4. ประมวลผล SHE Records
    for (const record of unprocessedSHE) {
      try {
        const insightData = await analyzeWithOllama(record);

        // ใช้ sanitizeInsight เพื่อกรองตัวอักษรแปลกประหลาดที่หลุดมา (ถ้ามี)
        const sanitizedData = sanitizeInsight(insightData);

        await prisma.aiInsight.upsert({
          where: { recordSheId: record.id },
          update: {
            category: sanitizedData.category,
            severityScore: sanitizedData.ai_severity_score,
            rootCause: sanitizedData.root_cause_analysis,
            recommendations: sanitizedData.recommendations,
            predictiveWarning: sanitizedData.predictive_warning,
          },
          create: {
            recordSheId: record.id,
            category: sanitizedData.category,
            severityScore: sanitizedData.ai_severity_score,
            rootCause: sanitizedData.root_cause_analysis,
            recommendations: sanitizedData.recommendations,
            predictiveWarning: sanitizedData.predictive_warning,
          },
        });

        processed++;
        console.log(`✅ [SHE] Processed ${record.id} (${processed}/${batchTotal})`);
      } catch (err: any) {
        errors++;
        errorDetails.push(`SHE ${record.id}: ${err.message}`);
        console.error(`❌ [SHE] Error processing ${record.id}:`, err.message);

        // บันทึกสถานะการประมวลผลล้มเหลวเพื่อป้องกันการค้างในคิว
        try {
          await prisma.aiInsight.upsert({
            where: { recordSheId: record.id },
            update: {
              category: 'FAILED',
              severityScore: 0,
              rootCause: `Failed to analyze: ${err.message}`,
              recommendations: [],
              predictiveWarning: 'N/A',
            },
            create: {
              recordSheId: record.id,
              category: 'FAILED',
              severityScore: 0,
              rootCause: `Failed to analyze: ${err.message}`,
              recommendations: [],
              predictiveWarning: 'N/A',
            },
          });
        } catch (dbErr: any) {
          console.error(`❌ [SHE] Failed to write fallback error status for ${record.id}:`, dbErr.message);
        }
      }
    }

    // คำนวณจำนวนที่เหลือจริงๆ หลังจากการรันรอบนี้ (ลบรายการที่เพิ่งทำสำเร็จหรือล้มเหลวออกไป)
    const postPendingBBS = await prisma.record.count({
      where: {
        aiInsight: null,
        observedWork: { not: null },
      }
    });
    const postPendingSHE = await prisma.recordShe.count({
      where: {
        aiInsight: null,
        observedWork: { not: null },
      }
    });

    return NextResponse.json({
      message: `ประมวลผลเสร็จสิ้น (สำเร็จ ${processed} รายการ, ล้มเหลว ${errors} รายการ)`,
      processed,
      errors,
      totalPending: postPendingBBS + postPendingSHE,
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
    });

  } catch (error: any) {
    console.error('Batch Process Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
