const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:14b';

async function analyzeWithOllama(record) {
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

  console.log("Sending prompt to Ollama...");
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
  console.log("Raw AI response length:", aiResponseText.length);
  console.log("Raw AI response snippet:", aiResponseText.substring(0, 500));

  let insightData;
  try {
    insightData = JSON.parse(aiResponseText);
    console.log("Parsed JSON successfully");
  } catch (e) {
    const match = aiResponseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      insightData = JSON.parse(match[1]);
      console.log("Parsed JSON from markdown successfully");
    } else {
      throw new Error('Failed to parse AI response as JSON: ' + aiResponseText);
    }
  }

  return insightData;
}

async function main() {
  const unprocessedBBS = await prisma.record.findMany({
    where: {
      aiInsight: null,
      observedWork: { not: null },
    },
    take: 5,
    orderBy: { createdAt: 'desc' },
  });
  
  console.log(`Found ${unprocessedBBS.length} unprocessed records`);
  
  for (const record of unprocessedBBS) {
    console.log("Testing record ID:", record.id);
    console.log("observedWork:", record.observedWork);
    try {
      await analyzeWithOllama(record);
    } catch (e) {
      console.error("Error analyzing:", e.message);
    }
    console.log("-------------------");
  }
}
main().finally(() => prisma.$disconnect());
