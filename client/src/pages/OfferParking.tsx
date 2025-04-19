import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRoute } from "wouter";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Car, Calendar, User, Clock, Clipboard } from "lucide-react";
import { cn } from "@/lib/utils";

// 定義表單驗證規則
const parkingOfferSchema = z.object({
  spaceNumber: z.string().min(1, "請輸入車位編號"),
  ownerName: z.string().min(1, "請輸入姓名"),
  ownerContact: z.string().min(1, "請輸入聯絡方式"),
  notes: z.string().optional(),
});

type ParkingOfferValues = z.infer<typeof parkingOfferSchema>;

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

const OfferParking = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [match, params] = useRoute<{ requestId: string }>("/offer-parking/:requestId");
  const requestId = match ? params.requestId : null;

  // 使用正確的API端點獲取特定ID的租借請求
  const { data: requestData, isLoading: requestLoading, error: requestError } = useQuery<RentalRequest>({
    queryKey: [`/api/rental-requests/${requestId}`],
    enabled: !!requestId
  });
  
  // 獲取該租借請求的所有車位提供
  const { data: offersData, isLoading: offersLoading } = useQuery<ParkingOfferResponse[]>({
    queryKey: [`/api/rental-requests/${requestId}/offers`],
    enabled: !!requestId
  });

  // 如果有現有提供，設置為已提交
  useEffect(() => {
    if (offersData && offersData.length > 0) {
      setIsSubmitted(true);
      // 將第一個提供的數據填入表單，以便在確認畫面顯示
      const firstOffer = offersData[0];
      form.setValue("spaceNumber", firstOffer.spaceNumber);
      form.setValue("ownerName", firstOffer.ownerName);
      form.setValue("ownerContact", firstOffer.ownerContact);
      if (firstOffer.notes) {
        form.setValue("notes", firstOffer.notes);
      }
    }
  }, [offersData]);
  
  // 調試信息
  useEffect(() => {
    if (requestData) {
      console.log("租借請求數據:", requestData);
    }
    if (offersData) {
      console.log("車位提供數據:", offersData);
    }
  }, [requestData, offersData]);
  
  useEffect(() => {
    if (requestError) {
      console.error("獲取租借請求失敗:", requestError);
    }
  }, [requestError]);

  // 初始化表單
  const form = useForm<ParkingOfferValues>({
    resolver: zodResolver(parkingOfferSchema),
    defaultValues: {
      spaceNumber: "",
      ownerName: "",
      ownerContact: "",
      notes: "",
    },
  });

  // 定義ParkingOffer類型
  interface ParkingOfferResponse {
    id: number;
    requestId: number;
    spaceNumber: string;
    ownerName: string;
    ownerContact: string;
    notes: string | null;
    createdAt: string;
  }

  // 確認車位的 Mutation
  const mutation = useMutation<ParkingOfferResponse, Error, ParkingOfferValues>({
    mutationFn: async (values: ParkingOfferValues) => {
      return await apiRequest<ParkingOfferResponse>('POST', `/api/rental-requests/${requestId}/offers`, values);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "成功",
        description: "您已成功提供車位",
      });
    },
    onError: (error) => {
      toast({
        title: "錯誤",
        description: `${error}`,
        variant: "destructive",
      });
    }
  });

  // 表單提交處理
  const onSubmit = (values: ParkingOfferValues) => {
    mutation.mutate(values);
  };

  // 格式化日期
  const formatDate = (dateString: string | undefined | null) => {
    try {
      if (!dateString) {
        return "---";
      }
      
      // 移除時間部分，只保留日期
      const datePart = typeof dateString === 'string' ? dateString.split('T')[0] : dateString;
      
      // 如果不是有效的日期格式，返回原始字符串
      if (!/^\d{4}-\d{2}-\d{2}/.test(String(datePart))) {
        return String(dateString);
      }
      
      return format(new Date(String(datePart)), "yyyy/MM/dd");
    } catch (error) {
      console.error("日期格式化錯誤:", error);
      return String(dateString || "---"); // 返回原始字符串，以防萬一
    }
  };

  // 如果沒有找到有效的請求ID
  if (!requestId) {
    return (
      <div className="container max-w-md mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>錯誤</CardTitle>
            <CardDescription>
              無效的租借請求連結
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4" variant="destructive">
              <AlertTitle>無法找到租借請求</AlertTitle>
              <AlertDescription>
                此連結可能已過期或無效。請確認您收到的連結是否正確。
              </AlertDescription>
            </Alert>
            <Button className="w-full" onClick={() => window.location.href = "/"}>
              返回首頁
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 正在讀取資料
  if (requestLoading || offersLoading) {
    return (
      <div className="container max-w-md mx-auto py-10">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // 如果發生錯誤
  if (requestError) {
    return (
      <div className="container max-w-md mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>錯誤</CardTitle>
            <CardDescription>
              無法讀取租借請求資訊
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4" variant="destructive">
              <AlertTitle>載入失敗</AlertTitle>
              <AlertDescription>
                無法讀取此租借請求的詳細資訊。請稍後再試或聯絡系統管理員。
              </AlertDescription>
            </Alert>
            <Button className="w-full" onClick={() => window.location.href = "/"}>
              返回首頁
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // 不需要特殊檢查 404 錯誤，因為我們已經有錯誤處理邏輯

  // 顯示主要頁面內容
  return (
    <div className="container max-w-md mx-auto py-10">
      <h1 className="text-2xl font-bold text-center mb-6">提供車位出租</h1>
      
      {isSubmitted && requestData ? (
        <Card className="shadow-lg border-t-4 border-green-500">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="text-green-500 h-16 w-16" />
            </div>
            <CardTitle>確認成功</CardTitle>
            <CardDescription>
              您已成功提供車位租借
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 bg-green-50 border-green-100">
              <AlertTitle className="text-green-700">租借資訊已確認</AlertTitle>
              <AlertDescription className="text-green-600">
                車位租借詳情已發送給雙方，請保持聯絡暢通
              </AlertDescription>
            </Alert>
            
            {/* 租借歷程時間線 */}
            <div className="border rounded-md p-4 bg-gray-50 mb-4">
              <h3 className="font-medium mb-3 text-gray-700">租借歷程</h3>
              <div className="relative pl-10 pb-1">
                {/* 連接線 */}
                <div className="absolute left-4 top-2 bottom-0 w-0.5 bg-gray-200"></div>
                
                {/* 申請階段 */}
                <div className="mb-6 relative">
                  <div className="absolute left-[-22px] bg-primary rounded-full p-1.5 border-4 border-white shadow-sm">
                    <Clipboard className="h-3 w-3 text-white" />
                  </div>
                  <div className="font-medium text-sm">租借申請</div>
                  <div className="text-xs text-gray-500 mt-1">
                    申請人 {requestData.name} 於 {formatDate(requestData.createdAt)} 提出租借申請
                  </div>
                  <div className="bg-white p-2 mt-2 rounded-md text-xs border border-gray-100">
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar className="h-3 w-3 text-primary flex-shrink-0" />
                      <span>租借期間: {formatDate(requestData.startDate)} - {formatDate(requestData.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Car className="h-3 w-3 text-primary flex-shrink-0" />
                      <span>車牌號碼: {requestData.licensePlate}</span>
                    </div>
                  </div>
                </div>
                
                {/* 確認車位階段 */}
                <div className="relative">
                  <div className="absolute left-[-22px] bg-green-500 rounded-full p-1.5 border-4 border-white shadow-sm">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                  <div className="font-medium text-sm">車位確認</div>
                  <div className="text-xs text-gray-500 mt-1">
                    車位擁有者 {form.getValues("ownerName")} 於 {formatDate(offersData?.[0]?.createdAt || new Date().toISOString())} 確認提供車位
                  </div>
                  <div className="bg-white p-2 mt-2 rounded-md text-xs border border-gray-100">
                    <div className="flex items-center gap-1 mb-1">
                      <Car className="h-3 w-3 text-primary flex-shrink-0" />
                      <span>車位編號: {form.getValues("spaceNumber")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-primary flex-shrink-0" />
                      <span>聯絡方式: {form.getValues("ownerContact")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 租借資訊卡片 */}
            <div className="border rounded-md p-4 bg-gray-50">
              <h3 className="font-medium mb-3 text-gray-700">租借資訊</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">車位編號: {form.getValues("spaceNumber")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm">車位提供者: {form.getValues("ownerName")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    租借期間: {formatDate(requestData.startDate)} - {formatDate(requestData.endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm">租借者: {requestData.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-primary" />
                  <span className="text-sm">車牌號碼: {requestData.licensePlate}</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => window.location.href = "/create-rental"}
            >
              返回首頁
            </Button>
          </CardFooter>
        </Card>
      ) : requestData ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">租借請求</CardTitle>
            <CardDescription className="text-center">
              以下用戶正在尋找可用車位，請填寫您的資料
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-md p-4 bg-gray-50">
              <h3 className="font-medium mb-2 text-gray-700">租借需求</h3>
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <div>
                    <span className="text-gray-500 text-xs">租借者：</span>
                    <span className="font-medium text-sm">{requestData.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-primary" />
                  <div>
                    <span className="text-gray-500 text-xs">車牌號碼：</span>
                    <span className="font-medium text-sm">{requestData.licensePlate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <span className="text-gray-500 text-xs">租借期間：</span>
                    <span className="font-medium text-sm">{formatDate(requestData.startDate)} - {formatDate(requestData.endDate)}</span>
                  </div>
                </div>
              </div>
              {requestData.notes && (
                <div className="pt-2 border-t">
                  <span className="text-gray-500 text-xs block">備註：</span>
                  <p className="text-sm mt-1">{requestData.notes}</p>
                </div>
              )}
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="spaceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>車位編號</FormLabel>
                      <FormControl>
                        <Input placeholder="例: A-123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>姓名</FormLabel>
                      <FormControl>
                        <Input placeholder="您的姓名" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="ownerContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>聯絡方式</FormLabel>
                      <FormControl>
                        <Input placeholder="您的電話號碼或Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>備註</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="其他需告知租借者的事項" 
                          {...field} 
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "處理中..." : "確認提供車位"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default OfferParking;