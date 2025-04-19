import {
  ParkingSpace,
  InsertParkingSpace,
  Household,
  InsertHousehold,
  Rental,
  InsertRental,
  ActivityLog,
  InsertActivityLog,
  SPACE_STATUS,
  RentalRequest,
  InsertRentalRequest,
  ParkingOffer,
  InsertParkingOffer,
  REQUEST_STATUS,
  parkingSpaces,
  households,
  rentals,
  activityLogs,
  rentalRequests,
  parkingOffers
} from "@shared/schema";
import { eq, and, desc, asc, gte, lte, count, sql } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

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
  
  // Rental Request methods (for simplified parking system)
  getAllRentalRequests(): Promise<RentalRequest[]>;
  getRentalRequestById(id: number): Promise<RentalRequest | undefined>;
  createRentalRequest(request: InsertRentalRequest): Promise<RentalRequest>;
  updateRentalRequestStatus(id: number, status: keyof typeof REQUEST_STATUS): Promise<RentalRequest | undefined>;
  
  // Parking Offer methods (for simplified parking system)
  getParkingOffersByRequestId(requestId: number): Promise<ParkingOffer[]>;
  createParkingOffer(offer: InsertParkingOffer): Promise<ParkingOffer>;
}

export class MemStorage implements IStorage {
  private parkingSpaces: Map<number, ParkingSpace>;
  private households: Map<number, Household>;
  private rentals: Map<number, Rental>;
  private activityLogs: Map<number, ActivityLog>;
  private rentalRequests: Map<number, RentalRequest>;
  private parkingOffers: Map<number, ParkingOffer>;
  
  private parkingSpaceCurrentId: number;
  private householdCurrentId: number;
  private rentalCurrentId: number;
  private activityLogCurrentId: number;
  private rentalRequestCurrentId: number;
  private parkingOfferCurrentId: number;
  
  constructor() {
    this.parkingSpaces = new Map();
    this.households = new Map();
    this.rentals = new Map();
    this.activityLogs = new Map();
    this.rentalRequests = new Map();
    this.parkingOffers = new Map();
    
    this.parkingSpaceCurrentId = 1;
    this.householdCurrentId = 1;
    this.rentalCurrentId = 1;
    this.activityLogCurrentId = 1;
    this.rentalRequestCurrentId = 1;
    this.parkingOfferCurrentId = 1;
    
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
  
  // Rental Request methods (for simplified parking system)
  async getAllRentalRequests(): Promise<RentalRequest[]> {
    return Array.from(this.rentalRequests.values());
  }
  
  async getRentalRequestById(id: number): Promise<RentalRequest | undefined> {
    return this.rentalRequests.get(id);
  }
  
  async createRentalRequest(request: InsertRentalRequest): Promise<RentalRequest> {
    const id = this.rentalRequestCurrentId++;
    const newRequest: RentalRequest = {
      ...request,
      id,
      status: REQUEST_STATUS.PENDING,
      createdAt: new Date()
    };
    this.rentalRequests.set(id, newRequest);
    
    // Log the activity
    await this.createActivityLog({
      activityType: "REQUEST_CREATED",
      description: `新增租借申請: ${request.name} (${request.licensePlate})`,
      relatedId: id
    });
    
    return newRequest;
  }
  
  async updateRentalRequestStatus(id: number, status: keyof typeof REQUEST_STATUS): Promise<RentalRequest | undefined> {
    const existingRequest = this.rentalRequests.get(id);
    if (!existingRequest) return undefined;
    
    const updatedRequest = { ...existingRequest, status };
    this.rentalRequests.set(id, updatedRequest);
    
    // Log the activity
    await this.createActivityLog({
      activityType: "REQUEST_UPDATED",
      description: `更新租借申請狀態: ${id} 至 ${status}`,
      relatedId: id
    });
    
    return updatedRequest;
  }
  
  // Parking Offer methods (for simplified parking system)
  async getParkingOffersByRequestId(requestId: number): Promise<ParkingOffer[]> {
    return Array.from(this.parkingOffers.values()).filter(
      (offer) => offer.requestId === requestId
    );
  }
  
  async createParkingOffer(offer: InsertParkingOffer): Promise<ParkingOffer> {
    const id = this.parkingOfferCurrentId++;
    const newOffer: ParkingOffer = {
      ...offer,
      id,
      createdAt: new Date()
    };
    this.parkingOffers.set(id, newOffer);
    
    // Update the rental request status to matched
    const request = await this.getRentalRequestById(offer.requestId);
    if (request) {
      await this.updateRentalRequestStatus(request.id, REQUEST_STATUS.MATCHED);
    }
    
    // Log the activity
    await this.createActivityLog({
      activityType: "OFFER_CREATED",
      description: `車位提供: ${offer.ownerName} 提供車位 ${offer.spaceNumber} 給請求 ${offer.requestId}`,
      relatedId: id
    });
    
    return newOffer;
  }
}

export class DatabaseStorage implements IStorage {
  // Parking Space methods
  async getAllParkingSpaces(): Promise<ParkingSpace[]> {
    const { db } = await import('./db');
    const { parkingSpaces } = await import('@shared/schema');
    return await db.select().from(parkingSpaces);
  }

