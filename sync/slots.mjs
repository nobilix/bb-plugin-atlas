/**
 * `data/slots.json` — `PluginAppSlots` methods plus the builder surfaces that
 * sit beside them on `PluginAppBuilder`.
 *
 * A plugin author reaches a slot either as `app.slots.<name>(…)` or as a
 * builder region such as `app.commands` or `app.contentScripts`; both are
 * places a plugin plugs in, so both belong here. `slots` itself is skipped —
 * it is the container, not a surface.
 */
import { contextAt } from "./lib/context.mjs";
import { interfaceMembers } from "./lib/members.mjs";
import { show } from "./lib/upstream.mjs";
import { SlotsFileSchema } from "../packages/atlas-core/src/schema.ts";
import { writeData } from "./lib/write.mjs";

const APP_CONTRACT = "packages/plugin-sdk/src/app-contract.ts";

export async function build(commit) {
  const { meta, commit: at } = await contextAt(commit);
  const source = show(at, APP_CONTRACT);

  const slots = interfaceMembers(source, "PluginAppSlots").map((member) => ({
    name: member.name,
    kind: "slot-method",
    registration: `app.slots.${member.name}({ … })`,
    experimental: member.name.startsWith("experimental_"),
    deprecated: member.deprecated,
    registrationType: member.type,
    path: APP_CONTRACT,
    line: member.line,
  }));

  const builder = interfaceMembers(source, "PluginAppBuilder")
    .filter((member) => member.name !== "slots")
    .map((member) => ({
      name: member.name,
      kind: "builder-surface",
      registration: `app.${member.name}`,
      experimental: member.name.startsWith("experimental_"),
      deprecated: member.deprecated,
      registrationType: member.type,
      path: APP_CONTRACT,
      line: member.line,
    }));

  return { meta, slots: [...slots, ...builder] };
}

export async function run() {
  const file = await build();
  writeData("slots.json", SlotsFileSchema, file);
  return file;
}

if (import.meta.url === `file://${process.argv[1]}`) await run();
