import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../services/dataStore';
import { nexconnService } from '../../services/nexconnService';
import { ENV } from '../../config/env';
import { AuthenticatedRequest } from '../../middleware/auth';
import { UserProfile, Vendor } from '../../../../shared';

export class AuthController {
  public async register(req: Request, res: Response) {
    const { email, password, displayName, role = 'consumer', businessName } = req.body;

    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    let vendorId: string | undefined = undefined;

    // If registering as vendor, provision vendor document
    if (role === 'vendor') {
      vendorId = `vendor_${Date.now()}`;
      const newVendor: Vendor = {
        vendorId,
        ownerUid: uid,
        businessName: businessName || `${displayName}'s Store`,
        description: 'New verified seller on ConvoCart marketplace.',
        logo: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200&auto=format&fit=crop&q=80',
        category: 'Electronics & Gadgets',
        verificationStatus: 'approved', // auto-approve for testing
        rating: 5.0,
        reviewCount: 0,
        businessPolicies: {
          shipping: 'Standard delivery in 3-5 business days.',
          returns: '7-day replacement guarantee.',
          warranty: '1-year standard warranty.',
        },
        availability: 'online',
        aiAgentEnabled: true,
        commissionRate: 0.05,
        contactEmail: email,
        contactPhone: '+1-555-0100',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.addVendor(newVendor);
    }

    const newUser: UserProfile = {
      uid,
      email,
      displayName,
      role,
      preferredLanguage: 'en',
      vendorId,
      addresses: [],
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addUser(newUser, passwordHash);

    const token = jwt.sign({ uid: newUser.uid, role: newUser.role }, ENV.JWT_SECRET, {
      expiresIn: '7d',
    });

    const nexconn = await nexconnService.issueUserToken(
      newUser.uid,
      newUser.displayName,
      newUser.photoURL
    );

    res.status(201).json({
      message: 'Registration successful',
      user: newUser,
      token,
      nexconnToken: nexconn.token,
      nexconnAppKey: nexconn.appKey,
    });
  }

  public async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const hash = db.getPasswordHash(user.uid);
    if (!hash || !bcrypt.compareSync(password, hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ uid: user.uid, role: user.role }, ENV.JWT_SECRET, {
      expiresIn: '7d',
    });

    const nexconn = await nexconnService.issueUserToken(
      user.uid,
      user.displayName,
      user.photoURL
    );

    res.json({
      message: 'Login successful',
      user,
      token,
      nexconnToken: nexconn.token,
      nexconnAppKey: nexconn.appKey,
    });
  }

  public async getMe(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Refresh Nexconn token
    const nexconn = await nexconnService.issueUserToken(
      req.user.uid,
      req.user.displayName,
      req.user.photoURL
    );

    res.json({
      user: req.user,
      nexconnToken: nexconn.token,
      nexconnAppKey: nexconn.appKey,
    });
  }

  public async updateProfile(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { displayName, preferredLanguage, phoneNumber, photoURL, addresses } = req.body;
    const updated = db.updateUser(req.user.uid, {
      displayName: displayName ?? req.user.displayName,
      preferredLanguage: preferredLanguage ?? req.user.preferredLanguage,
      phoneNumber: phoneNumber ?? req.user.phoneNumber,
      photoURL: photoURL ?? req.user.photoURL,
      addresses: addresses ?? req.user.addresses,
    });

    res.json({ message: 'Profile updated', user: updated });
  }

  public async getNexconnToken(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const nexconn = await nexconnService.issueUserToken(
      req.user.uid,
      req.user.displayName,
      req.user.photoURL
    );

    res.json(nexconn);
  }
}

export const authController = new AuthController();
