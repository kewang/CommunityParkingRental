import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
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
import { Plus, Search, Calendar, Car, User, FileText, CheckCircle } from "lucide-react";
import { Rental } from "@shared/schema";
import { format } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";
import RentParkingSpaceModal from "@/components/modals/RentParkingSpaceModal";

const Rentals = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'zh' | 'en';
  
  // State for filtering and pagination
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Modals state
  const [showRentModal, setShowRentModal] = useState<boolean>(false);
  
  // Format date based on language
  const formatDate = (date: Date) => {
    const locale = lang === 'zh' ? zhCN : enUS;
    const formatStr = lang === 'zh' ? 'yyyy/MM/dd' : 'MM/dd/yyyy';
    return format(new Date(date), formatStr, { locale });
  };
  
  // Fetch rentals
  const { data: rentals, isLoading } = useQuery<Rental[]>({
    queryKey: ['/api/rentals'],
  });
  
  // Filter rentals based on criteria
  const filteredRentals = rentals?.filter(rental => {
    let matchesStatus = statusFilter === "all" || 
                        (statusFilter === "active" && rental.isActive) || 
                        (statusFilter === "inactive" && !rental.isActive);
    
    let matchesSearch = searchQuery === "" || 
                       rental.licensePlate.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  }) || [];
  
  // Pagination
  const rentalsPerPage = 10;
  const totalPages = Math.ceil(filteredRentals.length / rentalsPerPage);
  const paginatedRentals = filteredRentals.slice(
    (currentPage - 1) * rentalsPerPage,
    currentPage * rentalsPerPage
  );
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t("rentals")}</h2>
        <Button onClick={() => setShowRentModal(true)} className="bg-primary text-white">
          <Plus className="mr-2 h-4 w-4" /> {t("newRental")}
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center">
            <label className="mr-2 text-sm">{t("status")}:</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue placeholder={t("status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                <SelectItem value="active">{t("active")}</SelectItem>
                <SelectItem value="inactive">{t("inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center ml-auto">
            <Input
              type="text"
              placeholder={`${t("search")} ${t("licensePlate")}...`}
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
                <TableHead>{t("householdNumber")}</TableHead>
                <TableHead>{t("licensePlate")}</TableHead>
                <TableHead>{t("startDate")}</TableHead>
                <TableHead>{t("endDate")}</TableHead>
                <TableHead>{t("status")}</TableHead>
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
              ) : paginatedRentals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    {t("noRentalsFound")}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRentals.map((rental) => {
                  // In a real app, we would fetch related entities
                  // Mocking the space number for now
                  const spaceNumber = `A-${100 + (rental.parkingSpaceId % 10)}`;
                  const householdNumber = `${1200 + (rental.householdId % 10)}`;
                  
                  return (
                    <TableRow key={rental.id} className="border-b">
                      <TableCell>{spaceNumber}</TableCell>
                      <TableCell>{householdNumber}</TableCell>
                      <TableCell>{rental.licensePlate}</TableCell>
                      <TableCell>{formatDate(new Date(rental.startDate))}</TableCell>
                      <TableCell>{formatDate(new Date(rental.endDate))}</TableCell>
                      <TableCell>
                        <Badge className={rental.isActive ? "bg-green-100 text-[#107C10]" : "bg-gray-200 text-[#797775]"}>
                          {rental.isActive ? t("active") : t("expired")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="icon" className="text-primary">
                            <FileText className="h-4 w-4" />
                          </Button>
                          {rental.isActive && (
                            <Button variant="ghost" size="icon" className="text-[#107C10]">
                              <CheckCircle className="h-4 w-4" />
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
            {t("showing")} {(currentPage - 1) * rentalsPerPage + 1}-
            {Math.min(currentPage * rentalsPerPage, filteredRentals.length)} / {filteredRentals.length}
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
      
      {/* Rent Parking Space Modal */}
      <RentParkingSpaceModal
        open={showRentModal}
        onClose={() => setShowRentModal(false)}
      />
    </div>
  );
};

export default Rentals;
