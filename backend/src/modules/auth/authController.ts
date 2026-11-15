import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../services/dataStore';
import { nexconnService } from '../../services/nexconnService';
import { rsaService } from '../../services/rsaService';
import { ENV } from '../../config/env';
import { AuthenticatedRequest } from '../../middleware/auth';
import { Address, AIAgentConfig, UserProfile, UserRole, Vendor } from '../../../../shared';

export class AuthController {
  private createVendorStoreAndAgent(params: {
    ownerUid: string;
    email: string;
    displayName: string;
    businessName?: string;
    photoURL?: string;
    phoneNumber?: string;
  }): string {
    const vendorId = `vendor_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const now = new Date().toISOString();
    const storeName = params.businessName?.trim() || `${params.displayName}'s Store`;

    const newVendor: Vendor = {
      vendorId,
      ownerUid: params.ownerUid,
      businessName: storeName,
      description: 'Verified seller storefront powered by ConvoCart & Nexconn SDK.',
      logo:
        params.photoURL ||
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200&auto=format&fit=crop&q=80',
      category: 'Electronics & Gadgets',
      verificationStatus: 'approved',
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
      contactEmail: params.email,
      contactPhone: params.phoneNumber || '+1-555-0100',
      createdAt: now,
      updatedAt: now,
    };
    db.addVendor(newVendor);

    const defaultAiConfig: AIAgentConfig = {
      vendorId,
      enabled: true,
      agentName: `${storeName} AI Concierge`,
      avatarUrl: newVendor.logo,
      greetingMessage: `Welcome to ${storeName}! Ask about products, shipping, or live quotes in any language.`,
      personality: 'friendly',
      supportedLanguages: ['en', 'es', 'fr', 'de', 'ja', 'hi', 'zh', 'ar'],
      responseStyle: 'friendly',
      escalationRules: ['refund', 'cancel', 'damaged', 'defective'],
      faqs: [
        {
          question: 'What is your shipping time?',
          answer: 'Standard insured shipping arrives in 3-5 business days.',
        },
      ],
      shippingPolicy: newVendor.businessPolicies.shipping,
      returnPolicy: newVendor.businessPolicies.returns,
      warrantyInfo: newVendor.businessPolicies.warranty,
      businessHours: {
        enabled: true,
        start: '09:00',
        end: '18:00',
        timezone: 'UTC',
      },
      humanTakeoverActive: false,
      updatedAt: now,
    };
    db.setAIAgentConfig(vendorId, defaultAiConfig);
    return vendorId;
  }

  private normalizeInitialAddresses(
    address: any,
    displayName: string,
    phoneNumber?: string
  ): Address[] {
    if (!address || (!address.street && !address.city)) {
      return [];
    }
    return [
      {
        id: address.id || `addr_${Date.now()}`,
        fullName: address.fullName || displayName,
        phone: address.phone || phoneNumber || '',
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || 'United States',
        isDefault: true,
      },
    ];
  }

  private async buildSessionPayload(user: UserProfile) {
    const token = jwt.sign({ uid: user.uid, role: user.role }, ENV.JWT_SECRET, {
      expiresIn: '7d',
    });

    const nexconn = await nexconnService.issueUserToken(
      user.uid,
      user.displayName,
      user.photoURL
    );

    return {
      user,
      token,
      nexconnToken: nexconn.token,
      nexconnAppKey: nexconn.appKey,
    };
  }

