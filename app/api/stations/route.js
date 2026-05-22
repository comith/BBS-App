// app/api/stations/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function initDefaultStations() {
    try {
        const count = await prisma.weatherStation.count();
        if (count === 0) {
            const defaultStations = [
                {
                    id: "tb-hq",
                    name: "ITH HQ Station (สำนักงานใหญ่)",
                    desc: "สถานีติดตั้งหลัก ณ ตึกสำนักงาน ITH",
                    active: true,
                    deviceId: "d26d5f60-a302-11ef-a358-3ba4df6c3d74",
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
                        wifiPowerSaveLabel: "โหมด Power Save"
                    }
                },
                {
                    id: "st-02",
                    name: "Station 02 (โรงพยาบาลสนาม)",
                    desc: "เตรียมเปิดให้บริการติดตั้งในเฟสถัดไป",
                    active: false,
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
                        wifiPowerSaveLabel: "โหมด Power Save"
                    }
                }
            ];

            for (const item of defaultStations) {
                await prisma.weatherStation.create({
                    data: item
                });
            }
            console.log("[stations-seeder] Seeded default stations into PostgreSQL successfully.");
        }
    } catch (e) {
        console.error("[stations-seeder] Error seeding default stations:", e);
    }
}

export async function GET() {
    try {
        await initDefaultStations();
        const stations = await prisma.weatherStation.findMany({
            orderBy: {
                createdAt: 'asc'
            }
        });
        return NextResponse.json(stations);
    } catch (error) {
        console.error("Error reading stations from database:", error);
        return NextResponse.json({ message: 'Error reading stations' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json(); // array of Stations
        if (!Array.isArray(data)) {
            return NextResponse.json({ message: 'Data must be an array of stations' }, { status: 400 });
        }

        const ids = data.map(s => s.id);

        // Run transaction to keep the DB perfectly synced with the dashboard list
        const result = await prisma.$transaction(async (tx) => {
            // 1. Delete stations that are no longer in the updated list
            await tx.weatherStation.deleteMany({
                where: {
                    id: {
                        notIn: ids
                    }
                }
            });

            // 2. Upsert (update or create) all items in the updated list
            const upserted = [];
            for (const item of data) {
                const s = await tx.weatherStation.upsert({
                    where: { id: item.id },
                    create: {
                        id: item.id,
                        name: item.name,
                        desc: item.desc || "",
                        active: item.active !== undefined ? item.active : true,
                        deviceId: item.deviceId || "",
                        config: item.config || {}
                    },
                    update: {
                        name: item.name,
                        desc: item.desc || "",
                        active: item.active !== undefined ? item.active : true,
                        deviceId: item.deviceId || "",
                        config: item.config || {}
                    }
                });
                upserted.push(s);
            }
            return upserted;
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("Error saving stations to database:", error);
        return NextResponse.json({ message: 'Error saving stations' }, { status: 500 });
    }
}
