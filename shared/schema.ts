import { pgTable, text, serial, integer, boolean, timestamp, foreignKey, json, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Company schema
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
});

export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
});

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone").notNull(),
  role: text("role").notNull(), // 'admin' or 'collaborator'
  companyId: integer("company_id").references(() => companies.id),
  function: text("function"), // Only for collaborators
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password: true,
  phone: true,
  role: true,
  companyId: true,
  function: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Client schema
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  notes: text("notes"),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).pick({
  name: true,
  phone: true,
  notes: true,
  companyId: true,
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Procedure schema
export const procedures = pgTable("procedures", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  value: numeric("value").notNull(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
});

// Modificar o esquema para transformar valores conforme necessário
export const insertProcedureSchema = createInsertSchema(procedures)
  .pick({
    name: true,
    value: true,
    companyId: true,
  })
  .transform((data) => {
    // Converter companyId para número
    const companyId = typeof data.companyId === 'string' ? parseInt(data.companyId) : data.companyId;
    
    // Converter value para string se for número
    // Isso é necessário porque o campo value no banco é numeric, que o Drizzle espera como string
    const value = typeof data.value === 'number' ? data.value.toString() : data.value;
    
    return {
      ...data,
      companyId,
      value
    };
  });

export type InsertProcedure = z.infer<typeof insertProcedureSchema>;
export type Procedure = typeof procedures.$inferSelect;

// Appointment schema
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  collaboratorId: integer("collaborator_id").references(() => users.id).notNull(),
  procedureId: integer("procedure_id").references(() => procedures.id).notNull(), // Coluna legada
  date: timestamp("date").notNull(),
  status: text("status").notNull().default("scheduled"), // 'scheduled', 'confirmed', 'completed', 'cancelled'
  companyId: integer("company_id").references(() => companies.id).notNull(),
  value: numeric("value").notNull(),
  notes: text("notes"),
});

export const insertAppointmentSchema = createInsertSchema(appointments)
  .pick({
    clientId: true,
    collaboratorId: true,
    procedureId: true, // Adicionando procedureId
    date: true,
    status: true,
    companyId: true,
    value: true,
    notes: true,
  })
  .transform((data) => {
    // Convertemos a string ISO para objeto Date antes da validação
    if (typeof data.date === 'string') {
      return { ...data, date: new Date(data.date) };
    }
    return data;
  })
  .transform((data) => {
    // Converter IDs de string para número
    const clientId = typeof data.clientId === 'string' ? parseInt(data.clientId) : data.clientId;
    const collaboratorId = typeof data.collaboratorId === 'string' ? parseInt(data.collaboratorId) : data.collaboratorId;
    const companyId = typeof data.companyId === 'string' ? parseInt(data.companyId) : data.companyId;
    
    // Converter valor para string se for número
    // Isso é necessário porque o campo value no banco é numeric, que o Drizzle espera como string
    const value = typeof data.value === 'number' ? data.value.toString() : data.value;
    
    // Para datas, aceitamos objeto Date ou string ISO
    let dateValue: any;
    try {
      if (typeof data.date === 'string') {
        // Verificar se a string de data é válida criando um Date temporário
        const tempDate = new Date(data.date);
        if (isNaN(tempDate.getTime())) {
          throw new Error("Data inválida");
        }
        // Usar a string original, pois o PostgreSQL aceita string ISO
        dateValue = data.date;
      } else if (data.date instanceof Date) {
        // Verificar se o objeto Date é válido
        if (isNaN(data.date.getTime())) {
          throw new Error("Data inválida");
        }
        // Usar o objeto Date diretamente
        dateValue = data.date;
      } else {
        throw new Error("Formato de data desconhecido");
      }
    } catch (error) {
      console.error("Erro ao processar data:", error, data.date);
      throw new Error("Invalid date format");
    }
    
    return {
      ...data,
      clientId,
      collaboratorId,
      companyId,
      value,
      date: dateValue,
      // Ignorar qualquer procedureId missing durante a validação, pois será adicionado depois
      procedureId: data.procedureId || undefined
    };
  });

// Appointment procedures junction table
export const appointmentProcedures = pgTable("appointment_procedures", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").references(() => appointments.id).notNull(),
  procedureId: integer("procedure_id").references(() => procedures.id).notNull(),
});

export const insertAppointmentProcedureSchema = createInsertSchema(appointmentProcedures).pick({
  appointmentId: true,
  procedureId: true,
});

export type InsertAppointmentProcedure = z.infer<typeof insertAppointmentProcedureSchema>;
export type AppointmentProcedure = typeof appointmentProcedures.$inferSelect;

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// Financial record schema
export const financialRecords = pgTable("financial_records", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'income', 'expense'
  category: text("category").notNull(), // 'appointment', 'fixed_cost', 'variable_cost'
  description: text("description").notNull(),
  value: numeric("value").notNull(),
  date: timestamp("date").notNull(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  appointmentId: integer("appointment_id").references(() => appointments.id),
});

