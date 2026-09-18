export function formatBytes(bytes = 0) {
  if (bytes < 1024) return bytes + " B";
  const divisor = bytes < 1048576 ? 1024 : 1048576;
  return (
    (bytes / divisor).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) +
    (divisor === 1024 ? " KB" : " MB")
  );
}

export function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
        new Date(value),
      )
    : "—";
}

export function formatReduction(value) {
  return value >= 0
    ? value.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) +
        "% de economia"
    : "Formato otimizado · tamanho maior";
}
