import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Car,
  Home,
  BarChart4,
  Settings,
  ClipboardList
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SidebarProps {
  activePath: string;
}

// 定義租借請求類型
interface RentalRequest {
  id: number;
  name: string;
  contact: string;
  licensePlate: string;
  startDate: string;
  endDate: string;
  notes: string | null;
  status: string;
  createdAt: string;
}

const Sidebar = ({ activePath }: SidebarProps) => {
  const { t } = useTranslation();
  
  // 獲取所有待處理的租借請求
  const { data: requests } = useQuery<RentalRequest[]>({
    queryKey: ["/api/rental-requests"],
  });
  
  // 過濾只顯示待處理的請求 (PENDING 狀態)
  const pendingCount = requests?.filter(req => req.status === "PENDING")?.length || 0;
  
  // Helper function to determine if a path is active
  const isActive = (path: string) => {
    if (path === '/' && activePath === '/') return true;
    if (path !== '/' && activePath.startsWith(path)) return true;
    return false;
  };
  
  // Navigation items
  const navItems = [
    { path: '/create-rental', icon: <Car className="w-5 h-5" />, label: '申請租車位' },
    { 
      path: '/pending-requests', 
      icon: <ClipboardList className="w-5 h-5" />, 
      label: '目前待租借', 
      count: pendingCount 
    },
  ];
  
  return (
    <aside className="w-64 bg-white shadow-md hidden md:block">
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <div
                onClick={() => window.location.href = item.path}
                className={`flex items-center p-3 rounded-md transition-colors cursor-pointer ${
                  isActive(item.path)
                    ? "text-primary bg-[#F3F2F1]"
                    : "hover:bg-[#F3F2F1]"
                }`}
              >
                <span className="w-6">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {typeof item.count !== 'undefined' && item.count > 0 && (
                  <span className="ml-2 bg-primary text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {item.count}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
