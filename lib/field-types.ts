export type FieldType =
  | "text" | "email" | "number" | "textarea"
  | "select" | "checkbox" | "date" | "phone";

export interface Field {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[];      // for select
  placeholder?: string;
}

export const FIELD_LABELS: Record<FieldType, string> = {
  text: "Short text", email: "Email", number: "Number",
  textarea: "Paragraph", select: "Dropdown", checkbox: "Checkbox",
  date: "Date", phone: "Phone",
};

export const newField = (type: FieldType): Field => ({
  id: "f" + Math.random().toString(36).slice(2, 9),
  type, label: FIELD_LABELS[type], required: false,
  options: type === "select" ? ["Option 1", "Option 2"] : undefined,
});
