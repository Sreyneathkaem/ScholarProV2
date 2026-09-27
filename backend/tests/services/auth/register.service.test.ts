import registerService from "@services/auth/register.service";
import { db } from "@db";
import { inviteUsers } from "@db/schema/invite-user";
import { users } from "@db/schema/user";
import bcrypt from "bcryptjs";

// Mock dependencies
jest.mock("@db", () => ({
  db: {
    transaction: jest.fn((cb) => cb({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  },
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe("Register Service", () => {
  let mockTx: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup transaction mock
    mockTx = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    (db.transaction as jest.Mock).mockImplementation(async (cb) => cb(mockTx));
  });

  it("should register user successfully with valid token", async () => {
    const mockInvite = {
      role: "admin",
      name: "Test User",
      token: "hashedToken",
    };

    mockTx.limit
      .mockResolvedValueOnce([mockInvite]) // inviteUser check
      .mockResolvedValueOnce([]); // existingUser check

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
    
    mockTx.returning.mockResolvedValue([{ id: 1 }]); // insert user result

    const result = await registerService("inviteId", "validToken", "test@example.com", "password");

    expect(result.success).toBe(true);
    expect(result.msg).toBe("Register successfully");
    expect(mockTx.insert).toHaveBeenCalledWith(users);
    expect(mockTx.delete).toHaveBeenCalledWith(inviteUsers);
  });

  it("should fail if invitation is invalid or expired", async () => {
    mockTx.limit.mockResolvedValueOnce([]); // No invite found

    const result = await registerService("inviteId", "token", "test@example.com", "password");

    expect(result.success).toBe(false);
    expect(result.msg).toBe("The invitation link is invalid or expired.");
  });

  it("should fail if token does not match", async () => {
    mockTx.limit.mockResolvedValueOnce([{ token: "hashedToken" }]);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const result = await registerService("inviteId", "wrongToken", "test@example.com", "password");

    expect(result.success).toBe(false);
    expect(result.msg).toBe("Invalid invitation link");
  });

  it("should fail if user already exists", async () => {
    mockTx.limit
      .mockResolvedValueOnce([{ token: "hashedToken" }]) // invite found
      .mockResolvedValueOnce([{ id: 1, isActive: true }]); // user already exists and is active

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await registerService("inviteId", "token", "test@example.com", "password");

    expect(result.success).toBe(false);
    expect(result.msg).toBe("Email already registered");
  });

  it("should cleanup stale inactive user and register successfully", async () => {
    const mockInvite = {
      role: "admin",
      name: "Test User",
      token: "hashedToken",
    };

    mockTx.limit
      .mockResolvedValueOnce([mockInvite]) // invite found
      .mockResolvedValueOnce([{ id: 1, isActive: false }]); // stale inactive user exists

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
    mockTx.returning.mockResolvedValue([{ id: 1 }]);

    const result = await registerService("inviteId", "validToken", "test@example.com", "password");

    expect(result.success).toBe(true);
    expect(result.msg).toBe("Register successfully");
    expect(mockTx.insert).toHaveBeenCalledWith(users);
    expect(mockTx.delete).toHaveBeenCalledWith(inviteUsers);
  });
});