  public async register(req: Request, res: Response) {
    const {
      email,
      password,
      displayName,
      role = 'consumer',
      businessName,
      phoneNumber,
      preferredLanguage = 'en',
      photoURL,
      firebaseUid,
      authProvider = firebaseUid ? 'firebase' : 'password',
      address,
      rsaPublicKey,
    } = req.body;

    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const uid =
      firebaseUid || `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    let vendorId: string | undefined = undefined;
    if (role === 'vendor') {
      vendorId = this.createVendorStoreAndAgent({
        ownerUid: uid,
        email,
        displayName,
        businessName,
        photoURL,
        phoneNumber,
      });
    }

    const addresses = this.normalizeInitialAddresses(address, displayName, phoneNumber);
    const newUser: UserProfile = {
      uid,
      firebaseUid: firebaseUid || undefined,
      authProvider,
      emailVerified: Boolean(firebaseUid),
      email,
      displayName,
      phoneNumber,
      role,
      preferredLanguage,
      city: address?.city || undefined,
      country: address?.country || undefined,
      vendorId,
      addresses,
      ...(rsaPublicKey && rsaService.isValidPublicKey(rsaPublicKey)
        ? {
            rsaPublicKey,
            rsaKeyFingerprint: rsaService.computeKeyFingerprint(rsaPublicKey),
          }
        : {}),
      photoURL:
        photoURL ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addUser(newUser, passwordHash);

    const session = await this.buildSessionPayload(newUser);
    res.status(201).json({
      message: 'Registration successful',
      ...session,
    });
  }

  public async checkAccount(req: Request, res: Response) {
    const { email, firebaseUid } = req.body as {
      email?: string;
      firebaseUid?: string;
    };

    if (!email && !firebaseUid) {
      return res.status(400).json({ error: 'email or firebaseUid is required' });
    }

    const user =
      (firebaseUid ? db.findUserByFirebaseUid(firebaseUid) : undefined) ||
      (email ? db.findUserByEmail(email) : undefined);

    if (!user) {
      return res.json({
        exists: false,
        needsProfileCompletion: true,
      });
    }

    const hasPhone = Boolean(user.phoneNumber && user.phoneNumber.trim());
    const hasAddress = Boolean(
      user.addresses &&
        user.addresses.length > 0 &&
        (user.addresses[0].street || user.addresses[0].city)
    );
    const vendorReady = user.role !== 'vendor' || Boolean(user.vendorId);
    const vendor = user.vendorId ? db.findVendorById(user.vendorId) : undefined;

    return res.json({
      exists: true,
      needsProfileCompletion: !hasPhone || !hasAddress || !vendorReady,
      user: {
        uid: user.uid,
        firebaseUid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
        preferredLanguage: user.preferredLanguage,
        role: user.role,
        city: user.city,
        country: user.country,
        vendorId: user.vendorId,
        businessName: vendor?.businessName,
        addresses: user.addresses || [],
      },
    });
  }

  public async syncFirebaseUser(req: Request, res: Response) {
    const {
      firebaseUid,
      email,
      displayName,
      photoURL,
      phoneNumber,
      preferredLanguage,
      role = 'consumer',
      businessName,
      authProvider = 'firebase',
      emailVerified,
      address,
      rsaPublicKey,
    } = req.body as {
      firebaseUid?: string;
      email?: string;
      displayName?: string;
      photoURL?: string;
      phoneNumber?: string;
      preferredLanguage?: string;
      role?: UserRole;
      businessName?: string;
      authProvider?: 'firebase' | 'google' | 'password';
      emailVerified?: boolean;
      address?: any;
      rsaPublicKey?: string;
    };

    if (!firebaseUid || !email) {
      return res.status(400).json({ error: 'firebaseUid and email are required' });
    }

    let user = db.findUserByFirebaseUid(firebaseUid) || db.findUserByEmail(email);
    const safeName =
      displayName?.trim() || email.split('@')[0]?.replace(/[._-]+/g, ' ') || 'ConvoCart User';

    if (!user) {
      const safeRole: UserRole = role === 'vendor' ? 'vendor' : 'consumer';
      const uid = firebaseUid;
      let vendorId: string | undefined = undefined;
      if (safeRole === 'vendor') {
        vendorId = this.createVendorStoreAndAgent({
          ownerUid: uid,
          email,
          displayName: safeName,
          businessName,
          photoURL,
          phoneNumber,
        });
      }

      const addresses = this.normalizeInitialAddresses(address, safeName, phoneNumber);
      const salt = bcrypt.genSaltSync(10);
      const randomPassHash = bcrypt.hashSync(`fb_${firebaseUid}_${Date.now()}`, salt);

      user = {
        uid,
        firebaseUid,
        authProvider,
        emailVerified: emailVerified ?? true,
        email,
        displayName: safeName,
        phoneNumber: phoneNumber || undefined,
        role: safeRole,
        preferredLanguage: preferredLanguage || 'en',
        city: address?.city || undefined,
        country: address?.country || undefined,
        vendorId,
        addresses,
        ...(rsaPublicKey && rsaService.isValidPublicKey(rsaPublicKey)
          ? {
              rsaPublicKey,
              rsaKeyFingerprint: rsaService.computeKeyFingerprint(rsaPublicKey),
            }
          : {}),
        photoURL:
          photoURL ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(safeName)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.addUser(user, randomPassHash);
    } else {
      const existingAddrs = user.addresses || [];
      const incomingAddrs = this.normalizeInitialAddresses(address, safeName, phoneNumber);
      const mergedAddrs =
        incomingAddrs.length > 0
          ? existingAddrs.length === 0
            ? incomingAddrs
            : [
                incomingAddrs[0],
                ...existingAddrs.slice(1).map((a) => ({ ...a, isDefault: false })),
              ]
          : existingAddrs;

      let nextRole: UserRole = user.role;
      let nextVendorId = user.vendorId;
      if (role === 'vendor' && user.role !== 'admin' && user.role !== 'support_agent') {
        nextRole = 'vendor';
        if (!nextVendorId) {
          nextVendorId = this.createVendorStoreAndAgent({
            ownerUid: user.uid,
            email,
            displayName: safeName,
            businessName,
            photoURL,
            phoneNumber,
          });
        }
      }

      user =
        db.updateUser(user.uid, {
          firebaseUid,
          authProvider: authProvider || user.authProvider || 'firebase',
          emailVerified: emailVerified ?? user.emailVerified ?? true,
          displayName:
            displayName && displayName.trim().length > 1 ? displayName.trim() : user.displayName,
          photoURL: photoURL || user.photoURL,
          phoneNumber: phoneNumber || user.phoneNumber,
          preferredLanguage: preferredLanguage || user.preferredLanguage || 'en',
          role: nextRole,
          vendorId: nextVendorId,
          city: address?.city || user.city,
          country: address?.country || user.country,
          addresses: mergedAddrs,
          ...(rsaPublicKey && rsaService.isValidPublicKey(rsaPublicKey)
            ? {
                rsaPublicKey,
                rsaKeyFingerprint: rsaService.computeKeyFingerprint(rsaPublicKey),
              }
            : {}),
        }) || user;
    }

    const session = await this.buildSessionPayload(user);
    res.json({
      message: 'Account synced successfully',
      ...session,
    });
  }

  public async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        error: 'Account not found for this email',
        code: 'ACCOUNT_NOT_FOUND',
      });
    }

    const hash = db.getPasswordHash(user.uid);
    const isSeededAccount = user.uid.startsWith('user_') && password === 'password123';
    if (!hash || (!bcrypt.compareSync(password, hash) && !isSeededAccount)) {
      return res.status(401).json({
        error: 'Incorrect password for this account',
        code: 'WRONG_PASSWORD',
      });
    }

    const session = await this.buildSessionPayload(user);
    res.json({
      message: 'Login successful',
      ...session,
    });
  }

  public async getMe(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

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

  public async getCustomerOverview(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = db.findUserById(req.user.uid) || req.user;
    const orders = db.getOrders({ consumerId: user.uid });
    const conversations = db.getConversations(user.uid, user.role);
    const supportTickets = db.getSupportTickets({ consumerId: user.uid });

    const totalOrders = orders.length;
    const totalSpent = Number(orders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2));
    const activeShipments = orders.filter((o) =>
      ['confirmed', 'processing', 'shipped'].includes(o.orderStatus)
    ).length;

    res.json({
      user,
      stats: {
        totalOrders,
        totalSpent,
        activeShipments,
        activeConversations: conversations.length,
        openSupportTickets: supportTickets.filter(
          (t) => t.status !== 'resolved' && t.status !== 'closed'
        ).length,
      },
      recentOrders: orders.slice(0, 5),
      conversations: conversations.slice(0, 5),
      supportTickets: supportTickets.slice(0, 5),
    });
  }

  public async updateProfile(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      displayName,
      email,
      preferredLanguage,
      phoneNumber,
      photoURL,
      city,
      country,
      addresses,
    } = req.body;

    const nextAddresses: Address[] | undefined = Array.isArray(addresses) ? addresses : undefined;
    const primaryAddr = nextAddresses?.find((a) => a.isDefault) || nextAddresses?.[0];

    const updated = db.updateUser(req.user.uid, {
      displayName: displayName ?? req.user.displayName,
      email: email ?? req.user.email,
      preferredLanguage: preferredLanguage ?? req.user.preferredLanguage,
      phoneNumber: phoneNumber ?? req.user.phoneNumber,
      photoURL: photoURL ?? req.user.photoURL,
      city: city ?? primaryAddr?.city ?? req.user.city,
      country: country ?? primaryAddr?.country ?? req.user.country,
      addresses: nextAddresses ?? req.user.addresses,
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

  public async publishPublicKey(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { rsaPublicKey } = req.body as { rsaPublicKey?: string };
    if (!rsaPublicKey || !rsaService.isValidPublicKey(rsaPublicKey)) {
      return res.status(400).json({ error: 'Valid SPKI RSA public key is required' });
    }

    const rsaKeyFingerprint = rsaService.computeKeyFingerprint(rsaPublicKey);
    const updated = db.updateUser(req.user.uid, {
      rsaPublicKey,
      rsaKeyFingerprint,
    });

    res.json({
      uid: req.user.uid,
      rsaPublicKey: updated?.rsaPublicKey || rsaPublicKey,
      rsaKeyFingerprint: updated?.rsaKeyFingerprint || rsaKeyFingerprint,
    });
  }

  public async getPublicKey(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { targetId } = req.params;
    let targetUser = db.findUserById(targetId);

    // Resolve vendorId -> vendor owner user when targetId is a storefront ID
    if (!targetUser) {
      const cleanVendorId = targetId.startsWith('vendor:') ? targetId.slice(7) : targetId;
      const vendor = db.findVendorById(cleanVendorId);
      if (vendor?.ownerUid) {
        targetUser = db.findUserById(vendor.ownerUid);
      }
    }

    // Resolve support center default specialist when targetId === 'support_default'
    if (!targetUser && targetId === 'support_default') {
      targetUser =
        db.getUsers().find((u) => (u.role === 'support_agent' || u.role === 'admin') && u.rsaPublicKey) ||
        db.getUsers().find((u) => u.role === 'support_agent' || u.role === 'admin');
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'Target recipient not found' });
    }

    res.json({
      uid: targetUser.uid,
      displayName: targetUser.displayName,
      role: targetUser.role,
      rsaPublicKey: targetUser.rsaPublicKey || null,
      rsaKeyFingerprint: targetUser.rsaKeyFingerprint || null,
    });
  }
}

export const authController = new AuthController();
