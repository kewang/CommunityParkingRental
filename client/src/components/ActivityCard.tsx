import { useTranslation } from "react-i18next";
import { ActivityLog } from "@shared/schema";
import { format } from "date-fns";
import { ACTIVITY_COLORS } from "@/types";
import { zhCN, enUS } from "date-fns/locale";

interface ActivityCardProps {
  activity: ActivityLog;
  lang: 'zh' | 'en';
}

const ActivityCard = ({ activity, lang }: ActivityCardProps) => {
  const { t } = useTranslation();
  const borderColor = ACTIVITY_COLORS[activity.activityType] || "border-gray-300";
  
  // Format the date based on the language
  const formatDate = (date: Date) => {
    const locale = lang === 'zh' ? zhCN : enUS;
    const formatStr = lang === 'zh' ? 'yyyy/MM/dd HH:mm' : 'MM/dd/yyyy HH:mm';
    return format(new Date(date), formatStr, { locale });
  };
  
  // Get activity title based on activity type
  const getActivityTitle = (type: string) => {
    switch (type) {
      case 'RENTAL_CREATED':
        return t('rentalAdded');
      case 'RENTAL_ENDED':
        return t('rentalEnded');
      case 'SPACE_UPDATED':
      case 'SPACE_CREATED':
      case 'HOUSEHOLD_UPDATED':
      case 'HOUSEHOLD_CREATED':
      case 'RENTAL_UPDATED':
        return t('spaceUpdated');
      default:
        return type;
    }
  };
  
  return (
    <div className={`border-l-4 ${borderColor} pl-3 pb-4`}>
      <div className="text-sm font-medium">{getActivityTitle(activity.activityType)}</div>
      <div className="text-xs text-[#605E5C]">{activity.description}</div>
      <div className="text-xs text-[#605E5C]/70">{formatDate(activity.timestamp)}</div>
    </div>
  );
};

export default ActivityCard;
