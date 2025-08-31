// Minimal MCP Bridge client for better-chatbot
const BASE = process.env.MOKAI_MCP_BRIDGE_URL!;
const TOKEN = process.env.MOKAI_MCP_BRIDGE_TOKEN!;

function authHeaders() {
  if (!TOKEN) throw new Error("Missing MOKAI_MCP_BRIDGE_TOKEN");
  return { Authorization: `Bearer ${TOKEN}` };
}

export async function getManifest(repo: string, commit: string) {
  const url = new URL(`${BASE}/manifest`);
  url.searchParams.set("repo", repo);
  url.searchParams.set("commit", commit);
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw new Error(`manifest ${res.status}: ${await res.text()}`);
  return res.json(); // {files:[{path,sha256,size}], ...}
}

export async function getFile(repo: string, ref: string, path: string) {
  const url = new URL(`${BASE}/file`);
  url.searchParams.set("repo", repo);
  url.searchParams.set("ref", ref); // commit sha OR branch ref
  url.searchParams.set("path", path); // e.g. .cursor/rules/example.mdc
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw new Error(`file ${res.status}: ${await res.text()}`);
  return res.text(); // file contents
}

// Registry functions
const REGISTRY_BASE = process.env.MOKAI_MCP_REGISTRY_URL!;

export async function getRegistryManifest() {
  const url = new URL(`${REGISTRY_BASE}/manifest`);
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok)
    throw new Error(`registry manifest ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function getRegistryEntry(id: string) {
  const url = new URL(`${REGISTRY_BASE}/entry/${id}`);
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok)
    throw new Error(`registry entry ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function searchRegistry(query: string) {
  const url = new URL(`${REGISTRY_BASE}/search`);
  url.searchParams.set("q", query);
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok)
    throw new Error(`registry search ${res.status}: ${await res.text()}`);
  return res.json();
}
