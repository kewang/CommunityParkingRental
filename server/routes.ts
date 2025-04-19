import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  parkingSpaceFormSchema, 
  rentalFormSchema, 
  householdFormSchema,
  rentalRequestFormSchema,
  parkingOfferFormSchema,
  SPACE_STATUS,
  REQUEST_STATUS
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";

// Middleware to handle validation errors
const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error: any) {
      const validationError = fromZodError(error);
      res.status(400).json({ message: validationError.message });
    }
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // 数据库健康检查路由 (用于 Heroku 部署)
  app.get('/api/health', async (req, res) => {
    try {
      const { testConnection } = await import('./db');
      const isConnected = await testConnection();
      
      res.json({
        status: 'ok',
        db: isConnected ? 'connected' : 'disconnected',
        memory: 'available',
        env: process.env.NODE_ENV || 'development',
        storage: process.env.DATABASE_URL ? 'postgresql' : 'memory'
      });
    } catch (error) {
      res.status(500).json({ 
        status: 'error',
        message: 'Health check failed',
        detail: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // ==== Parking Space Routes ====
  
  // Get all parking spaces
  app.get('/api/parking-spaces', async (req, res) => {
    try {
      const parkingSpaces = await storage.getAllParkingSpaces();
      res.json(parkingSpaces);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching parking spaces' });
    }
  });
  
  // Get available parking spaces
  app.get('/api/parking-spaces/available', async (req, res) => {
    try {
      const availableSpaces = await storage.getAvailableParkingSpaces();
      res.json(availableSpaces);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching available parking spaces' });
    }
  });
  
  // Get parking space by ID
  app.get('/api/parking-spaces/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parkingSpace = await storage.getParkingSpaceById(id);
      
      if (!parkingSpace) {
        return res.status(404).json({ message: 'Parking space not found' });
      }
      
      res.json(parkingSpace);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching parking space' });
    }
  });
  
  // Create new parking space
  app.post('/api/parking-spaces', validateRequest(parkingSpaceFormSchema), async (req, res) => {
    try {
      // Check if space number already exists
      const existingSpace = await storage.getParkingSpaceByNumber(req.body.spaceNumber);
      if (existingSpace) {
        return res.status(400).json({ message: '車位號碼已存在 / Space number already exists' });
      }
      
      const newSpace = await storage.createParkingSpace(req.body);
      res.status(201).json(newSpace);
    } catch (error) {
      res.status(500).json({ message: 'Error creating parking space' });
    }
  });
  
  // Update parking space
  app.put('/api/parking-spaces/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedSpace = await storage.updateParkingSpace(id, req.body);
      
      if (!updatedSpace) {
        return res.status(404).json({ message: 'Parking space not found' });
      }
      
      res.json(updatedSpace);
    } catch (error) {
      res.status(500).json({ message: 'Error updating parking space' });
    }
  });
  
  // Delete parking space
  app.delete('/api/parking-spaces/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteParkingSpace(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Parking space not found or cannot be deleted' });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting parking space' });
    }
  });
  
  // ==== Household Routes ====
  
  // Get all households
  app.get('/api/households', async (req, res) => {
    try {
      const households = await storage.getAllHouseholds();
      res.json(households);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching households' });
    }
  });
  
  // Get household by ID
  app.get('/api/households/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const household = await storage.getHouseholdById(id);
      
      if (!household) {
        return res.status(404).json({ message: 'Household not found' });
      }
      
      res.json(household);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching household' });
    }
  });
  
  // Create new household
  app.post('/api/households', validateRequest(householdFormSchema), async (req, res) => {
    try {
      // Check if household number already exists
      const existingHousehold = await storage.getHouseholdByNumber(req.body.householdNumber);
      if (existingHousehold) {
        return res.status(400).json({ message: '戶號已存在 / Household number already exists' });
      }
      
      const newHousehold = await storage.createHousehold(req.body);
      res.status(201).json(newHousehold);
    } catch (error) {
      res.status(500).json({ message: 'Error creating household' });
    }
  });
  
  // Update household
  app.put('/api/households/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedHousehold = await storage.updateHousehold(id, req.body);
      
      if (!updatedHousehold) {
        return res.status(404).json({ message: 'Household not found' });
      }
      
      res.json(updatedHousehold);
    } catch (error) {
      res.status(500).json({ message: 'Error updating household' });
    }
  });
  
  // Delete household
  app.delete('/api/households/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteHousehold(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Household not found or cannot be deleted' });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting household' });
    }
  });
  
  // ==== Rental Routes ====
  
  // Get all rentals
  app.get('/api/rentals', async (req, res) => {
    try {
      const rentals = await storage.getAllRentals();
      res.json(rentals);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching rentals' });
    }
  });
  
  // Get active rentals
  app.get('/api/rentals/active', async (req, res) => {
    try {
      const activeRentals = await storage.getActiveRentals();
      res.json(activeRentals);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching active rentals' });
    }
  });
  
  // Get expiring rentals
  app.get('/api/rentals/expiring', async (req, res) => {
    try {
      const daysThreshold = parseInt(req.query.days as string) || 7;
      const expiringRentals = await storage.getExpiringRentals(daysThreshold);
      res.json(expiringRentals);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching expiring rentals' });
    }
  });
  
  // Get rental by ID
  app.get('/api/rentals/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rental = await storage.getRentalById(id);
      
      if (!rental) {
        return res.status(404).json({ message: 'Rental not found' });
      }
      
      res.json(rental);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching rental' });
    }
  });
  
  // Create new rental
  app.post('/api/rentals', validateRequest(rentalFormSchema), async (req, res) => {
    try {
      // Check if parking space exists and is available
      const parkingSpace = await storage.getParkingSpaceById(req.body.parkingSpaceId);
      if (!parkingSpace) {
        return res.status(400).json({ message: '車位不存在 / Parking space does not exist' });
      }
      
      if (parkingSpace.status !== SPACE_STATUS.AVAILABLE) {
        return res.status(400).json({ message: '車位不可用 / Parking space is not available' });
      }
      
      // Check if household exists
      const household = await storage.getHouseholdById(req.body.householdId);
      if (!household) {
        return res.status(400).json({ message: '住戶不存在 / Household does not exist' });
      }
      
      const newRental = await storage.createRental(req.body);
      res.status(201).json(newRental);
    } catch (error) {
      res.status(500).json({ message: 'Error creating rental' });
    }
  });
  
  // Update rental
  app.put('/api/rentals/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedRental = await storage.updateRental(id, req.body);
      
      if (!updatedRental) {
        return res.status(404).json({ message: 'Rental not found' });
      }
      
      res.json(updatedRental);
    } catch (error) {
      res.status(500).json({ message: 'Error updating rental' });
    }
  });
  
  // End rental
  app.post('/api/rentals/:id/end', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ended = await storage.endRental(id);
      
      if (!ended) {
        return res.status(404).json({ message: 'Rental not found' });
      }
      
      res.status(200).json({ message: 'Rental ended successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error ending rental' });
    }
  });
  
  // ==== Activity Log Routes ====
  
  // Get activity logs
  app.get('/api/activity-logs', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const logs = await storage.getAllActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching activity logs' });
    }
  });
  
  // ==== Dashboard Stats Route ====
  
  // Get dashboard statistics
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching dashboard statistics' });
    }
  });
  
  // ==== Rental Request Routes (for simplified parking system) ====
  
  // Get all rental requests
  app.get('/api/rental-requests', async (req, res) => {
    try {
      const requests = await storage.getAllRentalRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching rental requests' });
    }
  });
  
  // Get rental request by ID
  app.get('/api/rental-requests/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.getRentalRequestById(id);
      
      if (!request) {
        return res.status(404).json({ message: '找不到租借申請 / Rental request not found' });
      }
      
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching rental request' });
    }
  });
  
  // Create new rental request
  app.post('/api/rental-requests', validateRequest(rentalRequestFormSchema), async (req, res) => {
    try {
      const newRequest = await storage.createRentalRequest(req.body);
      res.status(201).json(newRequest);
    } catch (error) {
      res.status(500).json({ message: 'Error creating rental request' });
    }
  });
  
  // Update rental request status
  app.put('/api/rental-requests/:id/status', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!Object.values(REQUEST_STATUS).includes(status)) {
        return res.status(400).json({ message: '無效的狀態 / Invalid status' });
      }
      
      const updatedRequest = await storage.updateRentalRequestStatus(id, status);
      
      if (!updatedRequest) {
        return res.status(404).json({ message: '找不到租借申請 / Rental request not found' });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: 'Error updating rental request status' });
    }
  });
  
  // ==== Parking Offer Routes (for simplified parking system) ====
  
  // Get parking offers by request ID
  app.get('/api/rental-requests/:requestId/offers', async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const offers = await storage.getParkingOffersByRequestId(requestId);
      res.json(offers);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching parking offers' });
    }
  });
  
  // Create new parking offer
  app.post('/api/rental-requests/:requestId/offers', validateRequest(parkingOfferFormSchema), async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const request = await storage.getRentalRequestById(requestId);
      
      if (!request) {
        return res.status(404).json({ message: '找不到租借申請 / Rental request not found' });
      }
      
      if (request.status !== REQUEST_STATUS.PENDING) {
        return res.status(400).json({ message: '租借申請不再接受新的報價 / Rental request is no longer accepting offers' });
      }
      
      const offerData = {
        ...req.body,
        requestId
      };
      
      const newOffer = await storage.createParkingOffer(offerData);
      res.status(201).json(newOffer);
    } catch (error) {
      res.status(500).json({ message: 'Error creating parking offer' });
    }
  });
  
  return httpServer;
}
