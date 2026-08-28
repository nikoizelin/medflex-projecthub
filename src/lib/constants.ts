export const KATEGORIE_LABEL: Record<string, string> = {
  telefonassistent: "Telefonassistent",
  "medflex-app": "MedFlex App",
  sonstiges: "Sonstiges",
  featurewunsch: "Featurewunsch",
};

export const KATEGORIE_OPTIONS = Object.entries(KATEGORIE_LABEL).map(([value, label]) => ({
  value,
  label,
}));
