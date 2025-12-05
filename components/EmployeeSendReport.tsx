import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type EmployeeSendReportProps = {
  setShowLiseEmployeeSendReport: (show: boolean) => void;
  data: any;
  employeesInGroup?: any;
};

export function EmployeeSendReport({
  setShowLiseEmployeeSendReport,
  data,
  employeesInGroup,
}: EmployeeSendReportProps) {
  const [dataSummarySendReport, setDataSummarySendReport] = React.useState<any>(
    []
  );
  React.useEffect(() => {

        const employeeIdMap = new Map();
        employeesInGroup.forEach((emp: any) => {
            employeeIdMap.set(emp.employeeId, true);
        });

        const missingEmployees: any[] = [];
        data.forEach((report: any) => {
            if (!employeeIdMap.has(report.employeeId)) {
                const newEmployee = {
                    employeeId: report.employeeId,
                    employeeName: report.employeeName,
                    department: report.department || "ITH-MO", 
                    group: report.group 
                };
                missingEmployees.push(newEmployee);
            }
        });

        const allEmployees = [...employeesInGroup, ...missingEmployees];
        const reportMap = new Map();
        data.forEach((report: any) => {
            reportMap.set(report.employeeId, report);
        });
        const employeeSendHasGroup = allEmployees.map((employee: any) => {
            const reportsSent = reportMap.get(employee.employeeId);
            const placeholderReport = {
                employeeId: employee.employeeId,
                count: "-",
                employeeName: employee.employeeName,
                group: employee.group,
            };

            return {
                ...employee,
                sendReportCout: reportsSent || placeholderReport,
            };
        });

        setDataSummarySendReport(employeeSendHasGroup);
    }, [employeesInGroup, data]);

  return (
    <Dialog
      open={true}
      onOpenChange={() => setShowLiseEmployeeSendReport(false)}
    >
      <DialogContent className="sm:max-w-[425px] h-[600px]">
        <DialogHeader>
          <DialogTitle>รายชื่อพนักงานที่ส่งรายงาน</DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-sm text-gray-500 h-[10px]">
          จำนวนพนักงานในกลุ่ม:{" "}
          {dataSummarySendReport ? dataSummarySendReport.length : 0} คน
          ส่งรายงานทั้งหมด{" "}
          {data.reduce(
            (total: number, report: any) =>
              total + (typeof report.count === "number" ? report.count : 0),
            0
          )}{" "}
          ครั้ง
        </DialogDescription>
        <div className="mt-0">
          <ul className="list-disc list-inside space-y-2 max-h-96 overflow-y-auto">
            {dataSummarySendReport ? (
              dataSummarySendReport.map((employee: any, index: number) => (
                <li key={index} className="text-sm">
                  {employee.sendReportCout.count === "-" ? (
                    <label className="text-gray-400">
                      {employee.employeeId} : {employee.employeeName} |
                      ส่งรายงาน {employee.sendReportCout.count} ครั้ง
                    </label>
                  ) : (
                    <label className="text-gray-900">
                      {employee.employeeId} : {employee.employeeName} |
                      ส่งรายงาน {employee.sendReportCout.count} ครั้ง
                    </label>
                  )}
                </li>
              ))
            ) : (
              <li className="text-sm">ไม่มีข้อมูลพนักงาน</li>
            )}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
