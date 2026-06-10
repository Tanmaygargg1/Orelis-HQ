import { Octokit } from "@octokit/rest";
import type { FileItem, Task } from "./types";

const getClient = () => new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = () => process.env.GITHUB_OWNER!;
const repo = () => process.env.GITHUB_REPO!;
const base = () => process.env.CONTENT_PATH || "content";

export async function getContents(subPath = "") {
  const path = subPath ? `${base()}/${subPath}` : base();
  const { data } = await getClient().repos.getContent({ owner: owner(), repo: repo(), path });

  if (Array.isArray(data)) {
    const prefix = base() + "/";
    return {
      type: "dir" as const,
      files: data
        .filter((item) => !item.name.startsWith("."))
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
    owner: owner(),
    repo: repo(),
    path,
    message: sha ? `Update ${subPath}` : `Create ${subPath}`,
    content: Buffer.from(content).toString("base64"),
    sha,
  });
}

export async function deleteFile(subPath: string, sha: string) {
  const path = `${base()}/${subPath}`;
  await getClient().repos.deleteFile({
    owner: owner(),
    repo: repo(),
    path,
    message: `Delete ${subPath}`,
    sha,
  });
}

export async function getTasks(): Promise<{ tasks: Task[]; sha?: string }> {
  try {
    const result = await getContents("_tasks.json");
    if (result.type !== "file") return { tasks: [] };
    const data = JSON.parse(result.content);
    return { tasks: data.tasks || [], sha: result.sha };
  } catch {
    return { tasks: [], sha: undefined };
  }
}

export async function saveTasks(tasks: Task[], sha?: string) {
  await writeFile("_tasks.json", JSON.stringify({ tasks }, null, 2), sha);
}
