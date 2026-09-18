/**
 * Counts, printed. A check that says only "passed" cannot tell you whether it
 * looked at 921 links or at none, and a silently empty check is the failure
 * mode this suite is built against.
 */
export function counted(label: string, checked: number, failed: number = 0): void {
  const tail = failed === 0 ? "ok" : `${failed} failing`;
  console.log(`    · ${label}: ${checked} checked, ${tail}`);
}
