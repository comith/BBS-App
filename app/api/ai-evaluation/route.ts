import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// URL ของ Ollama Server ภายใน
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:14b';

// กรองอักษรต่างดาว (combining marks จากภาษาอื่น เช่น Arabic/Hebrew/Chinese) ที่ AI มักแทรกมาปนกับข้อความไทย
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { recordId, recordType, observedWork, departNotice, safetyCategory, subSafetyCategory, safeActionCount, unsafeActionCount, actionTypeUnsafe, forceReanalyze } = body;

    if (!recordId) {
      return NextResponse.json({ error: 'Missing recordId' }, { status: 400 });
    }

    // 1. ตรวจสอบว่ามีข้อมูล Insight ในระบบแล้วหรือยัง
    if (!forceReanalyze) {
      const existingInsight = await prisma.aiInsight.findFirst({
        where: recordType === 'SHE'
          ? { recordSheId: recordId }
          : { recordId: recordId },
      });

      // ถ้ามีแล้ว ส่งข้อมูลจาก Database กลับไปเลย (ลดการเรียก AI ซ้ำ)
      if (existingInsight) {
        return NextResponse.json(existingInsight);
      }
    }

    // ดึงข้อมูลจริงจากฐานข้อมูลเพื่อความถูกต้องแม่นยำ (ป้องกันการส่งฟิลด์ไม่ครบจาก Frontend)
    let dbRecord: any = null;
    try {
      if (recordType === 'SHE') {
        dbRecord = await prisma.recordShe.findUnique({
          where: { id: recordId }
        });
      } else {
        dbRecord = await prisma.record.findUnique({
          where: { id: recordId }
        });
      }
    } catch (dbErr) {
      console.error('Failed to query record from DB in ai-evaluation:', dbErr);
    }

    const finalObservedWork = dbRecord?.observedWork || observedWork || '-';
    const finalDepartNotice = dbRecord?.departNotice || departNotice || '-';
    const finalSafetyCategory = dbRecord?.safetyCategory || safetyCategory || '-';
    const finalSubSafetyCategory = dbRecord?.subSafetyCategory || subSafetyCategory || '-';
    const finalSafeActionCount = dbRecord?.safeActionCount ?? safeActionCount ?? 0;
    const finalUnsafeActionCount = dbRecord?.unsafeActionCount ?? unsafeActionCount ?? 0;
    const finalActionTypeUnsafe = dbRecord?.actionTypeUnsafe || actionTypeUnsafe || '-';

    // 2. ถ้ายังไม่มี ให้เตรียมข้อความส่งไปให้ Ollama AI
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
1. งานที่สังเกต: "${finalObservedWork}"
2. แผนกที่ถูกสังเกต: "${finalDepartNotice}"
3. หมวดหมู่หลักความปลอดภัย: "${finalSafetyCategory}"
4. หมวดหมู่ย่อย: "${finalSubSafetyCategory}"

[ข้อมูลพฤติกรรมและการจัดการ]
5. จำนวนพนักงานที่ปฏิบัติถูกต้อง (Safe Actions): ${finalSafeActionCount} คน
6. จำนวนพนักงานที่ปฏิบัติไม่ถูกต้อง (Unsafe Actions): ${finalUnsafeActionCount} คน
7. การดำเนินการเบื้องต้นของผู้แจ้ง (Action Taken): "${finalActionTypeUnsafe}"

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

    // 3. ส่ง Request ไปยัง AI Server (OpenAI Compatible)
    const response = await fetch(`${OLLAMA_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_HERMES_KEY || 'API_HERMES_KEY'}`,
        // 'X-Hermes-Session-Id': 'api-d8a144e45bfb7cd7' //ปิดเพราะ session มันบวมแล้วจะทำให้การติดต่อกับ ai ช้าขึ้น
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

    // 4. แปลงข้อความจาก AI เป็น JSON Object
    let insightData;
    try {
      insightData = JSON.parse(aiResponseText);
    } catch (parseError) {
      // ในกรณีที่โมเดลตอบกลับมามี Markdown ```json ... ``` ครอบอยู่
      const match = aiResponseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        insightData = JSON.parse(match[1]);
      } else {
        throw new Error('Failed to parse AI response as JSON: ' + aiResponseText);
      }
    }

    // 5. บันทึกผลลัพธ์ลง Database (ใช้ upsert เพื่อป้องกัน Race Condition จาก React Strict Mode)
    const whereClause = recordType === 'SHE'
      ? { recordSheId: recordId }
      : { recordId: recordId };

    const sanitizedData = sanitizeInsight(insightData);

    const insightPayload = {
      category: sanitizedData.category,
      severityScore: sanitizedData.ai_severity_score,
      rootCause: sanitizedData.root_cause_analysis,
      recommendations: sanitizedData.recommendations,
      predictiveWarning: sanitizedData.predictive_warning,
      ...(recordType === 'SHE' ? { recordSheId: recordId } : { recordId: recordId }),
    };

    const savedInsight = await prisma.aiInsight.upsert({
      where: whereClause,
      update: insightPayload,
      create: insightPayload,
    });

    return NextResponse.json(savedInsight);

  } catch (error: any) {
    console.error('AI Evaluation Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
