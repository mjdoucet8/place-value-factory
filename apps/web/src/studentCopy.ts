const skillLabels: Record<string, string> = {
  "pv.ones": "Ones place value",
  "pv.tens": "Tens place value",
  "pv.hundreds": "Hundreds place value",
  "pv.thousands": "Thousands place value",
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
