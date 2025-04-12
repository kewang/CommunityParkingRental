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
import { CheckCircle2, Car, Calendar, User, Phone } from "lucide-react";

// 定義表單驗證規則
const parkingOfferSchema = z.object({
  spaceNumber: z.string().min(1, "請輸入車位編號"),
  ownerName: z.string().min(1, "請輸入姓名"),
  ownerContact: z.string().min(1, "請輸入聯絡方式"),
  notes: z.string().optional(),
});

type ParkingOfferValues = z.infer<typeof parkingOfferSchema>;

const OfferParking = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [match, params] = useRoute<{ requestId: string }>("/offer-parking/:requestId");
  const requestId = match ? params.requestId : null;

  // 定義類型
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

  // 確認車位的 Mutation
  const mutation = useMutation({
    mutationFn: async (values: ParkingOfferValues) => {
      return await apiRequest('POST', `/api/rental-requests/${requestId}/offers`, values);
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
    return format(new Date(dateString), "yyyy/MM/dd");
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

  return (
    <div className="container max-w-md mx-auto py-10">
      <h1 className="text-2xl font-bold text-center mb-6">提供車位出租</h1>
      
      {isSubmitted && requestData ? (
        <Card>
          <CardHeader>
            <CardTitle>確認成功</CardTitle>
            <CardDescription>
              您已成功提供車位租借
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="text-green-500 h-16 w-16" />
            </div>
            <h3 className="text-lg font-semibold mb-2">租借資訊已確認</h3>
            <p className="text-sm text-gray-500 mb-4">
              車位租借詳情已發送給雙方，請保持聯絡暢通
            </p>
            
            <div className="border rounded-md p-4 bg-gray-50 mt-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Car className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">車位編號: {form.getValues("spaceNumber")}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  租借期間: {formatDate(requestData.startDate)} - {formatDate(requestData.endDate)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm">租借者: {requestData.name}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => window.location.href = "/"}
            >
              返回首頁
            </Button>
          </CardFooter>
        </Card>
      ) : requestData ? (
        <Card>
          <CardHeader>
            <CardTitle>租借詳情</CardTitle>
            <CardDescription>
              此用戶正在尋找可用車位
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-md p-4 bg-gray-50">
              <h3 className="font-medium mb-2">租借需求</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">租借者:</span>
                  <p>{requestData.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">車牌號碼:</span>
                  <p>{requestData.licensePlate}</p>
                </div>
                <div>
                  <span className="text-gray-500">起始日期:</span>
                  <p>{formatDate(requestData.startDate)}</p>
                </div>
                <div>
                  <span className="text-gray-500">結束日期:</span>
                  <p>{formatDate(requestData.endDate)}</p>
                </div>
                {requestData.notes && (
                  <div className="col-span-2">
                    <span className="text-gray-500">備註:</span>
                    <p>{requestData.notes}</p>
                  </div>
                )}
              </div>
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
      )}
    </div>
  );
};

export default OfferParking;