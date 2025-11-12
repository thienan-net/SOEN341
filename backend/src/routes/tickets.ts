import express from 'express';
import { body, validationResult } from 'express-validator';
import Ticket from '../models/Ticket';
import Event from '../models/Event';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use((req: AuthRequest, _res: express.Response, next: express.NextFunction) => {
  const who = req.user?.email ?? 'anonymous';
  console.log(`[Tickets] ${req.method} ${req.originalUrl} | user=${who}`);
  next();
});


router.get('/my', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const tickets = await Ticket.find({ user: req.user._id })
        .populate('event', 'title date startTime endTime location organization')
        .populate('user', 'email firstName lastName');

    return res.status(200).json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post(
    '/claim',
    authenticate,
    [body('eventId').notEmpty().withMessage('Event ID is required')],
    async (req: AuthRequest, res: express.Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const { eventId } = req.body;
        const userId = req.user?._id;

        if (!userId) {
          return res.status(401).json({ message: 'User not authenticated' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
          return res.status(404).json({ message: 'Event not found' });
        }

        const existingTicket = await Ticket.findOne({ event: eventId, user: userId });
        if (existingTicket) {
          return res.status(400).json({ message: 'Ticket already claimed for this event' });
        }

        const ticket = new Ticket({
          event: eventId,
          user: userId,
          status: 'active',
          qrCodeImage: '', // will be generated later
          createdAt: new Date(),
        });

        await ticket.save();

        console.log(`[Tickets] New ticket claimed by ${req.user?.email} for event ${event.title}`);

        return res.status(201).json(ticket);
      } catch (error) {
        console.error('Error claiming ticket:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    }
);

export default router;
