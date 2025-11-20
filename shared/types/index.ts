// Shared TypeScript types for frontend and backend

export interface UserInfo {
  loginName: string;
  password: string;
  phoneNumber?: string;
  email?: string;
  userName: string;
  gender?: boolean;
  birthDate?: string;
  address?: string;
}

// Add more interfaces for Buyer, Seller, Address, OrderInfo, etc.
