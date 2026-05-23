import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// URL ของ Ollama Server ภายใน
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:14b';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { recordId, recordType, observedWork, departNotice, forceReanalyze } = body;

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

    // 2. ถ้ายังไม่มี ให้เตรียมข้อความส่งไปให้ Ollama AI
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

    // 3. ส่ง Request ไปยัง Ollama
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        format: 'json', // บังคับให้ตอบเป็น JSON (ฟีเจอร์ของ Ollama สำหรับบางโมเดล)
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponseText = data.message.content;

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

    const insightPayload = {
      category: insightData.category,
      severityScore: insightData.ai_severity_score,
      rootCause: insightData.root_cause_analysis,
      recommendations: insightData.recommendations,
      predictiveWarning: insightData.predictive_warning,
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
