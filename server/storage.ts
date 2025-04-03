import { 
  User, 
  InsertUser, 
  Company, 
  InsertCompany, 
  Client, 
  InsertClient, 
  Procedure, 
  InsertProcedure, 
  Appointment, 
  InsertAppointment,
  AppointmentProcedure,
  InsertAppointmentProcedure,
  FinancialRecord,
  InsertFinancialRecord,
  FinancialGoal,
  InsertFinancialGoal,
  users,
  companies,
  clients,
  procedures,
  appointments,
  appointmentProcedures,
  financialRecords,
  financialGoals
} from "@shared/schema";
import session from "express-session";
import { sql, db, sessionStore } from "./database";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";

// Storage interface with CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  
  // Company methods
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByInviteCode(code: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany & { inviteCode: string }): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company>;
  
  // Client methods
  getClient(id: number): Promise<Client | undefined>;
  getClientsByCompany(companyId: number): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: InsertClient): Promise<Client>;
  deleteClient(id: number): Promise<void>;
  
  // Procedure methods
  getProcedure(id: number): Promise<Procedure | undefined>;
  getProceduresByCompany(companyId: number): Promise<Procedure[]>;
  createProcedure(procedure: InsertProcedure): Promise<Procedure>;
  updateProcedure(id: number, procedure: InsertProcedure): Promise<Procedure>;
  deleteProcedure(id: number): Promise<void>;
  
  // Collaborator methods (filtered users)
  getCollaboratorsByCompany(companyId: number): Promise<User[]>;
  
  // Appointment methods
  getAppointment(id: number): Promise<Appointment | undefined>;
  getAppointmentsByCompany(companyId: number): Promise<Appointment[]>;
  getAppointmentsByDateRange(companyId: number, startDate: Date, endDate: Date, collaboratorId?: number): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment & { procedureId?: number }): Promise<Appointment>;
  updateAppointment(id: number, appointment: InsertAppointment & { procedureId?: number }): Promise<Appointment>;
  deleteAppointment(id: number): Promise<void>;
  
  // Appointment procedures methods
  getAppointmentProcedures(appointmentId: number): Promise<Procedure[]>;
  addProcedureToAppointment(appointmentProcedure: InsertAppointmentProcedure): Promise<AppointmentProcedure>;
  removeProcedureFromAppointment(appointmentId: number, procedureId: number): Promise<void>;
  removeAllProceduresFromAppointment(appointmentId: number): Promise<void>;
  
  // Financial record methods
  getFinancialRecord(id: number): Promise<FinancialRecord | undefined>;
  getFinancialRecordsByCompany(companyId: number): Promise<FinancialRecord[]>;
  getFinancialRecordsByDateRange(companyId: number, startDate: Date, endDate: Date, type?: string): Promise<FinancialRecord[]>;
  createFinancialRecord(record: InsertFinancialRecord): Promise<FinancialRecord>;
  updateFinancialRecord(id: number, record: Partial<InsertFinancialRecord>): Promise<FinancialRecord>;
  deleteFinancialRecord(id: number): Promise<void>;
  updateFinancialRecordByAppointment(appointmentId: number, updates: Partial<InsertFinancialRecord>): Promise<void>;
  deleteFinancialRecordByAppointment(appointmentId: number): Promise<void>;
  
  // Financial goal methods
  getFinancialGoal(id: number): Promise<FinancialGoal | undefined>;
  getFinancialGoalsByCompany(companyId: number): Promise<FinancialGoal[]>;
  createFinancialGoal(goal: InsertFinancialGoal): Promise<FinancialGoal>;
  updateFinancialGoal(id: number, goal: Partial<InsertFinancialGoal>): Promise<FinancialGoal>;
  deleteFinancialGoal(id: number): Promise<void>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = sessionStore;
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }
  
  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    if (result.length === 0) {
      throw new Error(`User with ID ${id} not found`);
    }
    return result[0];
  }
  
  async deleteUser(id: number): Promise<void> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    if (result.length === 0) {
      throw new Error(`User with ID ${id} not found`);
    }
  }
  
  // Company methods
  async getCompany(id: number): Promise<Company | undefined> {
    const result = await db.select().from(companies).where(eq(companies.id, id));
    return result[0];
  }
  
  async getCompanyByInviteCode(code: string): Promise<Company | undefined> {
    const result = await db.select().from(companies).where(eq(companies.inviteCode, code));
    return result[0];
  }
  
  async createCompany(company: InsertCompany & { inviteCode: string }): Promise<Company> {
    const result = await db.insert(companies).values(company).returning();
    return result[0];
  }
  
  async updateCompany(id: number, updates: Partial<InsertCompany>): Promise<Company> {
    const result = await db.update(companies).set(updates).where(eq(companies.id, id)).returning();
    if (result.length === 0) {
      throw new Error(`Company with ID ${id} not found`);
    }
    return result[0];
  }
  
  // Client methods
  async getClient(id: number): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.id, id));
    return result[0];
  }
  
  async getClientsByCompany(companyId: number): Promise<Client[]> {
    return db.select().from(clients).where(eq(clients.companyId, companyId)).orderBy(clients.name);
  }
  
  async createClient(client: InsertClient): Promise<Client> {
    const result = await db.insert(clients).values(client).returning();
    return result[0];
  }
  
  async updateClient(id: number, updates: InsertClient): Promise<Client> {
    const result = await db.update(clients).set(updates).where(eq(clients.id, id)).returning();
    if (result.length === 0) {
      throw new Error(`Client with ID ${id} not found`);
    }
    return result[0];
  }
  
  async deleteClient(id: number): Promise<void> {
    const result = await db.delete(clients).where(eq(clients.id, id)).returning();
    if (result.length === 0) {
      throw new Error(`Client with ID ${id} not found`);
    }
  }
  
  // Procedure methods
  async getProcedure(id: number): Promise<Procedure | undefined> {
    const result = await db.select().from(procedures).where(eq(procedures.id, id));
    return result[0];
  }
  
  async getProceduresByCompany(companyId: number): Promise<Procedure[]> {
    return db.select().from(procedures).where(eq(procedures.companyId, companyId)).orderBy(procedures.name);
  }
  
  async createProcedure(procedure: InsertProcedure): Promise<Procedure> {
    // Garantir que os tipos estão corretos para o banco de dados
    const procedureData = {
      name: procedure.name,
      value: String(procedure.value), // Converter para string para garantir compatibilidade
      companyId: procedure.companyId
    };
    
    const result = await db.insert(procedures).values(procedureData).returning();
    return result[0];
  }
  
  async updateProcedure(id: number, updates: InsertProcedure): Promise<Procedure> {
    // Garantir que os tipos estão corretos para o banco de dados
    const procedureData = {
      name: updates.name,
      value: String(updates.value), // Converter para string para garantir compatibilidade
      companyId: updates.companyId
    };
    
    const result = await db.update(procedures).set(procedureData).where(eq(procedures.id, id)).returning();
    if (result.length === 0) {
      throw new Error(`Procedure with ID ${id} not found`);
    }
    return result[0];
  }
  
  async deleteProcedure(id: number): Promise<void> {
    const result = await db.delete(procedures).where(eq(procedures.id, id)).returning();
    if (result.length === 0) {
      throw new Error(`Procedure with ID ${id} not found`);
    }
  }
  
  // Collaborator methods
  async getCollaboratorsByCompany(companyId: number): Promise<User[]> {
    // Include both collaborators and admins as they can both handle appointments
    return db.select()
      .from(users)
      .where(eq(users.companyId, companyId))
      .orderBy(users.name);
  }
  
  // Appointment methods
  async getAppointment(id: number): Promise<Appointment | undefined> {
    const result = await db.select().from(appointments).where(eq(appointments.id, id));
    return result[0];
  }
  
  async getAppointmentsByCompany(companyId: number): Promise<Appointment[]> {
    return db.select()
      .from(appointments)
      .where(eq(appointments.companyId, companyId))
      .orderBy(desc(appointments.date));
  }
  
  async getAppointmentsByDateRange(
    companyId: number, 
    startDate: Date, 
    endDate: Date,
    collaboratorId?: number
  ): Promise<Appointment[]> {
    let query = db.select()
      .from(appointments)
      .where(and(
        eq(appointments.companyId, companyId),
        gte(appointments.date, startDate),
        lte(appointments.date, endDate)
      ));
    
    if (collaboratorId) {
      query = query.where(eq(appointments.collaboratorId, collaboratorId));
    }
    
    return query.orderBy(asc(appointments.date));
  }
  
  async createAppointment(appointment: InsertAppointment & { procedureId?: number }): Promise<Appointment> {
    // Garantir que os tipos estão corretos para o banco de dados
    const appointmentData = {
      clientId: appointment.clientId,
      collaboratorId: appointment.collaboratorId,
      procedureId: appointment.procedureId,  // Inclua a coluna obrigatória procedureId
      date: appointment.date instanceof Date ? appointment.date : new Date(appointment.date),
      status: appointment.status || 'scheduled',
      companyId: appointment.companyId,
      value: typeof appointment.value === 'string' ? parseFloat(appointment.value) : appointment.value,
      notes: appointment.notes
    };
    
    console.log("Criando agendamento com dados:", appointmentData);

    const result = await db.insert(appointments).values(appointmentData).returning();
    return result[0];
  }
  
  async updateAppointment(id: number, updates: InsertAppointment & { procedureId?: number }): Promise<Appointment> {
    // Garantir que os tipos estão corretos para o banco de dados
    const appointmentData = {
      clientId: updates.clientId,
      collaboratorId: updates.collaboratorId,
      procedureId: updates.procedureId, // Inclua a coluna obrigatória procedureId
      date: updates.date instanceof Date ? updates.date : new Date(updates.date),
      status: updates.status || 'scheduled',
      companyId: updates.companyId,
      value: typeof updates.value === 'string' ? parseFloat(updates.value) : updates.value,
      notes: updates.notes
    };
    
    const result = await db.update(appointments)
      .set(appointmentData)
      .where(eq(appointments.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Appointment with ID ${id} not found`);
    }
    return result[0];
  }
  
  async deleteAppointment(id: number): Promise<void> {
    // First, delete related appointment procedures
    await this.removeAllProceduresFromAppointment(id);
    
    const result = await db.delete(appointments).where(eq(appointments.id, id)).returning();
    if (result.length === 0) {
      throw new Error(`Appointment with ID ${id} not found`);
    }
  }
  
  // Appointment procedures methods
  async getAppointmentProcedures(appointmentId: number): Promise<Procedure[]> {
    const result = await db
      .select({
        procedure: procedures
      })
      .from(appointmentProcedures)
      .innerJoin(procedures, eq(appointmentProcedures.procedureId, procedures.id))
      .where(eq(appointmentProcedures.appointmentId, appointmentId));
    
    return result.map(r => r.procedure);
  }
  
  async addProcedureToAppointment(appointmentProcedure: InsertAppointmentProcedure): Promise<AppointmentProcedure> {
    const result = await db
      .insert(appointmentProcedures)
      .values(appointmentProcedure)
      .returning();
    
    return result[0];
  }
  
  async removeProcedureFromAppointment(appointmentId: number, procedureId: number): Promise<void> {
    await db
      .delete(appointmentProcedures)
      .where(
        and(
          eq(appointmentProcedures.appointmentId, appointmentId),
          eq(appointmentProcedures.procedureId, procedureId)
        )
      );
  }
  
  async removeAllProceduresFromAppointment(appointmentId: number): Promise<void> {
    await db
      .delete(appointmentProcedures)
      .where(eq(appointmentProcedures.appointmentId, appointmentId));
  }
  
  // Financial record methods
  async getFinancialRecord(id: number): Promise<FinancialRecord | undefined> {
    const result = await db.select().from(financialRecords).where(eq(financialRecords.id, id));
    return result[0];
  }
  
  async getFinancialRecordsByCompany(companyId: number): Promise<FinancialRecord[]> {
    return db.select()
      .from(financialRecords)
      .where(eq(financialRecords.companyId, companyId))
      .orderBy(desc(financialRecords.date));
  }
  
  async getFinancialRecordsByDateRange(
    companyId: number, 
    startDate: Date, 
    endDate: Date,
    type?: string
  ): Promise<FinancialRecord[]> {
    let query = db.select()
      .from(financialRecords)
      .where(and(
        eq(financialRecords.companyId, companyId),
        gte(financialRecords.date, startDate),
        lte(financialRecords.date, endDate)
      ));
    
    if (type) {
      query = query.where(eq(financialRecords.type, type));
    }
    
    return query.orderBy(desc(financialRecords.date));
  }
  
  async createFinancialRecord(record: InsertFinancialRecord): Promise<FinancialRecord> {
    const result = await db.insert(financialRecords).values(record).returning();
    return result[0];
  }
  
  async updateFinancialRecord(id: number, updates: Partial<InsertFinancialRecord>): Promise<FinancialRecord> {
    const result = await db.update(financialRecords)
      .set(updates)
      .where(eq(financialRecords.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Financial record with ID ${id} not found`);
    }
    return result[0];
  }
  
  async deleteFinancialRecord(id: number): Promise<void> {
    const result = await db.delete(financialRecords).where(eq(financialRecords.id, id)).returning();
    if (result.length === 0) {
      throw new Error(`Financial record with ID ${id} not found`);
    }
  }
  
  async updateFinancialRecordByAppointment(appointmentId: number, updates: Partial<InsertFinancialRecord>): Promise<void> {
    await db.update(financialRecords)
      .set(updates)
      .where(eq(financialRecords.appointmentId, appointmentId));
  }
  
  async deleteFinancialRecordByAppointment(appointmentId: number): Promise<void> {
    await db.delete(financialRecords).where(eq(financialRecords.appointmentId, appointmentId));
  }
  
  // Financial goal methods
  async getFinancialGoal(id: number): Promise<FinancialGoal | undefined> {
    const result = await db.select().from(financialGoals).where(eq(financialGoals.id, id));
    return result[0];
  }
  
  async getFinancialGoalsByCompany(companyId: number): Promise<FinancialGoal[]> {
    return db.select()
      .from(financialGoals)
      .where(eq(financialGoals.companyId, companyId))
      .orderBy([desc(financialGoals.year), desc(financialGoals.month)]);
  }
  
  async createFinancialGoal(goal: InsertFinancialGoal): Promise<FinancialGoal> {
    const result = await db.insert(financialGoals).values(goal).returning();
    return result[0];
  }
  
  async updateFinancialGoal(id: number, updates: Partial<InsertFinancialGoal>): Promise<FinancialGoal> {
    const result = await db.update(financialGoals)
      .set(updates)
      .where(eq(financialGoals.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Financial goal with ID ${id} not found`);
    }
    return result[0];
  }
  
  async deleteFinancialGoal(id: number): Promise<void> {
    const result = await db.delete(financialGoals).where(eq(financialGoals.id, id)).returning();
    if (result.length === 0) {
      throw new Error(`Financial goal with ID ${id} not found`);
    }
  }
}

export const storage = new DatabaseStorage();