<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import { Search, X } from "lucide-vue-next";
import AdminPageHeader from "../../components/admin/AdminPageHeader.vue";
import AdminState from "../../components/admin/AdminState.vue";
import { createAdminFaq, getAdminCourses, getAdminFaq, getAdminFaqs, updateAdminFaq } from "../../services/adminApi";

defineProps({ id: String });
const route = useRoute();
const router = useRouter();
const isEdit = computed(() => Boolean(route.params.id));
const loading = ref(isEdit.value);
const saving = ref(false);
const error = ref("");
const isDirty = ref(false);
const allCourses = ref([]);
const courseSearch = ref("");
const duplicateWarning = ref("");
let duplicateCheckTimer;

const form = reactive({
  question: "",
  answer: "",
  application_mode: "all_courses",
  course_ids: [],
  is_published: false,
  sort_order: 0,
});

const selectedCourses = computed(() => allCourses.value.filter((course) => form.course_ids.includes(course.id)));
const filteredCourses = computed(() => {
  const term = courseSearch.value.trim().toLowerCase();
  if (!term) return allCourses.value;
  return allCourses.value.filter((course) => course.name.toLowerCase().includes(term));
});

function markDirty() {
  isDirty.value = true;
}
function toggleCourse(courseId) {
  const index = form.course_ids.indexOf(courseId);
  if (index === -1) form.course_ids.push(courseId);
  else form.course_ids.splice(index, 1);
  markDirty();
}
function removeCourse(courseId) {
  form.course_ids = form.course_ids.filter((id) => id !== courseId);
  markDirty();
}
function normalize(text) {
  return text.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.!?]+$/, "");
}
function checkDuplicateQuestion() {
  clearTimeout(duplicateCheckTimer);
  duplicateWarning.value = "";
  const question = form.question.trim();
  if (question.length < 6) return;
  duplicateCheckTimer = setTimeout(async () => {
    try {
      const payload = await getAdminFaqs({ search: question, per_page: 5 });
      const normalized = normalize(question);
      const match = payload.data.find((faq) => faq.id !== Number(route.params.id) && normalize(faq.question) === normalized);
      if (match) duplicateWarning.value = `Já existe uma FAQ parecida: "${match.question}". Verifique se não é uma duplicata antes de salvar.`;
    } catch (_) {
      // silencioso: o aviso é apenas um auxílio, não deve bloquear o formulário
    }
  }, 400);
}
function loadFaq(faq) {
  Object.assign(form, {
    question: faq.question,
    answer: faq.answer,
    application_mode: faq.application_mode,
    course_ids: faq.course_ids || [],
    is_published: faq.is_published,
    sort_order: faq.sort_order,
  });
  isDirty.value = false;
}
function payload(isPublished) {
  return {
    question: form.question,
    answer: form.answer,
    application_mode: form.application_mode,
    course_ids: form.application_mode === "selected_courses" ? form.course_ids : [],
    is_published: isPublished,
    sort_order: form.sort_order,
  };
}
async function save(isPublished) {
  error.value = "";
  saving.value = true;
  try {
    const response = isEdit.value
      ? await updateAdminFaq(route.params.id, payload(isPublished))
      : await createAdminFaq(payload(isPublished));
    loadFaq(response.data);
    isDirty.value = false;
    await router.replace({ name: "admin-faq-edit", params: { id: response.data.id } });
  } catch (requestError) {
    error.value =
      requestError.errors?.question?.[0] ||
      requestError.errors?.answer?.[0] ||
      requestError.errors?.application_mode?.[0] ||
      requestError.errors?.course_ids?.[0] ||
      requestError.errors?.["course_ids.0"]?.[0] ||
      requestError.message;
  } finally {
    saving.value = false;
  }
}
function cancel() {
  if (!isDirty.value || window.confirm("Existem alterações não salvas. Deseja sair mesmo assim?"))
    router.push({ name: "admin-faqs" });
}
onBeforeRouteLeave(() => {
  if (isDirty.value && !saving.value)
    return window.confirm("Existem alterações não salvas. Deseja sair mesmo assim?");
});
onMounted(async () => {
  try {
    const coursePayload = await getAdminCourses({ per_page: 50, sort: "name", direction: "asc" });
    allCourses.value = coursePayload.data;
    if (isEdit.value) {
      const faqPayload = await getAdminFaq(route.params.id);
      loadFaq(faqPayload.data);
    }
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <AdminPageHeader
    :title="isEdit ? 'Editar FAQ' : 'Nova FAQ'"
    :description="isEdit ? 'Altere a pergunta e os cursos onde ela aparece.' : 'Cadastre uma pergunta reutilizável entre um ou mais cursos.'"
    ><template #actions
      ><button class="admin-button ghost" type="button" @click="cancel">Cancelar</button
      ><button class="admin-button secondary" type="button" :disabled="saving" @click="save(false)">Salvar rascunho</button
      ><button class="admin-button primary" type="button" :disabled="saving" @click="save(true)">
        {{ saving ? "Salvando…" : "Publicar" }}
      </button></template
    ></AdminPageHeader
  ><AdminState v-if="loading" message="Carregando FAQ…" />
  <form v-else class="course-form" @submit.prevent="save(form.is_published)">
    <p v-if="error" class="form-alert error" role="alert">{{ error }}</p>
    <section class="form-card">
      <div class="form-card-heading">
        <div>
          <h2>Pergunta</h2>
          <p>Esta pergunta pode ser reutilizada em quantos cursos forem necessários.</p>
        </div>
      </div>
      <label
        >Pergunta<input
          v-model="form.question"
          required
          maxlength="255"
          @input="
            markDirty();
            checkDuplicateQuestion();
          "
      /></label>
      <p v-if="duplicateWarning" class="form-alert warning" role="status">{{ duplicateWarning }}</p>
      <label>Resposta<textarea v-model="form.answer" required rows="5" @input="markDirty"></textarea></label>
    </section>
    <section class="form-card">
      <div class="form-card-heading">
        <div>
          <h2>Onde esta FAQ aparece</h2>
          <p>Escolha se a pergunta vale para todos os cursos ou apenas para alguns.</p>
        </div>
      </div>
      <div class="switch-row application-mode-row">
        <label
          ><input v-model="form.application_mode" type="radio" value="all_courses" @change="markDirty" />
          Todos os cursos</label
        ><label
          ><input v-model="form.application_mode" type="radio" value="selected_courses" @change="markDirty" />
          Cursos selecionados</label
        >
      </div>
      <div v-if="form.application_mode === 'selected_courses'" class="course-picker">
        <p class="course-picker-count">{{ form.course_ids.length }} curso{{ form.course_ids.length === 1 ? "" : "s" }} selecionado{{ form.course_ids.length === 1 ? "" : "s" }}</p>
        <div v-if="selectedCourses.length" class="course-chips">
          <span v-for="course in selectedCourses" :key="course.id" class="course-chip">
            {{ course.name }}
            <button type="button" :aria-label="`Remover ${course.name}`" @click="removeCourse(course.id)"><X :size="13" /></button>
          </span>
        </div>
        <div class="admin-search-input course-picker-search">
          <Search :size="16" /><input v-model="courseSearch" type="search" placeholder="Buscar curso pelo nome" />
        </div>
        <div class="course-picker-list">
          <label v-for="course in filteredCourses" :key="course.id">
            <input type="checkbox" :checked="form.course_ids.includes(course.id)" @change="toggleCourse(course.id)" />
            <span>{{ course.name }}</span>
          </label>
          <p v-if="!filteredCourses.length" class="muted-box">Nenhum curso encontrado com este termo.</p>
        </div>
      </div>
    </section>
    <section class="form-card">
      <div class="form-card-heading">
        <div>
          <h2>Publicação e ordem</h2>
        </div>
      </div>
      <div class="form-grid two">
        <label>Ordem de exibição<input v-model.number="form.sort_order" type="number" min="0" @input="markDirty" /></label>
      </div>
      <div class="switch-row">
        <label><input v-model="form.is_published" type="checkbox" @change="markDirty" />Publicar</label>
      </div>
    </section>
  </form>
</template>
