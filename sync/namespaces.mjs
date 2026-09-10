/**
 * `data/namespaces.json` — the members of `BbPluginApi`, the `bb` object a
 * plugin's `server.ts` factory receives.
 */
import { contextAt } from "./lib/context.mjs";
import { interfaceMembers } from "./lib/members.mjs";
import { show } from "./lib/upstream.mjs";
import { NamespacesFileSchema } from "../packages/atlas-core/src/schema.ts";
import { writeData } from "./lib/write.mjs";

const BACKEND_CONTRACT = "packages/plugin-sdk/src/backend-contract.ts";

export async function build(commit) {
  const { meta, commit: at } = await contextAt(commit);
  const source = show(at, BACKEND_CONTRACT);

  const namespaces = interfaceMembers(source, "BbPluginApi").map((member) => ({
    name: `bb.${member.name}`,
    member: member.name,
    experimental: member.name.startsWith("experimental_"),
    type: member.type,
    doc: member.doc,
    path: BACKEND_CONTRACT,
    line: member.line,
  }));

  return { meta, namespaces };
}

export async function run() {
  const file = await build();
  writeData("namespaces.json", NamespacesFileSchema, file);
  return file;
}

if (import.meta.url === `file://${process.argv[1]}`) await run();
