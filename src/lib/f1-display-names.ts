const antonelliPattern = /^(?:andrea\s+kimi|kimi\s+andrea)\s+antonelli$/i;

export const normalizeF1DriverDisplayName = (name = ''): string => {
  const trimmed = String(name ?? '').trim().replace(/\s+/g, ' ');
  if (antonelliPattern.test(trimmed)) {
    return 'Kimi Antonelli';
  }

  return trimmed;
};

export const f1DriverSurname = (name = ''): string => {
  const normalized = normalizeF1DriverDisplayName(name);
  const parts = normalized.split(/\s+/).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : normalized;
};
