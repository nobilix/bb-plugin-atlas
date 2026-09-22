# Evidence: "Your first plugin" run on a live bb

The tutorial at `site/src/content/docs/start.mdx` was run end to end on 2026-09-23 against a locally installed bb 0.43.3 (the pinned release, SDK 0.4.104), macOS, Node 22.23.2. Every step was executed as written; the outputs below are copied from the terminal, with the scratch directory path shortened to `<scratch>`. Screenshots were not kept, because the bb window shows the owner's own thread list.

## Step 1: `bb plugin new hello`

```console
$ bb plugin new hello
Created bb-plugin-hello/ (bb-plugin-hello).
Installed dependencies (npm install).
Next steps:
  cd bb-plugin-hello
  bb plugin install .
```

The command ran `npm install` itself; the `npm install --include=dev` next step appears only when that fails. The tutorial shows the normal output, not the fallback.

## Steps 2 to 4: the scaffold

`server.ts` and `app.tsx` match the abridged listings: `rpcContract` with `todos_list`, `todos_add`, `todos_set_done`, `todos_remove`; `bb.storage.kv` under the key `todos`; `bb.realtime.publish` on `todos-changed`; `bb.cli.register({ name: "hello", commands, run })`; `bb.onDispose`; `app.slots.navPanel` with `path: "example-todos"`. In the real `app.tsx` the RPC and realtime calls sit in a `useTodos()` hook, which the listing now shows.

## Step 5: install, dev loop, three ways in

```console
$ bb plugin install .
Installing bb-plugin-hello@0.1.0 from <scratch>/bb-plugin-hello
Plugins are full-trust code running inside the BB server. They can read all local BB data, including other plugins' secrets.
Refusing to install without confirmation — re-run with --yes.
```

That is the non-interactive run. With `--yes`:

```console
Installed:
hello@0.1.0  running
  source: path:<scratch>/bb-plugin-hello
  command: bb hello — Manage the Hello plugin's example todo list
```

After the install `dist/` held `app.css`, `app.js` and `app.meta.json` only: the path install builds the app entry and loads `server.ts` directly.

`bb plugin dev` printed `Watching <scratch>/bb-plugin-hello for plugin "hello" (frontend rebuild + reload on change) — Ctrl+C to stop.`

1. The page: "Example todos" appeared in the sidebar at `/plugins/hello/example-todos`. A todo added with the Add button appeared in the list.
2. The CLI: `bb hello add "Ship it"` printed `Added [ ] e9adbfab  Ship it`. The open page showed the new row without a reload: the page's navigation entry was unchanged and 41 seconds old when the row appeared.
3. The agent: a thread in the personal project with the Claude Code provider, prompted "Add a todo titled 'Added by the agent' to the Hello plugin's example todo list.", produced this timeline (noise lines from the macOS certificate store removed):

```text
── Assistant
I'll use the Hello plugin's todo skill.
── Loaded skill bb-global-skills:example-todos
── Ran bb hello list
── Ran bb hello add "Added by the agent" 2>/dev/null; bb hello list 2>/dev/null
   Added [ ] dadb1d84  Added by the agent
```

A first attempt with the project's default provider, Pi, ended in "Connection error." before the agent ran; that is a provider setup issue on the test machine, not a plugin behavior.

## Step 6: the `count` command

After the edit, `bb plugin dev` printed `1 file changed · rebuilt app in 545ms · reloaded hello`, and `bb hello count` printed `3`.

`bb plugin logs hello -n 5` showed the reload order:

```text
{"ts":1790108909784,"level":"info","message":"loaded"}
{"ts":1790109065230,"level":"info","message":"loaded"}
{"ts":1790109065231,"level":"info","message":"disposed"}
```

The new instance logs `loaded` one millisecond before the old one logs `disposed`.

The generated skill `~/.bb/skills-generated/plugin-commands/SKILL.md` gained `- \`bb hello count\` — Count todos` without any other change. `bb hello --help` did not list `count`: it prints the plugin's own `usage` string. The tutorial previously said the `commands` list builds the command's help; it now tells the reader to update `usage` by hand.

## Troubleshooting table

`bb plugin types --check` printed `This plugin uses the npm package @get-bb/plugin-sdk; pin is 0.4.104, host is 0.4.104.` and exited 0.

## Not exercised

The `@get-bb/plugin-sdk does not resolve`, shimmed-package and `needs-configuration` rows were not reproduced; they are grounded in the source at the pin. The pinned source disagrees with itself on whether saving settings reloads a `needs-configuration` plugin (the `backend-contract.ts` doc comment says no, a server regression test says yes), so the tutorial no longer states either.
