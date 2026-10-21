import { AuthSession, UserAccount, UserRole, SubscriptionTier } from '../types';
import { StorageService } from './storageService';

const STORAGE_KEYS = {
  USERS: 'vridhi_users_registry_v3',
  SESSION: 'vridhi_auth_session_v3',
};

export const MASTER_ADMIN_EMAIL = 's26608934archana@gmail.com';
export const MASTER_ADMIN_PASSWORD = 'vghkbjhihdw89i2';

// Only master super admin account is initialized (No dummy users)
const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr_admin_master',
    email: MASTER_ADMIN_EMAIL,
    passwordHash: MASTER_ADMIN_PASSWORD,
    name: 'Archana (Platform Super Admin)',
    role: 'super_admin',
    createdAt: new Date().toISOString(),
  },
];

export class AuthService {
  public static init(): void {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    } else {
      const users: UserAccount[] = JSON.parse(raw);
      // Ensure master admin credentials match exactly
      const adminIdx = users.findIndex(
        (u) => u.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase() || u.role === 'super_admin'
      );
      if (adminIdx >= 0) {
        users[adminIdx].email = MASTER_ADMIN_EMAIL;
        users[adminIdx].passwordHash = MASTER_ADMIN_PASSWORD;
      } else {
        users.unshift(INITIAL_USERS[0]);
      }
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  }

  public static getUsers(): UserAccount[] {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  }

  public static getSession(): AuthSession | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (!data) return null;
      const session: AuthSession = JSON.parse(data);
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        this.logout();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  public static login(
    email: string,
    password: string,
    role?: UserRole
  ): { success: boolean; session?: AuthSession; message?: string } {
    this.init();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Check Master Super Admin login
    if (role === 'super_admin' || cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase()) {
      if (cleanEmail && cleanEmail !== MASTER_ADMIN_EMAIL.toLowerCase()) {
        return { success: false, message: 'Unauthorized administrator email address.' };
      }
      if (cleanPassword === MASTER_ADMIN_PASSWORD) {
        const session: AuthSession = {
          user: {
            id: 'usr_admin_master',
            email: MASTER_ADMIN_EMAIL,
            name: 'Platform Super Admin',
            role: 'super_admin',
          },
          token: `vrd_adm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
        return { success: true, session };
      }
      return { success: false, message: 'Invalid Admin Master Password. Please try again.' };
    }

    // Business Owner Merchant Login
    const users = this.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return {
        success: false,
        message: 'No registered merchant account found with this email. Please sign up first.',
      };
    }

    if (user.passwordHash !== cleanPassword) {
      return { success: false, message: 'Invalid password. Please check your credentials.' };
    }

    // Verify tenant status
    if (user.role === 'business_owner' && user.tenantId) {
      const tenant = StorageService.getTenantById(user.tenantId);
      if (tenant && tenant.subscription.status === 'suspended') {
        return {
          success: false,
          message: 'Your business account is suspended. Please contact platform administration.',
        };
      }
    }

    const session: AuthSession = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
      token: `vrd_usr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    return { success: true, session };
  }

  public static registerMerchant(data: {
    businessName: string;
    ownerName: string;
    email: string;
    password: string;
    phone: string;
    city: string;
    state: string;
    plan?: SubscriptionTier;
    upiTxnRef?: string;
  }): { success: boolean; session?: AuthSession; message?: string } {
    this.init();
    const users = this.getUsers();
    const cleanEmail = data.email.trim().toLowerCase();

    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return {
        success: false,
        message: 'An account with this email already exists. Please sign in.',
      };
    }

    const assignedPlan = data.plan || 'trial';

    // Create isolated tenant cell (Zero GSTIN, ₹0 trial for 30 days)
    const tenant = StorageService.createTenant({
      businessName: data.businessName.trim(),
      ownerName: data.ownerName.trim(),
      email: cleanEmail,
      phone: data.phone.trim(),
      city: data.city.trim(),
      state: data.state.trim(),
      industry: 'Wholesale & Retail Trade',
      plan: assignedPlan,
      upiTxnRef: data.upiTxnRef?.trim() || 'FREE-TRIAL-30D',
      status: 'active', // 1-month trial activates immediately!
    });

    // Create user account linked to tenant
    const newUser: UserAccount = {
      id: `usr_${Date.now()}`,
      email: cleanEmail,
      passwordHash: data.password.trim(),
      name: data.ownerName.trim(),
      role: 'business_owner',
      tenantId: tenant.id,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Auto-login new merchant
    const session: AuthSession = {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        tenantId: tenant.id,
      },
      token: `vrd_usr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    return { success: true, session };
  }

  public static logout(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
}
