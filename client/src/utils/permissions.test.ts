import { describe, expect, it } from "vitest";
import type { User, UserRole } from "../types/models";
import { canCreateProject, isPrivilegedRole } from "./permissions";

const makeUser = (role: UserRole): User => ({
  _id: "user-1",
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
  organizationId: "org-1",
  role,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("isPrivilegedRole", () => {
  it("returns true for the owner role", () => {
    expect(isPrivilegedRole("owner")).toBe(true);
  });

  it("returns true for the admin role", () => {
    expect(isPrivilegedRole("admin")).toBe(true);
  });

  it("returns false for the member role", () => {
    expect(isPrivilegedRole("member")).toBe(false);
  });

  it("returns false when the role is null", () => {
    expect(isPrivilegedRole(null)).toBe(false);
  });

  it("returns false when the role is undefined", () => {
    expect(isPrivilegedRole(undefined)).toBe(false);
  });
});

describe("canCreateProject", () => {
  it("allows an owner to create projects", () => {
    expect(canCreateProject(makeUser("owner"))).toBe(true);
  });

  it("allows an admin to create projects", () => {
    expect(canCreateProject(makeUser("admin"))).toBe(true);
  });

  it("does not allow a member to create projects", () => {
    expect(canCreateProject(makeUser("member"))).toBe(false);
  });

  it("does not allow a missing (null) user to create projects", () => {
    expect(canCreateProject(null)).toBe(false);
  });
});
