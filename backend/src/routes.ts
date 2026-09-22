import { Router } from "express";
import { login, register } from "./controllers/Authcontroller";
import { 
  createTicket, 
  deleteTicket, 
  getTicketById, 
  getTickets, 
  updateTicket 
} from "./controllers/TicketController";
import { addComment, getComments } from "./controllers/CommentController";
import { authenticate, requireRole } from "./middleware/authMiddleware";

const router = Router();

// ==========================================
// Auth Routes (Public)
// ==========================================
router.post("/auth/register", register);
router.post("/auth/login", login);

// ==========================================
// Ticket Routes (Protected)
// ==========================================
// GET tickets (Customers see own, Agents see all)
router.get("/tickets", authenticate, getTickets);

// POST ticket (Customer only)
router.post("/tickets", authenticate, requireRole(["CUSTOMER"]), createTicket);

// GET ticket by ID (Authorized user)
router.get("/tickets/:id", authenticate, getTicketById);

// PUT ticket (Agent only - Update status/priority/assignment)
router.put("/tickets/:id", authenticate, requireRole(["AGENT"]), updateTicket);

// DELETE ticket (Admin/Agent only)
router.delete("/tickets/:id", authenticate, requireRole(["AGENT"]), deleteTicket);

// ==========================================
// Comment Routes (Protected)
// ==========================================
// GET comments for ticket
router.get("/tickets/:id/comments", authenticate, getComments);

// POST comment to ticket
router.post("/tickets/:id/comments", authenticate, addComment);

// ==========================================
// Users Route (Protected - Agent/Admin only)
// ==========================================
import prisma from "./config/prisma";
router.get("/users", authenticate, requireRole(["AGENT"]), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
