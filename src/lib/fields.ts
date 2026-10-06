/**
 * Declarative form fields. The admin panel renders every editor (page sections,
 * settings, products, coupons...) from these descriptors.
 */
export type Option = { value: string; label: string };

type Base = {
  name: string;
  label: string;
  help?: string;
  placeholder?: string;
  /** Take half the row on wide screens. */
  half?: boolean;
};

export type Field =
  | (Base & {
      type:
        | "text"
        | "textarea"
        | "markdown"
        | "number"
        | "money"
        | "boolean"
        | "color"
        | "image"
        | "images"
        | "tags"
        | "link"
        | "datetime";
    })
  | (Base & {
      type: "select";
      options?: Option[];
      /** Name of a runtime option list (e.g. "categories") supplied by the page. */
      source?: string;
      allowEmpty?: string;
    })
  | (Base & {
      type: "list";
      fields: Field[];
      itemLabel: string;
      /** Sub-field shown as the collapsed row title. */
      titleField?: string;
    });

export type FieldSources = Record<string, Option[]>;

export function emptyValue(field: Field): unknown {
  switch (field.type) {
    case "boolean":
      return false;
    case "number":
    case "money":
      return 0;
    case "images":
    case "tags":
    case "list":
      return [];
    case "select":
      return field.allowEmpty !== undefined ? "" : (field.options?.[0]?.value ?? "");
    default:
      return "";
  }
}

export function emptyItem(fields: Field[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((f) => [f.name, emptyValue(f)]));
}
