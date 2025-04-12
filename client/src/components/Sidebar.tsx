import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Car,
  Home,
  BarChart4,
  Settings,
  Repeat
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
    { path: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: t('dashboard') },
    { path: '/parking-spaces', icon: <Car className="w-5 h-5" />, label: t('parkingSpaces') },
    { path: '/rentals', icon: <Repeat className="w-5 h-5" />, label: t('rentals') },
    { path: '/households', icon: <Home className="w-5 h-5" />, label: t('households') },
    { path: '/create-rental', icon: <Car className="w-5 h-5" />, label: '申請租車位' },
    { path: '/reports', icon: <BarChart4 className="w-5 h-5" />, label: t('reports') },
    { path: '/settings', icon: <Settings className="w-5 h-5" />, label: t('settings') }
  ];
  
  return (
    <aside className="w-64 bg-white shadow-md hidden md:block">
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <a
                  className={`flex items-center p-3 rounded-md transition-colors ${
                    isActive(item.path)
                      ? "text-primary bg-[#F3F2F1]"
                      : "hover:bg-[#F3F2F1]"
                  }`}
                >
                  <span className="w-6">{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
