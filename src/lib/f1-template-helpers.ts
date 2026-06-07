import type {F1BaseVideoTemplate, F1VideoTemplate} from './types';

export const NEW_TEMPLATE_PREFIX = 'novo-';

export const isNewShortTemplate = (template?: string): boolean =>
  String(template ?? '').startsWith(NEW_TEMPLATE_PREFIX);

export const baseF1Template = (template?: string): F1BaseVideoTemplate => {
  const normalized = String(template ?? '').replace(/^novo-/, '') as F1BaseVideoTemplate;
  return normalized;
};

export const sameBaseF1Template = (left?: string, right?: string): boolean =>
  baseF1Template(left) === baseF1Template(right);

export const asF1Template = (template: string): F1VideoTemplate => template as F1VideoTemplate;
