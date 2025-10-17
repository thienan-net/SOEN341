import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Organization, { IOrganization } from '../models/Organization';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Generate JWT token
const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  } as jwt.SignOptions);
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('role').isIn(['student', 'organizer']),
  body('studentId').optional().trim(),
  body('organizationName').optional().trim(),
  body('phoneNumber').optional().trim()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, role, studentId, organizationName, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

  let organization: IOrganization | null = null;

    if (role === 'organizer' && !organizationName) {
      return res.status(400).json({ message: 'Organization name is required for organizers' });
    }

    // Create user instance but delay saving until organization is linked (organizer requires org)
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role,
      studentId: role === 'student' ? studentId : undefined,
      phoneNumber,
      isApproved: role === 'student' // Students are auto-approved
    });

    // If organizer, find or create organization and link it before saving user
    if (role === 'organizer') {
      // Try to find existing org by exact name (case-sensitive in DB unless collation set)
      organization = await Organization.findOne({ name: organizationName });

      if (!organization) {
        // Create new organization with minimal required fields
        const newOrg = new Organization({
          name: organizationName,
          description: `${organizationName} - created during user registration`,
          contactEmail: email,
          createdBy: user._id
        });

        organization = await newOrg.save();
      }

      // Link organization to user
      user.organization = organization._id as any;
      // Organizers should not be auto-approved by default
      user.isApproved = false;
    }

    // Now save the user (password will be hashed in pre-save)
    await user.save();

    const token = generateToken((user._id as any).toString());

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).populate('organization');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken((user._id as any).toString());

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isApproved: user.isApproved,
        organization: user.organization
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const user = await User.findById(req.user!._id)
      .select('-password')
      .populate('organization');
    
    res.json({
      user: {
        id: user!._id,
        email: user!.email,
        firstName: user!.firstName,
        lastName: user!.lastName,
        role: user!.role,
        isApproved: user!.isApproved,
        organization: user!.organization,
        studentId: user!.studentId,
        phoneNumber: user!.phoneNumber,
        profilePicture: user!.profilePicture
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/organizations
// @desc    Create a new organization
// @access  Private (Admin only)
router.post('/organizations', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, description, contactEmail, website } = req.body;

    const organization = new Organization({
      name,
      description,
      contactEmail,
      website,
      createdBy: req.user!._id
    });

    await organization.save();

    res.status(201).json(organization);
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/organizations
// @desc    Get all organizations
// @access  Public
router.get('/organizations', async (req: express.Request, res: express.Response) => {
  try {
    const organizations = await Organization.find({ isActive: true })
      .select('name description logo website contactEmail');
    
    res.json(organizations);
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;