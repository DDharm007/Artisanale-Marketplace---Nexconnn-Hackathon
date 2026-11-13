import { Response } from 'express';
import { db } from '../../services/dataStore';
import { AuthenticatedRequest } from '../../middleware/auth';
import { SupportTicket, InternalNote } from '../../../../shared';

export class SupportController {
  public getTickets(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status, priority, assignedOnly } = req.query;

    let tickets: SupportTicket[] = [];
    if (req.user.role === 'consumer') {
      tickets = db.getSupportTickets({ consumerId: req.user.uid });
    } else if (req.user.role === 'support_agent' || req.user.role === 'admin') {
      tickets = db.getSupportTickets({
        assignedAgentId: assignedOnly === 'true' ? req.user.uid : undefined,
        status: status as string,
      });
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (priority) {
      tickets = tickets.filter((t) => t.priority === priority);
    }

    res.json(tickets);
  }

  public getTicketById(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { ticketId } = req.params;
    const ticket = db.findSupportTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    // Consumer can only view their own ticket and internal notes are stripped for consumers!
    if (req.user.role === 'consumer') {
      if (ticket.consumerId !== req.user.uid) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      const safeTicket = { ...ticket, internalNotes: [] };
      return res.json(safeTicket);
    }

    res.json(ticket);
  }

  public createTicket(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { subject, category, description, orderId, conversationId, priority = 'medium' } = req.body;
    const ticketId = `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newTicket: SupportTicket = {
      ticketId,
      consumerId: req.user.uid,
      consumerName: req.user.displayName,
      consumerEmail: req.user.email,
      conversationId,
      orderId,
      priority,
      status: 'open',
      category,
      subject,
      description,
      internalNotes: [],
      slaDueHours: priority === 'urgent' ? 4 : priority === 'high' ? 12 : 24,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addSupportTicket(newTicket);
    res.status(201).json(newTicket);
  }

  public updateTicket(req: AuthenticatedRequest, res: Response) {
    if (!req.user || (req.user.role !== 'support_agent' && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Only support agents or admins can update tickets' });
    }

    const { ticketId } = req.params;
    const { status, priority, assignToMe } = req.body;

    const ticket = db.findSupportTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const updates: Partial<SupportTicket> = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (assignToMe) {
      updates.assignedAgentId = req.user.uid;
      updates.assignedAgentName = req.user.displayName;
    }

    const updated = db.updateSupportTicket(ticketId, updates);
    res.json(updated);
  }

  public addInternalNote(req: AuthenticatedRequest, res: Response) {
    if (!req.user || (req.user.role !== 'support_agent' && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Only authorized agents can add internal notes' });
    }

    const { ticketId } = req.params;
    const { note } = req.body;

    if (!note || note.trim().length === 0) {
      return res.status(400).json({ error: 'Note text cannot be empty' });
    }

    const ticket = db.findSupportTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const internalNote: InternalNote = {
      id: `note_${Date.now()}`,
      authorId: req.user.uid,
      authorName: req.user.displayName,
      note,
      createdAt: new Date().toISOString(),
    };

    ticket.internalNotes.push(internalNote);
    const updated = db.updateSupportTicket(ticketId, {
      internalNotes: ticket.internalNotes,
    });

    res.status(201).json(updated);
  }
}

export const supportController = new SupportController();
