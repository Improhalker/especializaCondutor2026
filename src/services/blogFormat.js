const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeZone: "America/Sao_Paulo",
});

export function formatPostDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

export function readingLabel(minutes) {
  const value = Math.max(1, Number(minutes) || 1);
  return `${value} min de leitura`;
}
