import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
import { CalendarIcon, Copy, Share2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// 定義表單驗證規則
const rentalRequestSchema = z.object({
  name: z.string().min(1, "請輸入姓名"),
  contact: z.string().min(1, "請輸入聯絡方式"),
  licensePlate: z.string().min(1, "請輸入車牌號碼"),
  startDate: z.date({ required_error: "請選擇起始日期" }),
  endDate: z.date({ required_error: "請選擇結束日期" }),
  notes: z.string().optional(),
});

type RentalRequestValues = z.infer<typeof rentalRequestSchema>;

const CreateRental = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // 初始化表單
  const form = useForm<RentalRequestValues>({
    resolver: zodResolver(rentalRequestSchema),
    defaultValues: {
      name: "",
      contact: "",
      licensePlate: "",
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      notes: "",
    },
  });

  // 定義類型
  interface RentalRequestResponse {
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

  // 生成租借請求的 Mutation
  const mutation = useMutation<RentalRequestResponse, Error, RentalRequestValues>({
    mutationFn: async (values: RentalRequestValues) => {
      return await apiRequest<RentalRequestResponse>('POST', '/api/rental-requests', values);
    },
    onSuccess: (data) => {
      // 產生分享連結
      const requestId = data.id;
      const baseUrl = window.location.origin;
      const shareLink = `${baseUrl}/offer-parking/${requestId}`;
      
      setGeneratedLink(shareLink);
      
      toast({
        title: "申請成功",
        description: "已生成車位共享連結",
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
  const onSubmit = (values: RentalRequestValues) => {
    try {
      console.log("原始表單數據:", values);
      
      // 為了 PostgreSQL 格式化日期為 YYYY-MM-DD 字符串格式
      const processedValues = {
        ...values,
        startDate: values.startDate ? values.startDate.toISOString().split('T')[0] : values.startDate,
        endDate: values.endDate ? values.endDate.toISOString().split('T')[0] : values.endDate
      };
      
      console.log("處理後的數據:", processedValues);
      mutation.mutate(processedValues as any);
    } catch (error) {
      console.error("日期處理錯誤:", error);
      toast({
        title: "錯誤",
        description: "日期處理失敗，請重試",
        variant: "destructive",
      });
    }
  };

  // 複製連結到剪貼簿
  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast({
        title: "已複製",
        description: "連結已複製到剪貼簿",
      });
    }
  };

  // 分享連結 (如果瀏覽器支援 Web Share API)
  const shareLink = () => {
    if (generatedLink && navigator.share) {
      navigator.share({
        title: '車位租借申請',
        text: '我正在尋找車位，請點擊連結查看我的租借需求',
        url: generatedLink,
      })
      .catch((error) => console.log('分享失敗', error));
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="container max-w-md mx-auto py-10">
      <h1 className="text-2xl font-bold text-center mb-6">車位租借申請</h1>
      
      {generatedLink ? (
        <Card className="shadow-lg border-t-4 border-primary">
          <CardHeader>
            <CardTitle className="text-center">申請成功</CardTitle>
            <CardDescription className="text-center">
              請將此連結分享給車位擁有者
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-md flex items-center justify-between mb-4 border">
              <div className="text-sm overflow-hidden overflow-ellipsis">
                {generatedLink}
              </div>
              <div className="flex gap-2 ml-2 flex-shrink-0">
                <Button variant="outline" size="icon" onClick={copyToClipboard} title="複製連結">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={shareLink} title="分享連結">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Alert className="mb-4">
              <AlertTitle className="text-primary">如何使用</AlertTitle>
              <AlertDescription>
                將此連結發送給擁有車位的人，他們點擊後可以提供車位租借給您
              </AlertDescription>
            </Alert>

            <div className="rounded-md bg-gray-50 p-4 border">
              <h3 className="font-medium text-sm text-gray-500 mb-2">您的租借資訊</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">姓名：</span>
                  <p className="font-medium">{form.getValues("name")}</p>
                </div>
                <div>
                  <span className="text-gray-500">車牌號碼：</span>
                  <p className="font-medium">{form.getValues("licensePlate")}</p>
                </div>
                <div>
                  <span className="text-gray-500">起始日期：</span>
                  <p className="font-medium">{format(form.getValues("startDate"), "yyyy/MM/dd")}</p>
                </div>
                <div>
                  <span className="text-gray-500">結束日期：</span>
                  <p className="font-medium">{format(form.getValues("endDate"), "yyyy/MM/dd")}</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              onClick={() => {
                setGeneratedLink(null);
                form.reset();
              }}
            >
              建立新租借申請
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">尋找車位</CardTitle>
            <CardDescription className="text-center">
              填寫您的資料以尋找可用的停車位
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>姓名</FormLabel>
                      <FormControl>
                        <Input placeholder="請輸入您的姓名" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>聯絡方式</FormLabel>
                      <FormControl>
                        <Input placeholder="電話號碼或Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="licensePlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>車牌號碼</FormLabel>
                      <FormControl>
                        <Input placeholder="例: ABC-1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>起始日期</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "yyyy/MM/dd")
                                ) : (
                                  <span>選擇日期</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>結束日期</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "yyyy/MM/dd")
                                ) : (
                                  <span>選擇日期</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => 
                                date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                                date <= form.getValues("startDate")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>備註</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="其他需求說明" 
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
                  {mutation.isPending ? "處理中..." : "建立租借申請"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CreateRental;