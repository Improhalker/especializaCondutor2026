import test from "node:test";
import assert from "node:assert/strict";
import { editableCharacteristics, serializeCharacteristics, courseCharacteristicRows } from "../src/services/courseCharacteristics.js";

test("campos ausentes não recebem números, PDF, certificado ou suporte inventados", () => {
  assert.deepEqual(courseCharacteristicRows({ name: "Formação", workload: "Formação completa" }), []);
  assert.deepEqual(courseCharacteristicRows({ name: "Atualização", workload: "Atualização do curso", characteristics: {} }), []);
});

test("cada modalidade exibe apenas seus próprios dados", () => {
  const formation = courseCharacteristicRows({ workload: "50 horas", characteristics: { format: "Online", materials: "PDF confirmado", video_lessons_count: 14, video_lessons_duration: "2 horas de vídeos no total" } });
  assert.equal(formation[0].value, "50 horas");
  assert.equal(formation.find(row => row.key === "video_lessons_count").value, "14 videoaulas");
  const update = courseCharacteristicRows({ characteristics: { support: "WhatsApp" } });
  assert.deepEqual(update.map(row => row.key), ["support"]);
});

test("valores vazios e quantidade inválida não aparecem", () => {
  assert.deepEqual(courseCharacteristicRows({ characteristics: { format: "  ", materials: null, assessment: undefined, video_lessons_count: 0, unknown: "Não exibir" } }), []);
  assert.equal(courseCharacteristicRows({ characteristics: { video_lessons_count: 1 } })[0].value, "1 videoaula");
  assert.equal(courseCharacteristicRows({ characteristics: { video_lessons_count: "12" } })[0].value, "12 videoaulas");
  assert.deepEqual(courseCharacteristicRows({ characteristics: { video_lessons_count: "doze" } }), []);
});

test("editor transforma quantidade em número e permite remover campos sem autocompletar", () => {
  const editable = editableCharacteristics({ format: "Presencial", video_lessons_count: 10 });
  editable.video_lessons_count = "12";
  editable.format = "";
  const payload = serializeCharacteristics(editable);
  assert.equal(payload.video_lessons_count, 12);
  assert.equal(payload.format, null);
  assert.equal(payload.materials, null);
  assert.equal(payload.video_lessons_duration, null);
});
