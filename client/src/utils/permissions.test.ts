import { describe, expect, it } from "vitest";
import type { Comment, User, UserRole } from "../types/models";
import {
  canCreateProject,
  canManageComment,
  isPrivilegedRole,
} from "./permissions";

const makeComment = (authorId: string): Comment => ({
  _id: "comment-1",
  organizationId: "org-1",
  taskId: "task-1",
  authorId,
  content: "Looks good",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("canManageComment", () => {
  it("lets an owner manage someone else's comment", () => {
    expect(canManageComment(makeUser("owner"), makeComment("other"))).toBe(
      true,
    );
  });

  it("lets an admin manage someone else's comment", () => {
    expect(canManageComment(makeUser("admin"), makeComment("other"))).toBe(
      true,
    );
  });

  it("lets a member manage their own comment", () => {
    expect(canManageComment(makeUser("member"), makeComment("user-1"))).toBe(
      true,
    );
  });

  it("does not let a member manage someone else's comment", () => {
    expect(canManageComment(makeUser("member"), makeComment("other"))).toBe(
      false,
    );
  });

  it("does not let a missing (null) user manage a comment", () => {
    expect(canManageComment(null, makeComment("user-1"))).toBe(false);
  });
});

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
