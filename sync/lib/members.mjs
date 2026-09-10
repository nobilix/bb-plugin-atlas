/**
 * Reads the members of one declared interface out of a source file.
 *
 * Scoped on purpose: `PluginAppSlots`, `PluginAppBuilder` and `BbPluginApi` are
 * flat interfaces of one member per entry, and a scan gives their order, their
 * doc comment and their line — things a type checker would flatten away.
 */

/** Members of `export interface <name>` at the top level of `source`. */
export function interfaceMembers(source, name) {
  const lines = source.split("\n");
  const start = lines.findIndex((line) => new RegExp(`^export interface ${name}\\b`).test(line));
  if (start === -1) throw new Error(`No \`export interface ${name}\` in this file.`);

  const members = [];
  let depth = 0;
  let parens = 0;
  let started = false;
  let doc = [];
  let pending = null;

  const flush = () => {
    if (!pending) return;
    members.push({
      ...pending,
      type: firstTypeReference(pending.signature),
      doc: docText(pending.doc),
      deprecated: pending.doc.some((line) => line.includes("@deprecated")),
    });
    pending = null;
  };

  for (let i = start; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    // A member starts only at the top level of the body: the continuation
    // lines of a wrapped signature look exactly like members otherwise.
    if (started && depth === 1 && parens === 0) {
      if (trimmed.startsWith("/*") || trimmed.startsWith("*")) {
        if (pending) flush();
        doc.push(trimmed.replace(/^\/\*+|^\*+\/?|\*\/$/g, "").trim());
      } else if (trimmed.length > 0 && !trimmed.startsWith("}")) {
        const match = trimmed.match(/^(?:readonly\s+)?([A-Za-z_$][\w$]*)\s*[?!]?\s*([(<:])/);
        if (match) {
          flush();
          pending = {
            name: match[1],
            line: i + 1,
            kind: match[2] === ":" ? "property" : "method",
            signature: "",
            doc,
          };
          doc = [];
        }
      }
    }

    if (pending) pending.signature += ` ${trimmed}`;

    for (const character of line) {
      if (character === "{") {
        depth += 1;
        started = true;
      } else if (character === "}") {
        depth -= 1;
      } else if (character === "(") {
        parens += 1;
      } else if (character === ")") {
        parens -= 1;
      }
    }

    if (started && depth <= 0) break;
  }
  flush();

  return members;
}

/** The first named type in a signature: the registration type of a slot. */
function firstTypeReference(signature) {
  const match = signature.match(/:\s*([A-Z][\w$]*)/);
  return match ? match[1] : null;
}

function docText(doc) {
  return doc
    .filter((line) => line.length > 0 && !line.startsWith("@"))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
