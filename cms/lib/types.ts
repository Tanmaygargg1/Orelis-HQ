export type UserRole = "admin" | "editor" | "viewer";

export interface TeamMember {
  email: string;
  name: string;
  password: string;
  role: UserRole;
}

export interface FileItem {
  name: string;
  path: string;
  type: "file" | "dir";
  sha: string;
}

export type TaskStatus = "todo" | "in-progress" | "done";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignee?: string;
  startDate?: string;
  dueDate?: string;   // used as end date when startDate is also set
  createdAt: string;
  updatedAt: string;
}
