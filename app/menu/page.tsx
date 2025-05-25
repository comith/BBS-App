"use client";
import React, { useState } from "react";
import { SquareUser } from "lucide-react";
import { useRouter,useSearchParams } from "next/navigation";
import { employeeData } from "../form/form-data";

function ModernBBSLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("employeeId") || "";

  interface FormData {
    employeerId: string;
    fullName: string;
    department: string;
    group: string;
  }

  const [formData, setFormData] = useState<FormData>({
    employeerId: "",
    fullName: "",
    department: "",
    group: "",
  });

interface Employee {
    employeerId: string;
    fullName: string;
    department: string | number;
    group: string;
}

interface InputChangeEvent extends React.ChangeEvent<HTMLInputElement> {}

const findEmployeeData = (id: string) => {
    const employee: Employee | undefined = employeeData.find(
        (emp: Employee) => emp.employeerId === id
    );
    if (employee) {
        setFormData((prev: FormData) => ({
            ...prev,
            fullName: employee.fullName,
            department: String(employee.department),
            group: employee.group || "", // Assuming group is optional
        }));
    } else {
        setFormData((prev: FormData) => ({
            ...prev,
            fullName: "",
            department: "",
            group: "",
        }));
    }
};


  const handleInputChange = (e: InputChangeEvent) => {
    const { name, value } = e.target;
    setFormData((prev: FormData) => ({
      ...prev,
      [name]: value,
    }));
    if (name === "employeerId" && value.length >= 8) {
      findEmployeeData(value);
    } else {
      setFormData((prev: FormData) => ({
        ...prev,
        fullName: "",
        department: "",
        group: "",
      }));
    }
  };


  React.useEffect(() => {
    if (employeeId.length >= 8) {
      setFormData((prev: FormData) => ({
        ...prev,
        employeerId: employeeId,
      }));

      findEmployeeData(employeeId);
    }
  }, [employeeId]);

  

  return (
    <div className="min-h-screen flex">
      {/* Left side - Abstract Design */}
      <div className="w-full xl:w-1/2 relative overflow-hidden hidden xl:block">
        {/* Background gradient */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/img/bg_login.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>

        {/* Abstract shapes and patterns */}
        <div className="absolute inset-0">
          {/* Large wave shapes */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 800 600"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient
                id="waveGrad1"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  style={{ stopColor: "rgba(255,255,255,0.1)", stopOpacity: 1 }}
                />
                <stop
                  offset="100%"
                  style={{
                    stopColor: "rgba(255,255,255,0.05)",
                    stopOpacity: 1,
                  }}
                />
              </linearGradient>
              <linearGradient
                id="waveGrad2"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  style={{
                    stopColor: "rgba(255,255,255,0.08)",
                    stopOpacity: 1,
                  }}
                />
                <stop
                  offset="100%"
                  style={{
                    stopColor: "rgba(255,255,255,0.03)",
                    stopOpacity: 1,
                  }}
                />
              </linearGradient>
            </defs>

            {/* Wave path 1 */}
            <path
              d="M0,200 Q200,100 400,150 T800,120 L800,0 L0,0 Z"
              fill="url(#waveGrad1)"
            />

            {/* Wave path 2 */}
            <path
              d="M0,300 Q300,200 600,250 T800,230 L800,0 L0,0 Z"
              fill="url(#waveGrad2)"
            />

            {/* Wave path 3 */}
            <path
              d="M0,450 Q150,350 300,400 Q450,450 600,400 Q700,370 800,390 L800,600 L0,600 Z"
              fill="url(#waveGrad1)"
            />

            {/* Floating circles */}
            <circle cx="150" cy="120" r="60" fill="rgba(255,255,255,0.1)" />
            <circle cx="650" cy="80" r="40" fill="rgba(255,255,255,0.08)" />
            <circle cx="100" cy="450" r="25" fill="rgba(255,255,255,0.12)" />
            <circle cx="700" cy="500" r="35" fill="rgba(255,255,255,0.1)" />
            <circle cx="400" cy="350" r="15" fill="rgba(255,255,255,0.15)" />
            <circle cx="200" cy="300" r="20" fill="rgba(255,255,255,0.1)" />

            {/* Small dots */}
            <circle cx="300" cy="150" r="5" fill="rgba(255,255,255,0.2)" />
            <circle cx="500" cy="200" r="3" fill="rgba(255,255,255,0.25)" />
            <circle cx="600" cy="300" r="4" fill="rgba(255,255,255,0.2)" />
            <circle cx="150" cy="350" r="6" fill="rgba(255,255,255,0.18)" />
            <circle cx="750" cy="200" r="4" fill="rgba(255,255,255,0.22)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-[100vh] p-8">
          {/* Top section */}
          <div className="flex flex-row gap-3">
            <img
              src="/img/ith.png"
              alt="Logo"
              className="w-32 h-32 translate-y-[-5px]"
            />

            <div className="flex flex-col">
              <div className="flex flex-row gap-3">
                <span className="text-orange-400 text-[40px] text-shadow-2xs font-medium tracking-wider">
                  Behavior
                </span>
                <span className="text-blue-600 text-[40px] text-shadow-2xs font-medium tracking-wider">
                  Base
                </span>
                <span className="text-blue-600 text-[40px] text-shadow-2xs font-medium tracking-wider">
                  Safety
                </span>
              </div>
              <span className="text-slate-400 text-[26px] text-shadow-2xs font-medium tracking-wider">
                ความปลอดภัย เริ่มต้นที่พฤติกรรม
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="w-full xl:w-1/2 flex items-center justify-center bg-gray-50 py-4 h-full overflow-auto">
        <div className="-full mx-8 flex gap-4 flex-col ">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Behavior Base Safety (BBS)
              </h2>
              คือการจัดการพฤติกรรมเสี่ยง{" "}
              <b className="text-orange-500">เพื่อสร้างพฤติกรรมที่ปลอดภัย </b>
              โดยไม่ต้องการให้พนักงานได้รับบาดเจ็บเพื่อปรับเปลี่ยนพฤติกรรมเสี่ยงให้เป็นพฤติกรรมที่ปลอดภัย
              ซึ่งอาศัยความร่วมมือของพนักงานทุกคน จนเกิดเป็น{" "}
              <b className="text-orange-500">วัฒนธรรมความปลอดภัยในองค์กร</b>
              <br />
              <br />
              <b className="text-orange-500 text-[18px] md:text-[17px]">
                BBS ทำอะไร?
              </b>
              <div className="pl-4 gap-2 flex flex-col mt-2">
                <li>
                  <b className="text-orange-500 text-[18px]">
                    เน้นพฤติกรรม BBS
                  </b>{" "}
                  ไม่ได้รอให้เกิดอุบัติเหตุแล้วค่อยมาแก้ไข
                  แต่จะเข้าไปสังเกตและปรับเปลี่ยนพฤติกรรมที่เสี่ยงต่อการเกิดอุบัติเหตุตั้งแต่เนิ่นๆ
                </li>
                <li>
                  <b className="text-orange-500 text-[18px] md:text-[17px]">
                    ทุกคนมีส่วนร่วม
                  </b>{" "}
                  ทุกคนในองค์กร ไม่ว่าจะเป็นพนักงาน ผู้จัดการ หรือเจ้าของกิจการ
                  ต่างมีส่วนร่วมในการสังเกตและปรับปรุงพฤติกรรมของตนเองและผู้อื่น
                </li>
                <li>
                  <b className="text-orange-500 text-[18px] md:text-[17px]">
                    วัดผลได้
                  </b>{" "}
                  BBS มีวิธีการวัดผลที่ชัดเจน
                  ทำให้เราสามารถเห็นผลลัพธ์และปรับปรุงแนวทางได้อย่างต่อเนื่อง
                </li>
              </div>
            </div>
          </div>
          {/* Button select menu */}
          <div className="bg-white rounded-2xl shadow-xl p-4 w-full mb-4">
            <div className="flex items-center mb-4">
              <SquareUser className="w-6 h-6 text-gray-500 mr-2" />
              <span className="text-gray-700 font-medium">
                กรอกรหัสพนักงานเพื่อเริ่มใช้งาน{" "}
                {<RequiredMark />}
              </span>
            </div>
            <input
              type="text"
              name="employeerId"
              value={formData.employeerId}
              onChange={handleInputChange}
              placeholder="กรอกรหัสพนักงาน เช่น 5LD01234"
              className="w-full px-4 py-4 border-l-4 border-blue-500 bg-gray-50 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
            />
          </div>
          {formData.employeerId.length >= 8 && (
            <div className="flex flex-row ite gap-4 w-full max-w-md pb-4">
              <div
                className="bg-white flex flex-col justify-center rounded-2xl shadow-xl p-4 w-1/2 hover:scale-105 transition-transform duration-200 hover:cursor-pointer"
                onClick={() => {
                  const params = new URLSearchParams({
                    employeeId: formData.employeerId,
                    fullName: formData.fullName,
                    department: formData.department,
                    group: formData.group,
                  }).toString();
                  router.push(`/form?${params}`);
                }}
              >
                <img
                  src="/img/formicon.png"
                  alt="Logo"
                  className="w-auto h-32 m-auto"
                />
                <h2 className="text-lg text-center font-bold text-gray-900 mb-2">
                  บันทึกรายงานพฤติกรรม
                </h2>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-4 w-1/2 hover:scale-105 transition-transform duration-200 hover:cursor-pointer">
                <img
                  src="/img/report_icon.png"
                  alt="Logo"
                  className="w-auto h-32 m-auto"
                />
                <h2 className="text-lg text-center font-bold text-gray-900 mb-2">
                  สรุปผลรายงานพฤติกรรม
                </h2>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModernBBSLogin;

const RequiredMark = () => <sup className="text-red-500">*</sup>;