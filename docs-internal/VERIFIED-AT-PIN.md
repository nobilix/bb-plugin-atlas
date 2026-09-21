# Claims checked against the pinned release

Checked on 2026-09-22 against `e865697` (tag `desktop-v0.43.3`, bb 0.43.3, SDK 0.4.104). Each row is a claim that looked newer than 0.43.3 and was settled by reading the pinned tree.

| Claim | Verdict | Evidence |
|---|---|---|
| `experimental_useSidebarThreadSplit`, `experimental_useCodeTheme`, `experimental_useBranches`, `experimental_useCheckoutState` | **present at the release** | all four appear in `packages/plugin-sdk/src/app-contract.ts` at the pin. Absence from the changelog is normal for `experimental_` members and is not evidence of absence from the release. |
| `/host` exports: `experimental_nativeRootsHostContract`, `experimental_killProcessesWithCwdUnder`, `experimental_spawnPortableOutputProcess`, `experimental_resolveVendorPluginRoots` | **present at the release** | all four appear in `packages/plugin-sdk/src/host.ts` at the pin. |
| Scaffold pins SDK `0.4.104` | **correct** | `packages/domain/src/plugin-sdk-version.ts` at the pin is `PLUGIN_SDK_VERSION = "0.4.104"`, `packages/plugin-sdk/package.json` is `0.4.104`, and `plugin-scaffold.ts` writes `engines.bbPluginSdk` from that constant. The Russian source's `0.4.108` was `main`. |
| "22 `app.slots.*` methods" | **correct, and the site must not say 25** | `interface PluginAppSlots` at the pin has exactly 22 members: `homepageSection`, `settingsSection`, `experimental_appOverlay`, `navPanel`, `threadPanelAction`, `experimental_newThreadPanelAction`, `pendingInteraction`, `sidebarFooterAction`, `experimental_sidebarNavigation`, `experimental_threadList`, `experimental_threadHeaderAction`, `experimental_browserToolbarAction`, `fileOpener`, `experimental_sourceCodeRenderer`, `experimental_diffRenderer`, `messageDirective`, `messageAction`, `commandPaletteAction`, `experimental_providerIcon`, `experimental_timelineRenderer`, `experimental_environmentProviderInputs`, `experimental_machineProviderInputs`. A count of 25 adds three builder surfaces (`composer.customize`, `contentScripts`, `experimental_icons`). **Wording rule:** "22 slot methods, plus three builder surfaces" — never "25 slots". |
| ACP dialects and the five shipped agents | **not re-verified** | read from `main`. Keep the source's own "not verified" label until the sync resolves it from the pin. |
| `experimental_desktopBrowsers` member list | **correct at the release, 12 members** | `interface ExperimentalDesktopBrowsersArea` in `packages/sdk/src/areas/desktop-browsers.ts` at the pin: the same 12 methods the page lists. The page said "13"; fixed. The `subscribe` quote now matches `surfaces.ts:1058` verbatim, and the "not verified" label is removed from the glossary. |
| Contract line counts, `bundled-types` size | **dropped, correctly** | they were measured at `main`. If wanted, regenerate from the pin; never restate by hand. |

Rule this establishes: absence from the changelog is not evidence that an API is unreleased. Check the pinned tree.

## Arbitration: six, five, twenty-two, twenty-seven

Checked at the pin: `interface PluginAppBuilder` has **exactly six members** — `slots`, `commands`, `composer`, `contentScripts`, `experimental_icons`, `experimental_sidebarFooter`. `interface PluginAppSlots` has **exactly 22 methods**.

Both earlier numbers were right about different things, so the site fixes the vocabulary once:

- **`PluginAppBuilder` has six members.** Prose may say "the builder gives you six registration surfaces" — that is correct and stays.
- **One of the six is `slots`**, the container for the 22 slot methods.
- **The other five are builder regions**, which is what `data/slots.json` counts beside the methods.
- **27 registration points** = 22 slot methods + 5 builder regions. Never "25 slots", never "six builder regions".

Where a page prints counts, read them off the data and never sum them into a single unlabelled number.
