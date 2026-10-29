import { buildProjectWithTaskCount } from "../utils/projectMetrics";
import type { Project, ProjectWithTaskCount, Task } from "./models";

export const exampleProject: Project = {
  _id: "project-001",
  organizationId: "organization-001",
  name: "Website redesign",
  description: "Refresh the company website and improve accessibility.",
  createdBy: "user-001",
  createdAt: "2026-01-15T09:00:00.000Z",
  updatedAt: "2026-02-02T14:30:00.000Z",
};

export const exampleTask: Task = {
  _id: "task-001",
  organizationId: "organization-001",
  projectId: exampleProject._id,
  title: "Review homepage wireframes",
  description: "Collect feedback on the first-round homepage layouts.",
  status: "in_progress",
  priority: "high",
  assignedTo: "user-002",
  dueDate: "2026-11-15T17:00:00.000Z",
  createdAt: "2026-02-03T10:15:00.000Z",
  updatedAt: "2026-02-10T16:45:00.000Z",
};

export const exampleProjectWithTaskCount: ProjectWithTaskCount =
  buildProjectWithTaskCount(exampleProject, [exampleTask]);
