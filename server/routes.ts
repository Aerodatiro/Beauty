import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertClientSchema, 
  insertProcedureSchema, 
  insertAppointmentSchema,
  insertFinancialRecordSchema,
  insertFinancialGoalSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Middleware to check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check if user is admin
function isAdmin(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated() && req.user?.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Admin access required" });
}

// Helper to handle validation errors
function handleValidationError(error: unknown, res: Response) {
  if (error instanceof ZodError) {
    const validationError = fromZodError(error);
    return res.status(400).json({ message: validationError.message });
  }
  return res.status(500).json({ message: "Server error" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setting up authentication routes
  setupAuth(app);

  // Get procedures for a specific appointment
  app.get("/api/appointments/:id/procedures", isAuthenticated, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const companyId = req.user!.companyId;
      
      // Verify appointment exists and belongs to user's company
      const existingAppointment = await storage.getAppointment(appointmentId);
      if (!existingAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      if (existingAppointment.companyId !== companyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const procedures = await storage.getAppointmentProcedures(appointmentId);
      res.json(procedures);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Client routes
  app.get("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const companyId = req.user!.companyId;
      const clients = await storage.getClientsByCompany(companyId!);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const companyId = req.user!.companyId;
      const clientData = insertClientSchema.parse({
        ...req.body,
        companyId,
      });
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.get("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Check if client belongs to user's company
      if (client.companyId !== req.user!.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const companyId = req.user!.companyId;
      
      // Verify client exists and belongs to user's company
      const existingClient = await storage.getClient(clientId);
      if (!existingClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      if (existingClient.companyId !== companyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const clientData = insertClientSchema.parse({
        ...req.body,
        companyId,
      });
      
      const updatedClient = await storage.updateClient(clientId, clientData);
      res.json(updatedClient);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.delete("/api/clients/:id", isAdmin, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      
      // Verify client exists and belongs to user's company
      const existingClient = await storage.getClient(clientId);
      if (!existingClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      if (existingClient.companyId !== req.user!.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteClient(clientId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Procedure routes
  app.get("/api/procedures", isAuthenticated, async (req, res) => {
    try {
      const companyId = req.user!.companyId;
      const procedures = await storage.getProceduresByCompany(companyId!);
      res.json(procedures);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/procedures", isAdmin, async (req, res) => {
    try {
      const companyId = req.user!.companyId;
      const procedureData = insertProcedureSchema.parse({
        ...req.body,
        companyId,
      });
      const procedure = await storage.createProcedure(procedureData);
      res.status(201).json(procedure);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.put("/api/procedures/:id", isAdmin, async (req, res) => {
    try {
      const procedureId = parseInt(req.params.id);
      const companyId = req.user!.companyId;
      
      // Verify procedure exists and belongs to user's company
      const existingProcedure = await storage.getProcedure(procedureId);
      if (!existingProcedure) {
        return res.status(404).json({ message: "Procedure not found" });
      }
      if (existingProcedure.companyId !== companyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const procedureData = insertProcedureSchema.parse({
        ...req.body,
        companyId,
      });
      
      const updatedProcedure = await storage.updateProcedure(procedureId, procedureData);
      res.json(updatedProcedure);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.delete("/api/procedures/:id", isAdmin, async (req, res) => {
    try {
      const procedureId = parseInt(req.params.id);
      
      // Verify procedure exists and belongs to user's company
      const existingProcedure = await storage.getProcedure(procedureId);
      if (!existingProcedure) {
        return res.status(404).json({ message: "Procedure not found" });
      }
      if (existingProcedure.companyId !== req.user!.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteProcedure(procedureId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Collaborator routes
  app.get("/api/collaborators", isAuthenticated, async (req, res) => {
    try {
      const companyId = req.user!.companyId;
      const collaborators = await storage.getCollaboratorsByCompany(companyId!);
      res.json(collaborators);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Appointment routes
  app.get("/api/appointments", isAuthenticated, async (req, res) => {
    try {
      const companyId = req.user!.companyId;
      const { startDate, endDate, collaboratorId, clientId } = req.query;
      
      let appointments;
      if (startDate && endDate) {
        appointments = await storage.getAppointmentsByDateRange(
          companyId!, 
          new Date(startDate as string), 
          new Date(endDate as string),
          collaboratorId ? parseInt(collaboratorId as string) : undefined
        );
      } else if (clientId) {
        // Filter appointments by client ID
        const allAppointments = await storage.getAppointmentsByCompany(companyId!);
        appointments = allAppointments.filter(a => a.clientId === parseInt(clientId as string));
      } else {
        appointments = await storage.getAppointmentsByCompany(companyId!);
      }
      
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/appointments", isAuthenticated, async (req, res) => {
    try {
      const companyId = req.user!.companyId;
      const { procedureIds, ...restData } = req.body;
      
      // Validate appointment data
      console.log("Dados recebidos para agendamento:", {
        ...restData,
        companyId,
        procedureIds,
      });
      
      // Ensure procedures exist and belong to the same company
      if (!procedureIds || !Array.isArray(procedureIds) || procedureIds.length === 0) {
        return res.status(400).json({ message: "Pelo menos um procedimento é obrigatório" });
      }
      
      // Verify that all procedures are valid
      let totalValue = 0;
      const validProcedures = [];
      
      for (const procedureId of procedureIds) {
        const procedure = await storage.getProcedure(parseInt(procedureId));
        if (!procedure || procedure.companyId !== companyId) {
          return res.status(400).json({ message: "Procedimento inválido ou não pertence à sua empresa" });
        }
        validProcedures.push(procedure);
        totalValue += parseFloat(procedure.value);
      }
      
      // Pré-processamento manual da data e outros campos antes de passar para o schema
      const preprocessedData = {
        ...restData,
        companyId,
        // Converter a string de data para um objeto Date adequado
        date: new Date(restData.date),
        // Usar o valor calculado a partir dos procedimentos
        value: totalValue.toFixed(2),
        // Usar o primeiro procedimento para o campo procedureId (necessário pelo schema)
        procedureId: validProcedures[0].id,
      };
      
      console.log("Dados pré-processados:", preprocessedData);
      
      let appointmentData;
      try {
        appointmentData = insertAppointmentSchema.parse(preprocessedData);
        console.log("Dados após parse:", appointmentData);
      } catch (validationError: any) {
        console.error("Erro na validação:", validationError);
        return res.status(400).json({ 
          message: `Erro de validação: ${validationError.message}`,
          details: validationError.errors
        });
      }
      
      try {
        // Create appointment
        const appointment = await storage.createAppointment(appointmentData);
        
        // Add procedures to appointment
        for (const procedure of validProcedures) {
          await storage.addProcedureToAppointment({
            appointmentId: appointment.id,
            procedureId: procedure.id
          });
        }
        
        // Create financial record for the appointment
        await storage.createFinancialRecord({
          type: "income",
          category: "appointment",
          description: `Agendamento #${appointment.id}`,
          value: appointment.value,
          date: appointment.date,
          companyId: companyId!,
          appointmentId: appointment.id,
        });
        
        res.status(201).json(appointment);
      } catch (error) {
        console.error("Erro interno ao criar agendamento:", error);
        res.status(500).json({ 
          message: "Erro interno ao criar agendamento",
          details: error instanceof Error ? error.message : String(error)
        });
      }
    } catch (validationError) {
      console.error("Erro de validação:", validationError);
      handleValidationError(validationError, res);
    }
  });

  app.put("/api/appointments/:id", isAuthenticated, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const companyId = req.user!.companyId;
      const { procedureIds, ...restData } = req.body;
      
      // Verify appointment exists and belongs to user's company
      const existingAppointment = await storage.getAppointment(appointmentId);
      if (!existingAppointment) {
        return res.status(404).json({ message: "Agendamento não encontrado" });
      }
      if (existingAppointment.companyId !== companyId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Ensure procedures exist and belong to the same company
      if (!procedureIds || !Array.isArray(procedureIds) || procedureIds.length === 0) {
        return res.status(400).json({ message: "Pelo menos um procedimento é obrigatório" });
      }
      
      // Verify that all procedures are valid and calculate total value
      let totalValue = 0;
      const validProcedures = [];
      
      for (const procedureId of procedureIds) {
        const procedure = await storage.getProcedure(parseInt(procedureId));
        if (!procedure || procedure.companyId !== companyId) {
          return res.status(400).json({ message: "Procedimento inválido ou não pertence à sua empresa" });
        }
        validProcedures.push(procedure);
        totalValue += parseFloat(procedure.value);
      }
      
      // Pré-processamento manual da data antes de passar para o schema
      const preprocessedData = {
        ...restData,
        companyId,
        // Converter a string de data para um objeto Date adequado
        date: new Date(restData.date),
        // Usar o valor calculado a partir dos procedimentos
        value: totalValue.toFixed(2),
        // Usar o primeiro procedimento para o campo procedureId (necessário pelo schema)
        procedureId: validProcedures[0].id,
      };
      
      console.log("Dados pré-processados (PUT):", preprocessedData);
      
      // Validate appointment data
      try {
        const appointmentData = insertAppointmentSchema.parse(preprocessedData);
        
        // Update appointment data
        const updatedAppointment = await storage.updateAppointment(appointmentId, appointmentData);
        
        // First, remove all existing procedures from the appointment
        await storage.removeAllProceduresFromAppointment(appointmentId);
        
        // Then add the new procedures
        for (const procedure of validProcedures) {
          await storage.addProcedureToAppointment({
            appointmentId,
            procedureId: procedure.id
          });
        }
        
        // Update financial record if the status changed to completed
        if (updatedAppointment.status === 'completed' && existingAppointment.status !== 'completed') {
          await storage.updateFinancialRecordByAppointment(appointmentId, {
            value: updatedAppointment.value,
            date: new Date(),
          });
        }
      } catch (validationError: any) {
        console.error("Erro na validação:", validationError);
        return res.status(400).json({ 
          message: `Erro de validação: ${validationError.message}`,
          details: validationError.errors
        });
      }
      
      // Buscar e retornar o agendamento atualizado
      const updatedAppointment = await storage.getAppointment(appointmentId);
      res.json(updatedAppointment);
    } catch (error) {
      console.error("Erro ao atualizar agendamento:", error);
      res.status(500).json({ 
        message: "Erro ao atualizar agendamento",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.delete("/api/appointments/:id", isAuthenticated, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      
      // Verify appointment exists and belongs to user's company
      const existingAppointment = await storage.getAppointment(appointmentId);
      if (!existingAppointment) {
        return res.status(404).json({ message: "Agendamento não encontrado" });
      }
      if (existingAppointment.companyId !== req.user!.companyId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      try {
        // Delete associated financial record first
        await storage.deleteFinancialRecordByAppointment(appointmentId);
        
        // Delete appointment
        await storage.deleteAppointment(appointmentId);
        res.status(204).send();
      } catch (error) {
        console.error("Erro ao excluir agendamento:", error);
        res.status(500).json({ 
          message: "Erro ao excluir agendamento",
          details: error instanceof Error ? error.message : String(error)
        });
      }
    } catch (error) {
      console.error("Erro ao processar exclusão:", error);
      res.status(500).json({ message: "Erro do servidor" });
    }
  });

  // Financial routes
  app.get("/api/financial-records", isAuthenticated, async (req, res) => {
    try {
      const companyId = req.user!.companyId;
      const { startDate, endDate, type } = req.query;
      
      let records;
      if (startDate && endDate) {
        records = await storage.getFinancialRecordsByDateRange(
          companyId!, 
          new Date(startDate as string), 
          new Date(endDate as string),
          type as string | undefined
        );
      } else {
        records = await storage.getFinancialRecordsByCompany(companyId!);
      }
      
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/financial-records", isAdmin, async (req, res) => {
    try {
      const companyId = req.user!.companyId;
      const preprocessedData = {
        ...req.body,
        companyId,
        // Converter string de data para objeto Date
        date: typeof req.body.date === 'string' ? new Date(req.body.date) : req.body.date,
      };
      
      console.log("Dados financeiros pré-processados:", preprocessedData);
      
      const recordData = insertFinancialRecordSchema.parse(preprocessedData);
      
      const record = await storage.createFinancialRecord(recordData);
      res.status(201).json(record);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  // Financial goals
  app.get("/api/financial-goals", isAuthenticated, async (req, res) => {
    try {
      const companyId = req.user!.companyId;
      const goals = await storage.getFinancialGoalsByCompany(companyId!);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/financial-goals", isAdmin, async (req, res) => {
    try {
      const companyId = req.user!.companyId;
      const preprocessedData = {
        ...req.body,
        companyId,
        // Converter string de data para objeto Date
        startDate: typeof req.body.startDate === 'string' ? new Date(req.body.startDate) : req.body.startDate,
        endDate: typeof req.body.endDate === 'string' ? new Date(req.body.endDate) : req.body.endDate,
      };
      
      console.log("Dados de meta financeira pré-processados:", preprocessedData);
      
      const goalData = insertFinancialGoalSchema.parse(preprocessedData);
      
      const goal = await storage.createFinancialGoal(goalData);
      res.status(201).json(goal);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const isAdmin = req.user!.role === 'admin';
      const timeFilter = req.query.timeFilter as string || 'day';
      
      // Define date ranges based on time filter
      const now = new Date();
      let startDate: Date, endDate: Date;
      
      switch (timeFilter) {
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'day':
        default:
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
      }
      
      // Get appointments for the selected period
      // If user is a collaborator, only show their appointments
      const appointments = await storage.getAppointmentsByDateRange(
        companyId!,
        startDate,
        endDate,
        !isAdmin ? userId : undefined  // Filter by collaborator ID if not admin
      );
      
      // Get total clients
      const clients = await storage.getClientsByCompany(companyId!);
      
      // Get revenue for the selected period (admin only)
      let revenue = 0;
      if (isAdmin) {
        const revenueRecords = await storage.getFinancialRecordsByDateRange(
          companyId!,
          startDate,
          endDate,
          'income'
        );
        revenue = revenueRecords.reduce((sum, record) => sum + Number(record.value), 0);
      }
      
      // Calculate occupation rate based on completed vs total appointments
      // Use appointments from the selected period
      const occupationRate = Math.round((appointments.filter(a => a.status === 'completed').length / 
        (appointments.length || 1)) * 100);
      
      // Calculate clients served (completed appointments for the period)
      const clientsServed = appointments.filter(a => a.status === 'completed').length;
      
      // Get upcoming weekly appointments (for collaborators)
      const nextWeekStart = new Date();
      const nextWeekEnd = new Date();
      nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
      nextWeekEnd.setHours(23, 59, 59, 999);
      
      const upcomingAppointments = await storage.getAppointmentsByDateRange(
        companyId!,
        nextWeekStart,
        nextWeekEnd,
        !isAdmin ? userId : undefined  // Filter by collaborator ID if not admin
      );
      
      res.json({
        appointments: appointments.length,
        clients: clients.length,
        revenue: revenue,
        occupation: occupationRate,
        clientsServed: clientsServed,
        weeklyAppointments: upcomingAppointments.length
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
