export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  password?: string;
  role: 'user' | 'admin';
  avatarUrl?: string;
  settings?: {
    alerts?: {
      newClaim?: boolean;
      claimStatus?: boolean;
      policyExpiring?: boolean;
      paymentDue?: boolean;
    };
    company?: {
      name?: string;
      email?: string;
      address?: string;
      billingCycle?: string;
      policyTypes?: string;
    };
    rules?: {
      autoApproveBelow?: number;
      escalationThreshold?: number;
      processDays?: number;
    };
  };
}

export interface Policy {
  id: string;
  displayId?: string;
  userId: string;
  type: string;
  provider: string;
  premium: number;
  coverageAmount: number;
  status: 'active' | 'expired' | 'cancelled';
  expiryDate?: string;
  renewalEmailSent?: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  date: string;
  type: 'policy' | 'claim' | 'system';
}

export interface Activity {
  id: string;
  userId: string;
  message: string;
  date: string;
}

export interface Claim {
  id: string;
  displayId?: string;
  userId: string;
  policyId: string;
  amount: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}
