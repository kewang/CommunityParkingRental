import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Search, LayoutDashboard, Car, AlertCircle, Check, RepeatIcon, Bell } from "lucide-react";
import { ParkingSpace, ActivityLog, Rental } from "@shared/schema";
import { DashboardStats } from "@/types";
import ParkingSpaceCard from "@/components/ParkingSpaceCard";
import ActivityCard from "@/components/ActivityCard";
import { useState } from "react";
import { format, addDays } from "date-fns";
import { useLocation } from "wouter";
import { zhCN, enUS } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";

interface ExpiringRentalProps {
  parkingSpaceNumber: string;
  licensePlate: string;
  daysLeft: number;
  expiryDate: Date;
  lang: 'zh' | 'en';
}

const ExpiringRental = ({ parkingSpaceNumber, licensePlate, daysLeft, expiryDate, lang }: ExpiringRentalProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Format date based on language
  const formatDate = (date: Date) => {
    const locale = lang === 'zh' ? zhCN : enUS;
    return format(date, lang === 'zh' ? 'MM/dd' : 'MM/dd', { locale });
  };
  
  const handleRemind = () => {
    toast({
      title: t("notificationTitle"),
      description: `${t("reminder")}: ${parkingSpaceNumber} (${licensePlate}) ${t("daysUntilExpiry").replace("{days}", daysLeft.toString())}`,
    });
  };
  
  return (
    <div className="flex items-center bg-[#F3F2F1] rounded-lg p-2">
      <div className="flex-shrink-0 bg-[#FFB900]/20 p-2 rounded-full mr-3">
        <AlertCircle className="text-[#FFB900]" size={16} />
      </div>
      <div className="flex-grow">
        <div className="text-sm font-medium">{parkingSpaceNumber} ({licensePlate})</div>
        <div className="text-xs text-[#605E5C]">
          {daysLeft} {t("daysUntilExpiry")} ({formatDate(expiryDate)})
        </div>
      </div>
      <Button variant="ghost" size="sm" className="text-primary" onClick={handleRemind}>
        <Bell size={16} />
      </Button>
    </div>
  );
};

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const lang = i18n.language as 'zh' | 'en';
  
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });
  
  // Fetch all parking spaces
  const { data: parkingSpaces, isLoading: spacesLoading } = useQuery<ParkingSpace[]>({
    queryKey: ['/api/parking-spaces'],
  });
  
  // Fetch recent activity logs
  const { data: activityLogs, isLoading: logsLoading } = useQuery<ActivityLog[]>({
    queryKey: ['/api/activity-logs?limit=4'],
  });
  
  // Fetch expiring rentals
  const { data: expiringRentals, isLoading: rentalsLoading } = useQuery<Rental[]>({
    queryKey: ['/api/rentals/expiring?days=7'],
  });
  
  // Handle search 
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // In a real implementation, this would navigate to a search results page
      // or filter the current data
      console.log("Searching for:", searchQuery);
    }
  };
  
  // Generate stat card data
  const statCards = [
    {
      title: t("totalSpaces"),
      value: stats?.totalSpaces || 0,
      change: "+2",
      changeText: t("since"),
      icon: <Car className="text-primary" />,
      iconBg: "bg-blue-100"
    },
    {
      title: t("occupiedSpaces"),
      value: stats?.occupiedSpaces || 0,
      percentText: (stats && ((stats.occupiedSpaces / stats.totalSpaces) * 100).toFixed(1)) || "0.0",
      changeText: t("percentage"),
      icon: <Car className="text-[#D83B01]" />,
      iconBg: "bg-red-100"
    },
    {
      title: t("availableSpaces"),
      value: stats?.availableSpaces || 0,
      percentText: (stats && ((stats.availableSpaces / stats.totalSpaces) * 100).toFixed(1)) || "0.0",
      changeText: t("percentage"),
      icon: <Check className="text-[#107C10]" />,
      iconBg: "bg-green-100"
    },
    {
      title: t("monthlyRentals"),
      value: stats?.activeRentalsCount || 0,
      change: "+3",
      changeText: t("compared"),
      icon: <RepeatIcon className="text-[#FFB900]" />,
      iconBg: "bg-yellow-100"
    }
  ];
  
  return (
    <div id="dashboard" className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t("dashboard")}</h2>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" className="md:hidden bg-white p-2 rounded shadow">
            <LayoutDashboard size={20} />
          </Button>
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              className="pl-10 pr-4 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#605E5C]" />
          </form>
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card, index) => (
          <Card key={index} className="bg-white shadow-sm border-none">
            <CardContent className="p-4">
              {statsLoading ? (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <Skeleton className="h-5 w-24 mb-2" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-20 mt-3" />
                </>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-[#605E5C]">{card.title}</p>
                      <p className="text-2xl font-bold">{card.value}</p>
                    </div>
                    <div className={`${card.iconBg} p-2 rounded-full ${card.icon ? '' : 'invisible'}`}>
                      {card.icon}
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    {card.change && <span className="text-[#107C10]">{card.change}</span>} 
                    {card.percentText && <span className="font-medium">{card.percentText}%</span>} 
                    {' '}{card.changeText}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Parking status and recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-white shadow-sm border-none">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">{t("parkingOverview")}</h3>
                <div className="flex space-x-1">
                  <Button size="sm" variant="default" className="py-1 px-3 text-sm">
                    {t("area")}
                  </Button>
                  <Button size="sm" variant="outline" className="py-1 px-3 text-sm bg-[#F3F2F1] text-[#605E5C]">
                    {t("list")}
                  </Button>
                </div>
              </div>
              
              {/* Parking map visualization */}
              <div className="overflow-auto">
                {spacesLoading ? (
                  <div className="grid grid-cols-6 md:grid-cols-10 gap-2 min-w-[500px]">
                    {Array.from({ length: 10 }).map((_, index) => (
                      <Skeleton key={index} className="aspect-[4/3] w-full h-full" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-6 md:grid-cols-10 gap-2 min-w-[500px]">
                    {parkingSpaces?.slice(0, 10).map((space) => (
                      <ParkingSpaceCard 
                        key={space.id} 
                        space={space} 
                        licensePlate={space.status === 'occupied' ? 'ABC-123' : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-between mt-4">
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-[#107C10] rounded-full mr-1"></div>
                    <span className="text-xs">{t("available")}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-[#D83B01] rounded-full mr-1"></div>
                    <span className="text-xs">{t("occupied")}</span>
                  </div>
                </div>
                <Button 
                  variant="link" 
                  className="text-primary text-sm p-0"
                  onClick={() => navigate("/parking-spaces")}
                >
                  {t("showMore")} <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card className="bg-white shadow-sm border-none mb-4">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">{t("recentActivity")}</h3>
                <Button variant="link" className="text-xs text-primary p-0">
                  {t("viewAll")}
                </Button>
              </div>
              
              <div className="space-y-4">
                {logsLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="border-l-4 border-gray-200 pl-3 pb-4">
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-3 w-40 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  ))
                ) : (
                  activityLogs?.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} lang={lang} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm border-none">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">{t("expiringSoon")}</h3>
                <Button variant="link" className="text-xs text-primary p-0">
                  {t("remindAll")}
                </Button>
              </div>
              
              <div className="space-y-3">
                {rentalsLoading ? (
                  Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="flex items-center bg-[#F3F2F1] rounded-lg p-2">
                      <Skeleton className="h-10 w-10 rounded-full mr-3" />
                      <div className="flex-grow">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  ))
                ) : (
                  expiringRentals?.slice(0, 3).map((rental, index) => {
                    // In a real app, we would fetch and associate the space number and license plate
                    // For now, create sample data
                    const today = new Date();
                    const expiryDate = new Date(rental.endDate);
                    const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <ExpiringRental
                        key={rental.id}
                        parkingSpaceNumber={`B-${100 + index}`}
                        licensePlate={rental.licensePlate}
                        daysLeft={daysLeft}
                        expiryDate={expiryDate}
                        lang={lang}
                      />
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
