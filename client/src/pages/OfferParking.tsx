import { useState } from "react";
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
import { CheckCircle2, Car, Calendar, User } from "lucide-react";

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

  // 獲取租借請求資訊
  const { data: requestData, isLoading, error } = useQuery<RentalRequest>({
    queryKey: ['/api/rental-requests', requestId],
    enabled: !!requestId,
  });

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
  const formatDate = (dateString: string) => {
    try {
      // 移除時間部分，只保留日期
      const datePart = dateString.split('T')[0];
      return format(new Date(datePart), "yyyy/MM/dd");
    } catch (error) {
      console.error("日期格式化錯誤:", error);
      return dateString; // 返回原始字符串，以防萬一
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
  if (isLoading) {
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
  if (error) {
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