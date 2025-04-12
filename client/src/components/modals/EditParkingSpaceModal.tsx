import { useEffect } from "react";
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
import { parkingSpaceFormSchema, ParkingSpace, SPACE_STATUS } from "@shared/schema";

interface EditParkingSpaceModalProps {
  open: boolean;
  onClose: () => void;
  parkingSpace: ParkingSpace;
}

type FormValues = z.infer<typeof parkingSpaceFormSchema>;

const EditParkingSpaceModal = ({ open, onClose, parkingSpace }: EditParkingSpaceModalProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(parkingSpaceFormSchema),
    defaultValues: {
      spaceNumber: parkingSpace.spaceNumber,
      area: parkingSpace.area,
      status: parkingSpace.status,
      notes: parkingSpace.notes || "",
    },
  });
  
  // Update form when parking space changes
  useEffect(() => {
    if (parkingSpace) {
      form.reset({
        spaceNumber: parkingSpace.spaceNumber,
        area: parkingSpace.area,
        status: parkingSpace.status,
        notes: parkingSpace.notes || "",
      });
    }
  }, [parkingSpace, form]);
  
  // Update parking space mutation
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return await apiRequest('PUT', `/api/parking-spaces/${parkingSpace.id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parking-spaces'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: t("successTitle"),
        description: "車位已更新成功 / Parking space updated successfully",
      });
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
  
  // Determine if status can be changed
  // If the space is occupied, don't allow changing the status directly
  const isStatusLocked = parkingSpace.status === SPACE_STATUS.OCCUPIED;
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("edit")} {t("parkingSpaces")}</DialogTitle>
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
                      <Input {...field} />
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
                          <RadioGroupItem 
                            value={SPACE_STATUS.AVAILABLE} 
                            disabled={isStatusLocked}
                          />
                        </FormControl>
                        <FormLabel className={`cursor-pointer ${isStatusLocked ? 'opacity-50' : ''}`}>
                          {t("available")}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem 
                            value={SPACE_STATUS.OCCUPIED} 
                            disabled={isStatusLocked}
                          />
                        </FormControl>
                        <FormLabel className={`cursor-pointer ${isStatusLocked ? 'opacity-50' : ''}`}>
                          {t("occupied")}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem 
                            value={SPACE_STATUS.MAINTENANCE} 
                            disabled={isStatusLocked}
                          />
                        </FormControl>
                        <FormLabel className={`cursor-pointer ${isStatusLocked ? 'opacity-50' : ''}`}>
                          {t("maintenance")}
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  {isStatusLocked && (
                    <p className="text-xs text-[#D83B01]">
                      {t("cannotChangeStatusOfOccupiedSpace")}
                    </p>
                  )}
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

export default EditParkingSpaceModal;
