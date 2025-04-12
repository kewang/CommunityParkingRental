import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Pencil, Trash, Car } from "lucide-react";
import { Household } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { householdFormSchema } from "@shared/schema";

type HouseholdFormValues = z.infer<typeof householdFormSchema>;

const Households = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // State for filtering and pagination
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editHousehold, setEditHousehold] = useState<Household | null>(null);
  
  // Fetch households
  const { data: households, isLoading } = useQuery<Household[]>({
    queryKey: ['/api/households'],
  });
  
  // Form for adding/editing household
  const form = useForm<HouseholdFormValues>({
    resolver: zodResolver(householdFormSchema),
    defaultValues: {
      householdNumber: "",
      contactName: "",
      contactPhone: "",
      notes: "",
    },
  });
  
  // Reset form when modal is closed
  const resetForm = () => {
    form.reset({
      householdNumber: "",
      contactName: "",
      contactPhone: "",
      notes: "",
    });
    setEditHousehold(null);
  };
  
  // Update form when editing
  useState(() => {
    if (editHousehold) {
      form.reset({
        householdNumber: editHousehold.householdNumber,
        contactName: editHousehold.contactName || "",
        contactPhone: editHousehold.contactPhone || "",
        notes: editHousehold.notes || "",
      });
    } else {
      resetForm();
    }
  });
  
  // Add household mutation
  const addMutation = useMutation({
    mutationFn: async (values: HouseholdFormValues) => {
      return await apiRequest('POST', '/api/households', values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/households'] });
      setShowAddModal(false);
      resetForm();
      toast({
        title: t("successTitle"),
        description: "住戶已新增成功 / Household added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: t("errorTitle"),
        description: `${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Update household mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: HouseholdFormValues }) => {
      return await apiRequest('PUT', `/api/households/${id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/households'] });
      setEditHousehold(null);
      resetForm();
      toast({
        title: t("successTitle"),
        description: "住戶已更新成功 / Household updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: t("errorTitle"),
        description: `${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete household mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/households/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/households'] });
      toast({
        title: t("successTitle"),
        description: "住戶已刪除成功 / Household deleted successfully",
      });
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
  const onSubmit = (values: HouseholdFormValues) => {
    if (editHousehold) {
      updateMutation.mutate({ id: editHousehold.id, values });
    } else {
      addMutation.mutate(values);
    }
  };
  
  // Handle delete
  const handleDelete = (household: Household) => {
    if (confirm(`確定要刪除住戶 ${household.householdNumber} 嗎? / Are you sure you want to delete household ${household.householdNumber}?`)) {
      deleteMutation.mutate(household.id);
    }
  };
  
  // Filter households based on search query
  const filteredHouseholds = households?.filter(household => {
    return searchQuery === "" || 
           household.householdNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (household.contactName && household.contactName.toLowerCase().includes(searchQuery.toLowerCase()));
  }) || [];
  
  // Pagination
  const householdsPerPage = 10;
  const totalPages = Math.ceil(filteredHouseholds.length / householdsPerPage);
  const paginatedHouseholds = filteredHouseholds.slice(
    (currentPage - 1) * householdsPerPage,
    currentPage * householdsPerPage
  );
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t("households")}</h2>
        <Button onClick={() => setShowAddModal(true)} className="bg-primary text-white">
          <Plus className="mr-2 h-4 w-4" /> {t("add")} {t("households")}
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center ml-auto">
            <Input
              type="text"
              placeholder={`${t("search")} ${t("householdNumber")}...`}
              className="w-48 h-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button size="sm" className="bg-primary text-white ml-1 h-8">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#F3F2F1]">
              <TableRow>
                <TableHead>{t("householdNumber")}</TableHead>
                <TableHead>{t("contactName")}</TableHead>
                <TableHead>{t("contact")}</TableHead>
                <TableHead>{t("parkingSpaces")}</TableHead>
                <TableHead>{t("notes")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 6 }).map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedHouseholds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    {t("noHouseholdsFound")}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedHouseholds.map((household) => (
                  <TableRow key={household.id} className="border-b">
                    <TableCell>{household.householdNumber}</TableCell>
                    <TableCell>{household.contactName || "-"}</TableCell>
                    <TableCell>{household.contactPhone || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Car className="h-4 w-4 mr-1 text-primary" />
                        <span>1</span> {/* In a real app, this would be the count of parking spaces */}
                      </div>
                    </TableCell>
                    <TableCell>{household.notes || "-"}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-primary" 
                          onClick={() => setEditHousehold(household)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-[#D83B01]" 
                          onClick={() => handleDelete(household)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex justify-between mt-4">
          <div className="text-sm text-[#605E5C]">
            {t("showing")} {(currentPage - 1) * householdsPerPage + 1}-
            {Math.min(currentPage * householdsPerPage, filteredHouseholds.length)} / {filteredHouseholds.length}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} 
                  className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(3, totalPages) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <PaginationItem key={i}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {totalPages > 3 && <PaginationEllipsis />}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} 
                  className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
      
      {/* Add/Edit Household Modal */}
      <Dialog 
        open={showAddModal || editHousehold !== null} 
        onOpenChange={(open) => {
          if (!open) {
            setShowAddModal(false);
            setEditHousehold(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editHousehold ? t("edit") : t("add")} {t("households")}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="householdNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("householdNumber")}</FormLabel>
                    <FormControl>
                      <Input placeholder="例: 1201" {...field} disabled={!!editHousehold} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("contactName")}</FormLabel>
                    <FormControl>
                      <Input placeholder="例: 王小明" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("contact")}</FormLabel>
                    <FormControl>
                      <Input placeholder="例: 0912-345-678" {...field} />
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
                      <Input placeholder={t("notes")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditHousehold(null);
                    resetForm();
                  }}
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={addMutation.isPending || updateMutation.isPending}
                >
                  {t("save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Households;
