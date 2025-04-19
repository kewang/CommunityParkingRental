import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Car, User, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

const PendingRequests = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // 獲取所有待處理的租借請求
  const { data: requests, isLoading, error, refetch } = useQuery<RentalRequest[]>({
    queryKey: ["/api/rental-requests"],
  });
  
  // 過濾只顯示待處理的請求 (PENDING 狀態)
  const pendingRequests = requests?.filter(req => req.status === "PENDING") || [];
  
  // 格式化日期
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "---";
    
    try {
      const datePart = typeof dateString === 'string' ? dateString.split('T')[0] : dateString;
      
      if (!/^\d{4}-\d{2}-\d{2}/.test(String(datePart))) {
        return String(dateString);
      }
      
      return format(new Date(String(datePart)), "yyyy/MM/dd");
    } catch (error) {
      console.error("日期格式化錯誤:", error);
      return String(dateString || "---");
    }
  };
  
  // 複製租借連結
  const copyRentalLink = (requestId: number) => {
    const baseUrl = window.location.origin;
    const shareLink = `${baseUrl}/offer-parking/${requestId}`;
    
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "已複製",
      description: "租借連結已複製到剪貼簿",
    });
  };
  
  // 獲取狀態標籤顏色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'MATCHED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };
  
  // 獲取狀態中文名稱
  const getStatusName = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '待處理';
      case 'MATCHED':
        return '已配對';
      case 'EXPIRED':
        return '已過期';
      case 'CANCELLED':
        return '已取消';
      default:
        return status;
    }
  };

  // 顯示載入中狀態
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">目前待租借</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shadow-md">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 顯示錯誤
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">目前待租借</h1>
        <Card className="shadow-md">
          <CardContent className="py-10">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">
                無法載入待租借列表
              </h2>
              <p className="mb-4 text-gray-600">
                請稍後再試或聯絡系統管理員
              </p>
              <Button onClick={() => refetch()}>重試</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">目前待租借</h1>
      
      {pendingRequests.length === 0 ? (
        <Card className="shadow-md">
          <CardContent className="py-10">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">
                目前沒有待處理的租借請求
              </h2>
              <p className="mb-4 text-gray-600">
                當有人申請租借車位時，將會顯示在這裡
              </p>
              <Button onClick={() => window.location.href = "/create-rental"}>
                建立租借申請
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingRequests.map((request) => (
            <Card key={request.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">
                      {request.name}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      {formatDate(request.createdAt).split(' ')[0]}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(request.status)}`}>
                    {getStatusName(request.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-primary" />
                  <span className="text-sm">{request.licensePlate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-sm">
                    {formatDate(request.startDate)} - {formatDate(request.endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-sm">{request.contact}</span>
                </div>
                {request.notes && (
                  <div className="pt-2 border-t mt-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">備註: </span>
                      {request.notes}
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={() => copyRentalLink(request.id)}
                >
                  複製租借連結
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingRequests;