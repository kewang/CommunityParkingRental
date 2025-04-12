import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface HeaderProps {
  lang: "zh" | "en";
  setLang: (lang: "zh" | "en") => void;
}

const Header = ({ lang, setLang }: HeaderProps) => {
  const { t, i18n } = useTranslation();
  const [notificationCount, setNotificationCount] = useState(3);
  
  // Toggle language
  const toggleLanguage = () => {
    const newLang = lang === "zh" ? "en" : "zh";
    i18n.changeLanguage(newLang);
    setLang(newLang);
  };
  
  // Update language when it changes externally
  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);
  
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <svg className="w-8 h-8 text-primary mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 9.5H5C3.89543 9.5 3 10.3954 3 11.5V19.5C3 20.6046 3.89543 21.5 5 21.5H19C20.1046 21.5 21 20.6046 21 19.5V11.5C21 10.3954 20.1046 9.5 19 9.5Z" fill="currentColor"/>
            <path d="M7 9.5V5.5C7 4.17392 7.52678 2.90215 8.46447 1.96447C9.40215 1.02678 10.6739 0.5 12 0.5C13.3261 0.5 14.5979 1.02678 15.5355 1.96447C16.4732 2.90215 17 4.17392 17 5.5V9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 15.5V17.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 className="text-xl font-bold text-primary">
            <span className="mr-2">{t("systemTitle")}</span>
            <span className="text-sm font-english text-[#605E5C]">
              {lang === "zh" ? "Community Parking Management" : "社區停車場管理系統"}
            </span>
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5 text-[#605E5C]" />
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 bg-[#D83B01] text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Button>
          </div>
          
          <div className="flex items-center">
            <span className="mr-2">{t("admin")}</span>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleLanguage}
            className="text-sm px-2 py-1 rounded border"
          >
            {lang === "zh" ? "EN | 中" : "中 | EN"}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
