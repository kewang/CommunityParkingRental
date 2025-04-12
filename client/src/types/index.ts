import { 
  ParkingSpace, 
  Household, 
  Rental, 
  ActivityLog,
  SPACE_STATUS
} from "@shared/schema";

export interface DashboardStats {
  totalSpaces: number;
  occupiedSpaces: number;
  availableSpaces: number;
  maintenanceSpaces: number;
  activeRentalsCount: number;
}

export interface ParkingSpaceWithRental extends ParkingSpace {
  currentRental?: RentalWithDetails;
}

export interface RentalWithDetails extends Rental {
  parkingSpace?: ParkingSpace;
  household?: Household;
}

// Match the color scheme with the design reference
export const STATUS_COLORS = {
  [SPACE_STATUS.AVAILABLE]: {
    bg: "bg-green-100",
    text: "text-[#107C10]",
    label: "available"
  },
  [SPACE_STATUS.OCCUPIED]: {
    bg: "bg-red-100",
    text: "text-[#D83B01]",
    label: "occupied"
  },
  [SPACE_STATUS.MAINTENANCE]: {
    bg: "bg-gray-200",
    text: "text-[#797775]",
    label: "maintenance"
  }
};

export const ACTIVITY_COLORS = {
  "RENTAL_CREATED": "border-[#D83B01]",
  "RENTAL_ENDED": "border-[#107C10]",
  "SPACE_UPDATED": "border-[#FFB900]",
  "SPACE_CREATED": "border-[#0078D4]",
  "HOUSEHOLD_CREATED": "border-[#0078D4]",
  "HOUSEHOLD_UPDATED": "border-[#FFB900]",
  "RENTAL_UPDATED": "border-[#FFB900]",
};
