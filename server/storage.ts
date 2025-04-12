import {
  ParkingSpace,
  InsertParkingSpace,
  Household,
  InsertHousehold,
  Rental,
  InsertRental,
  ActivityLog,
  InsertActivityLog,
  SPACE_STATUS
} from "@shared/schema";

export interface IStorage {
  // Parking Space methods
  getAllParkingSpaces(): Promise<ParkingSpace[]>;
  getParkingSpaceById(id: number): Promise<ParkingSpace | undefined>;
  getParkingSpaceByNumber(spaceNumber: string): Promise<ParkingSpace | undefined>;
  createParkingSpace(space: InsertParkingSpace): Promise<ParkingSpace>;
  updateParkingSpace(id: number, space: Partial<InsertParkingSpace>): Promise<ParkingSpace | undefined>;
  deleteParkingSpace(id: number): Promise<boolean>;
  
  // Household methods
  getAllHouseholds(): Promise<Household[]>;
  getHouseholdById(id: number): Promise<Household | undefined>;
  getHouseholdByNumber(householdNumber: string): Promise<Household | undefined>;
  createHousehold(household: InsertHousehold): Promise<Household>;
  updateHousehold(id: number, household: Partial<InsertHousehold>): Promise<Household | undefined>;
  deleteHousehold(id: number): Promise<boolean>;
  
  // Rental methods
  getAllRentals(): Promise<Rental[]>;
  getActiveRentals(): Promise<Rental[]>;
  getRentalById(id: number): Promise<Rental | undefined>;
  getRentalsByParkingSpaceId(parkingSpaceId: number): Promise<Rental[]>;
  getRentalsByHouseholdId(householdId: number): Promise<Rental[]>;
  createRental(rental: InsertRental): Promise<Rental>;
  updateRental(id: number, rental: Partial<InsertRental>): Promise<Rental | undefined>;
  endRental(id: number): Promise<boolean>;
  
  // Activity logs
  getAllActivityLogs(limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  
  // Extended methods for specific business logic
  getAvailableParkingSpaces(): Promise<ParkingSpace[]>;
  getExpiringRentals(daysThreshold: number): Promise<Rental[]>;
  getDashboardStats(): Promise<{
    totalSpaces: number;
    occupiedSpaces: number;
    availableSpaces: number;
    maintenanceSpaces: number;
    activeRentalsCount: number;
  }>;
}

export class MemStorage implements IStorage {
  private parkingSpaces: Map<number, ParkingSpace>;
  private households: Map<number, Household>;
  private rentals: Map<number, Rental>;
  private activityLogs: Map<number, ActivityLog>;
  
  private parkingSpaceCurrentId: number;
  private householdCurrentId: number;
  private rentalCurrentId: number;
  private activityLogCurrentId: number;
  
  constructor() {
    this.parkingSpaces = new Map();
    this.households = new Map();
    this.rentals = new Map();
    this.activityLogs = new Map();
    
    this.parkingSpaceCurrentId = 1;
    this.householdCurrentId = 1;
    this.rentalCurrentId = 1;
    this.activityLogCurrentId = 1;
    
    // Initialize with some default data
    this.initializeData();
  }
  
  private initializeData() {
    // Sample areas
    const areas = ["A", "B", "C"];
    
    // Generate parking spaces
    for (let area of areas) {
      for (let i = 1; i <= 10; i++) {
        const number = i.toString().padStart(2, '0');
        this.createParkingSpace({
          spaceNumber: `${area}-${number}`,
          area,
          status: SPACE_STATUS.AVAILABLE,
          notes: ""
        });
      }
    }
    
    // Create a few sample households
    this.createHousehold({
      householdNumber: "1201",
      contactName: "王小明",
      contactPhone: "0912-345-678",
      notes: ""
    });
    
    this.createHousehold({
      householdNumber: "1502",
      contactName: "張大華",
      contactPhone: "0923-456-789",
      notes: ""
    });
  }

  // Parking Space methods
  async getAllParkingSpaces(): Promise<ParkingSpace[]> {
    return Array.from(this.parkingSpaces.values());
  }
  
  async getParkingSpaceById(id: number): Promise<ParkingSpace | undefined> {
    return this.parkingSpaces.get(id);
  }
  
  async getParkingSpaceByNumber(spaceNumber: string): Promise<ParkingSpace | undefined> {
    return Array.from(this.parkingSpaces.values()).find(
      (space) => space.spaceNumber === spaceNumber
    );
  }
  
