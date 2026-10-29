import { describe, expect, it } from "vitest";
import type { Project, Task } from "../types/models";
import { buildProjectWithTaskCount } from "./projectMetrics";

const project: Project = {
  _id: "project-1",
  organizationId: "org-1",
  name: "Website redesign",
  description: "Refresh the marketing site",
  createdBy: "user-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

const makeTask = (id: string, projectId: string): Task => ({
  _id: id,
  organizationId: "org-1",
  projectId,
  title: `Task ${id}`,
  description: "",
  status: "todo",
  priority: "medium",
  assignedTo: null,
  dueDate: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("buildProjectWithTaskCount", () => {
  it("counts every task whose projectId matches the project's _id", () => {
    const tasks = [
      makeTask("t1", "project-1"),
      makeTask("t2", "project-1"),
      makeTask("t3", "project-1"),
    ];

    expect(buildProjectWithTaskCount(project, tasks).taskCount).toBe(3);
  });

  it("returns a taskCount of 0 when there are no tasks", () => {
    expect(buildProjectWithTaskCount(project, []).taskCount).toBe(0);
  });

  it("returns a taskCount of 0 when all tasks belong to other projects", () => {
    const tasks = [makeTask("t1", "project-2"), makeTask("t2", "project-3")];

    expect(buildProjectWithTaskCount(project, tasks).taskCount).toBe(0);
  });

  it("ignores tasks from other projects when mixed with matching tasks", () => {
    const tasks = [
      makeTask("t1", "project-1"),
      makeTask("t2", "project-2"),
      makeTask("t3", "project-1"),
      makeTask("t4", "project-3"),
    ];

    expect(buildProjectWithTaskCount(project, tasks).taskCount).toBe(2);
  });

  it("keeps all of the original project fields on the result", () => {
    expect(buildProjectWithTaskCount(project, [])).toMatchObject(project);
  });
});
