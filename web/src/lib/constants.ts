export const GIT_STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  added:    { label: "A", cls: "bg-emerald-light text-emerald" },
  deleted:  { label: "D", cls: "bg-danger-light text-danger" },
  modified: { label: "M", cls: "bg-accent-light text-accent" },
  renamed:  { label: "R", cls: "bg-plum-light text-plum" },
};
