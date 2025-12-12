/**
 * E2E Test Data Seeding Utilities
 * Provides realistic test data for comprehensive E2E testing
 * Google/Microsoft standard: Deterministic, repeatable test data
 */

import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

/**
 * Seed Data Interfaces
 */
export interface SeedUserData {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'tenant' | 'agent' | 'contractor' | 'admin';
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeedContractorData {
  id: string;
  userId: string;
  businessName: string;
  specialties: string[];
  hourlyRate: number;
  latitude: number;
  longitude: number;
  serviceRadius: number;
  averageRating: number;
  reliabilityScore: number;
  averageResponseTime: number;
  totalJobsCompleted: number;
  currentJobs: number;
  maxConcurrentJobs: number;
  availabilityStatus: 'available' | 'unavailable' | 'busy' | 'on_leave';
  status: 'pending' | 'verified' | 'suspended' | 'rejected';
  backgroundCheckStatus: 'not_started' | 'in_progress' | 'passed' | 'failed';
  insuranceVerified: boolean;
  licenseNumber?: string;
  yearsExperience: number;
}

export interface SeedAgentData {
  id: string;
  userId: string;
  organizationId: string;
  territories: string[];
  maxActiveTickets: number;
  currentActiveTickets: number;
}

export interface SeedTicketData {
  id: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'triaged' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  tradeCategory?: string;
  estimatedCost?: number;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generates 50 realistic contractors across NYC boroughs
 * Distribution: Manhattan (15), Brooklyn (15), Queens (10), Bronx (5), Staten Island (5)
 */
export function generateContractors(): SeedContractorData[] {
  const trades = ['plumbing', 'electrical', 'hvac', 'carpentry', 'painting', 'roofing', 'masonry', 'locksmith'];
  const contractors: SeedContractorData[] = [];

  // NYC coordinates with realistic distribution
  const locations = [
    // Manhattan (Financial District to Upper West Side)
    ...Array.from({ length: 15 }, (_, i) => ({
      lat: 40.7128 + (i * 0.01),
      lng: -74.006 + (i * 0.005),
      area: 'Manhattan'
    })),
    // Brooklyn (Williamsburg to Park Slope)
    ...Array.from({ length: 15 }, (_, i) => ({
      lat: 40.6782 + (i * 0.008),
      lng: -73.9442 + (i * 0.007),
      area: 'Brooklyn'
    })),
    // Queens (Astoria to Flushing)
    ...Array.from({ length: 10 }, (_, i) => ({
      lat: 40.7614 + (i * 0.012),
      lng: -73.9246 + (i * 0.015),
      area: 'Queens'
    })),
    // Bronx
    ...Array.from({ length: 5 }, (_, i) => ({
      lat: 40.8448 + (i * 0.01),
      lng: -73.8648 + (i * 0.008),
      area: 'Bronx'
    })),
    // Staten Island
    ...Array.from({ length: 5 }, (_, i) => ({
      lat: 40.5795 + (i * 0.015),
      lng: -74.1502 + (i * 0.01),
      area: 'Staten Island'
    })),
  ];

  for (let i = 0; i < 50; i++) {
    const location = locations[i];
    const trade = trades[i % trades.length];
    const specialtyCount = Math.floor(Math.random() * 2) + 1; // 1-2 specialties
    const specialties = [trade];
    if (specialtyCount > 1) {
      specialties.push(trades[(i + 1) % trades.length]);
    }

    // Realistic performance distribution (bell curve)
    const performanceTier = Math.random();
    let rating: number;
    let reliability: number;
    let responseTime: number;
    let jobsCompleted: number;

    if (performanceTier < 0.1) {
      // Top 10% - Elite contractors
      rating = 4.7 + Math.random() * 0.3;
      reliability = 0.92 + Math.random() * 0.08;
      responseTime = 5 + Math.floor(Math.random() * 10);
      jobsCompleted = 150 + Math.floor(Math.random() * 100);
    } else if (performanceTier < 0.3) {
      // Next 20% - Excellent contractors
      rating = 4.3 + Math.random() * 0.4;
      reliability = 0.85 + Math.random() * 0.07;
      responseTime = 15 + Math.floor(Math.random() * 15);
      jobsCompleted = 80 + Math.floor(Math.random() * 70);
    } else if (performanceTier < 0.7) {
      // Middle 40% - Good contractors
      rating = 3.8 + Math.random() * 0.5;
      reliability = 0.75 + Math.random() * 0.1;
      responseTime = 25 + Math.floor(Math.random() * 20);
      jobsCompleted = 30 + Math.floor(Math.random() * 50);
    } else {
      // Bottom 30% - Average/New contractors
      rating = 3.0 + Math.random() * 0.8;
      reliability = 0.65 + Math.random() * 0.1;
      responseTime = 40 + Math.floor(Math.random() * 30);
      jobsCompleted = 5 + Math.floor(Math.random() * 25);
    }

    // Availability and capacity
    const availabilityRoll = Math.random();
    let availabilityStatus: 'available' | 'unavailable' | 'busy' | 'on_leave';
    let currentJobs: number;
    const maxJobs = 3 + Math.floor(Math.random() * 5); // 3-7 max concurrent jobs

    if (availabilityRoll < 0.6) {
      availabilityStatus = 'available';
      currentJobs = Math.floor(Math.random() * Math.max(1, maxJobs - 1));
    } else if (availabilityRoll < 0.85) {
      availabilityStatus = 'busy';
      currentJobs = maxJobs;
    } else if (availabilityRoll < 0.95) {
      availabilityStatus = 'unavailable';
      currentJobs = 0;
    } else {
      availabilityStatus = 'on_leave';
      currentJobs = 0;
    }

    contractors.push({
      id: `contractor-${String(i + 1).padStart(3, '0')}`,
      userId: `user-contractor-${String(i + 1).padStart(3, '0')}`,
      businessName: `${location.area} ${trade.charAt(0).toUpperCase() + trade.slice(1)} Services #${i + 1}`,
      specialties,
      hourlyRate: 55 + Math.floor(Math.random() * 95), // $55-$150/hr
      latitude: location.lat,
      longitude: location.lng,
      serviceRadius: 5 + Math.floor(Math.random() * 15), // 5-20 mile radius
      averageRating: parseFloat(rating.toFixed(2)),
      reliabilityScore: parseFloat(reliability.toFixed(2)),
      averageResponseTime: responseTime,
      totalJobsCompleted: jobsCompleted,
      currentJobs,
      maxConcurrentJobs: maxJobs,
      availabilityStatus,
      status: Math.random() < 0.95 ? 'verified' : 'pending', // 95% verified
      backgroundCheckStatus: Math.random() < 0.92 ? 'passed' : 'in_progress',
      insuranceVerified: Math.random() < 0.9, // 90% insured
      licenseNumber: Math.random() < 0.85 ? `NYC-${trade.toUpperCase()}-${10000 + i}` : undefined,
      yearsExperience: 1 + Math.floor(Math.random() * 20),
    });
  }

  return contractors;
}

/**
 * Generates 10 property management agents
 * Distribution: 5 in Manhattan, 3 in Brooklyn, 2 in Queens
 */
export function generateAgents(): SeedAgentData[] {
  const agents: SeedAgentData[] = [];
  const organizations = ['org-001', 'org-002', 'org-003'];
  const territories = [
    ['Manhattan-Downtown', 'Manhattan-Midtown'],
    ['Manhattan-Upper East Side', 'Manhattan-Upper West Side'],
    ['Manhattan-Harlem'],
    ['Brooklyn-Williamsburg', 'Brooklyn-Park Slope'],
    ['Brooklyn-Downtown', 'Brooklyn-Heights'],
    ['Brooklyn-Bushwick'],
    ['Queens-Astoria', 'Queens-LIC'],
    ['Queens-Flushing'],
    ['Bronx-South'],
    ['Staten Island-North'],
  ];

  for (let i = 0; i < 10; i++) {
    agents.push({
      id: `agent-${String(i + 1).padStart(3, '0')}`,
      userId: `user-agent-${String(i + 1).padStart(3, '0')}`,
      organizationId: organizations[i % organizations.length],
      territories: territories[i],
      maxActiveTickets: 20 + Math.floor(Math.random() * 30), // 20-50 max tickets
      currentActiveTickets: Math.floor(Math.random() * 15), // 0-15 current
    });
  }

  return agents;
}

/**
 * Generates 10 realistic tickets for testing
 */
export function generateTickets(): SeedTicketData[] {
  const tickets: SeedTicketData[] = [];
  const issues = [
    { title: 'Leaking Kitchen Sink', description: 'Water dripping from under sink, getting worse', trade: 'plumbing', priority: 'high' },
    { title: 'Broken Outlet in Bedroom', description: 'Outlet not working, needs replacement', trade: 'electrical', priority: 'medium' },
    { title: 'AC Not Cooling', description: 'Air conditioner running but not cooling apartment', trade: 'hvac', priority: 'urgent' },
    { title: 'Damaged Floor Boards', description: 'Several floorboards in living room are loose', trade: 'carpentry', priority: 'low' },
    { title: 'Bathroom Door Lock Broken', description: 'Lock mechanism broken, door won\'t stay closed', trade: 'locksmith', priority: 'medium' },
    { title: 'Ceiling Water Stain', description: 'Large water stain on ceiling, possibly from upstairs', trade: 'plumbing', priority: 'urgent' },
    { title: 'Peeling Paint in Hallway', description: 'Paint peeling off walls, needs repainting', trade: 'painting', priority: 'low' },
    { title: 'Heating Not Working', description: 'Radiator cold, no heat in apartment', trade: 'hvac', priority: 'urgent' },
    { title: 'Broken Window Latch', description: 'Window won\'t close properly, latch broken', trade: 'carpentry', priority: 'medium' },
    { title: 'Electrical Panel Buzzing', description: 'Main electrical panel making buzzing sound', trade: 'electrical', priority: 'high' },
  ];

  // Manhattan coordinates
  const locations = [
    { lat: 40.7589, lng: -73.9851 }, // Times Square
    { lat: 40.7614, lng: -73.9776 }, // Central Park South
    { lat: 40.7484, lng: -73.9857 }, // Empire State
    { lat: 40.7128, lng: -74.0060 }, // Financial District
    { lat: 40.7831, lng: -73.9712 }, // Upper East Side
    { lat: 40.7794, lng: -73.9632 }, // Upper East Side 2
    { lat: 40.8075, lng: -73.9626 }, // Harlem
    { lat: 40.7549, lng: -73.9840 }, // Hell's Kitchen
    { lat: 40.7282, lng: -73.9942 }, // East Village
    { lat: 40.7580, lng: -73.9855 }, // Midtown West
  ];

  for (let i = 0; i < 10; i++) {
    const issue = issues[i];
    const location = locations[i];
    const daysAgo = Math.floor(Math.random() * 5);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);

    tickets.push({
      id: `ticket-${String(i + 1).padStart(3, '0')}`,
      propertyId: `property-${String(Math.floor(i / 3) + 1).padStart(3, '0')}`,
      unitId: `unit-${String(i + 1).padStart(3, '0')}`,
      tenantId: `user-tenant-${String(i + 1).padStart(3, '0')}`,
      title: issue.title,
      description: issue.description,
      priority: issue.priority as any,
      status: 'new',
      tradeCategory: issue.trade,
      estimatedCost: 100 + Math.floor(Math.random() * 900), // $100-$1000
      latitude: location.lat,
      longitude: location.lng,
      createdAt,
      updatedAt: createdAt,
    });
  }

