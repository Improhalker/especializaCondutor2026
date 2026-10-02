export const characteristicFields = [
  { key: "format", label: "Formato do curso", icon: "monitor", hint: "Informe como o conteúdo é acessado e possíveis etapas presenciais." },
  { key: "video_lessons_count", label: "Quantidade de videoaulas", icon: "video", numeric: true, hint: "Somente a quantidade confirmada para esta modalidade." },
  { key: "video_lessons_duration", label: "Duração das videoaulas", icon: "clock", limit: 150, hint: "Diferencie duração total de duração por aula." },
  { key: "materials", label: "Material de estudo", icon: "book", hint: "Cite PDF somente quando esse formato estiver confirmado." },
  { key: "assessment", label: "Avaliação", icon: "assessment", hint: "Explique prova, avaliação e etapas exigidas nesta modalidade." },
  { key: "certificate", label: "Certificado", icon: "certificate", hint: "Informe quem emite e as condições; não prometa registro automático na CNH." },
  { key: "support", label: "Suporte", icon: "support", hint: "Especifique o tipo de suporte, canal e horários, se confirmados." },
  { key: "access", label: "Acesso ao curso", icon: "access", hint: "Informe como e quando o aluno recebe o acesso." },
];

export function editableCharacteristics(value = {}) {
  return Object.fromEntries(characteristicFields.map(({ key }) => [key, value?.[key] ?? ""]));
}

export function serializeCharacteristics(value = {}) {
  return Object.fromEntries(characteristicFields.map(({ key, numeric }) => {
    const field = value?.[key];
    const empty = field == null || String(field).trim() === "";
    return [key, empty ? null : numeric ? Number(field) : String(field).trim()];
  }));
}

export function courseCharacteristicRows(modality = {}) {
  const rows = [];
  const workload = typeof modality.workload === "string" ? modality.workload.trim() : "";
  if (workload && !["Formação completa", "Atualização do curso"].includes(workload)) {
    rows.push({ key: "workload", label: "Carga horária", icon: "clock", value: workload });
  }
  for (const field of characteristicFields) {
    const value = modality.characteristics?.[field.key];
    if (field.numeric) {
      const count = typeof value === "number" ? value : typeof value === "string" && /^[1-9]\d*$/.test(value) ? Number(value) : null;
      if (!Number.isInteger(count) || count < 1 || count > 100000) continue;
      rows.push({ ...field, label: "Videoaulas", value: `${count} ${count === 1 ? "videoaula" : "videoaulas"}` });
    } else if (typeof value === "string" && value.trim()) {
      rows.push({ ...field, value: value.trim() });
    }
  }
  return rows;
}
