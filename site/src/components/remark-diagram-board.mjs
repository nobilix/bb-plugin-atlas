/**
 * Turns the board markers in the prose into real boards.
 *
 * `src/content/docs/**` marks each diagram with an MDX comment naming the
 * board:
 *
 *   {\/* DiagramBoard: runtime-topology — browser realm, server process, … *\/}
 *
 * An MDX comment renders nothing, so the marker is inert until this plugin
 * rewrites it into `<DiagramBoard board="runtime-topology" />` and adds the
 * import the element needs. Doing it here rather than by editing the MDX keeps
 * one owner per file: the prose says where a board goes, the component decides
 * what a board is, and neither phase has to touch the other's files.
 *
 * An unknown board id fails the build: `boardById` in `boards.ts` throws when
 * the component renders. A marker that silently rendered nothing is exactly the
 * failure this replaces.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const COMPONENT = fileURLToPath(new URL('./DiagramBoard.astro', import.meta.url));
const MARKER = /^\s*\/\*\s*DiagramBoard:\s*([a-z0-9-]+)\b/;
const LOCAL = 'AtlasDiagramBoard';

/** `import AtlasDiagramBoard from "./DiagramBoard.astro";`, as an MDX ESM node. */
function importNode(fromFile) {
  let specifier = path.relative(path.dirname(fromFile), COMPONENT);
  if (!specifier.startsWith('.')) specifier = `./${specifier}`;
  /* Windows separators are not module specifiers. */
  specifier = specifier.split(path.sep).join('/');

  return {
    type: 'mdxjsEsm',
    value: `import ${LOCAL} from ${JSON.stringify(specifier)};`,
    data: {
      estree: {
        type: 'Program',
        sourceType: 'module',
        comments: [],
        body: [
          {
            type: 'ImportDeclaration',
            attributes: [],
            specifiers: [
              {
                type: 'ImportDefaultSpecifier',
                local: { type: 'Identifier', name: LOCAL },
              },
            ],
            source: {
              type: 'Literal',
              value: specifier,
              raw: JSON.stringify(specifier),
            },
          },
        ],
      },
    },
  };
}

function boardNode(id) {
  return {
    type: 'mdxJsxFlowElement',
    name: LOCAL,
    attributes: [{ type: 'mdxJsxAttribute', name: 'board', value: id }],
    children: [],
  };
}

export default function remarkDiagramBoard() {
  return (tree, file) => {
    const found = [];

    const walk = (node) => {
      if (!Array.isArray(node.children)) return;
      for (let i = 0; i < node.children.length; i += 1) {
        const child = node.children[i];
        if (child.type === 'mdxFlowExpression' || child.type === 'mdxTextExpression') {
          const match = MARKER.exec(child.value ?? '');
          if (match) {
            node.children[i] = boardNode(match[1]);
            found.push(match[1]);
            continue;
          }
        }
        walk(child);
      }
    };

    walk(tree);
    if (found.length > 0) tree.children.unshift(importNode(file.path ?? ''));
  };
}