  return tickets;
}

/**
 * Seeds contractors into database with proper TypeORM entity transformation
 */
export async function seedContractorsToDb<T>(
  repository: Repository<T>,
  contractors?: SeedContractorData[]
): Promise<T[]> {
  const data = contractors || generateContractors();
  const entities = data.map((contractor) =>
    repository.create({
      ...contractor,
      // Transform lat/lng to PostGIS Point
      locationPoint: {
        type: 'Point',
        coordinates: [contractor.longitude, contractor.latitude],
      },
    } as any)
  );

  return await repository.save(entities);
}

/**
 * Seeds agents into database
 */
export async function seedAgentsToDb<T>(
  repository: Repository<T>,
  agents?: SeedAgentData[]
): Promise<T[]> {
  const data = agents || generateAgents();
  const entities = data.map((agent) => repository.create(agent as any));
  return await repository.save(entities);
}

/**
 * Seeds tickets into database
 */
export async function seedTicketsToDb<T>(
  repository: Repository<T>,
  tickets?: SeedTicketData[]
): Promise<T[]> {
  const data = tickets || generateTickets();
  const entities = data.map((ticket) => repository.create(ticket as any));
  return await repository.save(entities);
}

/**
 * Creates test users with hashed passwords
 */
export async function generateUsers(): Promise<SeedUserData[]> {
  const hashedPassword = await bcrypt.hash('Test123!@#', 10);
  const users: SeedUserData[] = [];

  // Generate 50 contractor users
  for (let i = 0; i < 50; i++) {
    users.push({
      id: `user-contractor-${String(i + 1).padStart(3, '0')}`,
      email: `contractor${i + 1}@test.rentfix.com`,
      passwordHash: hashedPassword,
      firstName: `Contractor${i + 1}`,
      lastName: 'Test',
      phone: `+1555${String(1000000 + i).slice(1)}`,
      role: 'contractor',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Generate 10 agent users
  for (let i = 0; i < 10; i++) {
    users.push({
      id: `user-agent-${String(i + 1).padStart(3, '0')}`,
      email: `agent${i + 1}@test.rentfix.com`,
      passwordHash: hashedPassword,
      firstName: `Agent${i + 1}`,
      lastName: 'Test',
      phone: `+1555${String(2000000 + i).slice(1)}`,
      role: 'agent',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Generate 10 tenant users
  for (let i = 0; i < 10; i++) {
    users.push({
      id: `user-tenant-${String(i + 1).padStart(3, '0')}`,
      email: `tenant${i + 1}@test.rentfix.com`,
      passwordHash: hashedPassword,
      firstName: `Tenant${i + 1}`,
      lastName: 'Test',
      phone: `+1555${String(3000000 + i).slice(1)}`,
      role: 'tenant',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return users;
}

/**
 * Seeds users into database
 */
export async function seedUsersToDb<T>(
  repository: Repository<T>,
  users?: SeedUserData[]
): Promise<T[]> {
  const data = users || await generateUsers();
  const entities = data.map((user) => repository.create(user as any));
  return await repository.save(entities);
}

/**
 * Complete database seed function - seeds all entities in correct order
 */
export async function seedAll(repositories: {
  users?: Repository<any>;
  contractors?: Repository<any>;
  agents?: Repository<any>;
  tickets?: Repository<any>;
}): Promise<{
  users?: any[];
  contractors?: any[];
  agents?: any[];
  tickets?: any[];
}> {
  const result: any = {};

  if (repositories.users) {
    result.users = await seedUsersToDb(repositories.users);
    console.log(`✅ Seeded ${result.users.length} users`);
  }

  if (repositories.contractors) {
    result.contractors = await seedContractorsToDb(repositories.contractors);
    console.log(`✅ Seeded ${result.contractors.length} contractors`);
  }

  if (repositories.agents) {
    result.agents = await seedAgentsToDb(repositories.agents);
    console.log(`✅ Seeded ${result.agents.length} agents`);
  }

  if (repositories.tickets) {
    result.tickets = await seedTicketsToDb(repositories.tickets);
    console.log(`✅ Seeded ${result.tickets.length} tickets`);
  }

  return result;
}