  async createParkingSpace(space: InsertParkingSpace): Promise<ParkingSpace> {
    const id = this.parkingSpaceCurrentId++;
    const newSpace: ParkingSpace = { ...space, id };
    this.parkingSpaces.set(id, newSpace);
    
    // Log the activity
    await this.createActivityLog({
      activityType: "SPACE_CREATED",
      description: `新增車位 ${space.spaceNumber}`,
      relatedId: id
    });
    
    return newSpace;
  }
  
  async updateParkingSpace(id: number, space: Partial<InsertParkingSpace>): Promise<ParkingSpace | undefined> {
    const existingSpace = this.parkingSpaces.get(id);
    if (!existingSpace) return undefined;
    
    const updatedSpace = { ...existingSpace, ...space };
    this.parkingSpaces.set(id, updatedSpace);
    
    // Log the activity
    await this.createActivityLog({
      activityType: "SPACE_UPDATED",
      description: `更新車位 ${updatedSpace.spaceNumber} 資訊`,
      relatedId: id
    });
    
    return updatedSpace;
  }
  
  async deleteParkingSpace(id: number): Promise<boolean> {
    const space = this.parkingSpaces.get(id);
    if (!space) return false;
    
    // Check if there are active rentals for this space
    const activeRentals = await this.getRentalsByParkingSpaceId(id);
    if (activeRentals.some(rental => rental.isActive)) {
      return false;
    }
    
    const deleted = this.parkingSpaces.delete(id);
    
    if (deleted) {
      // Log the activity
      await this.createActivityLog({
        activityType: "SPACE_DELETED",
        description: `刪除車位 ${space.spaceNumber}`,
        relatedId: null
      });
    }
    
    return deleted;
  }
  
  // Household methods
  async getAllHouseholds(): Promise<Household[]> {
    return Array.from(this.households.values());
  }
  
  async getHouseholdById(id: number): Promise<Household | undefined> {
    return this.households.get(id);
  }
  
  async getHouseholdByNumber(householdNumber: string): Promise<Household | undefined> {
    return Array.from(this.households.values()).find(
      (household) => household.householdNumber === householdNumber
    );
  }
  
  async createHousehold(household: InsertHousehold): Promise<Household> {
    const id = this.householdCurrentId++;
    const newHousehold: Household = { ...household, id };
    this.households.set(id, newHousehold);
    
    // Log the activity
    await this.createActivityLog({
      activityType: "HOUSEHOLD_CREATED",
      description: `新增住戶 ${household.householdNumber}`,
      relatedId: id
    });
    
    return newHousehold;
  }
  
  async updateHousehold(id: number, household: Partial<InsertHousehold>): Promise<Household | undefined> {
    const existingHousehold = this.households.get(id);
    if (!existingHousehold) return undefined;
    
    const updatedHousehold = { ...existingHousehold, ...household };
    this.households.set(id, updatedHousehold);
    
    // Log the activity
    await this.createActivityLog({
      activityType: "HOUSEHOLD_UPDATED",
      description: `更新住戶 ${updatedHousehold.householdNumber} 資訊`,
      relatedId: id
    });
    
    return updatedHousehold;
  }
  
  async deleteHousehold(id: number): Promise<boolean> {
    const household = this.households.get(id);
    if (!household) return false;
    
    // Check if there are active rentals for this household
    const activeRentals = await this.getRentalsByHouseholdId(id);
    if (activeRentals.some(rental => rental.isActive)) {
      return false;
    }
    
    const deleted = this.households.delete(id);
    
    if (deleted) {
      // Log the activity
      await this.createActivityLog({
        activityType: "HOUSEHOLD_DELETED",
        description: `刪除住戶 ${household.householdNumber}`,
        relatedId: null
      });
    }
    
    return deleted;
  }
  
  // Rental methods
  async getAllRentals(): Promise<Rental[]> {
    return Array.from(this.rentals.values());
  }
  
  async getActiveRentals(): Promise<Rental[]> {
    return Array.from(this.rentals.values()).filter(rental => rental.isActive);
  }
  
  async getRentalById(id: number): Promise<Rental | undefined> {
    return this.rentals.get(id);
  }
  
  async getRentalsByParkingSpaceId(parkingSpaceId: number): Promise<Rental[]> {
    return Array.from(this.rentals.values()).filter(
      (rental) => rental.parkingSpaceId === parkingSpaceId
    );
  }
  
