"use client";
import * as React from "react";
import { House } from "lucide-react";
import { useRouter } from "next/navigation";

export function Header() {
  //   const { user, logout } = useAuth()
  const router = useRouter();
  const [employeeId, setEmployeeId] = React.useState<string | null>(null);
  const [employeeName, setEmployeeName] = React.useState<string | null>(null);
  const [department, setDepartment] = React.useState<string | null>(null);
  const [group, setGroup] = React.useState<string | null>(null);

  if (typeof window !== "undefined") {
    const searchParams = new URLSearchParams(window.location.search);
    setEmployeeId(searchParams.get("employeeId") || "");
    setEmployeeName(searchParams.get("fullName") || "");
    setDepartment(searchParams.get("department") || "");
    setGroup(searchParams.get("group") || "");
  }
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      {/* <Button variant="outline" size="icon" className="md:hidden">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button> */}

      <div className="flex-1">
        <a
          className="flex items-center gap-2 font-semibold hover:cursor-pointer"
          onClick={() => {
            const params = new URLSearchParams({
              employeeId: employeeId || "",
              fullName: employeeName || "",
              department: department || "",
              group: group || "",
            }).toString();
            router.push(`/?${params}`);
          }}
        >
          <House className="h-5 w-5" />
          <span className="font-bold text-xl">BBS</span>
          <span className="text-sm text-muted-foreground hidden sm:inline-block">
            Behavior Base Safety
          </span>
        </a>
      </div>

      <div className="flex items-center gap-2">
        {/* <LanguageSwitcher /> */}

        {/* <Button variant="outline" size="icon">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button> */}

        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline-block">{user?.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t("logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}
      </div>
    </header>
  );
}
