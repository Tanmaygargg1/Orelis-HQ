import { Octokit } from "@octokit/rest";
import type { FileItem, Task } from "./types";

const getClient = () => new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = () => process.env.GITHUB_OWNER!;
const repo = () => process.env.GITHUB_REPO!;
const base = () => process.env.CONTENT_PATH || "content";

// DO NOT pre-encode — Octokit handles URL encoding internally.
// Pre-encoding causes double-encoding (%20 → %2520) which results in GitHub 404s.

export async function getContents(subPath = "") {
  const path = subPath ? `${base()}/${subPath}` : base();
  const { data } = await getClient().repos.getContent({ owner: owner(), repo: repo(), path });

  if (Array.isArray(data)) {
    const prefix = base() + "/";
    return {
      type: "dir" as const,
      files: data
        .filter((item) => !item.name.startsWith(".") && !item.name.startsWith("_") && item.name !== ".gitkeep")
        .map((item) => ({
          name: item.name,
          path: item.path.startsWith(prefix) ? item.path.slice(prefix.length) : item.path,
          type: item.type as "file" | "dir",
          sha: item.sha,
        }))
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
          return a.name.localeCompare(b.name);
        }) as FileItem[],
    };
  }

  if (data.type !== "file") throw new Error("Unsupported content type");
  return {
    type: "file" as const,
    content: Buffer.from(data.content, "base64").toString("utf-8"),
    sha: data.sha,
    name: data.name,
  };
}

export async function writeFile(subPath: string, content: string, sha?: string) {
  const path = `${base()}/${subPath}`;
  await getClient().repos.createOrUpdateFileContents({
    owner: owner(), repo: repo(), path,
    message: sha ? `Update ${subPath}` : `Create ${subPath}`,
    content: Buffer.from(content).toString("base64"),
    sha,
  });
}

export async function deleteFile(subPath: string, sha: string) {
  const path = `${base()}/${subPath}`;
  await getClient().repos.deleteFile({
    owner: owner(), repo: repo(), path,
    message: `Delete ${subPath}`,
    sha,
  });
}

// Tasks live at data/tasks.json — outside content/ so they don't show in Obsidian
const TASKS_PATH = "data/tasks.json";

export async function getTasks(): Promise<{ tasks: Task[]; sha?: string }> {
  try {
    const { data } = await getClient().repos.getContent({ owner: owner(), repo: repo(), path: TASKS_PATH });
    if (Array.isArray(data) || data.type !== "file") return { tasks: [] };
    const parsed = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
    return { tasks: parsed.tasks || [], sha: data.sha };
  } catch {
    return { tasks: [], sha: undefined };
  }
}

export async function saveTasks(tasks: Task[], sha?: string) {
  await getClient().repos.createOrUpdateFileContents({
    owner: owner(), repo: repo(), path: TASKS_PATH,
    message: "Update tasks",
    content: Buffer.from(JSON.stringify({ tasks }, null, 2)).toString("base64"),
    sha,
  });
}
