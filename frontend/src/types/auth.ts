export type UserStatus = "active" | "inactive";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  primaryEmail?: string;
  status: UserStatus;
  loginsCounter: number;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  id: string;
  userId: string;
  createdAt: string;
  terminatedAt: string | null;
};
