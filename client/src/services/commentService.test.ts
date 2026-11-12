import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  patch: vi.fn(),
  delete: vi.fn(),
  unwrapResponse: vi.fn(),
}));

vi.mock("./api", () => ({
  api: { patch: mocks.patch, delete: mocks.delete },
  unwrapResponse: mocks.unwrapResponse,
}));

import { commentService } from "./commentService";

describe("commentService mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("patches the task comment and unwraps the response", () => {
    const request = Promise.resolve({ data: "updated" });
    const response = Promise.resolve({ _id: "comment-1" });
    mocks.patch.mockReturnValue(request);
    mocks.unwrapResponse.mockReturnValue(response);

    expect(
      commentService.update("task-1", "comment-1", { content: "Updated" }),
    ).toBe(response);
    expect(mocks.patch).toHaveBeenCalledWith(
      "/tasks/task-1/comments/comment-1",
      { content: "Updated" },
    );
    expect(mocks.unwrapResponse).toHaveBeenCalledWith(request);
  });

  it("deletes the task comment and unwraps the response", () => {
    const request = Promise.resolve({ data: "deleted" });
    const response = Promise.resolve({ deleted: true });
    mocks.delete.mockReturnValue(request);
    mocks.unwrapResponse.mockReturnValue(response);

    expect(commentService.delete("task-1", "comment-1")).toBe(response);
    expect(mocks.delete).toHaveBeenCalledWith(
      "/tasks/task-1/comments/comment-1",
    );
    expect(mocks.unwrapResponse).toHaveBeenCalledWith(request);
  });
});
