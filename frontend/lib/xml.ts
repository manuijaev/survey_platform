import { XMLBuilder, XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseAttributeValue: true,
  trimValues: true
});

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  format: true
});

export const parseXML = <T>(xmlString: string): T => parser.parse(xmlString) as T;

export const buildXML = (obj: object): string => builder.build(obj);

export const isXmlString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().startsWith("<");

export const safeXmlText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map((item) => safeXmlText(item)).join("");
  if (typeof value === "object") {
    if ("#text" in (value as Record<string, unknown>)) {
      return safeXmlText((value as Record<string, unknown>)["#text"]);
    }
    return "";
  }
  return String(value);
};
