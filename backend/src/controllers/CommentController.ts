import { Request, Response } from "express";
import prisma from "../config/prisma";

// Add a comment to a ticket
export const addComment = async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id as string);
    const { content } = req.body;
    const { userId, role } = req.user!;

    if (isNaN(ticketId)) {
      return res.status(400).json({ message: "Invalid ticket ID" });
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    // Verify the ticket exists and user has access
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // If customer, they can only comment on their own tickets
    if (role === "CUSTOMER" && ticket.customerId !== userId) {
      return res.status(403).json({ message: "Forbidden: Cannot comment on this ticket" });
    }

    const comment = await prisma.ticketComment.create({
      data: {
        content: content.trim(),
        ticketId,
        userId,
      },
      include: {
        user: { select: { id: true, name: true, role: true } }
      }
    });

    return res.status(201).json(comment);
  } catch (error) {
    console.error("Add comment error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get comments for a ticket (useful for pagination later)
export const getComments = async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id as string);
    const { userId, role } = req.user!;

    if (isNaN(ticketId)) {
      return res.status(400).json({ message: "Invalid ticket ID" });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (role === "CUSTOMER" && ticket.customerId !== userId) {
      return res.status(403).json({ message: "Forbidden: Cannot view comments for this ticket" });
    }

    const comments = await prisma.ticketComment.findMany({
      where: { ticketId },
      include: {
        user: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    return res.status(200).json(comments);
  } catch (error) {
    console.error("Get comments error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