export const insertFinancialRecordSchema = createInsertSchema(financialRecords)
  .pick({
    type: true,
    category: true,
    description: true,
    value: true,
    date: true,
    companyId: true,
    appointmentId: true,
  })
  .transform((data) => {
    // Converter IDs para número
    const companyId = typeof data.companyId === 'string' ? parseInt(data.companyId) : data.companyId;
    const appointmentId = data.appointmentId && typeof data.appointmentId === 'string' ? 
      parseInt(data.appointmentId) : data.appointmentId;
    
    // Converter valor para string se for número
    // Isso é necessário porque o campo value no banco é numeric, que o Drizzle espera como string
    const value = typeof data.value === 'number' ? data.value.toString() : data.value;
    
    // Para datas, aceitamos objeto Date ou string ISO
    let dateValue: any;
    try {
      if (typeof data.date === 'string') {
        // Verificar se a string de data é válida criando um Date temporário
        const tempDate = new Date(data.date);
        if (isNaN(tempDate.getTime())) {
          throw new Error("Data inválida");
        }
        // Usar a string original, pois o PostgreSQL aceita string ISO
        dateValue = data.date;
      } else if (data.date instanceof Date) {
        // Verificar se o objeto Date é válido
        if (isNaN(data.date.getTime())) {
          throw new Error("Data inválida");
        }
        // Usar o objeto Date diretamente
        dateValue = data.date;
      } else {
        throw new Error("Formato de data desconhecido");
      }
    } catch (error) {
      console.error("Erro ao processar data:", error, data.date);
      throw new Error("Invalid date format");
    }
    
    return {
      ...data,
      companyId,
      appointmentId,
      value,
      date: dateValue
    };
  });

export type InsertFinancialRecord = z.infer<typeof insertFinancialRecordSchema>;
export type FinancialRecord = typeof financialRecords.$inferSelect;

// Financial goal schema
export const financialGoals = pgTable("financial_goals", {
  id: serial("id").primaryKey(),
  target: numeric("target").notNull(),
  period: text("period").notNull(), // 'monthly', 'quarterly', 'yearly'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
});

export const insertFinancialGoalSchema = createInsertSchema(financialGoals)
  .pick({
    target: true,
    period: true,
    startDate: true,
    endDate: true,
    companyId: true,
  })
  .transform((data) => {
    // Converter companyId para número
    const companyId = typeof data.companyId === 'string' ? parseInt(data.companyId) : data.companyId;
    
    // Converter target para string se for número
    // Isso é necessário porque o campo target no banco é numeric, que o Drizzle espera como string
    const target = typeof data.target === 'number' ? data.target.toString() : data.target;
    
    // Para datas, aceitamos objeto Date ou string ISO
    let startDateValue: any, endDateValue: any;
    try {
      // Processar data inicial
      if (typeof data.startDate === 'string') {
        // Verificar se a string de data é válida criando um Date temporário
        const tempDate = new Date(data.startDate);
        if (isNaN(tempDate.getTime())) {
          throw new Error("Data inicial inválida");
        }
        // Usar a string original, pois o PostgreSQL aceita string ISO
        startDateValue = data.startDate;
      } else if (data.startDate instanceof Date) {
        // Verificar se o objeto Date é válido
        if (isNaN(data.startDate.getTime())) {
          throw new Error("Data inicial inválida");
        }
        // Usar o objeto Date diretamente
        startDateValue = data.startDate;
      } else {
        throw new Error("Formato de data inicial desconhecido");
      }
      
      // Processar data final
      if (typeof data.endDate === 'string') {
        // Verificar se a string de data é válida criando um Date temporário
        const tempDate = new Date(data.endDate);
        if (isNaN(tempDate.getTime())) {
          throw new Error("Data final inválida");
        }
        // Usar a string original, pois o PostgreSQL aceita string ISO
        endDateValue = data.endDate;
      } else if (data.endDate instanceof Date) {
        // Verificar se o objeto Date é válido
        if (isNaN(data.endDate.getTime())) {
          throw new Error("Data final inválida");
        }
        // Usar o objeto Date diretamente
        endDateValue = data.endDate;
      } else {
        throw new Error("Formato de data final desconhecido");
      }
    } catch (error) {
      console.error("Erro ao processar datas:", error);
      throw new Error("Invalid date format");
    }
    
    return {
      ...data,
      companyId,
      target,
      startDate: startDateValue,
      endDate: endDateValue
    };
  });

export type InsertFinancialGoal = z.infer<typeof insertFinancialGoalSchema>;
export type FinancialGoal = typeof financialGoals.$inferSelect;