  async getParkingSpaceById(id: number): Promise<ParkingSpace | undefined> {
    const { db } = await import('./db');
    const { parkingSpaces } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    const [space] = await db.select().from(parkingSpaces).where(eq(parkingSpaces.id, id));
    return space;
  }

  async getParkingSpaceByNumber(spaceNumber: string): Promise<ParkingSpace | undefined> {
    const { db } = await import('./db');
    const { parkingSpaces } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    const [space] = await db.select().from(parkingSpaces).where(eq(parkingSpaces.spaceNumber, spaceNumber));
    return space;
  }

  async createParkingSpace(space: InsertParkingSpace): Promise<ParkingSpace> {
    const { db } = await import('./db');
    const [newSpace] = await db.insert(schema.parkingSpaces).values(space).returning();
    
    // Log the activity
    await this.createActivityLog({
      activityType: "SPACE_CREATED",
      description: `新增車位 ${space.spaceNumber}`,
      relatedId: newSpace.id
    });
    
    return newSpace;
  }

  async updateParkingSpace(id: number, space: Partial<InsertParkingSpace>): Promise<ParkingSpace | undefined> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    const [updatedSpace] = await db.update(schema.parkingSpaces)
      .set(space)
      .where(eq(schema.parkingSpaces.id, id))
      .returning();
    
    if (updatedSpace) {
      // Log the activity
      await this.createActivityLog({
        activityType: "SPACE_UPDATED",
        description: `更新車位 ${updatedSpace.spaceNumber} 資訊`,
        relatedId: id
      });
    }
    
    return updatedSpace;
  }

  async deleteParkingSpace(id: number): Promise<boolean> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    
    // 先獲取空間信息用於日誌記錄
    const [space] = await db.select().from(schema.parkingSpaces).where(eq(schema.parkingSpaces.id, id));
    if (!space) return false;
    
    // 檢查是否有相關的租賃
    const rentals = await this.getRentalsByParkingSpaceId(id);
    if (rentals.some(rental => rental.isActive)) {
      return false;
    }
    
    const result = await db.delete(schema.parkingSpaces).where(eq(schema.parkingSpaces.id, id));
    
    if (result.count > 0) {
      // Log the activity
      await this.createActivityLog({
        activityType: "SPACE_DELETED",
        description: `刪除車位 ${space.spaceNumber}`,
        relatedId: null
      });
      return true;
    }
    
