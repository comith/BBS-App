"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Home, FileText, User, Plus, WifiZero, CloudFog } from "lucide-react";

// TypeScript interfaces
interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  activeColor: string;
  bgColor: string;
  path: string;
  isSpecial?: boolean;
}

interface MobileTabBarProps {
  activeTab: string;
  onTabChange?: (tabId: string) => void;
  customTabs?: TabItem[];
  className?: string;
}

// Default tab configuration
const defaultTabItems: TabItem[] = [
  {
    id: "home",
    label: "หน้าหลัก",
    icon: Home,
    color: "text-blue-500",
    activeColor: "text-blue-600",
    bgColor: "bg-blue-50",
    path: "/",
  },
  {
    id: "reports",
    label: "รายงาน",
    icon: FileText,
    color: "text-green-500",
    activeColor: "text-green-600",
    bgColor: "bg-green-50",
    path: "/dashboard",
  },
  {
    id: "create",
    label: "สร้าง",
    icon: Plus,
    color: "text-orange-500",
    activeColor: "text-orange-600",
    bgColor: "bg-orange-50",
    path: "/form",
    isSpecial: true,
  },
  {
    id: "weather",
    label: "อากาศ",
    icon: CloudFog,
    color: "text-sky-500",
    activeColor: "text-sky-600",
    bgColor: "bg-sky-50",
    path: "/weather",
  },
  {
    id: "profile",
    label: "รายงาน(ฉัน)",
    icon: User,
    color: "text-gray-500",
    activeColor: "text-gray-600",
    bgColor: "bg-gray-50",
    path: "/employeer",
  },
];

// LocalStorage utility functions
const STORAGE_KEY = "bbs_employee_data";

const saveToLocalStorage = (data: any) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }
};

const loadFromLocalStorage = () => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      return null;
    }
  }
  return null;
};

const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  onTabChange,
  customTabs,
  className = "",
}) => {
  const router = useRouter();
  const tabItems = customTabs || defaultTabItems;
  const [position, setPosition] = React.useState("");

  // Load employee data on component mount
  React.useEffect(() => {
    const employeeData = loadFromLocalStorage();
    if (employeeData) {
      const { position = "" } = employeeData;
      setPosition(position);
    }
  }, []);

  const handleTabClick = (item: TabItem) => {
    if (onTabChange) {
      onTabChange(item.id);
    }
    const employeeData = loadFromLocalStorage();
    if (employeeData) {
      const {
        employeerId = "",
        fullName = "",
        department = "",
        group = "",
        position = "",
      } = employeeData;
      setPosition(position);
      saveToLocalStorage(employeeData);
    }
    router.push(item.path);
  };

  // Function to get the appropriate icon and label for reports tab based on position
  const getReportsTabConfig = (item: TabItem) => {
    if (item.id === "reports") {
      const hasAccess = position === "SHE" || position === "Manager";
      return {
        icon: hasAccess ? FileText : WifiZero,
        label: hasAccess ? "รายงาน" : "",
      };
    }
    return {
      icon: item.icon,
      label: item.label,
    };
  };

  return (
    <div
      className={`fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full bg-white border-t border-gray-200 shadow-lg ${className} md:hidden`}
    >
      <div className="flex items-center justify-around py-2">
        {tabItems.map((item) => {
          const isActive = activeTab === item.id;
          const tabConfig = getReportsTabConfig(item);
          const Icon = tabConfig.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item)}
              className={`flex flex-col items-center py-2 px-3 min-w-0 flex-1 transition-all duration-200 ${
                item.isSpecial ? "transform hover:scale-105" : ""
              }`}
            >
              <div
                className={`flex items-center justify-center transition-all duration-200 ${
                  item.isSpecial
                    ? `w-12 h-12 rounded-full ${
                        isActive
                          ? "bg-orange-500 text-white shadow-lg"
                          : "bg-orange-100 text-orange-500"
                      }`
                    : `w-8 h-8 rounded-lg ${
                        isActive
                          ? `${item.bgColor} ${item.activeColor}`
                          : "text-gray-400"
                      }`
                }`}
              >
                <Icon
                  className={`${item.isSpecial ? "w-6 h-6" : "w-5 h-5"}`}
                />
              </div>
              <span
                className={`text-xs mt-1 font-medium transition-colors duration-200 ${
                  isActive ? item.activeColor : "text-gray-400"
                } ${item.isSpecial ? "hidden" : ""}`}
              >
                {tabConfig.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileTabBar;

// Export types for use in other components
export type { TabItem, MobileTabBarProps };