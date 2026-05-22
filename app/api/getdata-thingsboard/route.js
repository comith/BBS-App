import { NextResponse } from 'next/server'

export async function GET(request) {
    const TB_HOST = "https://iot.ith.co.th";
    
    // ดึงค่า deviceId จาก Query Parameter ถ้าไม่มีให้เอาค่า Default (สำนักงานใหญ่)
    const { searchParams } = new URL(request.url);
    const DEVICE_ID = searchParams.get('deviceId') || "d26d5f60-a302-11ef-a358-3ba4df6c3d74";

    try {
        // --- สเต็ปที่ 1: Login ไปเอา Token ---
        const loginResponse = await fetch(`${TB_HOST}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "username": "computer@ith.co.th",
                "password": "iot4ITH2025"
            })
        });

        const loginData = await loginResponse.json();
        const token = loginData.token; // ได้กุญแจมาแล้ว!

        // --- สเต็ปที่ 2: เอา Token ไปดึงค่าฝุ่นล่าสุด ---
        const dataResponse = await fetch(`${TB_HOST}/api/plugins/telemetry/DEVICE/${DEVICE_ID}/values/timeseries`, {
            method: 'GET',
            headers: {
                'X-Authorization': `Bearer ${token}` // แนบกุญแจไปด้วย
            }
        });

        const dustData = await dataResponse.json();

        // --- นำค่าไปใช้งานต่อ ---
        // const currentPM25 = dustData.pm25[0].value;
        console.log("ข้อมูลที่ได้: ", dustData);

        return NextResponse.json(dustData);
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
        return NextResponse.json({ message: 'Error getting data' }, { status: 500 });
    }
}