    return false;
  }
  
  // Household methods
  async getAllHouseholds(): Promise<Household[]> {
    const { db } = await import('./db');
    return await db.select().from(schema.households);
  }

  async getHouseholdById(id: number): Promise<Household | undefined> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    const [household] = await db.select().from(schema.households).where(eq(schema.households.id, id));
    return household;
  }

  async getHouseholdByNumber(householdNumber: string): Promise<Household | undefined> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    const [household] = await db.select().from(schema.households).where(eq(schema.households.householdNumber, householdNumber));
    return household;
  }

  async createHousehold(household: InsertHousehold): Promise<Household> {
    const { db } = await import('./db');
    const [newHousehold] = await db.insert(schema.households).values(household).returning();
    
    // Log the activity
    await this.createActivityLog({
      activityType: "HOUSEHOLD_CREATED",
      description: `新增住戶 ${household.householdNumber}`,
      relatedId: newHousehold.id
    });
    
    return newHousehold;
  }

  async updateHousehold(id: number, household: Partial<InsertHousehold>): Promise<Household | undefined> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    const [updatedHousehold] = await db.update(schema.households)
      .set(household)
      .where(eq(schema.households.id, id))
      .returning();
    
    if (updatedHousehold) {
      // Log the activity
      await this.createActivityLog({
        activityType: "HOUSEHOLD_UPDATED",
        description: `更新住戶 ${updatedHousehold.householdNumber} 資訊`,
        relatedId: id
      });
    }
    
    return updatedHousehold;
  }

  async deleteHousehold(id: number): Promise<boolean> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    
    // 先獲取住戶信息用於日誌記錄
    const [household] = await db.select().from(schema.households).where(eq(schema.households.id, id));
    if (!household) return false;
    
    // 檢查是否有相關的租賃
    const rentals = await this.getRentalsByHouseholdId(id);
    if (rentals.some(rental => rental.isActive)) {
      return false;
    }
    
    const result = await db.delete(schema.households).where(eq(schema.households.id, id));
    
    if (result.count > 0) {
      // Log the activity
      await this.createActivityLog({
        activityType: "HOUSEHOLD_DELETED",
        description: `刪除住戶 ${household.householdNumber}`,
        relatedId: null
      });
      return true;
    }
    
    return false;
  }
  
  // Rental methods
  async getAllRentals(): Promise<Rental[]> {
    const { db } = await import('./db');
    const { rentals } = await import('@shared/schema');
    return await db.select().from(rentals);
  }

  async getActiveRentals(): Promise<Rental[]> {
    const { db } = await import('./db');
    const { rentals } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    return await db.select().from(rentals).where(eq(rentals.isActive, true));
  }

  async getRentalById(id: number): Promise<Rental | undefined> {
    const { db } = await import('./db');
    const { rentals } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    const [rental] = await db.select().from(rentals).where(eq(rentals.id, id));
    return rental;
  }

  async getRentalsByParkingSpaceId(parkingSpaceId: number): Promise<Rental[]> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    return await db.select().from(schema.rentals).where(eq(schema.rentals.parkingSpaceId, parkingSpaceId));
  }

  async getRentalsByHouseholdId(householdId: number): Promise<Rental[]> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    return await db.select().from(schema.rentals).where(eq(schema.rentals.householdId, householdId));
  }

  async createRental(rental: InsertRental): Promise<Rental> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    
    // 事務方法確保所有操作要麼一起成功，要麼一起失敗
    async function transaction() {
      const [newRental] = await db.insert(schema.rentals).values(rental).returning();
      
      // 更新車位狀態為已佔用
      await db.update(schema.parkingSpaces)
        .set({ status: SPACE_STATUS.OCCUPIED })
        .where(eq(schema.parkingSpaces.id, rental.parkingSpaceId));
      
      return newRental;
    }
    
    const newRental = await transaction();
    
    // 獲取相關信息用於日誌記錄
    const space = await this.getParkingSpaceById(rental.parkingSpaceId);
    const household = await this.getHouseholdById(rental.householdId);
    
    // Log the activity
    const spaceNumber = space ? space.spaceNumber : `ID: ${rental.parkingSpaceId}`;
    const householdNumber = household ? household.householdNumber : `ID: ${rental.householdId}`;
    
    await this.createActivityLog({
      activityType: "RENTAL_CREATED",
      description: `新增租借: 車位 ${spaceNumber} 租給 ${householdNumber}室 (${rental.licensePlate})`,
      relatedId: newRental.id
    });
    
    return newRental;
  }

  async updateRental(id: number, rentalUpdate: Partial<InsertRental>): Promise<Rental | undefined> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    const [updatedRental] = await db.update(schema.rentals)
      .set(rentalUpdate)
      .where(eq(schema.rentals.id, id))
      .returning();
    
    if (updatedRental) {
      // Log the activity
      await this.createActivityLog({
        activityType: "RENTAL_UPDATED",
        description: `更新租借記錄 ID: ${id}`,
        relatedId: id
      });
    }
    
    return updatedRental;
  }

  async endRental(id: number): Promise<boolean> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    
    // 先獲取租賃信息
    const [rental] = await db.select().from(schema.rentals).where(eq(schema.rentals.id, id));
    if (!rental || !rental.isActive) return false;
    
    // 事務方法確保所有操作要麼一起成功，要麼一起失敗
    async function transaction() {
      // 更新租賃為非活動狀態
      const result = await db.update(schema.rentals)
        .set({ isActive: false })
        .where(eq(schema.rentals.id, id));
      
      // 更新車位為可用狀態
      await db.update(schema.parkingSpaces)
        .set({ status: SPACE_STATUS.AVAILABLE })
        .where(eq(schema.parkingSpaces.id, rental.parkingSpaceId));
      
      return result.count > 0;
    }
    
    const success = await transaction();
    
    if (success) {
      // 獲取車位信息用於日誌記錄
      const space = await this.getParkingSpaceById(rental.parkingSpaceId);
      
      // Log the activity
      await this.createActivityLog({
        activityType: "RENTAL_ENDED",
        description: `租約結束: 車位 ${space ? space.spaceNumber : rental.parkingSpaceId} (${rental.licensePlate}) 租約到期`,
        relatedId: id
      });
    }
    
    return success;
  }
  
  // Activity logs
  async getAllActivityLogs(limit?: number): Promise<ActivityLog[]> {
    const { db } = await import('./db');
    const { desc } = await import('drizzle-orm');
    const query = db.select().from(schema.activityLogs).orderBy(desc(schema.activityLogs.timestamp));
    
    if (limit) {
      query.limit(limit);
    }
    
    return await query;
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const { db } = await import('./db');
    const { activityLogs } = await import('@shared/schema');
    const [newLog] = await db.insert(activityLogs).values({
      ...log,
      relatedId: log.relatedId || null,
      timestamp: new Date()
    }).returning();
    return newLog;
  }
  
  // Extended methods for specific business logic
  async getAvailableParkingSpaces(): Promise<ParkingSpace[]> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    return await db.select().from(schema.parkingSpaces)
      .where(eq(schema.parkingSpaces.status, SPACE_STATUS.AVAILABLE));
  }

  async getExpiringRentals(daysThreshold: number): Promise<Rental[]> {
    const { db } = await import('./db');
    const { eq, and, lte, gte } = await import('drizzle-orm');
    
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + daysThreshold);
    
    return await db.select().from(schema.rentals)
      .where(
        and(
          eq(schema.rentals.isActive, true),
          lte(schema.rentals.endDate, thresholdDate),
          gte(schema.rentals.endDate, today)
        )
      );
  }

  async getDashboardStats(): Promise<{
    totalSpaces: number;
    occupiedSpaces: number;
    availableSpaces: number;
    maintenanceSpaces: number;
    activeRentalsCount: number;
  }> {
    const { db } = await import('./db');
    const { eq, count } = await import('drizzle-orm');
    
    const [totalSpaces] = await db.select({ count: count() }).from(schema.parkingSpaces);
    
    const [occupiedSpaces] = await db.select({ count: count() })
      .from(schema.parkingSpaces)
      .where(eq(schema.parkingSpaces.status, SPACE_STATUS.OCCUPIED));
    
    const [availableSpaces] = await db.select({ count: count() })
      .from(schema.parkingSpaces)
      .where(eq(schema.parkingSpaces.status, SPACE_STATUS.AVAILABLE));
    
    const [maintenanceSpaces] = await db.select({ count: count() })
      .from(schema.parkingSpaces)
      .where(eq(schema.parkingSpaces.status, SPACE_STATUS.MAINTENANCE));
    
    const [activeRentalsCount] = await db.select({ count: count() })
      .from(schema.rentals)
      .where(eq(schema.rentals.isActive, true));
    
    return {
      totalSpaces: totalSpaces?.count || 0,
      occupiedSpaces: occupiedSpaces?.count || 0,
      availableSpaces: availableSpaces?.count || 0,
      maintenanceSpaces: maintenanceSpaces?.count || 0,
      activeRentalsCount: activeRentalsCount?.count || 0
    };
  }
  
  // Rental Request methods (for simplified parking system)
  async getAllRentalRequests(): Promise<RentalRequest[]> {
    const { db } = await import('./db');
    const { rentalRequests } = await import('@shared/schema');
    const { desc } = await import('drizzle-orm');
    return await db.select().from(rentalRequests).orderBy(desc(rentalRequests.createdAt));
  }

  async getRentalRequestById(id: number): Promise<RentalRequest | undefined> {
    const { db } = await import('./db');
    const { rentalRequests } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    const [request] = await db.select().from(rentalRequests).where(eq(rentalRequests.id, id));
    return request;
  }

  async createRentalRequest(request: InsertRentalRequest): Promise<RentalRequest> {
    try {
      console.log("Creating rental request with data:", {
        name: request.name,
        contact: request.contact,
        licensePlate: request.licensePlate,
        startDateType: typeof request.startDate,
        startDate: request.startDate,
        endDateType: typeof request.endDate,
        endDate: request.endDate,
        notes: request.notes
      });
      
      const { db } = await import('./db');
      const { rentalRequests, REQUEST_STATUS } = await import('@shared/schema');
      
      // 確保日期格式正確
      let startDate = request.startDate;
      let endDate = request.endDate;
      
      // 如果日期是字符串，轉換為 Date 對象
      if (typeof startDate === 'string') {
        startDate = new Date(startDate);
      }
      if (typeof endDate === 'string') {
        endDate = new Date(endDate);
      }
      
      // 日期只保留日期部分，不包含時間
      if (startDate instanceof Date) {
        startDate = new Date(startDate.toISOString().split('T')[0]);
      }
      if (endDate instanceof Date) {
        endDate = new Date(endDate.toISOString().split('T')[0]);
      }
      
      console.log("Processed dates:", { 
        startDate, 
        endDate, 
        startDateIso: startDate instanceof Date ? startDate.toISOString() : 'Not a Date',
        endDateIso: endDate instanceof Date ? endDate.toISOString() : 'Not a Date'
      });
      
      const [newRequest] = await db.insert(rentalRequests)
        .values({
          ...request,
          startDate,
          endDate,
          status: REQUEST_STATUS.PENDING,
          notes: request.notes || null
        })
        .returning();
      
      console.log("Successfully created rental request:", newRequest);
      
      // Log the activity
      await this.createActivityLog({
        activityType: "REQUEST_CREATED",
        description: `新增租借申請: ${request.name} (${request.licensePlate})`,
        relatedId: newRequest.id
      });
      
      return newRequest;
    } catch (error) {
      console.error("Error creating rental request:", error);
      throw error;
    }
  }

  async updateRentalRequestStatus(id: number, status: keyof typeof REQUEST_STATUS): Promise<RentalRequest | undefined> {
    const { db } = await import('./db');
    const { rentalRequests, REQUEST_STATUS } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    const [updatedRequest] = await db.update(rentalRequests)
      .set({ status })
      .where(eq(rentalRequests.id, id))
      .returning();
    
    if (updatedRequest) {
      // Log the activity
      await this.createActivityLog({
        activityType: "REQUEST_UPDATED",
        description: `更新租借申請狀態: ${id} 至 ${status}`,
        relatedId: id
      });
    }
    
    return updatedRequest;
  }
  
  // Parking Offer methods (for simplified parking system)
  async getParkingOffersByRequestId(requestId: number): Promise<ParkingOffer[]> {
    const { db } = await import('./db');
    const { parkingOffers } = await import('@shared/schema');
    const { eq, desc } = await import('drizzle-orm');
    return await db.select().from(parkingOffers)
      .where(eq(parkingOffers.requestId, requestId))
      .orderBy(desc(parkingOffers.createdAt));
  }

  async createParkingOffer(offer: InsertParkingOffer): Promise<ParkingOffer> {
    try {
      console.log("Creating parking offer with data:", {
        requestId: offer.requestId,
        spaceNumber: offer.spaceNumber,
        ownerName: offer.ownerName,
        ownerContact: offer.ownerContact,
        notes: offer.notes
      });
      
      const { db } = await import('./db');
      const { parkingOffers, rentalRequests, REQUEST_STATUS } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      // 事務方法確保所有操作要麼一起成功，要麼一起失敗
      async function transaction() {
        try {
          console.log("Beginning transaction for parking offer");
          
          // 檢查申請是否存在
          const request = await db.select().from(rentalRequests)
                              .where(eq(rentalRequests.id, offer.requestId))
                              .limit(1);
          
          console.log("Found rental request:", request);
          
          if (!request || request.length === 0) {
            throw new Error(`租借申請不存在，ID: ${offer.requestId}`);
          }
          
          const [newOffer] = await db.insert(parkingOffers).values({
            ...offer,
            notes: offer.notes || null,
            createdAt: new Date()
          }).returning();
          
          console.log("Inserted new parking offer:", newOffer);
          
          // 更新相關租借請求狀態為已匹配
          const [updatedRequest] = await db.update(rentalRequests)
            .set({ status: REQUEST_STATUS.MATCHED })
            .where(eq(rentalRequests.id, offer.requestId))
            .returning();
          
          console.log("Updated related rental request status:", updatedRequest);
          
          return newOffer;
        } catch (error) {
          console.error("Transaction error:", error);
          throw error;
        }
      }
      
      const newOffer = await transaction();
      
      // Log the activity
      await this.createActivityLog({
        activityType: "OFFER_CREATED",
        description: `車位提供: ${offer.ownerName} 提供車位 ${offer.spaceNumber} 給請求 ${offer.requestId}`,
        relatedId: newOffer.id
      });
      
      console.log("Successfully created parking offer with ID:", newOffer.id);
      return newOffer;
    } catch (error) {
      console.error("Error creating parking offer:", error);
      throw error;
    }
  }
}

// 依據環境決定使用哪種存儲方式
// 如果數據庫連接失敗，將回退到內存存儲
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
