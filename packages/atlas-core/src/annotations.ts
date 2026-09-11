/**
 * Curated annotations: the facts about a surface that upstream's own data does
 * not carry.
 *
 * `surfaces.ts` says what a surface is and which symbols it names. It does not
 * say which manifest entry registers it, what the registration call looks like,
 * whether a second plugin can share the slot, or how you know you are done.
 * Those were established by reading the repository and its first-party plugins,
 * and they live here as data so the brief generator stays a renderer and a test
 * can assert every rule id and plugin id still resolves.
 *
 * Titles, summaries, bullets, first-party names and symbol lists for surfaces
 * are deliberately not here: those come from `data/`, read out of upstream at
 * the pinned commit.
 */

export interface AnnotationReference {
  plugin: string;
  file: string;
  note: string;
}

export interface AnnotationPlugin {
  name: string;
  id: string | null;
}

export type AnnotationKind = "surface" | "slot" | "namespace" | "advanced";

export interface Annotation {
  kind: AnnotationKind;
  id: string;
  title?: string;
  summary?: string;
  entry: "app" | "server" | "host";
  manifestEntry: string;
  registration: string;
  propsType: string | null;
  slotKind: "additive" | "replacement" | "exclusive" | null;
  stability: "stable" | "experimental" | "mixed";
  symbols?: readonly string[];
  firstParty: readonly AnnotationPlugin[];
  reference: readonly AnnotationReference[];
  rules: readonly string[];
  doneWhen: readonly string[];
  surfaces: readonly string[];
  guideAnchor: string | null;
  mockupHash: string | null;
}

