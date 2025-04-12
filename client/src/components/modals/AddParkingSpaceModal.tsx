import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { parkingSpaceFormSchema, SPACE_STATUS } from "@shared/schema";

interface AddParkingSpaceModalProps {
  open: boolean;
  onClose: () => void;
}

type FormValues = z.infer<typeof parkingSpaceFormSchema>;

const AddParkingSpaceModal = ({ open, onClose }: AddParkingSpaceModalProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(parkingSpaceFormSchema),
    defaultValues: {
      spaceNumber: "",
      area: "A",
      status: SPACE_STATUS.AVAILABLE,
      notes: "",
    },
  });
  
  // Create parking space mutation
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return await apiRequest('POST', '/api/parking-spaces', values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parking-spaces'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: t("successTitle"),
        description: "車位已新增成功 / Parking space added successfully",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: t("errorTitle"),
        description: `${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("addParkingSpace")}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("area")}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("area")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A">A {t("area")}</SelectItem>
                        <SelectItem value="B">B {t("area")}</SelectItem>
                        <SelectItem value="C">C {t("area")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="spaceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("spaceNumber")}</FormLabel>
                    <FormControl>
                      <Input placeholder="例: A-101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{t("status")}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value={SPACE_STATUS.AVAILABLE} />
                        </FormControl>
                        <FormLabel className="cursor-pointer">{t("available")}</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value={SPACE_STATUS.OCCUPIED} />
                        </FormControl>
                        <FormLabel className="cursor-pointer">{t("occupied")}</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value={SPACE_STATUS.MAINTENANCE} />
                        </FormControl>
                        <FormLabel className="cursor-pointer">{t("maintenance")}</FormLabel>
                      </FormItem>
                    </RadioGroup>
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
                  <FormLabel>{t("notes")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("notes")} {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="border-t pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                {t("cancel")}
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
              >
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddParkingSpaceModal;
