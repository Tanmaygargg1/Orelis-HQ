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
  dueDate?: string;   // single date, or end date when startDate is also set
  createdAt: string;
  updatedAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;         // ISO date YYYY-MM-DD
  time?: string;        // HH:MM (24h)
  duration?: number;    // minutes
  attendees?: string;
  notes?: string;
  completed?: boolean;
  createdAt: string;
  updatedAt: string;
}
