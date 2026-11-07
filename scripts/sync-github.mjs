#!/usr/bin/env node
/**
 * Refreshes src/data/github.json (the Repository Archive) from the public GitHub API.
 *
 *   npm run sync:github
 *
 * Runs before every deploy (see .github/workflows/deploy.yml). Set GITHUB_TOKEN to avoid
 * the 60 requests/hour anonymous limit. If the API can't be reached, the existing snapshot
 * is kept and the build carries on with the last good data.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const USERNAME = process.env.GITHUB_USERNAME || "choivxcz";
const OUTPUT = fileURLToPath(new URL("../src/data/github.json", import.meta.url));

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": `${USERNAME}-portfolio-sync`,
  "X-GitHub-Api-Version": "2022-11-28",
};
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function getJson(path) {
  const response = await fetch(`https://api.github.com${path}`, { headers });
  if (!response.ok) throw new Error(`GitHub API ${path} responded ${response.status} ${response.statusText}`);
  return response.json();
}

/**
 * Creation dates from the last snapshot. Some repositories were re-created on GitHub
 * with their full history (2026-10-30), which reset their creation date; keeping the
 * earlier date keeps the timeline accurate.
 */
async function previousCreatedAt() {
  try {
    const previous = JSON.parse(await readFile(OUTPUT, "utf8"));
    return new Map(previous.repos.map((repo) => [repo.name, repo.createdAt]));
  } catch {
    return new Map();
  }
}

const earlier = (a, b) => (a && a < b ? a : b);

/** Repositories published under a new name, mapped to the one they came from. */
const successors = { "Bugtong-Buhay-Scripts": "Bugtong-Buhay" };

async function main() {
  const known = await previousCreatedAt();
  const [user, repos] = await Promise.all([
    getJson(`/users/${USERNAME}`),
    getJson(`/users/${USERNAME}/repos?per_page=100&type=owner&sort=created&direction=asc`),
  ]);
  const snapshot = {
    fetchedAt: new Date().toISOString(),
    user: {
      login: user.login,
      name: user.name,
      location: user.location,
      hireable: Boolean(user.hireable),
      publicRepos: user.public_repos,
      createdAt: user.created_at,
      htmlUrl: user.html_url,
    },
    repos: repos
      .filter((repo) => !repo.fork && !repo.private)
      .map((repo) => ({
        name: repo.name,
        description: repo.description,
        language: repo.language,
        htmlUrl: repo.html_url,
        homepage: repo.homepage || null,
        createdAt: earlier(known.get(repo.name) ?? known.get(successors[repo.name]), repo.created_at),
        pushedAt: repo.pushed_at,
        sizeKb: repo.size,
        archived: repo.archived,
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
  await writeFile(OUTPUT, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(`Saved ${snapshot.repos.length} repositories for ${USERNAME} → src/data/github.json`);
}

main().catch(async (error) => {
  console.warn(`GitHub sync skipped: ${error.message}`);
  try {
    await readFile(OUTPUT, "utf8");
    console.warn("Keeping the existing snapshot.");
  } catch {
    console.error("No snapshot at src/data/github.json, and the build needs one.");
    process.exitCode = 1;
  }
});
