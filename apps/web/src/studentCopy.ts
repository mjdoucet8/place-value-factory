const skillLabels: Record<string, string> = {
  "pv.ones": "Ones place value",
  "pv.tens": "Tens place value",
  "pv.hundreds": "Hundreds place value",
  "pv.thousands": "Thousands place value",
  "pv.tenThousands": "Ten thousands place value",
  "pv.hundredThousands": "Hundred thousands place value",
  "standard.decompose": "Breaking numbers into place values",
  "standard.zero": "Keeping zero places in a number",
  "rename.100000_10000": "Trading hundred thousands for ten thousands",
  "rename.10000_1000": "Trading ten thousands for thousands",
  "rename.100_10": "Trading hundreds for tens",
  "rename.10_1": "Trading tens for ones",
  "rename.multi": "Trading across several place values",
  "compose.forbidden": "Packing with some machines closed",
  "reason.minimum": "Finding the fewest crates",
  "reason.exactTypes": "Using the requested crate sizes",
  "reason.multiple": "Packing a number in two ways",
  "compose.allowed": "Building numbers with open machines",
  "rename.1000_100": "Trading thousands for hundreds",
};

export function studentSkillLabel(id: string) {
  return skillLabels[id] ?? "Place-value practice";
}

export function studentSkillStatus(status: string) {
  return (
    (
      {
        secure: "Strong evidence",
        developing: "Growing",
        emerging: "Getting started",
        unknown: "Ready to explore",
      } as Record<string, string>
    )[status] ?? "Growing"
  );
}
