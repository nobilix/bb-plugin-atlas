/**
 * Resolves an SDK symbol name to `(path, line, kind)` at a given commit.
 *
 * Two passes, cheapest first:
 *
 * 1. **Syntax.** A declaration index over the SDK source. This covers every
 *    name written in the tree, including members declared inside their owner's
 *    own body and public names introduced by a re-export alias.
 * 2. **ts-morph.** Only for a dotted name whose member is inherited through a
 *    type operator — `PluginBbSdk = Omit<BbSdk, "threads"> & {…}` hides
 *    `hosts` from any syntactic scan. The checker is expensive, so it is
 *    created lazily and only if pass 1 leaves something over.
 *
 * `ts-morph@28` rather than the TypeScript compiler API: TypeScript 7.0 ships
 * no compiler API, and bb itself aliases `@typescript/typescript6`.
 */
import { buildDeclarationIndex } from "./declaration-index.mjs";
import { listTree, show, materialize } from "./upstream.mjs";

/** Packages whose `src` holds the names a surface can reference. */
const SDK_PACKAGES = ["plugin-sdk", "sdk", "server-contract", "domain", "config"];

const IN_SDK = "packages/plugin-sdk/src/";

/**
 * A permalink should land on the declaration itself, so a real declaration
 * always beats a re-export clause; among declarations, the SDK's own copy of a
 * name beats a same-named declaration elsewhere. A re-export is the anchor only
 * for names the SDK renames on the way out (`experimental_*` aliases over
 * `@bb/process-utils`), whose declaration lives outside the indexed packages.
 */
function rankSymbol(path, origin) {
  const inSdk = path.startsWith(IN_SDK) ? 0 : 1;
  return (origin === "declaration" ? 0 : 2) + inSdk;
}

function rank(path) {
  return path.startsWith(IN_SDK) ? 0 : 1;
}

function isSource(path) {
  return /\.tsx?$/.test(path) && !/(__tests__|\.test\.|\.spec\.|\.d\.ts$)/.test(path);
}

export function loadSdkSources(commit) {
  const files = new Map();
  for (const pkg of SDK_PACKAGES) {
    for (const path of listTree(commit, `packages/${pkg}/src`)) {
      if (isSource(path)) files.set(path, show(commit, path));
    }
  }
  // plugin-sdk first, so its declarations win ties.
  return new Map([...files].sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0])));
}

export class SymbolResolver {
  #commit;
  #files;
  #index;
  #project = null;
  #checkerUsed = false;

  constructor(commit) {
    this.#commit = commit;
    this.#files = loadSdkSources(commit);
    this.#index = buildDeclarationIndex(this.#files, rankSymbol);
  }

  get lineCounts() {
    return this.#index.lineCounts;
  }

  get usedChecker() {
    return this.#checkerUsed;
  }

  /** @returns {Promise<{name,path,line,kind,resolvedBy}|null>} */
  async resolve(name) {
    return this.#resolveBySyntax(name) ?? (await this.#resolveByChecker(name));
  }

  #resolveBySyntax(name) {
    const [ownerName, ...members] = name.split(".");
    const owner = this.#index.byName.get(ownerName);
    if (!owner) return null;
    if (members.length === 0) {
      return { name, path: owner.path, line: owner.line, kind: owner.kind, resolvedBy: "syntax" };
    }
    // Members are indexed by name at any depth of the owner's own body, which
    // is what `PluginBbSdk.threads.getPluginMetadata` needs.
    const member = owner.members.get(members.at(-1));
    if (!member) return null;
    return { name, path: owner.path, line: member.line, kind: member.kind, resolvedBy: "syntax" };
  }

  async #resolveByChecker(name) {
    if (!name.includes(".")) return null;
    const [ownerName, ...members] = name.split(".");
    const owner = this.#index.byName.get(ownerName);
    if (!owner) return null;

    const project = this.#project ?? (this.#project = await this.#createProject());
    const source = project.getSourceFile(owner.path);
    if (!source) return null;

    const declaration =
      source.getTypeAlias(ownerName) ??
      source.getInterface(ownerName) ??
      source.getClass(ownerName);
    if (!declaration) return null;

    let type = declaration.getType();
    let property = null;
    for (const member of members) {
      property = type.getProperty(member);
      if (!property) return null;
      type = property.getTypeAtLocation(declaration);
    }

    const target = property.getDeclarations()[0];
    if (!target) return null;

    this.#checkerUsed = true;
    const file = target.getSourceFile().getFilePath();
    const repoPath = file.slice(file.indexOf("/packages/") + 1);
    return {
      name,
      path: repoPath,
      line: target.getStartLineNumber(),
      kind: target.getKindName().includes("Method") ? "method" : "property",
      resolvedBy: "ts-morph",
    };
  }

  async #createProject() {
    // ts-morph is loaded lazily: the syntax pass covers every reference in the
    // pinned tree, so a normal sync never pays for the checker.
    const { Project, ts } = await import("ts-morph").catch((cause) => {
      throw new Error(
        "The sync needs ts-morph to resolve members inherited through a type " +
          "operator. `sync/` carries its own package.json but is not yet a " +
          "workspace member: run `pnpm install --ignore-workspace` inside " +
          "sync/, or add `sync` to the workspace in package.json and " +
          "pnpm-workspace.yaml.",
        { cause },
      );
    });
    const root = this.#materializeSources();
    const project = new Project({
      compilerOptions: {
        allowJs: false,
        baseUrl: root,
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.Preserve,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        noEmit: true,
        skipLibCheck: true,
        strict: false,
        target: ts.ScriptTarget.ESNext,
        paths: Object.fromEntries(
          SDK_PACKAGES.flatMap((pkg) => [
            [`@bb/${pkg}`, [`packages/${pkg}/src/index.ts`, `packages/${pkg}/src/node.ts`]],
            [`@bb/${pkg}/*`, [`packages/${pkg}/src/*`]],
          ]),
        ),
      },
      skipAddingFilesFromTsConfig: true,
      useInMemoryFileSystem: false,
    });
    for (const path of this.#files.keys()) project.addSourceFileAtPath(`${root}/${path}`);
    project.resolveSourceFileDependencies();
    // Files are keyed by repo-relative path for lookup.
    const byRepoPath = new Map();
    for (const file of project.getSourceFiles()) {
      const full = file.getFilePath();
      const index = full.indexOf(`${root}/`);
      if (index === 0) byRepoPath.set(full.slice(root.length + 1), file);
    }
    project.getSourceFile = (repoPath) => byRepoPath.get(repoPath);
    return project;
  }

  #materializeSources() {
    let root = null;
    for (const path of this.#files.keys()) {
      const local = materialize(this.#commit, path);
      if (!root) root = local.slice(0, local.length - path.length - 1);
    }
    return root;
  }
}
