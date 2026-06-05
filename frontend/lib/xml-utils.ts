import { isXmlString, parseXML, safeXmlText } from "./xml";

export const parseMaybeXml = <T>(value: unknown): T | undefined => {
  if (typeof value === "string" && isXmlString(value)) {
    return parseXML<T>(value);
  }

  if (typeof value === "object" && value !== null) {
    return value as T;
  }

  return undefined;
};

export const extractNode = <T extends Record<string, unknown>>(
  value: unknown,
  keys: string[]
): T | undefined => {
  const parsed = parseMaybeXml<Record<string, unknown>>(value);
  if (!parsed) return undefined;

  for (const key of keys) {
    if (key in parsed) return parsed[key] as T;
  }

  return parsed as T;
};

export const textFromXml = (value: unknown, fallback = "") => {
  const text = safeXmlText(value).trim();
  return text.length > 0 ? text : fallback;
};
