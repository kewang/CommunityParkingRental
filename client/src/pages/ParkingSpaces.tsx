import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Search, Pencil, Trash, Info } from "lucide-react";
import { ParkingSpace, SPACE_STATUS } from "@shared/schema";
import { STATUS_COLORS } from "@/types";
import { useToast } from "@/hooks/use-toast";
import AddParkingSpaceModal from "@/components/modals/AddParkingSpaceModal";
import EditParkingSpaceModal from "@/components/modals/EditParkingSpaceModal";

const ParkingSpaces = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // State for filtering and pagination
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  
  // Fetch parking spaces
  const { data: parkingSpaces, isLoading } = useQuery<ParkingSpace[]>({
    queryKey: ['/api/parking-spaces'],
  });
  
  // Delete parking space mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/parking-spaces/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parking-spaces'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: t("successTitle"),
        description: "車位已刪除成功 / Parking space deleted successfully",
        variant: "default",
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
  
  // Handle delete
  const handleDelete = (space: ParkingSpace) => {
    if (space.status === SPACE_STATUS.OCCUPIED) {
      toast({
        title: t("errorTitle"),
        description: "無法刪除已租用的車位 / Cannot delete an occupied parking space",
        variant: "destructive",
      });
      return;
    }
    
    if (confirm(`確定要刪除車位 ${space.spaceNumber} 嗎? / Are you sure you want to delete space ${space.spaceNumber}?`)) {
      deleteMutation.mutate(space.id);
    }
  };
  
  // Filter spaces based on criteria
  const filteredSpaces = parkingSpaces?.filter(space => {
    let matchesArea = areaFilter === "all" || space.area === areaFilter;
    let matchesStatus = statusFilter === "all" || space.status === statusFilter;
    let matchesSearch = searchQuery === "" || space.spaceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesArea && matchesStatus && matchesSearch;
  }) || [];
  
  // Pagination
  const spacesPerPage = 10;
  const totalPages = Math.ceil(filteredSpaces.length / spacesPerPage);
  const paginatedSpaces = filteredSpaces.slice(
    (currentPage - 1) * spacesPerPage,
    currentPage * spacesPerPage
  );
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t("spaceManagement")}</h2>
        <Button onClick={() => setShowAddModal(true)} className="bg-primary text-white">
          <Plus className="mr-2 h-4 w-4" /> {t("addParkingSpace")}
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center">
            <label className="mr-2 text-sm">{t("area")}:</label>
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue placeholder={t("area")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                <SelectItem value="A">A {t("area")}</SelectItem>
                <SelectItem value="B">B {t("area")}</SelectItem>
                <SelectItem value="C">C {t("area")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center">
            <label className="mr-2 text-sm">{t("status")}:</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue placeholder={t("status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                <SelectItem value={SPACE_STATUS.AVAILABLE}>{t("available")}</SelectItem>
                <SelectItem value={SPACE_STATUS.OCCUPIED}>{t("occupied")}</SelectItem>
                <SelectItem value={SPACE_STATUS.MAINTENANCE}>{t("maintenance")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center ml-auto">
            <Input
              type="text"
              placeholder={`${t("search")} ${t("spaceNumber")}...`}
              className="w-40 h-8"
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
                <TableHead>{t("spaceNumber")}</TableHead>
                <TableHead>{t("area")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("rentalPeriod")}</TableHead>
                <TableHead>{t("licensePlate")}</TableHead>
                <TableHead>{t("householdNumber")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 7 }).map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedSpaces.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    {t("noSpacesFound")}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSpaces.map((space) => {
                  const statusColor = STATUS_COLORS[space.status];
                  return (
                    <TableRow key={space.id} className="border-b">
                      <TableCell>{space.spaceNumber}</TableCell>
                      <TableCell>{space.area} {t("area")}</TableCell>
                      <TableCell>
                        <Badge className={`${statusColor.bg} ${statusColor.text} font-normal`}>
                          {t(statusColor.label)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {space.status === SPACE_STATUS.OCCUPIED ? "2023/09/01 - 2023/12/31" : "-"}
                      </TableCell>
                      <TableCell>
                        {space.status === SPACE_STATUS.OCCUPIED ? "台北-888" : "-"}
                      </TableCell>
                      <TableCell>
                        {space.status === SPACE_STATUS.OCCUPIED ? "1201" : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-primary" 
                            onClick={() => {
                              setSelectedSpace(space);
                              setShowEditModal(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          
                          {space.status === SPACE_STATUS.OCCUPIED ? (
                            <Button variant="ghost" size="icon" className="text-primary">
                              <Info className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-[#D83B01]" 
                              onClick={() => handleDelete(space)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex justify-between mt-4">
          <div className="text-sm text-[#605E5C]">
            {t("showing")} {(currentPage - 1) * spacesPerPage + 1}-
            {Math.min(currentPage * spacesPerPage, filteredSpaces.length)} / {filteredSpaces.length}
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
      
      {/* Add Parking Space Modal */}
      <AddParkingSpaceModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
      
      {/* Edit Parking Space Modal */}
      {selectedSpace && (
        <EditParkingSpaceModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          parkingSpace={selectedSpace}
        />
      )}
    </div>
  );
};

export default ParkingSpaces;