/** One entry per surface in `data/surfaces.json`. */
export const SURFACE_ANNOTATIONS: Readonly<Record<string, Annotation>> = Object.freeze({
  "sidebar-navigation": {
    "kind": "surface",
    "id": "sidebar-navigation",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.experimental_sidebarNavigation({ id, title, description, component })",
    "propsType": "ExperimentalSidebarNavigationProps",
    "slotKind": "replacement",
    "stability": "experimental",
    "firstParty": [],
    "reference": [
      {
        "plugin": "sidebar-navigation-example",
        "file": "examples/plugins/sidebar-navigation/app.tsx",
        "note": "Replaces the whole navigation block with a compact grid and delegates to experimental_Original when it does not want to own an item."
      }
    ],
    "rules": [
      "frontend-no-network",
      "shims-devdeps",
      "replacement-original",
      "crash-boundary",
      "icons-hugeicons",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Settings → Appearance → Navigation lists your plugin and selecting it replaces the New thread / Search / Plugins / Skills block with your component",
      "Activating an item through experimental_activate opens the same destination bb would have opened, including split placement",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-sidebar-navigation",
    "mockupHash": "shell,surface=sidebar-navigation"
  },
  "nav-panel": {
    "kind": "surface",
    "id": "nav-panel",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.navPanel({ id, title, icon, path, component, fixedTabs?, experimental_sidebarAccessory?, headerContent? })",
    "propsType": "PluginNavPanelProps",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [
      {
        "name": "Automations",
        "id": "automations"
      },
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      }
    ],
    "reference": [
      {
        "plugin": "tasks",
        "file": "plugins/tasks/app.tsx",
        "note": "Registers a nav panel with a sidebar accessory and a fixed tab, and routes the remaining subPath inside the page."
      },
      {
        "plugin": "github",
        "file": "plugins/github/app.tsx",
        "note": "Uses headerContent to put controls into the shared app title bar."
      }
    ],
    "rules": [
      "frontend-no-network",
      "shims-devdeps",
      "css-scope",
      "icons-hugeicons",
      "crash-boundary",
      "panel-params-untrusted"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "A row with your icon and title appears under the built-in navigation rows and opens /plugins/<plugin-id>/<path>",
      "Deep links into the page work: navigating to /plugins/<plugin-id>/<path>/foo hands your component subPath = \"foo\"",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-nav-panel",
    "mockupHash": "shell,surface=nav-panel"
  },
  "thread-row-status": {
    "kind": "surface",
    "id": "thread-row-status",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.contentScripts.register({ id, mount(context) }) → context.experimental_setThreadRowStatus(threadId, status)",
    "propsType": "PluginComposerThreadRowStatus",
    "slotKind": "additive",
    "stability": "experimental",
    "firstParty": [],
    "reference": [
      {
        "plugin": "provider-usage",
        "file": "plugins/provider-usage/app.tsx",
        "note": "Registers a content script and schedules work around visibility and blur, releasing everything on the abort signal."
      }
    ],
    "rules": [
      "content-script-trust",
      "frontend-no-network",
      "experimental-churn",
      "dispose-lifo"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "The thread row shows your icon and label, and tone \"running\" shimmers on its own",
      "Clearing the status with null restores bb's own row rendering",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-thread-row-status",
    "mockupHash": "shell,surface=thread-row-status"
  },
  "thread-list": {
    "kind": "surface",
    "id": "thread-list",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.experimental_threadList({ id, title, description, component })",
    "propsType": "PluginThreadListProps",
    "slotKind": "exclusive",
    "stability": "experimental",
    "firstParty": [],
    "reference": [
      {
        "plugin": "replacement-lab-alpha",
        "file": "examples/plugins/replacement-lab-alpha/app.tsx",
        "note": "Shows conditional delegation to Original, the deliberate crash path and how two plugins contend for the same area."
      }
    ],
    "rules": [
      "exclusive-slot",
      "replacement-original",
      "frontend-no-network",
      "thread-list-keyboard",
      "crash-boundary",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Settings → Appearance → Sidebar lets the user pin your list, and the sidebar scroll area renders it",
      "Rows carry data-sidebar-thread-shortcut-target and data-sidebar-thread-id so thread.next / thread.previous keep working",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-thread-list",
    "mockupHash": "shell,surface=thread-list"
  },
  "sidebar-footer": {
    "kind": "surface",
    "id": "sidebar-footer",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.experimental_sidebarFooter.register({ kind: \"action\" | \"disclosure\", id, label, icon, … })",
    "propsType": "ExperimentalSidebarFooterDisclosureProps",
    "slotKind": "additive",
    "stability": "experimental",
    "firstParty": [
      {
        "name": "Remote access",
        "id": "connect"
      }
    ],
    "reference": [
      {
        "plugin": "connect",
        "file": "plugins/connect/app.tsx",
        "note": "Registers a footer action that opens the plugin's own details page."
      },
      {
        "plugin": "provider-usage",
        "file": "plugins/provider-usage/app.tsx",
        "note": "Registers a disclosure and keeps the returned controller to open and close it."
      }
    ],
    "rules": [
      "frontend-no-network",
      "shims-devdeps",
      "icons-hugeicons",
      "crash-boundary",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your item appears in the sidebar footer strip between Settings and the bug-report icon",
      "A disclosure opens above the footer row and closes when another plugin's disclosure opens",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-sidebar-footer",
    "mockupHash": "shell,surface=sidebar-footer"
  },
  "thread-header": {
    "kind": "surface",
    "id": "thread-header",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.experimental_threadHeaderAction({ id, title, component })",
    "propsType": "PluginThreadHeaderActionProps",
    "slotKind": "additive",
    "stability": "experimental",
    "firstParty": [],
    "reference": [],
    "rules": [
      "frontend-no-network",
      "shims-devdeps",
      "header-geometry",
      "split-instances",
      "crash-boundary",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your control renders at the left end of the thread header action row and stays inside the 48px chrome row",
      "With a split layout open, each visible pane renders its own instance and neither shares per-thread state",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-thread-header",
    "mockupHash": "shell,surface=thread-header"
  },
  "browser-toolbar": {
    "kind": "surface",
    "id": "browser-toolbar",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.experimental_browserToolbarAction({ id, title, component })",
    "propsType": "ExperimentalPluginBrowserToolbarActionProps",
    "slotKind": "additive",
    "stability": "experimental",
    "firstParty": [],
    "reference": [
      {
        "plugin": "agent-annotations",
        "file": "plugins/agent-annotations/app.tsx",
        "note": "Adds a control beside the address bar and drives the page through experimental_page.evaluate / onMessage."
      }
    ],
    "rules": [
      "frontend-no-network",
      "browser-page-null",
      "shims-devdeps",
      "crash-boundary",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "The control appears beside the address bar of every built-in Browser tab",
      "Outside the desktop app experimental_page is null and your component still renders without throwing",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-browser-toolbar",
    "mockupHash": "shell,surface=browser-toolbar"
  },
  "timeline-renderers": {
    "kind": "surface",
    "id": "timeline-renderers",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.experimental_timelineRenderer({ kind, component })",
    "propsType": "PluginTimelineRendererProps",
    "slotKind": "replacement",
    "stability": "experimental",
    "firstParty": [],
    "reference": [],
    "rules": [
      "timeline-kind-ownership",
      "replacement-original",
      "frontend-no-network",
      "crash-boundary",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Rows whose kind is \"<plugin-id>/<name>\" (or \"tool\" for your own provider) render your body while bb keeps the row header",
      "Removing the renderer falls back to the declarative base rendering instead of a blank row",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-timeline-renderers",
    "mockupHash": "shell,surface=timeline-renderers"
  },
  "message-directives": {
    "kind": "surface",
    "id": "message-directives",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.messageDirective({ id, component })",
    "propsType": "PluginMessageDirectiveProps",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "Inline visualizations",
        "id": "inline-vis"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "inline-vis",
        "file": "plugins/inline-vis/app.tsx",
        "note": "Smallest directive plugin: renders workspace or thread-storage HTML and Markdown inline in assistant messages."
      },
      {
        "plugin": "workflows",
        "file": "plugins/workflows/src/app.tsx",
        "note": "Emits a ::workflow-preview directive from a tool result and renders it."
      }
    ],
    "rules": [
      "directive-attrs-untrusted",
      "frontend-no-network",
      "css-scope",
      "crash-boundary"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "An assistant message containing ::<your-id>{…} renders your component instead of the literal text",
      "Malformed attributes fall back to the original source text rather than throwing",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-message-directives",
    "mockupHash": "shell,surface=message-directives"
  },
  "message-actions": {
    "kind": "surface",
    "id": "message-actions",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.messageAction({ id, title, icon, run })",
    "propsType": "PluginMessageActionContext",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [
      {
        "name": "Side chat",
        "id": "side-chat"
      }
    ],
    "reference": [
      {
        "plugin": "side-chat",
        "file": "plugins/side-chat/app.tsx",
        "note": "Opens a side-chat panel from the message action, passing message.sourceSeqEnd as the fork anchor."
      }
    ],
    "rules": [
      "frontend-no-network",
      "message-reference",
      "icons-hugeicons",
      "crash-boundary"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your entry appears last in the hover action row under user and assistant messages",
      "Invoking it from the assistant text-selection menu passes selectedText",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-message-actions",
    "mockupHash": "shell,surface=message-actions"
  },
  "pending-interaction": {
    "kind": "surface",
    "id": "pending-interaction",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.pendingInteraction({ id, component }) paired with bb.ui.requestInput({ rendererId: id, … })",
    "propsType": "PluginPendingInteractionProps",
    "slotKind": "replacement",
    "stability": "stable",
    "firstParty": [
      {
        "name": "Ask User Question",
        "id": "ask-user-question"
      },
      {
        "name": "Secrets",
        "id": "secrets"
      }
    ],
    "reference": [
      {
        "plugin": "ask-user-question",
        "file": "plugins/ask-user-question/src/server.ts",
        "note": "Requests a multiple-choice answer from the backend and renders it with the paired slot."
      },
      {
        "plugin": "secrets",
        "file": "plugins/secrets/src/server.ts",
        "note": "Asks for credentials from a CLI command and reconciles them into a dotenv file."
      }
    ],
    "rules": [
      "interaction-detached",
      "interaction-limits",
      "secrets-agent-reach",
      "frontend-no-network",
      "crash-boundary"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "While the interaction is pending your form replaces the composer and submit / cancel resolve the backend promise",
      "Every cancellation reason is handled: user, request-aborted, thread-stopped, thread-deleted, plugin-disposed, server-restarted, timeout",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-pending-interaction",
    "mockupHash": "shell,surface=pending-interaction"
  },
  "code-renderers": {
    "kind": "surface",
    "id": "code-renderers",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.experimental_sourceCodeRenderer({ id, title, description, component }) · app.slots.experimental_diffRenderer({ … })",
    "propsType": "PluginSourceCodeRendererProps · PluginDiffRendererProps",
    "slotKind": "exclusive",
    "stability": "experimental",
    "firstParty": [],
    "reference": [],
    "rules": [
      "exclusive-slot",
      "replacement-original",
      "diff-patch-complete",
      "frontend-no-network",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Source or diff surfaces across bb — the Diff tab, file previews, timeline diffs — render through your component",
      "Delegating to Original for the cases you do not handle produces bb's own rendering, not an error",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-code-renderers",
    "mockupHash": "shell,surface=code-renderers"
  },
  "thread-panel": {
    "kind": "surface",
    "id": "thread-panel",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.threadPanelAction({ id, title, icon, component, layout?, run? })",
    "propsType": "PluginThreadPanelProps",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Side chat",
        "id": "side-chat"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "side-chat",
        "file": "plugins/side-chat/app.tsx",
        "note": "Registers the panel action a message action opens, with layout \"flush\"."
      },
      {
        "plugin": "tasks",
        "file": "plugins/tasks/app.tsx",
        "note": "Opens a task panel tab from the thread side panel."
      }
    ],
    "rules": [
      "frontend-no-network",
      "panel-params-untrusted",
      "icons-hugeicons",
      "crash-boundary"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your row appears in the thread side panel's new-tab Actions list and opens a tab",
      "Re-opening the tab from persisted params re-fetches by id instead of trusting the stored payload",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-thread-panel",
    "mockupHash": "shell,surface=thread-panel"
  },
  "file-opener": {
    "kind": "surface",
    "id": "file-opener",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.fileOpener({ id, title, extensions, component })",
    "propsType": "PluginFileOpenerProps",
    "slotKind": "replacement",
    "stability": "stable",
    "firstParty": [
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "File Editor",
        "id": "monaco-editor"
      }
    ],
    "reference": [
      {
        "plugin": "pdf-preview",
        "file": "plugins/pdf-preview/app.tsx",
        "note": "Minimal file viewer: one fileOpener registration and nothing else."
      },
      {
        "plugin": "monaco-editor",
        "file": "plugins/monaco-editor/app.tsx",
        "note": "Full editor, and the reference consumer of experimental_lineRange revealed by object identity."
      }
    ],
    "rules": [
      "replacement-original",
      "file-source-kinds",
      "frontend-no-network",
      "crash-boundary"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Opening a file with one of your extensions renders your viewer in the file tab",
      "Settings → File openers lets the user pin another opener and yours steps aside",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-file-opener",
    "mockupHash": "shell,surface=file-opener"
  },
  "app-overlay": {
    "kind": "surface",
    "id": "app-overlay",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.experimental_appOverlay({ id, component })",
    "propsType": "ExperimentalAppOverlayProps",
    "slotKind": "additive",
    "stability": "experimental",
    "firstParty": [],
    "reference": [
      {
        "plugin": "push-notifications",
        "file": "plugins/push-notifications/app.tsx",
        "note": "Mounts a delivery overlay once per app window."
      },
      {
        "plugin": "browser-automation",
        "file": "plugins/browser-automation/app.tsx",
        "note": "Mounts a preview lightbox outside the layout regions."
      }
    ],
    "rules": [
      "overlay-owns-chrome",
      "frontend-no-network",
      "crash-boundary",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your overlay mounts once per app window and survives route changes",
      "It positions and hides itself: bb supplies no chrome, no placement and no visibility",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-app-overlay",
    "mockupHash": "shell,surface=app-overlay"
  },
  "content-scripts": {
    "kind": "surface",
    "id": "content-scripts",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.contentScripts.register({ id, mount(context) })",
    "propsType": "PluginContentScriptContext",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [],
    "reference": [
      {
        "plugin": "content-script-example",
        "file": "examples/plugins/content-script/app.ts",
        "note": "Cleanup-complete reference: adds a focus ring, releases it on the abort signal and returns a disposer."
      }
    ],
    "rules": [
      "content-script-trust",
      "mount-timeout",
      "frontend-no-network",
      "dispose-lifo"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "The script mounts once per window, tab and remote client, and its disposer plus the abort signal both release everything",
      "A reload of the plugin disposes the previous generation before the new one mounts — no duplicated listeners",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-content-scripts",
    "mockupHash": "shell,surface=content-scripts"
  },
  "command-palette-actions": {
    "kind": "surface",
    "id": "command-palette-actions",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.commands.register({ id, title, defaultShortcut?, isAvailable?, run })",
    "propsType": "PluginCommandContext",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [],
    "reference": [
      {
        "plugin": "monaco-editor",
        "file": "plugins/monaco-editor/app.tsx",
        "note": "Registers one command per editor action with isAvailable gating."
      }
    ],
    "rules": [
      "command-shortcuts",
      "command-isavailable",
      "frontend-no-network",
      "engines-gate"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your command appears in the quick palette (Mod+Shift+P) under the Plugins bucket with your plugin's name",
      "A declared defaultShortcut fires, and the user can rebind it under plugin:<plugin-id>/<command-id>",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-command-palette-actions",
    "mockupHash": "palette,surface=command-palette-actions"
  },
  "composer-banners": {
    "kind": "surface",
    "id": "composer-banners",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.composer.customize({ id, scopes?, banners: [{ id, chrome?, component }] })",
    "propsType": "ComposerCustomization",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [
      {
        "name": "Provider retry",
        "id": "provider-retry"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "workflows",
        "file": "plugins/workflows/src/app.tsx",
        "note": "Uses a bare banner as an always-mounted status strip."
      },
      {
        "plugin": "scheduled-send",
        "file": "plugins/scheduled-send/app.tsx",
        "note": "Uses a bare banner purely as a mount point for a portalled dialog."
      }
    ],
    "rules": [
      "composer-scopes",
      "frontend-no-network",
      "css-scope",
      "crash-boundary"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "The banner appears above the prompt box only in the scopes you declared",
      "chrome: \"bare\" renders with no card, and the composer keeps its own layout",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-composer-banners",
    "mockupHash": "composer,surface=composer-banners"
  },
  "mention-provider": {
    "kind": "surface",
    "id": "mention-provider",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.ui.registerMentionProvider({ id, label, triggers?, search, resolve })",
    "propsType": "PluginMentionProviderRegistration",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      }
    ],
    "reference": [
      {
        "plugin": "github",
        "file": "plugins/github/server.ts",
        "note": "Two providers (issues and pull requests) answering @ and # with resolve() building the agent context."
      },
      {
        "plugin": "tasks",
        "file": "plugins/tasks/mentions/index.ts",
        "note": "Searches its own SQLite store and resolves an item into task context."
      }
    ],
    "rules": [
      "mention-search-timebox",
      "mention-resolve-blocks",
      "mention-images-untrusted",
      "backend-full-trust"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Typing your trigger shows your section in the mention menu within the 2 s search box",
      "Sending the message attaches resolve()'s context to the prompt, visible to the agent and hidden from the user",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-mention-provider",
    "mockupHash": "composer,surface=mention-provider"
  },
  "composer-rich-text": {
    "kind": "surface",
    "id": "composer-rich-text",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.composer.customize({ id, richText: { effects, onDraftChange } })",
    "propsType": "ComposerRichTextSpec",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [],
    "reference": [
      {
        "plugin": "composer-customization",
        "file": "examples/plugins/composer-customization/app.tsx",
        "note": "Reference implementation of effects plus onDraftChange over the structured draft."
      }
    ],
    "rules": [
      "richtext-paint-only",
      "composer-scopes",
      "frontend-no-network"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your matches paint over the draft text and never mutate it",
      "Offsets stay correct after the user edits around a mention",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-composer-rich-text",
    "mockupHash": "composer,surface=composer-rich-text"
  },
  "composer-state": {
    "kind": "surface",
    "id": "composer-state",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "useComposer() / useComposerView() inside a composer customization or slot",
    "propsType": "PluginComposerApi · ComposerView",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [],
    "reference": [
      {
        "plugin": "drafts",
        "file": "plugins/drafts/app.tsx",
        "note": "Reads view.draft.isEmpty / view.run.isSubmitting to disable its plus-menu row and submits through the composer pipeline."
      }
    ],
    "rules": [
      "composer-write-target",
      "composer-scoped-effects",
      "frontend-no-network"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your reads and writes land in the composer that mounted your slot (thread draft, queued-message editor, side chat or new thread)",
      "setTextEffect and setInputLock release automatically when your slot unmounts",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-composer-state",
    "mockupHash": "composer,surface=composer-state"
  },
  "composer-plus-menu": {
    "kind": "surface",
    "id": "composer-plus-menu",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.composer.customize({ id, plusMenu: [{ id, label, icon?, description?, disabled?, experimental_sendMenu?, run }] })",
    "propsType": "ComposerPlusMenuItem",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [
      {
        "name": "Drafts",
        "id": "drafts"
      },
      {
        "name": "Send later",
        "id": "scheduled-send"
      }
    ],
    "reference": [
      {
        "plugin": "drafts",
        "file": "plugins/drafts/app.tsx",
        "note": "Whole plugin: a plus-menu row that submits with experimental_data and a dispatch hook that keeps it queued."
      },
      {
        "plugin": "scheduled-send",
        "file": "plugins/scheduled-send/app.tsx",
        "note": "Adds a send-menu row that schedules the draft with sendAt."
      }
    ],
    "rules": [
      "composer-submit-pipeline",
      "composer-scopes",
      "icons-hugeicons",
      "frontend-no-network"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your row appears in the + menu (and, with experimental_sendMenu, in the desktop send dropdown and mobile long-press menu)",
      "run() submits through composer.experimental_submit so attachments, mentions and picker selections travel with the message",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-composer-plus-menu",
    "mockupHash": "composer,surface=composer-plus-menu"
  },
  "provider-picker": {
    "kind": "surface",
    "id": "provider-picker",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.providers.register(declaration) — requires a bb.host entry; optional app.slots.experimental_providerIcon({ providerKind, providerId, icon })",
    "propsType": "PluginProviderDeclaration",
    "slotKind": "additive",
    "stability": "experimental",
    "firstParty": [
      {
        "name": "ACP providers",
        "id": "provider-acp"
      },
      {
        "name": "Claude Code provider",
        "id": "provider-claude-code"
      },
      {
        "name": "Codex provider",
        "id": "provider-codex"
      },
      {
        "name": "Pi provider",
        "id": "provider-pi"
      }
    ],
    "reference": [
      {
        "plugin": "provider-acp",
        "file": "plugins/provider-acp/src/declaration.ts",
        "note": "Builds one declaration per ACP agent and ships the bridge from the same host artifact."
      },
      {
        "plugin": "echo-provider",
        "file": "examples/plugins/echo-provider/src/provider-bridge.ts",
        "note": "Smallest complete bridge: handshake, a session start and the minimal turn loop."
      }
    ],
    "rules": [
      "provider-needs-host",
      "provider-id-immutable",
      "provider-derive-sync",
      "bridge-grammar-v3",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your provider appears in the composer's provider/model picker with its mark and models",
      "A thread runs end to end on it: input.accepted → turn.open → item deltas → turn.boundary",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-provider-picker",
    "mockupHash": "composer,surface=provider-picker"
  },
  "composer-actions": {
    "kind": "surface",
    "id": "composer-actions",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.composer.customize({ id, actions: [{ id, component }] })",
    "propsType": "ComposerCustomization",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [],
    "reference": [
      {
        "plugin": "composer-customization",
        "file": "examples/plugins/composer-customization/app.tsx",
        "note": "Registers an inline action beside the native controls."
      }
    ],
    "rules": [
      "composer-inline-cap",
      "composer-scopes",
      "frontend-no-network",
      "crash-boundary"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your button renders at the right end of the control row, before the mic and send buttons",
      "With three other plugins installed yours degrades into the overflow menu instead of breaking the row",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-composer-actions",
    "mockupHash": "composer,surface=composer-actions"
  },
  "homepage-section": {
    "kind": "surface",
    "id": "homepage-section",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.homepageSection({ id, title, component })",
    "propsType": "PluginHomepageSectionProps",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [],
    "reference": [],
    "rules": [
      "frontend-no-network",
      "no-worker-pool",
      "css-scope",
      "crash-boundary"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your section renders full width under the new-thread prompt box, after bb's own content",
      "projectId === null (no project selected) renders something sensible rather than throwing",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-homepage-section",
    "mockupHash": "home,surface=homepage-section"
  },
  "new-thread-panel": {
    "kind": "surface",
    "id": "new-thread-panel",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.experimental_newThreadPanelAction({ id, title, icon, component, layout?, run? })",
    "propsType": "PluginNewThreadPanelProps",
    "slotKind": "additive",
    "stability": "experimental",
    "firstParty": [],
    "reference": [],
    "rules": [
      "frontend-no-network",
      "panel-params-untrusted",
      "icons-hugeicons",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your row appears in the home screen's Actions list after Open browser and Start terminal",
      "run() opens your tab with the params you pass and projectId may be null",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-new-thread-panel",
    "mockupHash": "home,surface=new-thread-panel"
  },
  "declarative-settings": {
    "kind": "surface",
    "id": "declarative-settings",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.settings.define({ <key>: { type, label, default?, secret? } })",
    "propsType": "PluginSettingDescriptor",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [
      {
        "name": "Custom instructions",
        "id": "custom-instructions"
      },
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Provider retry",
        "id": "provider-retry"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "custom-instructions",
        "file": "plugins/custom-instructions/server.ts",
        "note": "Defines one setting, migrates a legacy kv value into it with experimental_set and tracks changes with onChange."
      },
      {
        "plugin": "github",
        "file": "plugins/github/server.ts",
        "note": "Validates a string setting with a zod superRefine through experimental_schema."
      }
    ],
    "rules": [
      "settings-load-once",
      "settings-secrets",
      "backend-full-trust",
      "dispose-lifo"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "bb renders your fields on the plugin's settings page and bb plugin config <id> set … writes them",
      "A secret: true field never reaches useSettings() and lives as a 0600 file, not in the database",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-declarative-settings",
    "mockupHash": "settings,surface=declarative-settings"
  },
  "settings-section": {
    "kind": "surface",
    "id": "settings-section",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.settingsSection({ id, title?, description?, component })",
    "propsType": "PluginSettingsSectionProps",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [
      {
        "name": "Account Pooler [Experimental]",
        "id": "account-pool"
      },
      {
        "name": "Keep Awake",
        "id": "keep-awake"
      },
      {
        "name": "Memory",
        "id": "memory"
      },
      {
        "name": "Remote access",
        "id": "connect"
      }
    ],
    "reference": [
      {
        "plugin": "connect",
        "file": "plugins/connect/app.tsx",
        "note": "Renders remote-access controls under the generated settings form."
      },
      {
        "plugin": "keep-awake",
        "file": "plugins/keep-awake/app.tsx",
        "note": "Renders per-host toggles backed by its own RPC."
      }
    ],
    "rules": [
      "frontend-no-network",
      "no-worker-pool",
      "css-scope",
      "crash-boundary"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your component renders directly below the generated Configuration card",
      "The plugin appears in the settings sidebar even with no declared settings, because the section alone qualifies it",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-settings-section",
    "mockupHash": "settings,surface=settings-section"
  },
  "plugin-status": {
    "kind": "surface",
    "id": "plugin-status",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.status.needsConfiguration(message)",
    "propsType": "PluginStatusApi",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "github",
        "file": "plugins/github/server.ts",
        "note": "Reports needs-configuration when gh auth is missing instead of failing the load."
      },
      {
        "plugin": "workflows",
        "file": "plugins/workflows/src/server.ts",
        "note": "Reports it from the factory so an unconfigured plugin does not crash-loop."
      }
    ],
    "rules": [
      "status-cleared-on-load",
      "needs-configuration-error",
      "backend-full-trust"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "An unconfigured plugin shows your message as a banner on its page and in bb plugin list",
      "After the user configures it, bb plugin reload <id> clears the state",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-plugin-status",
    "mockupHash": "plugins,surface=plugin-status"
  },
  "cli": {
    "kind": "surface",
    "id": "cli",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.cli.register(defineCli({ name, summary, commands }))",
    "propsType": "PluginCliRegistration",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [
      {
        "name": "Automations",
        "id": "automations"
      },
      {
        "name": "Custom instructions",
        "id": "custom-instructions"
      },
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Keep Awake",
        "id": "keep-awake"
      },
      {
        "name": "Memory",
        "id": "memory"
      },
      {
        "name": "Provider retry",
        "id": "provider-retry"
      },
      {
        "name": "Remote access",
        "id": "connect"
      },
      {
        "name": "Secrets",
        "id": "secrets"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "concurrency-limit",
        "file": "plugins/concurrency-limit/server.ts",
        "note": "defineCli + cliCommand with typed options and PluginCliError with a hint."
      },
      {
        "plugin": "tasks",
        "file": "plugins/tasks/cli/index.ts",
        "note": "Grouped command paths such as \"project create\"."
      }
    ],
    "rules": [
      "cli-runs-on-server",
      "cli-output-cap",
      "cli-argv",
      "backend-full-trust"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "bb <name> --help renders without executing plugin code and bb <name> <command> returns your exit code",
      "Output stays under PLUGIN_CLI_OUTPUT_MAX_BYTES; the host rejects an oversized result atomically",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-cli",
    "mockupHash": "headless,surface=cli"
  },
  "agent-tools": {
    "kind": "surface",
    "id": "agent-tools",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.agents.registerTool({ name, description, parameters, execute }) · bb.agents.configure(provider) · bb.agents.contributeInstructions(provider)",
    "propsType": "PluginAgentToolContext",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [
      {
        "name": "Ask User Question",
        "id": "ask-user-question"
      },
      {
        "name": "Custom instructions",
        "id": "custom-instructions"
      },
      {
        "name": "Memory",
        "id": "memory"
      },
      {
        "name": "Remote access",
        "id": "connect"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "workflows",
        "file": "plugins/workflows/src/server.ts",
        "note": "Registers two tools with presentation labels and narrows the parameter schema per resolution in configure()."
      },
      {
        "plugin": "ask-user-question",
        "file": "plugins/ask-user-question/src/server.ts",
        "note": "Drops its tool when the provider answers questions natively."
      }
    ],
    "rules": [
      "tools-next-session",
      "tool-name-global",
      "tool-output-bounded",
      "instructions-cap",
      "backend-full-trust"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "A new thread on a provider that selects your tool lists it and executes it with validated parameters",
      "Changing the tool set takes effect on the next session start, not mid-session",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-agent-tools",
    "mockupHash": "headless,surface=agent-tools"
  },
  "background": {
    "kind": "surface",
    "id": "background",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.background.service(name, { start(signal) }) · bb.background.schedule(name, cron, fn)",
    "propsType": "PluginBackground",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [
      {
        "name": "Automations",
        "id": "automations"
      },
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Keep Awake",
        "id": "keep-awake"
      },
      {
        "name": "Provider retry",
        "id": "provider-retry"
      },
      {
        "name": "Remote access",
        "id": "connect"
      },
      {
        "name": "Side chat",
        "id": "side-chat"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "automations",
        "file": "plugins/automations/src/server.ts",
        "note": "Startup reconciliation then a loop that sleeps on the abort signal."
      },
      {
        "plugin": "environment-modal-sandbox",
        "file": "plugins/environment-modal-sandbox/server.ts",
        "note": "A one-minute schedule that suspends idle machines."
      }
    ],
    "rules": [
      "service-abort-sleep",
      "schedule-only-while-loaded",
      "needs-configuration-error",
      "dispose-lifo"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your service starts after the factory and resolves when its signal aborts; bb plugin list shows it running",
      "Reload stops it within the 5 s window — no \"degraded (service did not stop)\"",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-background",
    "mockupHash": "headless,surface=background"
  },
  "wire": {
    "kind": "surface",
    "id": "wire",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.rpc.register(contract, handlers, options?) · bb.http.route(method, path, handler, { auth }) · bb.realtime.publish(channel, payload)",
    "propsType": "PluginRpcContract · PluginHttpHandler",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [
      {
        "name": "Automations",
        "id": "automations"
      },
      {
        "name": "Custom instructions",
        "id": "custom-instructions"
      },
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Inline visualizations",
        "id": "inline-vis"
      },
      {
        "name": "Keep Awake",
        "id": "keep-awake"
      },
      {
        "name": "Memory",
        "id": "memory"
      },
      {
        "name": "Provider retry",
        "id": "provider-retry"
      },
      {
        "name": "Remote access",
        "id": "connect"
      },
      {
        "name": "Side chat",
        "id": "side-chat"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "tasks",
        "file": "plugins/tasks/attachments/index.ts",
        "note": "Token-authenticated upload route plus realtime publishes after every write."
      },
      {
        "plugin": "slack-bot",
        "file": "examples/plugins/slack-bot/server.ts",
        "note": "auth: \"none\" webhook that verifies the Slack signature inside the handler."
      }
    ],
    "rules": [
      "frontend-no-network",
      "rpc-strict-json",
      "http-exact-match",
      "realtime-broadcast",
      "backend-full-trust"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "useRpc().call(...) from app.tsx reaches your handler and returns typed, strict-JSON output",
      "A realtime publish reaches every open window and your UI reconciles on the next connected transition",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-wire",
    "mockupHash": "headless,surface=wire"
  },
  "thread-events": {
    "kind": "surface",
    "id": "thread-events",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.events.on(event, handler)",
    "propsType": "PluginThreadEventPayloads",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [
      {
        "name": "Automations",
        "id": "automations"
      },
      {
        "name": "Provider retry",
        "id": "provider-retry"
      },
      {
        "name": "Push notifications",
        "id": "push-notifications"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "provider-retry",
        "file": "plugins/provider-retry/server.ts",
        "note": "Retries by reference on turn.failed with bb.sdk.threads.retry."
      },
      {
        "plugin": "tasks",
        "file": "plugins/tasks/lifecycle/index.ts",
        "note": "Tracks thread lifecycle transitions to update its own rows."
      }
    ],
    "rules": [
      "events-are-announcements",
      "events-see-everything",
      "message-cancelled-only-signal",
      "backend-full-trust"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your handler runs on the real transitions (thread.active / thread.idle / thread.failed) and its return value is ignored",
      "Queue events are filtered to your own rows through entry.waitingOn.pluginId",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-thread-events",
    "mockupHash": "headless,surface=thread-events"
  },
  "dispatch-hook": {
    "kind": "surface",
    "id": "dispatch-hook",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.experimental_hooks.on(\"message.dispatch\", handler) · bb.experimental_hooks.recheck(\"message.dispatch\")",
    "propsType": "MessageDispatchHookContext → MessageDispatchHookDecision",
    "slotKind": "additive",
    "stability": "experimental",
    "firstParty": [
      {
        "name": "Concurrency limit",
        "id": "concurrency-limit"
      },
      {
        "name": "Drafts",
        "id": "drafts"
      }
    ],
    "reference": [
      {
        "plugin": "drafts",
        "file": "plugins/drafts/server.ts",
        "note": "Shortest complete hook: waits forever on its own submissions until the user sends."
      },
      {
        "plugin": "concurrency-limit",
        "file": "plugins/concurrency-limit/server.ts",
        "note": "Counts running threads, waits with a reason and rechecks when capacity frees up."
      }
    ],
    "rules": [
      "hook-fail-closed",
      "hook-idempotent",
      "hook-no-amendment",
      "send-now-bypass",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "A message that should wait shows your reason on the queued card above the composer and a clock in the sidebar row",
      "Deciding takes milliseconds: a handler that throws or exceeds the 10 s box fails the attempt with your plugin named",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-dispatch-hook",
    "mockupHash": "headless,surface=dispatch-hook"
  },
  "environment-providers": {
    "kind": "surface",
    "id": "environment-providers",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.experimental_environments.register(declaration | composition)",
    "propsType": "PluginEnvironmentProviderDefinition",
    "slotKind": "additive",
    "stability": "experimental",
    "firstParty": [
      {
        "name": "Project checkout",
        "id": "environment-project-checkout"
      },
      {
        "name": "Personal workspace",
        "id": "environment-personal-workspace"
      },
      {
        "name": "Worktree",
        "id": "environment-git-worktree"
      }
    ],
    "reference": [
      {
        "plugin": "environment-personal-workspace",
        "file": "plugins/environment-personal-workspace/server.ts",
        "note": "Tiniest provider: requires projectless, one host call to create and one to remove."
      },
      {
        "plugin": "environment-git-worktree",
        "file": "plugins/environment-git-worktree/server.ts",
        "note": "Per-attempt path keys, existing-path adoption and experimental_claimPath."
      }
    ],
    "rules": [
      "env-create-idempotent",
      "env-failure-terminal",
      "env-inputs-public",
      "env-hooks-owned-by-core",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your provider appears in the New Thread environment picker and creates a workspace a thread can run in",
      "create() called twice with the same pathKey converges instead of allocating twice",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-environment-providers",
    "mockupHash": "headless,surface=environment-providers"
  },
  "machine-providers": {
    "kind": "surface",
    "id": "machine-providers",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.experimental_machines.register(declaration) + bb.experimental_machines.bootstrap({ key, executor, report, signal })",
    "propsType": "PluginMachineProviderDefinition",
    "slotKind": "additive",
    "stability": "experimental",
    "firstParty": [
      {
        "name": "Modal Sandbox [Experimental]",
        "id": "environment-modal-sandbox"
      }
    ],
    "reference": [
      {
        "plugin": "environment-modal-sandbox",
        "file": "plugins/environment-modal-sandbox/providers/register.ts",
        "note": "The only first-party machine provider: create → checkpoint → bootstrap, plus suspend / resume / reconcileCleanup."
      }
    ],
    "rules": [
      "machine-checkpoint",
      "machine-needs-composition",
      "machine-resource-public",
      "machine-idle-is-yours",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Creating a machine enrolls a host daemon that connects back and appears in bb machine list",
      "Removal cleans up by durable key even when no checkpoint was ever written",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-machine-providers",
    "mockupHash": "headless,surface=machine-providers"
  },
  "server-access": {
    "kind": "surface",
    "id": "server-access",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.experimental_serverAccess.register({ id, displayName, description, availability, acquire, release })",
    "propsType": "ServerAccessProviderDeclaration",
    "slotKind": "additive",
    "stability": "experimental",
    "firstParty": [
      {
        "name": "Remote access",
        "id": "connect"
      }
    ],
    "reference": [
      {
        "plugin": "connect",
        "file": "plugins/connect/src/server-access.ts",
        "note": "The sole implementation: persists the intent before redeeming a code so release works before enrolment."
      }
    ],
    "rules": [
      "access-acquire-idempotent",
      "access-release-null-grant",
      "machine-resource-public",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "A new machine reaches the server through your grant: serverUrl plus headers are used for enrolment and runtime",
      "release() reconciles by key and hostId even when grantId is null",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-server-access",
    "mockupHash": "headless,surface=server-access"
  },
  "host-workers": {
    "kind": "surface",
    "id": "host-workers",
    "entry": "host",
    "manifestEntry": "bb.host",
    "registration": "bb.hosts.experimental_client({ contract, experimental_signals }) on the server + experimental_defineHostEntry({ contract, handlers, dispose }) in bb.host",
    "propsType": "ExperimentalHostRpcContext",
    "slotKind": "additive",
    "stability": "experimental",
    "firstParty": [
      {
        "name": "Project checkout",
        "id": "environment-project-checkout"
      },
      {
        "name": "Keep Awake",
        "id": "keep-awake"
      },
      {
        "name": "Personal workspace",
        "id": "environment-personal-workspace"
      },
      {
        "name": "Remote access",
        "id": "connect"
      },
      {
        "name": "Worktree",
        "id": "environment-git-worktree"
      }
    ],
    "reference": [
      {
        "plugin": "keep-awake",
        "file": "plugins/keep-awake/server.ts",
        "note": "Calls the host worker to hold a wake lock and reacts to experimental_onWorkerExit."
      },
      {
        "plugin": "environment-git-worktree",
        "file": "plugins/environment-git-worktree/host.ts",
        "note": "Streams progress back with experimental_emitSignal correlated by an operationId."
      }
    ],
    "rules": [
      "host-call-not-in-factory",
      "host-no-private-imports",
      "host-limits",
      "host-worker-exit",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "bb plugin build emits dist/host.js and the daemon runs it after verifying its sha256 digest",
      "A call from an RPC handler or service reaches the worker; calls made during the factory are rejected",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-host-workers",
    "mockupHash": "headless,surface=host-workers"
  },
  "storage": {
    "kind": "surface",
    "id": "storage",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.storage.kv.{get,set,delete,list} · bb.storage.database() · bb.storage.migrate(db, statements)",
    "propsType": "PluginStorage",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [
      {
        "name": "Automations",
        "id": "automations"
      },
      {
        "name": "Custom instructions",
        "id": "custom-instructions"
      },
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Keep Awake",
        "id": "keep-awake"
      },
      {
        "name": "Memory",
        "id": "memory"
      },
      {
        "name": "Remote access",
        "id": "connect"
      },
      {
        "name": "Side chat",
        "id": "side-chat"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "memory",
        "file": "plugins/memory/server.ts",
        "note": "Owns a SQLite schema through migrate() and queries it directly."
      },
      {
        "plugin": "side-chat",
        "file": "plugins/side-chat/server.ts",
        "note": "Uses namespaced kv with a prefix sweep instead of a database."
      }
    ],
    "rules": [
      "kv-value-cap",
      "migrations-append-only",
      "storage-not-a-boundary",
      "backend-full-trust"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your data survives a plugin reload and a bb restart",
      "Adding a migration appends a new statement instead of editing an applied one",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-storage",
    "mockupHash": "headless,surface=storage"
  },
  "bb-sdk": {
    "kind": "surface",
    "id": "bb-sdk",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.sdk.<area>.<method>(...) — threads, projects, environments, hosts, files, terminals, skills, plugins, theme, system",
    "propsType": "PluginBbSdk",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [
      {
        "name": "Automations",
        "id": "automations"
      },
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Inline visualizations",
        "id": "inline-vis"
      },
      {
        "name": "Keep Awake",
        "id": "keep-awake"
      },
      {
        "name": "Provider retry",
        "id": "provider-retry"
      },
      {
        "name": "Push notifications",
        "id": "push-notifications"
      },
      {
        "name": "Secrets",
        "id": "secrets"
      },
      {
        "name": "Side chat",
        "id": "side-chat"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "side-chat",
        "file": "plugins/side-chat/server.ts",
        "note": "Forks hidden threads and lists them back by originPluginId."
      },
      {
        "plugin": "concurrency-limit",
        "file": "plugins/concurrency-limit/server.ts",
        "note": "Reads threads.listRunning() and subscribes to host changes."
      }
    ],
    "rules": [
      "sdk-bind-gated",
      "sdk-hidden-threads",
      "sdk-attribution",
      "backend-full-trust"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your call runs from a handler, service or timer (not from the factory in a harness) and returns real data",
      "Every hidden thread you spawn is stopped and archived in a finally block",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-bb-sdk",
    "mockupHash": "headless,surface=bb-sdk"
  },
  "thread-plugin-metadata": {
    "kind": "surface",
    "id": "thread-plugin-metadata",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.sdk.threads.getPluginMetadata({ threadId }) · bb.sdk.threads.updatePluginMetadata({ threadId, set, remove })",
    "propsType": "ThreadPluginMetadataResult",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [],
    "reference": [],
    "rules": [
      "metadata-untrusted",
      "metadata-size",
      "metadata-frozen-in-configure",
      "backend-full-trust"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your namespace travels with the thread and is readable from bb.agents.configure as a frozen snapshot",
      "An oversized patch fails with 413 and leaves the previous value intact",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-thread-plugin-metadata",
    "mockupHash": "headless,surface=thread-plugin-metadata"
  },
  "desktop-browsers": {
    "kind": "surface",
    "id": "desktop-browsers",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.sdk.experimental_desktopBrowsers.{listInstances,createTab,acquireControl,openConnection,releaseControl,closeTab,…}",
    "propsType": "ExperimentalDesktopBrowsersArea",
    "slotKind": "additive",
    "stability": "experimental",
    "firstParty": [
      {
        "name": "Browser Automation",
        "id": "browser-automation"
      }
    ],
    "reference": [
      {
        "plugin": "browser-automation",
        "file": "plugins/browser-automation/server.ts",
        "note": "The only consumer: scope → createTab → acquireControl → openConnection, with min() over every expiry."
      }
    ],
    "rules": [
      "browser-lease-ttl",
      "browser-allow-personal",
      "browser-host-match",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your automation drives a real desktop tab through the scoped CDP endpoint",
      "Releasing control and closing only the tabs you created leaves the user's own tabs and logins intact",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-desktop-browsers",
    "mockupHash": "headless,surface=desktop-browsers"
  },
  "ai-services": {
    "kind": "surface",
    "id": "ai-services",
    "entry": "host",
    "manifestEntry": "bb.host",
    "registration": "bb.experimental_aiServices.register({ id, displayName, kinds }) + experimental_aiServicesHostContract in bb.host",
    "propsType": "PluginAiServiceDeclaration",
    "slotKind": "additive",
    "stability": "experimental",
    "firstParty": [
      {
        "name": "Codex provider",
        "id": "provider-codex"
      }
    ],
    "reference": [
      {
        "plugin": "provider-codex",
        "file": "plugins/provider-codex/server.ts",
        "note": "The only first-party AI service: registers inference and voice from the codex host entry."
      }
    ],
    "rules": [
      "ai-needs-host",
      "ai-failures-returned",
      "ai-reserved-ids",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "With BB_INFERENCE=<id>/<model> bb's helper inference (thread titles, commit messages) runs through your host entry",
      "Failures come back as { ok: false, code } so core can apply its retry and fallback policy",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-ai-services",
    "mockupHash": "headless,surface=ai-services"
  },
  "host-components": {
    "kind": "surface",
    "id": "host-components",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "import { ThreadChat, Markdown, experimental_SourceCode, experimental_Diff, experimental_Icon, … } from \"@get-bb/plugin-sdk/app\"",
    "propsType": "ThreadChatProps · MarkdownProps",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [
      {
        "name": "Side chat",
        "id": "side-chat"
      },
      {
        "name": "Provider usage",
        "id": "provider-usage"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      }
    ],
    "reference": [
      {
        "plugin": "side-chat",
        "file": "plugins/side-chat/app.tsx",
        "note": "Embeds ThreadChat in compact mode with its own messageActions."
      },
      {
        "plugin": "thread-chat-demo",
        "file": "examples/plugins/thread-chat-demo/app.tsx",
        "note": "Demonstrates ThreadChat plus targeted fixed tabs."
      }
    ],
    "rules": [
      "jsx-alias-experimental",
      "threadchat-owns-thread",
      "no-worker-pool",
      "shims-devdeps"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your panel renders a live thread through ThreadChat instead of proxying thread data through your own RPC",
      "experimental_* components are imported under an aliased capitalised name so JSX compiles",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-host-components",
    "mockupHash": "headless,surface=host-components"
  },
  "testing": {
    "kind": "surface",
    "id": "testing",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "createFakePluginHost(options) · loadPluginApp(() => import(\"./app\")) + renderSlot(...) · createFakeSdk(...) · experimental_createHostEntryHarness(entry)",
    "propsType": "FakePluginHost · CapturedPluginApp",
    "slotKind": "additive",
    "stability": "stable",
    "firstParty": [
      {
        "name": "Ask User Question",
        "id": "ask-user-question"
      },
      {
        "name": "Automations",
        "id": "automations"
      },
      {
        "name": "Custom instructions",
        "id": "custom-instructions"
      },
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Inline visualizations",
        "id": "inline-vis"
      },
      {
        "name": "Keep Awake",
        "id": "keep-awake"
      },
      {
        "name": "Memory",
        "id": "memory"
      },
      {
        "name": "Provider retry",
        "id": "provider-retry"
      },
      {
        "name": "Remote access",
        "id": "connect"
      },
      {
        "name": "Secrets",
        "id": "secrets"
      },
      {
        "name": "Side chat",
        "id": "side-chat"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "tasks",
        "file": "plugins/tasks/app.test.tsx",
        "note": "Frontend harness driven by realtime, asserting on inspection.rpcCalls."
      },
      {
        "plugin": "echo-provider",
        "file": "examples/plugins/echo-provider/provider-bridge.conformance.test.ts",
        "note": "Bridge conformance, parity and stream tests against recordings."
      }
    ],
    "rules": [
      "harness-same-collector",
      "harness-stubs",
      "dispose-lifo"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your surfaces are exercised without a running bb: RPC, CLI, services and slots all covered",
      "The harness disposes cleanly in a finally block so temporary storage is removed",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "surface-testing",
    "mockupHash": "headless,surface=testing"
  }
});

/** Keyed by the `app.slots.*` or builder member name. */
export const SLOT_ANNOTATIONS: Readonly<Record<string, Annotation>> = Object.freeze({
  "homepageSection": {
    "kind": "slot",
    "id": "homepageSection",
    "title": "app.slots.homepageSection",
    "summary": "Adds a full-width section to the page bb opens on, below the prompt box. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.homepageSection({ id, title, component })",
    "propsType": "PluginHomepageSectionProps",
    "slotKind": "additive",
    "stability": "stable",
    "symbols": [
      "PluginHomepageSectionRegistration"
    ],
    "firstParty": [],
    "reference": [],
    "rules": [
      "frontend-no-network",
      "no-worker-pool",
      "css-scope",
      "crash-boundary"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your section renders full width under the new-thread prompt box, after bb's own content",
      "projectId === null (no project selected) renders something sensible rather than throwing",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "homepage-section"
    ],
    "guideAnchor": "slot-homepageSection",
    "mockupHash": "home,surface=homepage-section"
  },
  "settingsSection": {
    "kind": "slot",
    "id": "settingsSection",
    "title": "app.slots.settingsSection",
    "summary": "Renders your own React component on the plugin's settings page, below the [fields bb generated](declarative-settings). Use it for anything that is not a value in a form. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.settingsSection({ id, title?, description?, component })",
    "propsType": "PluginSettingsSectionProps",
    "slotKind": "additive",
    "stability": "stable",
    "symbols": [
      "PluginSettingsSectionRegistration"
    ],
    "firstParty": [
      {
        "name": "Account Pooler [Experimental]",
        "id": "account-pool"
      },
      {
        "name": "Keep Awake",
        "id": "keep-awake"
      },
      {
        "name": "Memory",
        "id": "memory"
      },
      {
        "name": "Remote access",
        "id": "connect"
      }
    ],
    "reference": [
      {
        "plugin": "connect",
        "file": "plugins/connect/app.tsx",
        "note": "Renders remote-access controls under the generated settings form."
      },
      {
        "plugin": "keep-awake",
        "file": "plugins/keep-awake/app.tsx",
        "note": "Renders per-host toggles backed by its own RPC."
      }
    ],
    "rules": [
      "frontend-no-network",
      "no-worker-pool",
      "css-scope",
      "crash-boundary"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your component renders directly below the generated Configuration card",
      "The plugin appears in the settings sidebar even with no declared settings, because the section alone qualifies it",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "settings-section"
    ],
    "guideAnchor": "slot-settingsSection",
    "mockupHash": "settings,surface=settings-section"
  },
  "experimental_appOverlay": {
    "kind": "slot",
    "id": "experimental_appOverlay",
    "title": "app.slots.experimental_appOverlay",
    "summary": "Mounts floating plugin UI across the bb app, outside route-owned layout regions. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.experimental_appOverlay({ id, component })",
    "propsType": "ExperimentalAppOverlayProps",
    "slotKind": "additive",
    "stability": "experimental",
    "symbols": [
      "ExperimentalAppOverlayRegistration",
      "ExperimentalAppOverlayProps"
    ],
    "firstParty": [],
    "reference": [
      {
        "plugin": "push-notifications",
        "file": "plugins/push-notifications/app.tsx",
        "note": "Mounts a delivery overlay once per app window."
      },
      {
        "plugin": "browser-automation",
        "file": "plugins/browser-automation/app.tsx",
        "note": "Mounts a preview lightbox outside the layout regions."
      }
    ],
    "rules": [
      "overlay-owns-chrome",
      "frontend-no-network",
      "crash-boundary",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your overlay mounts once per app window and survives route changes",
      "It positions and hides itself: bb supplies no chrome, no placement and no visibility",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "app-overlay"
    ],
    "guideAnchor": "slot-experimental_appOverlay",
    "mockupHash": "shell,surface=app-overlay"
  },
  "navPanel": {
    "kind": "slot",
    "id": "navPanel",
    "title": "app.slots.navPanel",
    "summary": "Adds a row to bb's sidebar that opens a page your plugin renders where threads normally appear. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.navPanel({ id, title, icon, path, component, fixedTabs?, experimental_sidebarAccessory?, headerContent? })",
    "propsType": "PluginNavPanelProps",
    "slotKind": "additive",
    "stability": "stable",
    "symbols": [
      "PluginNavPanelRegistration",
      "PluginNavPanelProps",
      "PluginFixedTabRegistration",
      "PluginFixedTabDeclaration",
      "ExperimentalPluginFixedTabReference",
      "ExperimentalFixedTabTargetContract",
      "experimental_useAppPanel",
      "ExperimentalAppPanel"
    ],
    "firstParty": [
      {
        "name": "Automations",
        "id": "automations"
      },
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      }
    ],
    "reference": [
      {
        "plugin": "tasks",
        "file": "plugins/tasks/app.tsx",
        "note": "Registers a nav panel with a sidebar accessory and a fixed tab, and routes the remaining subPath inside the page."
      },
      {
        "plugin": "github",
        "file": "plugins/github/app.tsx",
        "note": "Uses headerContent to put controls into the shared app title bar."
      }
    ],
    "rules": [
      "frontend-no-network",
      "shims-devdeps",
      "css-scope",
      "icons-hugeicons",
      "crash-boundary",
      "panel-params-untrusted"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "A row with your icon and title appears under the built-in navigation rows and opens /plugins/<plugin-id>/<path>",
      "Deep links into the page work: navigating to /plugins/<plugin-id>/<path>/foo hands your component subPath = \"foo\"",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "nav-panel"
    ],
    "guideAnchor": "slot-navPanel",
    "mockupHash": "shell,surface=nav-panel"
  },
  "threadPanelAction": {
    "kind": "slot",
    "id": "threadPanelAction",
    "title": "app.slots.threadPanelAction",
    "summary": "Adds a tab to the side panel that opens to the right of a thread. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.threadPanelAction({ id, title, icon, component, layout?, run? })",
    "propsType": "PluginThreadPanelProps",
    "slotKind": "additive",
    "stability": "stable",
    "symbols": [
      "PluginThreadPanelActionRegistration"
    ],
    "firstParty": [
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Side chat",
        "id": "side-chat"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "side-chat",
        "file": "plugins/side-chat/app.tsx",
        "note": "Registers the panel action a message action opens, with layout \"flush\"."
      },
      {
        "plugin": "tasks",
        "file": "plugins/tasks/app.tsx",
        "note": "Opens a task panel tab from the thread side panel."
      }
    ],
    "rules": [
      "frontend-no-network",
      "panel-params-untrusted",
      "icons-hugeicons",
      "crash-boundary"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your row appears in the thread side panel's new-tab Actions list and opens a tab",
      "Re-opening the tab from persisted params re-fetches by id instead of trusting the stored payload",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "thread-panel"
    ],
    "guideAnchor": "slot-threadPanelAction",
    "mockupHash": "shell,surface=thread-panel"
  },
  "experimental_newThreadPanelAction": {
    "kind": "slot",
    "id": "experimental_newThreadPanelAction",
    "title": "app.slots.experimental_newThreadPanelAction",
    "summary": "Adds a plugin tab to the side panel on the new-thread screen. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.experimental_newThreadPanelAction({ id, title, icon, component, layout?, run? })",
    "propsType": "PluginNewThreadPanelProps",
    "slotKind": "additive",
    "stability": "experimental",
    "symbols": [
      "PluginNewThreadPanelActionRegistration"
    ],
    "firstParty": [],
    "reference": [],
    "rules": [
      "frontend-no-network",
      "panel-params-untrusted",
      "icons-hugeicons",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your row appears in the home screen's Actions list after Open browser and Start terminal",
      "run() opens your tab with the params you pass and projectId may be null",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "new-thread-panel"
    ],
    "guideAnchor": "slot-experimental_newThreadPanelAction",
    "mockupHash": "home,surface=new-thread-panel"
  },
  "pendingInteraction": {
    "kind": "slot",
    "id": "pendingInteraction",
    "title": "app.slots.pendingInteraction",
    "summary": "Asks the person a question in the thread composer and delivers their answer to the agent, even if the original turn has ended. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.pendingInteraction({ id, component }) paired with bb.ui.requestInput({ rendererId: id, … })",
    "propsType": "PluginPendingInteractionProps",
    "slotKind": "replacement",
    "stability": "stable",
    "symbols": [
      "PluginUi",
      "PluginInteractionRequest",
      "PluginInteractionDescription",
      "PluginRowPresentation",
      "PluginPendingInteractionRegistration"
    ],
    "firstParty": [
      {
        "name": "Ask User Question",
        "id": "ask-user-question"
      },
      {
        "name": "Secrets",
        "id": "secrets"
      }
    ],
    "reference": [
      {
        "plugin": "ask-user-question",
        "file": "plugins/ask-user-question/src/server.ts",
        "note": "Requests a multiple-choice answer from the backend and renders it with the paired slot."
      },
      {
        "plugin": "secrets",
        "file": "plugins/secrets/src/server.ts",
        "note": "Asks for credentials from a CLI command and reconciles them into a dotenv file."
      }
    ],
    "rules": [
      "interaction-detached",
      "interaction-limits",
      "secrets-agent-reach",
      "frontend-no-network",
      "crash-boundary"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "While the interaction is pending your form replaces the composer and submit / cancel resolve the backend promise",
      "Every cancellation reason is handled: user, request-aborted, thread-stopped, thread-deleted, plugin-disposed, server-restarted, timeout",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "pending-interaction"
    ],
    "guideAnchor": "slot-pendingInteraction",
    "mockupHash": "shell,surface=pending-interaction"
  },
  "sidebarFooter": {
    "kind": "slot",
    "id": "sidebarFooter",
    "title": "app.experimental_sidebarFooter.register",
    "summary": "Adds a host-rendered icon item to the bottom of bb's sidebar. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.experimental_sidebarFooter.register({ kind: \"action\" | \"disclosure\", id, label, icon, onActivate | component })",
    "propsType": "ExperimentalSidebarFooterDisclosureProps",
    "slotKind": "additive",
    "stability": "experimental",
    "symbols": [
      "ExperimentalSidebarFooter",
      "ExperimentalSidebarFooterItemBase",
      "ExperimentalSidebarFooterItemRegistration",
      "ExperimentalSidebarFooterActionRegistration",
      "ExperimentalSidebarFooterActionContext",
      "ExperimentalSidebarFooterDisclosureRegistration",
      "ExperimentalSidebarFooterDisclosureProps",
      "ExperimentalSidebarFooterDisclosureController"
    ],
    "firstParty": [
      {
        "name": "Remote access",
        "id": "connect"
      }
    ],
    "reference": [
      {
        "plugin": "connect",
        "file": "plugins/connect/app.tsx",
        "note": "Registers a footer action that opens the plugin's own details page."
      },
      {
        "plugin": "provider-usage",
        "file": "plugins/provider-usage/app.tsx",
        "note": "Registers a disclosure and keeps the returned controller to open and close it."
      }
    ],
    "rules": [
      "frontend-no-network",
      "shims-devdeps",
      "icons-hugeicons",
      "crash-boundary",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your item appears in the sidebar footer strip between Settings and the bug-report icon",
      "A disclosure opens above the footer row and closes when another plugin's disclosure opens",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "sidebar-footer"
    ],
    "guideAnchor": "slot-sidebarFooter",
    "mockupHash": "shell,surface=sidebar-footer"
  },
  "experimental_sidebarNavigation": {
    "kind": "slot",
    "id": "experimental_sidebarNavigation",
    "title": "app.slots.experimental_sidebarNavigation",
    "summary": "Replaces bb's navigation controls above the thread list with a component your plugin renders. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.experimental_sidebarNavigation({ id, title, description, component })",
    "propsType": "ExperimentalSidebarNavigationProps",
    "slotKind": "replacement",
    "stability": "experimental",
    "symbols": [
      "ExperimentalSidebarNavigationRegistration",
      "ExperimentalSidebarNavigationProps",
      "ExperimentalSidebarNavigationItem",
      "ExperimentalSidebarNavigationAction",
      "ExperimentalSidebarNavigationIcon",
      "ExperimentalSidebarNavigationShortcut",
      "ExperimentalSidebarNavigationActivationOptions"
    ],
    "firstParty": [],
    "reference": [
      {
        "plugin": "sidebar-navigation-example",
        "file": "examples/plugins/sidebar-navigation/app.tsx",
        "note": "Replaces the whole navigation block with a compact grid and delegates to experimental_Original when it does not want to own an item."
      }
    ],
    "rules": [
      "frontend-no-network",
      "shims-devdeps",
      "replacement-original",
      "crash-boundary",
      "icons-hugeicons",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Settings → Appearance → Navigation lists your plugin and selecting it replaces the New thread / Search / Plugins / Skills block with your component",
      "Activating an item through experimental_activate opens the same destination bb would have opened, including split placement",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "sidebar-navigation"
    ],
    "guideAnchor": "slot-experimental_sidebarNavigation",
    "mockupHash": "shell,surface=sidebar-navigation"
  },
  "experimental_threadList": {
    "kind": "slot",
    "id": "experimental_threadList",
    "title": "app.slots.experimental_threadList",
    "summary": "Replaces the list of threads in bb's sidebar with a component your plugin renders. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.experimental_threadList({ id, title, description, component })",
    "propsType": "PluginThreadListProps",
    "slotKind": "exclusive",
    "stability": "experimental",
    "symbols": [
      "PluginThreadListRegistration",
      "PluginThreadListProps",
      "experimental_useSidebarThreads",
      "PluginSidebarThreadsState",
      "experimental_useSidebarThreadActions",
      "PluginSidebarThreadActions",
      "experimental_useSidebarThreadPullRequest",
      "PluginSidebarThreadPullRequestState"
    ],
    "firstParty": [],
    "reference": [
      {
        "plugin": "replacement-lab-alpha",
        "file": "examples/plugins/replacement-lab-alpha/app.tsx",
        "note": "Shows conditional delegation to Original, the deliberate crash path and how two plugins contend for the same area."
      }
    ],
    "rules": [
      "exclusive-slot",
      "replacement-original",
      "frontend-no-network",
      "thread-list-keyboard",
      "crash-boundary",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Settings → Appearance → Sidebar lets the user pin your list, and the sidebar scroll area renders it",
      "Rows carry data-sidebar-thread-shortcut-target and data-sidebar-thread-id so thread.next / thread.previous keep working",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "thread-list"
    ],
    "guideAnchor": "slot-experimental_threadList",
    "mockupHash": "shell,surface=thread-list"
  },
  "experimental_threadHeaderAction": {
    "kind": "slot",
    "id": "experimental_threadHeaderAction",
    "title": "app.slots.experimental_threadHeaderAction",
    "summary": "Adds a control to the header bar at the top of an open thread. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.experimental_threadHeaderAction({ id, title, component })",
    "propsType": "PluginThreadHeaderActionProps",
    "slotKind": "additive",
    "stability": "experimental",
    "symbols": [
      "PluginThreadHeaderActionRegistration"
    ],
    "firstParty": [],
    "reference": [],
    "rules": [
      "frontend-no-network",
      "shims-devdeps",
      "header-geometry",
      "split-instances",
      "crash-boundary",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your control renders at the left end of the thread header action row and stays inside the 48px chrome row",
      "With a split layout open, each visible pane renders its own instance and neither shares per-thread state",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "thread-header"
    ],
    "guideAnchor": "slot-experimental_threadHeaderAction",
    "mockupHash": "shell,surface=thread-header"
  },
  "experimental_browserToolbarAction": {
    "kind": "slot",
    "id": "experimental_browserToolbarAction",
    "title": "app.slots.experimental_browserToolbarAction",
    "summary": "Adds a plugin control to the toolbar of each open Browser tab. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.experimental_browserToolbarAction({ id, title, component })",
    "propsType": "ExperimentalPluginBrowserToolbarActionProps",
    "slotKind": "additive",
    "stability": "experimental",
    "symbols": [
      "ExperimentalPluginBrowserToolbarActionRegistration",
      "ExperimentalPluginBrowserToolbarActionProps",
      "ExperimentalPluginBrowserPage",
      "ExperimentalPluginBrowserPageEvaluateOptions",
      "ExperimentalPluginBrowserPageWorld"
    ],
    "firstParty": [],
    "reference": [
      {
        "plugin": "agent-annotations",
        "file": "plugins/agent-annotations/app.tsx",
        "note": "Adds a control beside the address bar and drives the page through experimental_page.evaluate / onMessage."
      }
    ],
    "rules": [
      "frontend-no-network",
      "browser-page-null",
      "shims-devdeps",
      "crash-boundary",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "The control appears beside the address bar of every built-in Browser tab",
      "Outside the desktop app experimental_page is null and your component still renders without throwing",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "browser-toolbar"
    ],
    "guideAnchor": "slot-experimental_browserToolbarAction",
    "mockupHash": "shell,surface=browser-toolbar"
  },
  "fileOpener": {
    "kind": "slot",
    "id": "fileOpener",
    "title": "app.slots.fileOpener",
    "summary": "Registers a viewer for the file types you name, so bb opens those files there instead of its built-in preview. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.fileOpener({ id, title, extensions, component })",
    "propsType": "PluginFileOpenerProps",
    "slotKind": "replacement",
    "stability": "stable",
    "symbols": [
      "PluginFileOpenerRegistration",
      "PluginFileOpenerProps",
      "PluginFileOpenerSource"
    ],
    "firstParty": [
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "File Editor",
        "id": "monaco-editor"
      }
    ],
    "reference": [
      {
        "plugin": "pdf-preview",
        "file": "plugins/pdf-preview/app.tsx",
        "note": "Minimal file viewer: one fileOpener registration and nothing else."
      },
      {
        "plugin": "monaco-editor",
        "file": "plugins/monaco-editor/app.tsx",
        "note": "Full editor, and the reference consumer of experimental_lineRange revealed by object identity."
      }
    ],
    "rules": [
      "replacement-original",
      "file-source-kinds",
      "frontend-no-network",
      "crash-boundary"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Opening a file with one of your extensions renders your viewer in the file tab",
      "Settings → File openers lets the user pin another opener and yours steps aside",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "file-opener"
    ],
    "guideAnchor": "slot-fileOpener",
    "mockupHash": "shell,surface=file-opener"
  },
  "experimental_sourceCodeRenderer": {
    "kind": "slot",
    "id": "experimental_sourceCodeRenderer",
    "title": "app.slots.experimental_sourceCodeRenderer",
    "summary": "Replaces bb's source-code or diff renderer everywhere that kind of content appears. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.experimental_sourceCodeRenderer({ id, title, description, component })",
    "propsType": "PluginSourceCodeRendererProps",
    "slotKind": "exclusive",
    "stability": "experimental",
    "symbols": [
      "PluginSourceCodeRendererRegistration",
      "PluginSourceCodeRendererProps",
      "PluginDiffRendererRegistration",
      "PluginDiffRendererProps"
    ],
    "firstParty": [],
    "reference": [],
    "rules": [
      "exclusive-slot",
      "replacement-original",
      "diff-patch-complete",
      "frontend-no-network",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Every place bb draws supplied source text — including plugins that call `experimental_SourceCode` — renders through your component",
      "Delegating to `Original` for unsupported paths produces bb's own rendering",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "code-renderers"
    ],
    "guideAnchor": "slot-experimental_sourceCodeRenderer",
    "mockupHash": "shell,surface=code-renderers"
  },
  "experimental_diffRenderer": {
    "kind": "slot",
    "id": "experimental_diffRenderer",
    "title": "app.slots.experimental_diffRenderer",
    "summary": "Replaces bb's source-code or diff renderer everywhere that kind of content appears. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.experimental_diffRenderer({ id, title, description, component })",
    "propsType": "PluginDiffRendererProps",
    "slotKind": "exclusive",
    "stability": "experimental",
    "symbols": [
      "PluginSourceCodeRendererRegistration",
      "PluginSourceCodeRendererProps",
      "PluginDiffRendererRegistration",
      "PluginDiffRendererProps"
    ],
    "firstParty": [],
    "reference": [],
    "rules": [
      "exclusive-slot",
      "replacement-original",
      "diff-patch-complete",
      "frontend-no-network",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Timeline file diffs, the environment diff panel and every `experimental_Diff` caller render through your component",
      "You verify that `patch` and `experimental_fullFileContents` agree before treating the full contents as complete",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "code-renderers"
    ],
    "guideAnchor": "slot-experimental_diffRenderer",
    "mockupHash": "shell,surface=code-renderers"
  },
  "messageDirective": {
    "kind": "slot",
    "id": "messageDirective",
    "title": "app.slots.messageDirective",
    "summary": "Renders your component inside an agent's reply, in place of a marker the agent writes into its message. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.messageDirective({ id, component })",
    "propsType": "PluginMessageDirectiveProps",
    "slotKind": "additive",
    "stability": "stable",
    "symbols": [
      "PluginMessageDirectiveRegistration"
    ],
    "firstParty": [
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "Inline visualizations",
        "id": "inline-vis"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "inline-vis",
        "file": "plugins/inline-vis/app.tsx",
        "note": "Smallest directive plugin: renders workspace or thread-storage HTML and Markdown inline in assistant messages."
      },
      {
        "plugin": "workflows",
        "file": "plugins/workflows/src/app.tsx",
        "note": "Emits a ::workflow-preview directive from a tool result and renders it."
      }
    ],
    "rules": [
      "directive-attrs-untrusted",
      "frontend-no-network",
      "css-scope",
      "crash-boundary"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "An assistant message containing ::<your-id>{…} renders your component instead of the literal text",
      "Malformed attributes fall back to the original source text rather than throwing",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "message-directives"
    ],
    "guideAnchor": "slot-messageDirective",
    "mockupHash": "shell,surface=message-directives"
  },
  "messageAction": {
    "kind": "slot",
    "id": "messageAction",
    "title": "app.slots.messageAction",
    "summary": "Adds an action to individual messages in a thread. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.messageAction({ id, title, icon, run })",
    "propsType": "PluginMessageActionContext",
    "slotKind": "additive",
    "stability": "stable",
    "symbols": [
      "PluginMessageActionRegistration"
    ],
    "firstParty": [
      {
        "name": "Side chat",
        "id": "side-chat"
      }
    ],
    "reference": [
      {
        "plugin": "side-chat",
        "file": "plugins/side-chat/app.tsx",
        "note": "Opens a side-chat panel from the message action, passing message.sourceSeqEnd as the fork anchor."
      }
    ],
    "rules": [
      "frontend-no-network",
      "message-reference",
      "icons-hugeicons",
      "crash-boundary"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your entry appears last in the hover action row under user and assistant messages",
      "Invoking it from the assistant text-selection menu passes selectedText",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "message-actions"
    ],
    "guideAnchor": "slot-messageAction",
    "mockupHash": "shell,surface=message-actions"
  },
  "commands": {
    "kind": "slot",
    "id": "commands",
    "title": "app.commands.register",
    "summary": "Registers a command with app.commands.register and adds a row under Plugins in bb's quick command palette. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.commands.register({ id, title, defaultShortcut?, isAvailable?, run })",
    "propsType": "PluginCommandContext",
    "slotKind": "additive",
    "stability": "stable",
    "symbols": [
      "PluginAppBuilder.commands",
      "PluginAppCommands",
      "PluginCommandRegistration",
      "PluginCommandContext",
      "PluginCommandShortcut"
    ],
    "firstParty": [],
    "reference": [
      {
        "plugin": "monaco-editor",
        "file": "plugins/monaco-editor/app.tsx",
        "note": "Registers one command per editor action with isAvailable gating."
      }
    ],
    "rules": [
      "command-shortcuts",
      "command-isavailable",
      "frontend-no-network",
      "engines-gate"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your command appears in the quick palette (Mod+Shift+P) under the Plugins bucket with your plugin's name",
      "A declared defaultShortcut fires, and the user can rebind it under plugin:<plugin-id>/<command-id>",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "command-palette-actions"
    ],
    "guideAnchor": "slot-commands",
    "mockupHash": "palette,surface=command-palette-actions"
  },
  "experimental_providerIcon": {
    "kind": "slot",
    "id": "experimental_providerIcon",
    "title": "app.slots.experimental_providerIcon",
    "summary": "Adds an agent to bb's model picker and runs the threads started with it. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.experimental_providerIcon({ providerKind, providerId, icon })",
    "propsType": "{ className?: string }",
    "slotKind": "additive",
    "stability": "experimental",
    "symbols": [
      "PluginProviderDeclaration",
      "PluginProviderIconRegistration",
      "experimental_useProviders",
      "PluginProvidersState",
      "ExperimentalPluginProviderEnvContext",
      "ExperimentalPluginProviderEnvEntry",
      "ExperimentalPluginProviderEnvHealthContext",
      "ExperimentalPluginProviderEnvHealth"
    ],
    "firstParty": [
      {
        "name": "ACP providers",
        "id": "provider-acp"
      },
      {
        "name": "Claude Code provider",
        "id": "provider-claude-code"
      },
      {
        "name": "Codex provider",
        "id": "provider-codex"
      },
      {
        "name": "Pi provider",
        "id": "provider-pi"
      }
    ],
    "reference": [
      {
        "plugin": "provider-acp",
        "file": "plugins/provider-acp/src/declaration.ts",
        "note": "Builds one declaration per ACP agent and ships the bridge from the same host artifact."
      },
      {
        "plugin": "echo-provider",
        "file": "examples/plugins/echo-provider/src/provider-bridge.ts",
        "note": "Smallest complete bridge: handshake, a session start and the minimal turn loop."
      }
    ],
    "rules": [
      "icons-hugeicons",
      "frontend-no-network",
      "crash-boundary",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your React mark replaces the masked logo everywhere that provider is drawn",
      "The component renders inline markup only and inherits color from `className`",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "provider-picker"
    ],
    "guideAnchor": "slot-experimental_providerIcon",
    "mockupHash": "composer,surface=provider-picker"
  },
  "experimental_timelineRenderer": {
    "kind": "slot",
    "id": "experimental_timelineRenderer",
    "title": "app.slots.experimental_timelineRenderer",
    "summary": "Renders the expanded content of plugin-owned timeline entries while bb keeps each entry's header and controls. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.experimental_timelineRenderer({ kind, component })",
    "propsType": "PluginTimelineRendererProps",
    "slotKind": "replacement",
    "stability": "experimental",
    "symbols": [
      "PluginTimelineRendererRegistration",
      "PluginTimelineRendererProps"
    ],
    "firstParty": [],
    "reference": [],
    "rules": [
      "timeline-kind-ownership",
      "replacement-original",
      "frontend-no-network",
      "crash-boundary",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Rows whose kind is \"<plugin-id>/<name>\" (or \"tool\" for your own provider) render your body while bb keeps the row header",
      "Removing the renderer falls back to the declarative base rendering instead of a blank row",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "timeline-renderers"
    ],
    "guideAnchor": "slot-experimental_timelineRenderer",
    "mockupHash": "shell,surface=timeline-renderers"
  },
  "experimental_environmentProviderInputs": {
    "kind": "slot",
    "id": "experimental_environmentProviderInputs",
    "title": "app.slots.experimental_environmentProviderInputs",
    "summary": "Offers plugin-provisioned places a thread can run, picked like any environment. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.experimental_environmentProviderInputs({ environmentProviderId, component })",
    "propsType": "PluginEnvironmentProviderInputsProps",
    "slotKind": "additive",
    "stability": "experimental",
    "symbols": [
      "PluginEnvironments",
      "PluginEnvironmentProviderDeclaration",
      "PluginEnvironmentProviderRequirements",
      "PluginEnvironmentValidateDecision",
      "PluginEnvironmentProviderInputsRegistration",
      "PluginEnvironmentProviderInputsProps",
      "PluginEnvironmentProviderInputsChange",
      "experimental_BranchPicker"
    ],
    "firstParty": [
      {
        "name": "Project checkout",
        "id": "environment-project-checkout"
      },
      {
        "name": "Personal workspace",
        "id": "environment-personal-workspace"
      },
      {
        "name": "Worktree",
        "id": "environment-git-worktree"
      }
    ],
    "reference": [
      {
        "plugin": "environment-personal-workspace",
        "file": "plugins/environment-personal-workspace/server.ts",
        "note": "Tiniest provider: requires projectless, one host call to create and one to remove."
      },
      {
        "plugin": "environment-git-worktree",
        "file": "plugins/environment-git-worktree/server.ts",
        "note": "Per-attempt path keys, existing-path adoption and experimental_claimPath."
      }
    ],
    "rules": [
      "frontend-no-network",
      "env-inputs-public",
      "crash-boundary",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Selecting your environment provider in New Thread renders your control beside it",
      "`onChange({ status: \"blocked\", reason })` prevents submission until the inputs are valid",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "environment-providers"
    ],
    "guideAnchor": "slot-experimental_environmentProviderInputs",
    "mockupHash": "headless,surface=environment-providers"
  },
  "experimental_machineProviderInputs": {
    "kind": "slot",
    "id": "experimental_machineProviderInputs",
    "title": "app.slots.experimental_machineProviderInputs",
    "summary": "Adds plugin-provisioned machines that compose with environment providers. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.slots.experimental_machineProviderInputs({ machineProviderId, component })",
    "propsType": "PluginMachineProviderInputsProps",
    "slotKind": "additive",
    "stability": "experimental",
    "symbols": [
      "PluginMachines",
      "PluginBbSdk.hosts.experimental_create",
      "PluginBbSdk.hosts.experimental_getEnrollmentCommand",
      "PluginBbSdk.hosts.experimental_listProviders",
      "PluginBbSdk.hosts.experimental_suspend",
      "PluginBbSdk.hosts.experimental_reconcile",
      "PluginBbSdk.hosts.experimental_resume",
      "PluginBbSdk.hosts.experimental_retryCleanup"
    ],
    "firstParty": [
      {
        "name": "Modal Sandbox [Experimental]",
        "id": "environment-modal-sandbox"
      }
    ],
    "reference": [
      {
        "plugin": "environment-modal-sandbox",
        "file": "plugins/environment-modal-sandbox/providers/register.ts",
        "note": "The only first-party machine provider: create → checkpoint → bootstrap, plus suspend / resume / reconcileCleanup."
      }
    ],
    "rules": [
      "frontend-no-network",
      "machine-resource-public",
      "crash-boundary",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Creating a machine with your provider renders your compact inputs control",
      "Only non-secret configuration and credential references are stored — machine inputs are readable by every plugin",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "machine-providers"
    ],
    "guideAnchor": "slot-experimental_machineProviderInputs",
    "mockupHash": "headless,surface=machine-providers"
  },
  "composer-customize": {
    "kind": "slot",
    "id": "composer-customize",
    "title": "app.composer.customize",
    "summary": "Adds rows to the menu that opens from the + button beside the prompt box. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.composer.customize({ id, scopes?, actions?, banners?, plusMenu?, richText? })",
    "propsType": "ComposerCustomization",
    "slotKind": "additive",
    "stability": "stable",
    "symbols": [
      "ComposerPlusMenuItem",
      "ComposerPlusMenuItem.experimental_sendMenu",
      "ExperimentalComposerSubmitOptions"
    ],
    "firstParty": [
      {
        "name": "Drafts",
        "id": "drafts"
      },
      {
        "name": "Send later",
        "id": "scheduled-send"
      }
    ],
    "reference": [
      {
        "plugin": "drafts",
        "file": "plugins/drafts/app.tsx",
        "note": "Whole plugin: a plus-menu row that submits with experimental_data and a dispatch hook that keeps it queued."
      },
      {
        "plugin": "scheduled-send",
        "file": "plugins/scheduled-send/app.tsx",
        "note": "Adds a send-menu row that schedules the draft with sendAt."
      }
    ],
    "rules": [
      "composer-scopes",
      "composer-submit-pipeline",
      "composer-inline-cap",
      "frontend-no-network",
      "crash-boundary"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your actions, banners, plus-menu rows and rich-text effects appear only in the scopes you declared",
      "Submitting through `composer.experimental_submit` carries attachments, mentions and picker selections",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "composer-banners",
      "composer-plus-menu",
      "composer-actions",
      "composer-rich-text",
      "composer-state"
    ],
    "guideAnchor": "slot-composer-customize",
    "mockupHash": "composer,surface=composer-plus-menu"
  },
  "contentScripts": {
    "kind": "slot",
    "id": "contentScripts",
    "title": "app.contentScripts.register",
    "summary": "Runs your code inside the bb window itself, without rendering a UI of its own. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.contentScripts.register({ id, mount(context) })",
    "propsType": "PluginContentScriptContext",
    "slotKind": "additive",
    "stability": "stable",
    "symbols": [
      "PluginContentScriptRegistration",
      "PluginContentScriptContext"
    ],
    "firstParty": [],
    "reference": [
      {
        "plugin": "content-script-example",
        "file": "examples/plugins/content-script/app.ts",
        "note": "Cleanup-complete reference: adds a focus ring, releases it on the abort signal and returns a disposer."
      }
    ],
    "rules": [
      "content-script-trust",
      "mount-timeout",
      "frontend-no-network",
      "dispose-lifo"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "The script mounts once per window, tab and remote client, and its disposer plus the abort signal both release everything",
      "A reload of the plugin disposes the previous generation before the new one mounts — no duplicated listeners",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "content-scripts",
      "thread-row-status"
    ],
    "guideAnchor": "slot-contentScripts",
    "mockupHash": "shell,surface=content-scripts"
  },
  "experimental_icons": {
    "kind": "slot",
    "id": "experimental_icons",
    "title": "app.experimental_icons.register",
    "summary": "Renders bb's chat, prompt box, pickers, file content, links, and shared app icons inside plugin pages. With this, a plugin can:",
    "entry": "app",
    "manifestEntry": "bb.app",
    "registration": "app.experimental_icons.register({ name, component })",
    "propsType": "{ className?: string }",
    "slotKind": "additive",
    "stability": "experimental",
    "symbols": [
      "experimental_Icon",
      "experimental_ProviderIcon",
      "ExperimentalProviderIconProps",
      "ExperimentalIconProps",
      "ExperimentalIconRegistration",
      "ExperimentalAppIcons",
      "PluginAppBuilder.experimental_icons",
      "experimental_NewThreadComposer"
    ],
    "firstParty": [
      {
        "name": "Side chat",
        "id": "side-chat"
      },
      {
        "name": "Provider usage",
        "id": "provider-usage"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      }
    ],
    "reference": [
      {
        "plugin": "side-chat",
        "file": "plugins/side-chat/app.tsx",
        "note": "Embeds ThreadChat in compact mode with its own messageActions."
      },
      {
        "plugin": "thread-chat-demo",
        "file": "examples/plugins/thread-chat-demo/app.tsx",
        "note": "Demonstrates ThreadChat plus targeted fixed tabs."
      }
    ],
    "rules": [
      "icons-hugeicons",
      "frontend-no-network",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your name resolves anywhere bb accepts an icon name, shadowing a built-in of the same name",
      "A duplicate name inside your own plugin rejects setup instead of silently winning",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "host-components"
    ],
    "guideAnchor": "slot-experimental_icons",
    "mockupHash": "headless,surface=host-components"
  }
});

/** Keyed by the `BbPluginApi` member name. */
export const NAMESPACE_ANNOTATIONS: Readonly<Record<string, Annotation>> = Object.freeze({
  "pluginId": {
    "kind": "namespace",
    "id": "pluginId",
    "title": "bb.pluginId",
    "summary": "",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.pluginId",
    "propsType": null,
    "slotKind": null,
    "stability": "stable",
    "symbols": [],
    "firstParty": [],
    "reference": [],
    "rules": [
      "backend-full-trust"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Self-filtering uses `bb.pluginId` instead of a hardcoded string, so renaming the package cannot silently break it",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "api-pluginId",
    "mockupHash": null
  },
  "log": {
    "kind": "namespace",
    "id": "log",
    "title": "bb.log",
    "summary": "",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.log.{debug,info,warn,error}(message)",
    "propsType": null,
    "slotKind": null,
    "stability": "stable",
    "symbols": [],
    "firstParty": [],
    "reference": [],
    "rules": [
      "backend-full-trust"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "`bb plugin logs <id> -f` shows your lines, prefixed `[plugin:<id>]`",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "api-log",
    "mockupHash": null
  },
  "settings": {
    "kind": "namespace",
    "id": "settings",
    "title": "bb.settings",
    "summary": "Declares the settings your plugin needs as plain data; bb renders the form for them on the plugin's settings page and stores the values. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.settings.define(descriptors) → { get, experimental_set, onChange }",
    "propsType": null,
    "slotKind": null,
    "stability": "mixed",
    "symbols": [
      "PluginSettings",
      "PluginSettingsHandle",
      "PluginSettingDescriptor",
      "PluginSettingsState"
    ],
    "firstParty": [
      {
        "name": "Custom instructions",
        "id": "custom-instructions"
      },
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Provider retry",
        "id": "provider-retry"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "custom-instructions",
        "file": "plugins/custom-instructions/server.ts",
        "note": "Defines one setting, migrates a legacy kv value into it with experimental_set and tracks changes with onChange."
      },
      {
        "plugin": "github",
        "file": "plugins/github/server.ts",
        "note": "Validates a string setting with a zod superRefine through experimental_schema."
      }
    ],
    "rules": [
      "settings-load-once",
      "settings-secrets",
      "backend-full-trust",
      "dispose-lifo"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "bb renders your fields on the plugin page and `bb plugin config <id> set <key> <value>` writes them",
      "A `secret: true` value never reaches the frontend",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "declarative-settings"
    ],
    "guideAnchor": "api-settings",
    "mockupHash": "settings,surface=declarative-settings"
  },
  "storage": {
    "kind": "namespace",
    "id": "storage",
    "title": "bb.storage",
    "summary": "Stores the plugin's data on the bb server. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.storage.kv.* · bb.storage.database() · bb.storage.migrate(db, statements)",
    "propsType": null,
    "slotKind": null,
    "stability": "stable",
    "symbols": [
      "PluginStorage"
    ],
    "firstParty": [
      {
        "name": "Automations",
        "id": "automations"
      },
      {
        "name": "Custom instructions",
        "id": "custom-instructions"
      },
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Keep Awake",
        "id": "keep-awake"
      },
      {
        "name": "Memory",
        "id": "memory"
      },
      {
        "name": "Remote access",
        "id": "connect"
      },
      {
        "name": "Side chat",
        "id": "side-chat"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "memory",
        "file": "plugins/memory/server.ts",
        "note": "Owns a SQLite schema through migrate() and queries it directly."
      },
      {
        "plugin": "side-chat",
        "file": "plugins/side-chat/server.ts",
        "note": "Uses namespaced kv with a prefix sweep instead of a database."
      }
    ],
    "rules": [
      "kv-value-cap",
      "migrations-append-only",
      "storage-not-a-boundary",
      "dispose-lifo"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Data survives reload and restart",
      "A second migration appends a statement instead of editing an applied one",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "storage"
    ],
    "guideAnchor": "api-storage",
    "mockupHash": "headless,surface=storage"
  },
  "http": {
    "kind": "namespace",
    "id": "http",
    "title": "bb.http",
    "summary": "Connects the plugin's own UI, its server code, and outside services. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.http.route(method, path, handler, { auth }) · bb.http.experimental_websocket(path, handler, { auth })",
    "propsType": null,
    "slotKind": null,
    "stability": "mixed",
    "symbols": [
      "PluginRpc",
      "PluginRpcMethodContract",
      "PluginsArea.experimental_discoverRpc",
      "PluginHttp",
      "PluginRealtime",
      "useRpc"
    ],
    "firstParty": [
      {
        "name": "Automations",
        "id": "automations"
      },
      {
        "name": "Custom instructions",
        "id": "custom-instructions"
      },
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Inline visualizations",
        "id": "inline-vis"
      },
      {
        "name": "Keep Awake",
        "id": "keep-awake"
      },
      {
        "name": "Memory",
        "id": "memory"
      },
      {
        "name": "Provider retry",
        "id": "provider-retry"
      },
      {
        "name": "Remote access",
        "id": "connect"
      },
      {
        "name": "Side chat",
        "id": "side-chat"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "tasks",
        "file": "plugins/tasks/attachments/index.ts",
        "note": "Token-authenticated upload route plus realtime publishes after every write."
      },
      {
        "plugin": "slack-bot",
        "file": "examples/plugins/slack-bot/server.ts",
        "note": "auth: \"none\" webhook that verifies the Slack signature inside the handler."
      }
    ],
    "rules": [
      "http-exact-match",
      "backend-full-trust",
      "secrets-agent-reach"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your route answers at `/api/v1/plugins/<id>/http<path>` with the auth mode you declared",
      "A `token` route rejects a wrong or missing `x-bb-plugin-token`",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "wire"
    ],
    "guideAnchor": "api-http",
    "mockupHash": "headless,surface=wire"
  },
  "rpc": {
    "kind": "namespace",
    "id": "rpc",
    "title": "bb.rpc",
    "summary": "Connects the plugin's own UI, its server code, and outside services. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.rpc.register(contract, handlers, { experimental_discoverable?, experimental_description? })",
    "propsType": null,
    "slotKind": null,
    "stability": "mixed",
    "symbols": [
      "PluginRpc",
      "PluginRpcMethodContract",
      "PluginsArea.experimental_discoverRpc",
      "PluginHttp",
      "PluginRealtime",
      "useRpc"
    ],
    "firstParty": [
      {
        "name": "Automations",
        "id": "automations"
      },
      {
        "name": "Custom instructions",
        "id": "custom-instructions"
      },
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Inline visualizations",
        "id": "inline-vis"
      },
      {
        "name": "Keep Awake",
        "id": "keep-awake"
      },
      {
        "name": "Memory",
        "id": "memory"
      },
      {
        "name": "Provider retry",
        "id": "provider-retry"
      },
      {
        "name": "Remote access",
        "id": "connect"
      },
      {
        "name": "Side chat",
        "id": "side-chat"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "tasks",
        "file": "plugins/tasks/attachments/index.ts",
        "note": "Token-authenticated upload route plus realtime publishes after every write."
      },
      {
        "plugin": "slack-bot",
        "file": "examples/plugins/slack-bot/server.ts",
        "note": "auth: \"none\" webhook that verifies the Slack signature inside the handler."
      }
    ],
    "rules": [
      "frontend-no-network",
      "rpc-strict-json",
      "backend-full-trust"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "`useRpc<typeof rpcContract>().call(...)` from `app.tsx` reaches your handler with validated input",
      "Invalid input returns `{ ok: false, error: { code: \"invalid_input\", issues } }` instead of throwing",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "wire"
    ],
    "guideAnchor": "api-rpc",
    "mockupHash": "headless,surface=wire"
  },
  "realtime": {
    "kind": "namespace",
    "id": "realtime",
    "title": "bb.realtime",
    "summary": "Connects the plugin's own UI, its server code, and outside services. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.realtime.publish(channel, payload)",
    "propsType": null,
    "slotKind": null,
    "stability": "stable",
    "symbols": [
      "PluginRpc",
      "PluginRpcMethodContract",
      "PluginsArea.experimental_discoverRpc",
      "PluginHttp",
      "PluginRealtime",
      "useRpc"
    ],
    "firstParty": [
      {
        "name": "Automations",
        "id": "automations"
      },
      {
        "name": "Custom instructions",
        "id": "custom-instructions"
      },
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Inline visualizations",
        "id": "inline-vis"
      },
      {
        "name": "Keep Awake",
        "id": "keep-awake"
      },
      {
        "name": "Memory",
        "id": "memory"
      },
      {
        "name": "Provider retry",
        "id": "provider-retry"
      },
      {
        "name": "Remote access",
        "id": "connect"
      },
      {
        "name": "Side chat",
        "id": "side-chat"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "tasks",
        "file": "plugins/tasks/attachments/index.ts",
        "note": "Token-authenticated upload route plus realtime publishes after every write."
      },
      {
        "plugin": "slack-bot",
        "file": "examples/plugins/slack-bot/server.ts",
        "note": "auth: \"none\" webhook that verifies the Slack signature inside the handler."
      }
    ],
    "rules": [
      "realtime-broadcast",
      "frontend-no-network"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Every open window refetches after a write, without polling",
      "Nothing secret rides in the payload — the signal reaches every connected client",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "wire"
    ],
    "guideAnchor": "api-realtime",
    "mockupHash": "headless,surface=wire"
  },
  "background": {
    "kind": "namespace",
    "id": "background",
    "title": "bb.background",
    "summary": "Runs code on the bb server when no window is open. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.background.service(name, { start(signal) }) · bb.background.schedule(name, cron, fn)",
    "propsType": null,
    "slotKind": null,
    "stability": "stable",
    "symbols": [
      "PluginBackground"
    ],
    "firstParty": [
      {
        "name": "Automations",
        "id": "automations"
      },
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Keep Awake",
        "id": "keep-awake"
      },
      {
        "name": "Provider retry",
        "id": "provider-retry"
      },
      {
        "name": "Remote access",
        "id": "connect"
      },
      {
        "name": "Side chat",
        "id": "side-chat"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "automations",
        "file": "plugins/automations/src/server.ts",
        "note": "Startup reconciliation then a loop that sleeps on the abort signal."
      },
      {
        "plugin": "environment-modal-sandbox",
        "file": "plugins/environment-modal-sandbox/server.ts",
        "note": "A one-minute schedule that suspends idle machines."
      }
    ],
    "rules": [
      "service-abort-sleep",
      "schedule-only-while-loaded",
      "needs-configuration-error",
      "dispose-lifo"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "`bb plugin list` shows the service running and the schedule's last status",
      "Reload stops the service inside the 5 s window",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "background"
    ],
    "guideAnchor": "api-background",
    "mockupHash": "headless,surface=background"
  },
  "cli": {
    "kind": "namespace",
    "id": "cli",
    "title": "bb.cli",
    "summary": "Registers a top-level `bb <name>` command, available in the terminal and to agents. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.cli.register(defineCli({ name, summary, commands }))",
    "propsType": null,
    "slotKind": null,
    "stability": "stable",
    "symbols": [
      "PluginCli",
      "PluginCliResult",
      "defineCli",
      "cliCommand",
      "PluginCliError",
      "PluginCliSpec"
    ],
    "firstParty": [
      {
        "name": "Automations",
        "id": "automations"
      },
      {
        "name": "Custom instructions",
        "id": "custom-instructions"
      },
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Keep Awake",
        "id": "keep-awake"
      },
      {
        "name": "Memory",
        "id": "memory"
      },
      {
        "name": "Provider retry",
        "id": "provider-retry"
      },
      {
        "name": "Remote access",
        "id": "connect"
      },
      {
        "name": "Secrets",
        "id": "secrets"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "concurrency-limit",
        "file": "plugins/concurrency-limit/server.ts",
        "note": "defineCli + cliCommand with typed options and PluginCliError with a hint."
      },
      {
        "plugin": "tasks",
        "file": "plugins/tasks/cli/index.ts",
        "note": "Grouped command paths such as \"project create\"."
      }
    ],
    "rules": [
      "cli-runs-on-server",
      "cli-output-cap",
      "cli-argv"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "`bb <name> --help` renders from metadata without executing plugin code",
      "`bb <name> <command> --json` prints a machine-readable envelope",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "cli"
    ],
    "guideAnchor": "api-cli",
    "mockupHash": "headless,surface=cli"
  },
  "agents": {
    "kind": "namespace",
    "id": "agents",
    "title": "bb.agents",
    "summary": "Adds tools, skills, and instructions to the agent sessions bb runs. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.agents.registerTool(...) · bb.agents.configure(...) · bb.agents.contributeInstructions(...)",
    "propsType": null,
    "slotKind": null,
    "stability": "stable",
    "symbols": [
      "PluginAgents",
      "PluginAgentToolContext",
      "PluginRowPresentation",
      "PluginRowLabels"
    ],
    "firstParty": [
      {
        "name": "Ask User Question",
        "id": "ask-user-question"
      },
      {
        "name": "Custom instructions",
        "id": "custom-instructions"
      },
      {
        "name": "Memory",
        "id": "memory"
      },
      {
        "name": "Remote access",
        "id": "connect"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "workflows",
        "file": "plugins/workflows/src/server.ts",
        "note": "Registers two tools with presentation labels and narrows the parameter schema per resolution in configure()."
      },
      {
        "plugin": "ask-user-question",
        "file": "plugins/ask-user-question/src/server.ts",
        "note": "Drops its tool when the provider answers questions natively."
      }
    ],
    "rules": [
      "tools-next-session",
      "tool-name-global",
      "instructions-cap",
      "tool-output-bounded",
      "secrets-agent-reach"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "A fresh thread lists your tool and executes it with validated parameters",
      "Instructions stay under 4096 characters and land in the documented order",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "agent-tools"
    ],
    "guideAnchor": "api-agents",
    "mockupHash": "headless,surface=agent-tools"
  },
  "providers": {
    "kind": "namespace",
    "id": "providers",
    "title": "bb.providers",
    "summary": "Adds an agent to bb's model picker and runs the threads started with it. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.providers.register(declaration) → { dispose } · experimental_contributeEnv(...) · experimental_contributeEnvHealth(...)",
    "propsType": null,
    "slotKind": null,
    "stability": "mixed",
    "symbols": [
      "contextSnapshotSchema",
      "ContextSnapshot",
      "ContextCategory",
      "ContextEntry",
      "PluginProviderDeclaration",
      "PluginProviderIconRegistration"
    ],
    "firstParty": [
      {
        "name": "ACP providers",
        "id": "provider-acp"
      },
      {
        "name": "Claude Code provider",
        "id": "provider-claude-code"
      },
      {
        "name": "Codex provider",
        "id": "provider-codex"
      },
      {
        "name": "Pi provider",
        "id": "provider-pi"
      }
    ],
    "reference": [
      {
        "plugin": "provider-acp",
        "file": "plugins/provider-acp/src/declaration.ts",
        "note": "Builds one declaration per ACP agent and ships the bridge from the same host artifact."
      },
      {
        "plugin": "echo-provider",
        "file": "examples/plugins/echo-provider/src/provider-bridge.ts",
        "note": "Smallest complete bridge: handshake, a session start and the minimal turn loop."
      }
    ],
    "rules": [
      "provider-needs-host",
      "provider-id-immutable",
      "provider-derive-sync",
      "bridge-grammar-v3"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your provider appears in the composer picker and a thread runs on it end to end",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "provider-picker"
    ],
    "guideAnchor": "api-providers",
    "mockupHash": "composer,surface=provider-picker"
  },
  "ui": {
    "kind": "namespace",
    "id": "ui",
    "title": "bb.ui",
    "summary": "Asks the person a question in the thread composer and delivers their answer to the agent, even if the original turn has ended. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.ui.requestInput(request, { signal }) · bb.ui.registerMentionProvider(provider)",
    "propsType": null,
    "slotKind": null,
    "stability": "stable",
    "symbols": [
      "PluginUi",
      "PluginInteractionRequest",
      "PluginInteractionDescription",
      "PluginRowPresentation",
      "PluginPendingInteractionRegistration"
    ],
    "firstParty": [
      {
        "name": "Ask User Question",
        "id": "ask-user-question"
      },
      {
        "name": "Secrets",
        "id": "secrets"
      }
    ],
    "reference": [
      {
        "plugin": "ask-user-question",
        "file": "plugins/ask-user-question/src/server.ts",
        "note": "Requests a multiple-choice answer from the backend and renders it with the paired slot."
      },
      {
        "plugin": "secrets",
        "file": "plugins/secrets/src/server.ts",
        "note": "Asks for credentials from a CLI command and reconciles them into a dotenv file."
      }
    ],
    "rules": [
      "interaction-detached",
      "interaction-limits",
      "mention-search-timebox",
      "mention-resolve-blocks",
      "secrets-agent-reach"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "A pending interaction replaces the composer and resolves your promise on submit or cancel",
      "Your mention section appears under its trigger and `resolve()` attaches context at send time",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "pending-interaction"
    ],
    "guideAnchor": "api-ui",
    "mockupHash": "shell,surface=pending-interaction"
  },
  "events": {
    "kind": "namespace",
    "id": "events",
    "title": "bb.events",
    "summary": "Runs server code when a thread changes state. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.events.on(event, handler) — 14 events",
    "propsType": null,
    "slotKind": null,
    "stability": "mixed",
    "symbols": [
      "PluginEvents",
      "PluginThreadEventPayloads",
      "PluginTurnFailedEvent"
    ],
    "firstParty": [
      {
        "name": "Automations",
        "id": "automations"
      },
      {
        "name": "Provider retry",
        "id": "provider-retry"
      },
      {
        "name": "Push notifications",
        "id": "push-notifications"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "provider-retry",
        "file": "plugins/provider-retry/server.ts",
        "note": "Retries by reference on turn.failed with bb.sdk.threads.retry."
      },
      {
        "plugin": "tasks",
        "file": "plugins/tasks/lifecycle/index.ts",
        "note": "Tracks thread lifecycle transitions to update its own rows."
      }
    ],
    "rules": [
      "events-are-announcements",
      "events-see-everything",
      "message-cancelled-only-signal"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your handler reacts to real transitions and never tries to block them",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "thread-events"
    ],
    "guideAnchor": "api-events",
    "mockupHash": "headless,surface=thread-events"
  },
  "experimental_hooks": {
    "kind": "namespace",
    "id": "experimental_hooks",
    "title": "bb.experimental_hooks",
    "summary": "Answers the admission checkpoint for ordinary sends, eligible queued messages, and retries before they reach a provider. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.experimental_hooks.on(\"message.dispatch\", handler) · recheck(hook)",
    "propsType": null,
    "slotKind": null,
    "stability": "experimental",
    "symbols": [
      "PluginHooks",
      "PluginHookSignatures",
      "MessageDispatchHookContext",
      "PluginDispatchEnvironmentIntent",
      "MessageDispatchHookDecision"
    ],
    "firstParty": [
      {
        "name": "Concurrency limit",
        "id": "concurrency-limit"
      },
      {
        "name": "Drafts",
        "id": "drafts"
      }
    ],
    "reference": [
      {
        "plugin": "drafts",
        "file": "plugins/drafts/server.ts",
        "note": "Shortest complete hook: waits forever on its own submissions until the user sends."
      },
      {
        "plugin": "concurrency-limit",
        "file": "plugins/concurrency-limit/server.ts",
        "note": "Counts running threads, waits with a reason and rechecks when capacity frees up."
      }
    ],
    "rules": [
      "hook-fail-closed",
      "hook-idempotent",
      "hook-no-amendment",
      "send-now-bypass",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "A held message shows your reason on the queued card and clears when you `recheck`",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "dispatch-hook"
    ],
    "guideAnchor": "api-experimental_hooks",
    "mockupHash": "headless,surface=dispatch-hook"
  },
  "experimental_environments": {
    "kind": "namespace",
    "id": "experimental_environments",
    "title": "bb.experimental_environments",
    "summary": "Offers plugin-provisioned places a thread can run, picked like any environment. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.experimental_environments.register(declaration | composition) · recheck()",
    "propsType": null,
    "slotKind": null,
    "stability": "experimental",
    "symbols": [
      "PluginEnvironments",
      "PluginEnvironmentProviderDeclaration",
      "PluginEnvironmentProviderRequirements",
      "PluginEnvironmentValidateDecision",
      "PluginEnvironmentProviderInputsRegistration",
      "PluginEnvironmentProviderInputsProps"
    ],
    "firstParty": [
      {
        "name": "Project checkout",
        "id": "environment-project-checkout"
      },
      {
        "name": "Personal workspace",
        "id": "environment-personal-workspace"
      },
      {
        "name": "Worktree",
        "id": "environment-git-worktree"
      }
    ],
    "reference": [
      {
        "plugin": "environment-personal-workspace",
        "file": "plugins/environment-personal-workspace/server.ts",
        "note": "Tiniest provider: requires projectless, one host call to create and one to remove."
      },
      {
        "plugin": "environment-git-worktree",
        "file": "plugins/environment-git-worktree/server.ts",
        "note": "Per-attempt path keys, existing-path adoption and experimental_claimPath."
      }
    ],
    "rules": [
      "env-create-idempotent",
      "env-failure-terminal",
      "env-inputs-public",
      "env-hooks-owned-by-core",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your provider appears in the New Thread environment picker and provisions a workspace",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "environment-providers"
    ],
    "guideAnchor": "api-experimental_environments",
    "mockupHash": "headless,surface=environment-providers"
  },
  "experimental_machines": {
    "kind": "namespace",
    "id": "experimental_machines",
    "title": "bb.experimental_machines",
    "summary": "Adds plugin-provisioned machines that compose with environment providers. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.experimental_machines.register(declaration) · bootstrap(request) · getResource(hostId)",
    "propsType": null,
    "slotKind": null,
    "stability": "experimental",
    "symbols": [
      "PluginMachines",
      "PluginBbSdk.hosts.experimental_create",
      "PluginBbSdk.hosts.experimental_getEnrollmentCommand",
      "PluginBbSdk.hosts.experimental_listProviders",
      "PluginBbSdk.hosts.experimental_suspend",
      "PluginBbSdk.hosts.experimental_reconcile"
    ],
    "firstParty": [
      {
        "name": "Modal Sandbox [Experimental]",
        "id": "environment-modal-sandbox"
      }
    ],
    "reference": [
      {
        "plugin": "environment-modal-sandbox",
        "file": "plugins/environment-modal-sandbox/providers/register.ts",
        "note": "The only first-party machine provider: create → checkpoint → bootstrap, plus suspend / resume / reconcileCleanup."
      }
    ],
    "rules": [
      "machine-checkpoint",
      "machine-needs-composition",
      "machine-resource-public",
      "machine-idle-is-yours",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "A created machine enrolls a daemon that connects back to the server",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "machine-providers"
    ],
    "guideAnchor": "api-experimental_machines",
    "mockupHash": "headless,surface=machine-providers"
  },
  "experimental_serverAccess": {
    "kind": "namespace",
    "id": "experimental_serverAccess",
    "title": "bb.experimental_serverAccess",
    "summary": "Registers server access for enrolment and ongoing machine runtime requests. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.experimental_serverAccess.register(declaration) · recheck()",
    "propsType": null,
    "slotKind": null,
    "stability": "experimental",
    "symbols": [
      "PluginServerAccess",
      "ServerAccessProviderDeclaration",
      "ServerAccessGrant"
    ],
    "firstParty": [
      {
        "name": "Remote access",
        "id": "connect"
      }
    ],
    "reference": [
      {
        "plugin": "connect",
        "file": "plugins/connect/src/server-access.ts",
        "note": "The sole implementation: persists the intent before redeeming a code so release works before enrolment."
      }
    ],
    "rules": [
      "access-acquire-idempotent",
      "access-release-null-grant",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "A new machine reaches the server through your grant",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "server-access"
    ],
    "guideAnchor": "api-experimental_serverAccess",
    "mockupHash": "headless,surface=server-access"
  },
  "status": {
    "kind": "namespace",
    "id": "status",
    "title": "bb.status",
    "summary": "Reports that the plugin cannot run until someone configures it, so bb can say so instead of the plugin failing silently. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.status.needsConfiguration(message)",
    "propsType": null,
    "slotKind": null,
    "stability": "stable",
    "symbols": [
      "PluginStatusApi"
    ],
    "firstParty": [
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "github",
        "file": "plugins/github/server.ts",
        "note": "Reports needs-configuration when gh auth is missing instead of failing the load."
      },
      {
        "plugin": "workflows",
        "file": "plugins/workflows/src/server.ts",
        "note": "Reports it from the factory so an unconfigured plugin does not crash-loop."
      }
    ],
    "rules": [
      "status-cleared-on-load",
      "needs-configuration-error"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "An unconfigured plugin shows your message instead of failing to load",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "plugin-status"
    ],
    "guideAnchor": "api-status",
    "mockupHash": "plugins,surface=plugin-status"
  },
  "server": {
    "kind": "namespace",
    "id": "server",
    "title": "bb.server",
    "summary": "Calls bb's own API from the plugin's server code. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.server.loopbackBaseUrl · experimental_appUrl · experimental_dataDir",
    "propsType": null,
    "slotKind": null,
    "stability": "mixed",
    "symbols": [
      "BbPluginApi",
      "PluginServerApi"
    ],
    "firstParty": [
      {
        "name": "Automations",
        "id": "automations"
      },
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Inline visualizations",
        "id": "inline-vis"
      },
      {
        "name": "Keep Awake",
        "id": "keep-awake"
      },
      {
        "name": "Provider retry",
        "id": "provider-retry"
      },
      {
        "name": "Push notifications",
        "id": "push-notifications"
      },
      {
        "name": "Secrets",
        "id": "secrets"
      },
      {
        "name": "Side chat",
        "id": "side-chat"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "side-chat",
        "file": "plugins/side-chat/server.ts",
        "note": "Forks hidden threads and lists them back by originPluginId."
      },
      {
        "plugin": "concurrency-limit",
        "file": "plugins/concurrency-limit/server.ts",
        "note": "Reads threads.listRunning() and subscribes to host changes."
      }
    ],
    "rules": [
      "sdk-bind-gated",
      "backend-full-trust"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "`loopbackBaseUrl` is read from a handler or service, never from the factory in a harness",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "bb-sdk"
    ],
    "guideAnchor": "api-server",
    "mockupHash": "headless,surface=bb-sdk"
  },
  "hosts": {
    "kind": "namespace",
    "id": "hosts",
    "title": "bb.hosts",
    "summary": "Runs the plugin's code on an enrolled machine, not only on the bb server. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.hosts.experimental_client({ contract, experimental_signals }) · ensureSharedPortTunnel · declareSharedPorts",
    "propsType": null,
    "slotKind": null,
    "stability": "mixed",
    "symbols": [
      "PluginHosts",
      "experimental_killProcessesWithCwdUnder",
      "experimental_sanitizeInheritedChildProcessEnv",
      "ExperimentalSanitizeInheritedChildProcessEnvArgs",
      "experimental_spawnPortableOutputProcess"
    ],
    "firstParty": [
      {
        "name": "Project checkout",
        "id": "environment-project-checkout"
      },
      {
        "name": "Keep Awake",
        "id": "keep-awake"
      },
      {
        "name": "Personal workspace",
        "id": "environment-personal-workspace"
      },
      {
        "name": "Remote access",
        "id": "connect"
      },
      {
        "name": "Worktree",
        "id": "environment-git-worktree"
      }
    ],
    "reference": [
      {
        "plugin": "keep-awake",
        "file": "plugins/keep-awake/server.ts",
        "note": "Calls the host worker to hold a wake lock and reacts to experimental_onWorkerExit."
      },
      {
        "plugin": "environment-git-worktree",
        "file": "plugins/environment-git-worktree/host.ts",
        "note": "Streams progress back with experimental_emitSignal correlated by an operationId."
      }
    ],
    "rules": [
      "host-call-not-in-factory",
      "host-limits",
      "host-worker-exit",
      "host-no-private-imports",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "A call from a handler reaches your `bb.host` worker and returns validated output",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "host-workers"
    ],
    "guideAnchor": "api-hosts",
    "mockupHash": "headless,surface=host-workers"
  },
  "experimental_aiServices": {
    "kind": "namespace",
    "id": "experimental_aiServices",
    "title": "bb.experimental_aiServices",
    "summary": "Lets a plugin answer bb's own helper-model calls — the short model calls behind thread titles and commit messages, and the microphone button's transcription. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.experimental_aiServices.register({ id, displayName, kinds }) → { dispose }",
    "propsType": null,
    "slotKind": null,
    "stability": "experimental",
    "symbols": [
      "PluginAiServices",
      "PluginAiServiceDeclaration"
    ],
    "firstParty": [
      {
        "name": "Codex provider",
        "id": "provider-codex"
      }
    ],
    "reference": [
      {
        "plugin": "provider-codex",
        "file": "plugins/provider-codex/server.ts",
        "note": "The only first-party AI service: registers inference and voice from the codex host entry."
      }
    ],
    "rules": [
      "ai-needs-host",
      "ai-failures-returned",
      "ai-reserved-ids",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "`BB_INFERENCE=<id>/<model>` routes bb's helper inference through your host entry",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "ai-services"
    ],
    "guideAnchor": "api-experimental_aiServices",
    "mockupHash": "headless,surface=ai-services"
  },
  "sdk": {
    "kind": "namespace",
    "id": "sdk",
    "title": "bb.sdk",
    "summary": "Calls bb's own API from the plugin's server code. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.sdk.<area>.<method>(...) — threads, projects, environments, hosts, files, terminals, skills, plugins, theme, system",
    "propsType": null,
    "slotKind": null,
    "stability": "mixed",
    "symbols": [
      "BbPluginApi",
      "PluginServerApi"
    ],
    "firstParty": [
      {
        "name": "Automations",
        "id": "automations"
      },
      {
        "name": "Docs",
        "id": "simple-notes"
      },
      {
        "name": "GitHub",
        "id": "github"
      },
      {
        "name": "Inline visualizations",
        "id": "inline-vis"
      },
      {
        "name": "Keep Awake",
        "id": "keep-awake"
      },
      {
        "name": "Provider retry",
        "id": "provider-retry"
      },
      {
        "name": "Push notifications",
        "id": "push-notifications"
      },
      {
        "name": "Secrets",
        "id": "secrets"
      },
      {
        "name": "Side chat",
        "id": "side-chat"
      },
      {
        "name": "Tasks",
        "id": "tasks"
      },
      {
        "name": "Workflows",
        "id": "workflows"
      }
    ],
    "reference": [
      {
        "plugin": "side-chat",
        "file": "plugins/side-chat/server.ts",
        "note": "Forks hidden threads and lists them back by originPluginId."
      },
      {
        "plugin": "concurrency-limit",
        "file": "plugins/concurrency-limit/server.ts",
        "note": "Reads threads.listRunning() and subscribes to host changes."
      }
    ],
    "rules": [
      "sdk-bind-gated",
      "sdk-hidden-threads",
      "sdk-attribution",
      "backend-full-trust"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Threads you spawn are attributed to your plugin and cleaned up in a `finally`",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "bb-sdk"
    ],
    "guideAnchor": "api-sdk",
    "mockupHash": "headless,surface=bb-sdk"
  },
  "onDispose": {
    "kind": "namespace",
    "id": "onDispose",
    "title": "bb.onDispose",
    "summary": "",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.onDispose(hook) — LIFO",
    "propsType": null,
    "slotKind": null,
    "stability": "stable",
    "symbols": [],
    "firstParty": [],
    "reference": [],
    "rules": [
      "dispose-lifo",
      "backend-full-trust"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Reload leaves no timers, sockets or watchers behind; `bb plugin list` never reports `degraded`",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [],
    "guideAnchor": "api-onDispose",
    "mockupHash": null
  }
});

/** Capabilities that span several surfaces and both entries. */
export const ADVANCED_ANNOTATIONS: Readonly<Record<string, Annotation>> = Object.freeze({
  "providers": {
    "kind": "advanced",
    "id": "providers",
    "title": "Agent provider + provider bridge",
    "summary": "Adds an agent to bb's model picker and runs the threads started with it. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.providers.register(declaration) + experimental_defineProviderBridge in the bb.host artifact",
    "propsType": "PluginProviderDeclaration",
    "slotKind": "additive",
    "stability": "experimental",
    "symbols": [
      "contextSnapshotSchema",
      "ContextSnapshot",
      "ContextCategory",
      "ContextEntry",
      "PluginProviderDeclaration",
      "PluginProviderIconRegistration",
      "experimental_useProviders",
      "PluginProvidersState"
    ],
    "firstParty": [
      {
        "name": "ACP providers",
        "id": "provider-acp"
      },
      {
        "name": "Claude Code provider",
        "id": "provider-claude-code"
      },
      {
        "name": "Codex provider",
        "id": "provider-codex"
      },
      {
        "name": "Pi provider",
        "id": "provider-pi"
      }
    ],
    "reference": [
      {
        "plugin": "provider-acp",
        "file": "plugins/provider-acp/src/declaration.ts",
        "note": "Builds one declaration per ACP agent and ships the bridge from the same host artifact."
      },
      {
        "plugin": "echo-provider",
        "file": "examples/plugins/echo-provider/src/provider-bridge.ts",
        "note": "Smallest complete bridge: handshake, a session start and the minimal turn loop."
      }
    ],
    "rules": [
      "provider-needs-host",
      "provider-id-immutable",
      "bridge-grammar-v3",
      "provider-derive-sync",
      "host-no-private-imports"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "A thread runs end to end on your provider with a correct turn loop",
      "`experimental_runBridgeConformance` passes against your bridge",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "provider-picker"
    ],
    "guideAnchor": "adv-providers",
    "mockupHash": "composer,surface=provider-picker"
  },
  "acp": {
    "kind": "advanced",
    "id": "acp",
    "title": "ACP agents and dialects",
    "summary": "Adds an agent to bb's model picker and runs the threads started with it. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.providers.register(acpProviderDeclaration(agent)) with experimental_acpProviderBridge",
    "propsType": "PluginProviderDeclaration",
    "slotKind": "additive",
    "stability": "experimental",
    "symbols": [
      "contextSnapshotSchema",
      "ContextSnapshot",
      "ContextCategory",
      "ContextEntry",
      "PluginProviderDeclaration",
      "PluginProviderIconRegistration",
      "experimental_useProviders",
      "PluginProvidersState"
    ],
    "firstParty": [
      {
        "name": "ACP providers",
        "id": "provider-acp"
      },
      {
        "name": "Claude Code provider",
        "id": "provider-claude-code"
      },
      {
        "name": "Codex provider",
        "id": "provider-codex"
      },
      {
        "name": "Pi provider",
        "id": "provider-pi"
      }
    ],
    "reference": [
      {
        "plugin": "provider-acp",
        "file": "plugins/provider-acp/src/declaration.ts",
        "note": "Builds one declaration per ACP agent and ships the bridge from the same host artifact."
      },
      {
        "plugin": "echo-provider",
        "file": "examples/plugins/echo-provider/src/provider-bridge.ts",
        "note": "Smallest complete bridge: handshake, a session start and the minimal turn loop."
      }
    ],
    "rules": [
      "provider-needs-host",
      "provider-id-immutable",
      "experimental-churn"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your ACP agent appears as its own provider id and launches with its declared launch spec",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "provider-picker"
    ],
    "guideAnchor": "adv-acp",
    "mockupHash": "composer,surface=provider-picker"
  },
  "environments": {
    "kind": "advanced",
    "id": "environments",
    "title": "Environment providers",
    "summary": "Offers plugin-provisioned places a thread can run, picked like any environment. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.experimental_environments.register(declaration | composition)",
    "propsType": "PluginEnvironmentProviderDefinition",
    "slotKind": "additive",
    "stability": "experimental",
    "symbols": [
      "PluginEnvironments",
      "PluginEnvironmentProviderDeclaration",
      "PluginEnvironmentProviderRequirements",
      "PluginEnvironmentValidateDecision",
      "PluginEnvironmentProviderInputsRegistration",
      "PluginEnvironmentProviderInputsProps",
      "PluginEnvironmentProviderInputsChange",
      "experimental_BranchPicker"
    ],
    "firstParty": [
      {
        "name": "Project checkout",
        "id": "environment-project-checkout"
      },
      {
        "name": "Personal workspace",
        "id": "environment-personal-workspace"
      },
      {
        "name": "Worktree",
        "id": "environment-git-worktree"
      }
    ],
    "reference": [
      {
        "plugin": "environment-personal-workspace",
        "file": "plugins/environment-personal-workspace/server.ts",
        "note": "Tiniest provider: requires projectless, one host call to create and one to remove."
      },
      {
        "plugin": "environment-git-worktree",
        "file": "plugins/environment-git-worktree/server.ts",
        "note": "Per-attempt path keys, existing-path adoption and experimental_claimPath."
      }
    ],
    "rules": [
      "env-create-idempotent",
      "env-failure-terminal",
      "env-inputs-public",
      "env-hooks-owned-by-core"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "A thread provisions a workspace through your provider and retires it under core's policy",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "environment-providers"
    ],
    "guideAnchor": "adv-environments",
    "mockupHash": "headless,surface=environment-providers"
  },
  "machines": {
    "kind": "advanced",
    "id": "machines",
    "title": "Machine providers, server access and bootstrap",
    "summary": "Adds plugin-provisioned machines that compose with environment providers. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.experimental_machines.register(...) + bb.experimental_machines.bootstrap(...) + bb.experimental_serverAccess.register(...)",
    "propsType": "PluginMachineProviderDefinition",
    "slotKind": "additive",
    "stability": "experimental",
    "symbols": [
      "PluginMachines",
      "PluginBbSdk.hosts.experimental_create",
      "PluginBbSdk.hosts.experimental_getEnrollmentCommand",
      "PluginBbSdk.hosts.experimental_listProviders",
      "PluginBbSdk.hosts.experimental_suspend",
      "PluginBbSdk.hosts.experimental_reconcile",
      "PluginBbSdk.hosts.experimental_resume",
      "PluginBbSdk.hosts.experimental_retryCleanup"
    ],
    "firstParty": [
      {
        "name": "Modal Sandbox [Experimental]",
        "id": "environment-modal-sandbox"
      }
    ],
    "reference": [
      {
        "plugin": "environment-modal-sandbox",
        "file": "plugins/environment-modal-sandbox/providers/register.ts",
        "note": "The only first-party machine provider: create → checkpoint → bootstrap, plus suspend / resume / reconcileCleanup."
      }
    ],
    "rules": [
      "machine-checkpoint",
      "machine-needs-composition",
      "machine-resource-public",
      "access-acquire-idempotent"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Creating a machine enrolls a daemon, and removing it cleans up by durable key",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "machine-providers"
    ],
    "guideAnchor": "adv-machines",
    "mockupHash": "headless,surface=machine-providers"
  },
  "host-workers": {
    "kind": "advanced",
    "id": "host-workers",
    "title": "Host workers",
    "summary": "Runs the plugin's code on an enrolled machine, not only on the bb server. With this, a plugin can:",
    "entry": "host",
    "manifestEntry": "bb.host",
    "registration": "experimental_defineHostEntry({ contract, handlers, dispose }) + bb.hosts.experimental_client(...)",
    "propsType": "ExperimentalHostRpcContext",
    "slotKind": "additive",
    "stability": "experimental",
    "symbols": [
      "PluginHosts",
      "experimental_killProcessesWithCwdUnder",
      "experimental_sanitizeInheritedChildProcessEnv",
      "ExperimentalSanitizeInheritedChildProcessEnvArgs",
      "experimental_spawnPortableOutputProcess"
    ],
    "firstParty": [
      {
        "name": "Project checkout",
        "id": "environment-project-checkout"
      },
      {
        "name": "Keep Awake",
        "id": "keep-awake"
      },
      {
        "name": "Personal workspace",
        "id": "environment-personal-workspace"
      },
      {
        "name": "Remote access",
        "id": "connect"
      },
      {
        "name": "Worktree",
        "id": "environment-git-worktree"
      }
    ],
    "reference": [
      {
        "plugin": "keep-awake",
        "file": "plugins/keep-awake/server.ts",
        "note": "Calls the host worker to hold a wake lock and reacts to experimental_onWorkerExit."
      },
      {
        "plugin": "environment-git-worktree",
        "file": "plugins/environment-git-worktree/host.ts",
        "note": "Streams progress back with experimental_emitSignal correlated by an operationId."
      }
    ],
    "rules": [
      "host-call-not-in-factory",
      "host-limits",
      "host-worker-exit",
      "host-no-private-imports"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "`dist/host.js` is built, digest-verified and run by the daemon on the target machine",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "host-workers"
    ],
    "guideAnchor": "adv-host-workers",
    "mockupHash": "headless,surface=host-workers"
  },
  "ai-services": {
    "kind": "advanced",
    "id": "ai-services",
    "title": "AI services",
    "summary": "Lets a plugin answer bb's own helper-model calls — the short model calls behind thread titles and commit messages, and the microphone button's transcription. With this, a plugin can:",
    "entry": "host",
    "manifestEntry": "bb.host",
    "registration": "bb.experimental_aiServices.register({ id, displayName, kinds })",
    "propsType": "PluginAiServiceDeclaration",
    "slotKind": "additive",
    "stability": "experimental",
    "symbols": [
      "PluginAiServices",
      "PluginAiServiceDeclaration"
    ],
    "firstParty": [
      {
        "name": "Codex provider",
        "id": "provider-codex"
      }
    ],
    "reference": [
      {
        "plugin": "provider-codex",
        "file": "plugins/provider-codex/server.ts",
        "note": "The only first-party AI service: registers inference and voice from the codex host entry."
      }
    ],
    "rules": [
      "ai-needs-host",
      "ai-failures-returned",
      "ai-reserved-ids"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "bb's helper inference and transcription run through your host entry",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "ai-services"
    ],
    "guideAnchor": "adv-ai-services",
    "mockupHash": "headless,surface=ai-services"
  },
  "desktop-browsers": {
    "kind": "advanced",
    "id": "desktop-browsers",
    "title": "Desktop browser control",
    "summary": "Controls a selected desktop window through bb.sdk.experimental_desktopBrowsers. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.sdk.experimental_desktopBrowsers.*",
    "propsType": "ExperimentalDesktopBrowsersArea",
    "slotKind": "additive",
    "stability": "experimental",
    "symbols": [
      "ExperimentalDesktopBrowsersArea",
      "ExperimentalDesktopBrowserScope",
      "ExperimentalDesktopBrowserLease",
      "ExperimentalDesktopBrowserCreateInput",
      "ExperimentalDesktopBrowserAcquireInput",
      "ExperimentalDesktopBrowsersArea.listImportSources",
      "ExperimentalDesktopBrowsersArea.importCookies"
    ],
    "firstParty": [
      {
        "name": "Browser Automation",
        "id": "browser-automation"
      }
    ],
    "reference": [
      {
        "plugin": "browser-automation",
        "file": "plugins/browser-automation/server.ts",
        "note": "The only consumer: scope → createTab → acquireControl → openConnection, with min() over every expiry."
      }
    ],
    "rules": [
      "browser-lease-ttl",
      "browser-allow-personal",
      "browser-host-match"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your automation drives a real desktop tab and releases control without closing the user's tabs",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "desktop-browsers"
    ],
    "guideAnchor": "adv-desktop-browsers",
    "mockupHash": "headless,surface=desktop-browsers"
  },
  "thread-metadata": {
    "kind": "advanced",
    "id": "thread-metadata",
    "title": "Thread plugin metadata",
    "summary": "Stores namespaced plugin JSON for a thread without automatically exposing it to the model. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "bb.sdk.threads.getPluginMetadata / updatePluginMetadata",
    "propsType": "ThreadPluginMetadataResult",
    "slotKind": "additive",
    "stability": "experimental",
    "symbols": [
      "PluginBbSdk",
      "PluginAgentConfigurationContext",
      "ReadonlyJsonValue",
      "BbPluginApi"
    ],
    "firstParty": [],
    "reference": [],
    "rules": [
      "metadata-untrusted",
      "metadata-size",
      "metadata-frozen-in-configure"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Your namespace travels with the thread and is treated as untrusted input when read back",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "thread-plugin-metadata"
    ],
    "guideAnchor": "adv-thread-metadata",
    "mockupHash": "headless,surface=thread-plugin-metadata"
  },
  "record-mode": {
    "kind": "advanced",
    "id": "record-mode",
    "title": "Bridge record mode",
    "summary": "Adds an agent to bb's model picker and runs the threads started with it. With this, a plugin can:",
    "entry": "server",
    "manifestEntry": "bb.server",
    "registration": "BB_PROVIDER_BRIDGE_RECORD_DIR=<dir> + experimental_recordProviderChildIo(child, { threadId })",
    "propsType": "PluginProviderDeclaration",
    "slotKind": "additive",
    "stability": "experimental",
    "symbols": [
      "contextSnapshotSchema",
      "ContextSnapshot",
      "ContextCategory",
      "ContextEntry",
      "PluginProviderDeclaration",
      "PluginProviderIconRegistration",
      "experimental_useProviders",
      "PluginProvidersState"
    ],
    "firstParty": [
      {
        "name": "ACP providers",
        "id": "provider-acp"
      },
      {
        "name": "Claude Code provider",
        "id": "provider-claude-code"
      },
      {
        "name": "Codex provider",
        "id": "provider-codex"
      },
      {
        "name": "Pi provider",
        "id": "provider-pi"
      }
    ],
    "reference": [
      {
        "plugin": "provider-acp",
        "file": "plugins/provider-acp/src/declaration.ts",
        "note": "Builds one declaration per ACP agent and ships the bridge from the same host artifact."
      },
      {
        "plugin": "echo-provider",
        "file": "examples/plugins/echo-provider/src/provider-bridge.ts",
        "note": "Smallest complete bridge: handshake, a session start and the minimal turn loop."
      }
    ],
    "rules": [
      "bridge-grammar-v3",
      "host-no-private-imports"
    ],
    "doneWhen": [
      "`bb plugin build` completes without errors",
      "`bb plugin install .` then `bb plugin dev` loads the plugin — `bb plugin list` shows it `running`",
      "Both bridge boundaries are recorded as NDJSON you can replay in conformance tests",
      "Disabling the plugin (`bb plugin disable <id>`) returns bb to its previous behaviour with no leftovers"
    ],
    "surfaces": [
      "provider-picker"
    ],
    "guideAnchor": "adv-record-mode",
    "mockupHash": "composer,surface=provider-picker"
  }
});

/**
 * The corpus names some slots the way the guide presents them; `data/slots.json`
 * names them the way `PluginAppSlots` and `PluginAppBuilder` do. The sidebar
 * footer is one managed region behind two members, and `commandPaletteAction` is
 * a deprecated door onto the same command registry as `app.commands`.
 */
export const SLOT_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  experimental_sidebarFooter: "sidebarFooter",
  sidebarFooterAction: "sidebarFooter",
  composer: "composer-customize",
  commandPaletteAction: "commands",
});

const BY_KIND = {
  surface: SURFACE_ANNOTATIONS,
  slot: SLOT_ANNOTATIONS,
  namespace: NAMESPACE_ANNOTATIONS,
  advanced: ADVANCED_ANNOTATIONS,
} as const;

/**
 * Ids are unique within a kind but not across kinds — `providers` is both a
 * `bb` namespace and an advanced capability — so lookups take both.
 */
export function annotationFor(kind: AnnotationKind, id: string): Annotation | null {
  const bucket = BY_KIND[kind];
  return bucket[id] ?? (kind === "slot" ? (bucket[SLOT_ALIASES[id] ?? ""] ?? null) : null);
}

export function annotationsOfKind(kind: AnnotationKind): Annotation[] {
  return Object.values(BY_KIND[kind]);
}

export function allAnnotations(): Annotation[] {
  return Object.values(BY_KIND).flatMap((bucket) => Object.values(bucket));
}
