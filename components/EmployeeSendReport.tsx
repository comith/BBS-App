import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"

type EmployeeSendReportProps = {
  setShowLiseEmployeeSendReport: (show: boolean) => void;
  data: any;
  employeesInGroup?: any;
};

export function EmployeeSendReport({ setShowLiseEmployeeSendReport,data,employeesInGroup }: EmployeeSendReportProps) {
    const [dataSummarySendReport, setDataSummarySendReport] = React.useState<any>([]);
    React.useEffect(() => {
        setDataSummarySendReport(
            employeesInGroup.map((employee: any) => {
                const reportsSent = data.filter((report: any) => report.employeeId === employee.employeeId)[0];
                return {
                    ...employee,
                    sendReportCout: reportsSent || {
                        employeeId: employee.employeeId,
                        count: "-",
                        employeeName: employee.employeeName,
                        group: employee.group
                        
                    }
                };
            })
        );

    }, [employeesInGroup]);

    return (
    <Dialog open={true} onOpenChange={()=> setShowLiseEmployeeSendReport(false)}>
        <DialogContent className="sm:max-w-[425px] h-[600px]">
          <DialogHeader>
            <DialogTitle>รายชื่อพนักงานที่ส่งรายงาน</DialogTitle>
          </DialogHeader>
            <DialogDescription className="text-sm text-gray-500 h-[10px]">
                จำนวนพนักงานในกลุ่ม: {dataSummarySendReport ? dataSummarySendReport.length : 0} คน
                ส่งรายงานทั้งหมด {data.reduce((total: number, report: any) => total + (typeof report.count === 'number' ? report.count : 0), 0)} ครั้ง
            </DialogDescription>
          <div className="mt-0">
            <ul className="list-disc list-inside space-y-2 max-h-96 overflow-y-auto">
              {dataSummarySendReport ? (
                dataSummarySendReport.map((employee: any, index: number) => (
                  <li key={index} className="text-sm">
                    {
                        employee.sendReportCout.count === "-" ? (
                            <label className="text-gray-400">
                                {employee.employeeId} : {employee.employeeName} | ส่งรายงาน {employee.sendReportCout.count} ครั้ง
                            </label>
                        ) : <label className="text-gray-900">
                                {employee.employeeId} : {employee.employeeName} | ส่งรายงาน {employee.sendReportCout.count} ครั้ง
                            </label>
                            
                    }
                    
                    
                  </li>
                ))
              ) : (
                <li className="text-sm">ไม่มีข้อมูลพนักงาน</li>
              )}
            </ul>
        </div>
            
        </DialogContent>
    </Dialog>
  )
}
