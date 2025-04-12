import { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useLocation } from "wouter";

interface LayoutProps {
  children: ReactNode;
  lang: "zh" | "en";
  setLang: (lang: "zh" | "en") => void;
}

const Layout = ({ children, lang, setLang }: LayoutProps) => {
  const [location] = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col bg-[#F3F2F1] text-[#605E5C]">
      <Header lang={lang} setLang={setLang} />
      
      <div className="flex flex-1">
        <Sidebar activePath={location} />
        
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
