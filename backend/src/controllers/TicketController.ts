import { Request, Response } from "express";
import prisma from "../config/prisma";
import { Priority, TicketStatus } from "@prisma/client";

// Create a new ticket (Customers only)
export const createTicket = async (req: Request, res: Response) => {
  try {
    const { subject, description, priority } = req.body;
    const userId = req.user!.userId;

    if (!subject || !description) {
      return res.status(400).json({ message: "Subject and description are required" });
    }

    const ticket = await prisma.ticket.create({
      data: {
        subject,
        description,
        priority: priority || "MEDIUM",
        customerId: userId,
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return res.status(201).json(ticket);
  } catch (error) {
    console.error("Create ticket error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get all tickets (Customers see own, Agents see all)
export const getTickets = async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user!;
    const { status, priority } = req.query;

    // Build filter based on role and query params
    const whereClause: any = {};
    
    if (role === "CUSTOMER") {
      whereClause.customerId = userId;
    }

    if (status) {
      whereClause.status = status as TicketStatus;
    }

    if (priority) {
      whereClause.priority = priority as Priority;
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        customer: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json(tickets);
  } catch (error) {
    console.error("Get tickets error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get a single ticket by ID
export const getTicketById = async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id as string);
    const { userId, role } = req.user!;

    if (isNaN(ticketId)) {
      return res.status(400).json({ message: "Invalid ticket ID" });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Customers can only view their own tickets
    if (role === "CUSTOMER" && ticket.customerId !== userId) {
      return res.status(403).json({ message: "Forbidden: You do not have access to this ticket" });
    }

    return res.status(200).json(ticket);
  } catch (error) {
    console.error("Get ticket by ID error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update ticket (Agents only: status, priority, assign to agent)
export const updateTicket = async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id as string);
    const { status, priority, assignedToId } = req.body;

    if (isNaN(ticketId)) {
      return res.status(400).json({ message: "Invalid ticket ID" });
    }

    const existingTicket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignedToId !== undefined && { assignedToId }),
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } }
      }
    });

    return res.status(200).json(updatedTicket);
  } catch (error) {
    console.error("Update ticket error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a ticket (Agents/Admins)
export const deleteTicket = async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id as string);

    if (isNaN(ticketId)) {
      return res.status(400).json({ message: "Invalid ticket ID" });
    }

    const existingTicket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    await prisma.ticket.delete({
      where: { id: ticketId }
    });

    return res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("Delete ticket error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