  async getRentalsByHouseholdId(householdId: number): Promise<Rental[]> {
    return Array.from(this.rentals.values()).filter(
      (rental) => rental.householdId === householdId
    );
  }
  
  async createRental(rental: InsertRental): Promise<Rental> {
    const id = this.rentalCurrentId++;
    const newRental: Rental = { 
      ...rental, 
      id, 
      createdAt: new Date() 
    };
    this.rentals.set(id, newRental);
    
    // Update the parking space status to occupied
    const space = await this.getParkingSpaceById(rental.parkingSpaceId);
    if (space) {
      await this.updateParkingSpace(space.id, { status: SPACE_STATUS.OCCUPIED });
    }
    
    // Log the activity
    const spaceNumber = space ? space.spaceNumber : `ID: ${rental.parkingSpaceId}`;
    const household = await this.getHouseholdById(rental.householdId);
    const householdNumber = household ? household.householdNumber : `ID: ${rental.householdId}`;
    
    await this.createActivityLog({
      activityType: "RENTAL_CREATED",
      description: `新增租借: 車位 ${spaceNumber} 租給 ${householdNumber}室 (${rental.licensePlate})`,
      relatedId: id
    });
    
    return newRental;
  }
  
  async updateRental(id: number, rentalUpdate: Partial<InsertRental>): Promise<Rental | undefined> {
    const existingRental = this.rentals.get(id);
    if (!existingRental) return undefined;
    
    const updatedRental = { ...existingRental, ...rentalUpdate };
    this.rentals.set(id, updatedRental);
    
    // Log the activity
    await this.createActivityLog({
      activityType: "RENTAL_UPDATED",
      description: `更新租借記錄 ID: ${id}`,
      relatedId: id
    });
    
    return updatedRental;
  }
  
  async endRental(id: number): Promise<boolean> {
    const rental = this.rentals.get(id);
    if (!rental) return false;
    
    // Update the rental to inactive
    rental.isActive = false;
    this.rentals.set(id, rental);
    
    // Update the parking space status to available
    const space = await this.getParkingSpaceById(rental.parkingSpaceId);
    if (space) {
      await this.updateParkingSpace(space.id, { status: SPACE_STATUS.AVAILABLE });
      
      // Log the activity
      await this.createActivityLog({
        activityType: "RENTAL_ENDED",
        description: `租約結束: 車位 ${space.spaceNumber} (${rental.licensePlate}) 租約到期`,
        relatedId: id
      });
    }
    
    return true;
  }
  
  // Activity logs
  async getAllActivityLogs(limit?: number): Promise<ActivityLog[]> {
    const logs = Array.from(this.activityLogs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? logs.slice(0, limit) : logs;
  }
  
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const id = this.activityLogCurrentId++;
    const newLog: ActivityLog = { 
      ...log, 
      id, 
      timestamp: new Date() 
    };
    this.activityLogs.set(id, newLog);
    return newLog;
  }
  
  // Extended methods for specific business logic
  async getAvailableParkingSpaces(): Promise<ParkingSpace[]> {
    return Array.from(this.parkingSpaces.values()).filter(
      (space) => space.status === SPACE_STATUS.AVAILABLE
    );
  }
  
  async getExpiringRentals(daysThreshold: number): Promise<Rental[]> {
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + daysThreshold);
    
    return Array.from(this.rentals.values()).filter(rental => {
      if (!rental.isActive) return false;
      
      const endDate = new Date(rental.endDate);
      return endDate <= thresholdDate && endDate >= today;
    });
  }
  
  async getDashboardStats(): Promise<{
    totalSpaces: number;
    occupiedSpaces: number;
    availableSpaces: number;
    maintenanceSpaces: number;
    activeRentalsCount: number;
  }> {
    const allSpaces = await this.getAllParkingSpaces();
    const activeRentals = await this.getActiveRentals();
    
    const totalSpaces = allSpaces.length;
    const occupiedSpaces = allSpaces.filter(space => space.status === SPACE_STATUS.OCCUPIED).length;
    const maintenanceSpaces = allSpaces.filter(space => space.status === SPACE_STATUS.MAINTENANCE).length;
    const availableSpaces = allSpaces.filter(space => space.status === SPACE_STATUS.AVAILABLE).length;
    const activeRentalsCount = activeRentals.length;
    
    return {
      totalSpaces,
      occupiedSpaces,
      availableSpaces,
      maintenanceSpaces,
      activeRentalsCount
    };
  }
}

export const storage = new MemStorage();
