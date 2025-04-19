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

interface SidebarProps {
  activePath: string;
}

const Sidebar = ({ activePath }: SidebarProps) => {
  const { t } = useTranslation();
  
  // Helper function to determine if a path is active
  const isActive = (path: string) => {
    if (path === '/' && activePath === '/') return true;
    if (path !== '/' && activePath.startsWith(path)) return true;
    return false;
  };
  
  // Navigation items
  const navItems = [
    { path: '/create-rental', icon: <Car className="w-5 h-5" />, label: '申請租車位' },
    { path: '/pending-requests', icon: <ClipboardList className="w-5 h-5" />, label: '目前待租借' },
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
                <span>{item.label}</span>
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
