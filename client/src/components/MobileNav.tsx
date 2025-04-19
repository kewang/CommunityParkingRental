import { useState, useEffect } from "react";
import { Menu, X, Car, ClipboardList } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

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

interface MobileNavProps {
  activePath: string;
}

const MobileNav = ({ activePath }: MobileNavProps) => {
  const [open, setOpen] = useState(false);
  
  // 獲取所有待處理的租借請求
  const { data: requests } = useQuery<RentalRequest[]>({
    queryKey: ["/api/rental-requests"],
  });
  
  // 過濾只顯示待處理的請求 (PENDING 狀態)
  const pendingCount = requests?.filter(req => req.status === "PENDING")?.length || 0;
  
  // 導航項目
  const navItems = [
    { path: '/create-rental', icon: <Car className="w-5 h-5" />, label: '申請租車位' },
    { 
      path: '/pending-requests', 
      icon: <ClipboardList className="w-5 h-5" />, 
      label: '目前待租借', 
      count: pendingCount 
    },
  ];
  
  // 導航到指定路徑
  const navigateTo = (path: string) => {
    window.location.href = path;
    setOpen(false);
  };
  
  // Helper function to determine if a path is active
  const isActive = (path: string) => {
    if (path === '/' && activePath === '/') return true;
    if (path !== '/' && activePath.startsWith(path)) return true;
    return false;
  };
  
  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] pt-12">
          <nav>
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => navigateTo(item.path)}
                    className={`flex items-center w-full p-3 rounded-md transition-colors ${
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
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileNav;