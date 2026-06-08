export type FieldType =
  | "text" | "email" | "number" | "textarea"
  | "select" | "checkbox" | "date" | "phone" | "file"
  | "signature"   // draw or type; stored as an image data-URL / uploaded URL
  | "content"     // display-only static text/HTML; not an input
  | "group";      // repeating section: contains child fields, value is an array of rows

export interface Field {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[];      // select / checkbox-group
  placeholder?: string;
  content?: string;        // for "content" display blocks (plain text or simple HTML)
  fields?: Field[];        // for "group" repeating sections (child fields)
  minRows?: number;        // group: minimum rows
}

export const FIELD_LABELS: Record<FieldType, string> = {
  text: "Short text", email: "Email", number: "Number",
  textarea: "Paragraph", select: "Dropdown", checkbox: "Checkboxes",
  date: "Date", phone: "Phone", file: "File upload",
  signature: "Signature", content: "Display text", group: "Repeating section",
};

export const newField = (type: FieldType): Field => {
  const base = {
    id: "f" + Math.random().toString(36).slice(2, 9),
    type, label: FIELD_LABELS[type], required: false,
  } as Field;
  if (type === "select" || type === "checkbox") base.options = ["Option 1", "Option 2"];
  if (type === "content") { base.content = "Enter display text here…"; base.label = ""; }
  if (type === "group") { base.fields = []; base.minRows = 1; }
  return base;
};
