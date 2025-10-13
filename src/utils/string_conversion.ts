export function snakeToCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (match, char) => char.toUpperCase());
}

export function stringToTitleCase (str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}