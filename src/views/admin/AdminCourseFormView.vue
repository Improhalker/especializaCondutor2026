<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import { ChevronDown, ChevronUp, Eye, Plus, Trash2 } from "lucide-vue-next";
import AdminPageHeader from "../../components/admin/AdminPageHeader.vue";
import MediaPicker from "../../components/admin/media/MediaPicker.vue";
import AdminState from "../../components/admin/AdminState.vue";
import {
  createAdminCourse,
  getAdminCourse,
  getCategories,
  updateAdminCourse,
} from "../../services/adminApi";

defineProps({ id: String });
const route = useRoute();
const router = useRouter();
const isEdit = computed(() => Boolean(route.params.id));
const loading = ref(isEdit.value);
const saving = ref(false);
const error = ref("");
const categories = ref([]);
const seoOpen = ref(false);
const slugEdited = ref(false);
const isDirty = ref(false);
const blankModality = (name, sortOrder) => ({
  name,
  workload: "",
  description: "",
  featuresText: "",
  bonusesText: "",
  price_mode: "consult",
  price: "",
  price_label: "",
  whatsapp_message: "",
  sort_order: sortOrder,
  is_published: true,
});
const form = reactive({
  name: "",
  short_name: "",
  slug: "",
  category_id: "",
  summary: "",
  description: "",
  cover_image_path: "",
  cover_media_id: null,
  cover_media: null,
  cover_alt_text: "",
  requirements: [""],
  is_featured: false,
  is_published: false,
  sort_order: 0,
  meta_title: "",
  meta_description: "",
  modalities: [blankModality("Atualização", 1), blankModality("Formação", 2)],
  faqs: [],
});

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
function selectedMedia(media) {
  form.cover_media = media;
  form.cover_media_id = media?.id || null;
  markDirty();
}
function markDirty() {
  isDirty.value = true;
}
function updateSlug() {
  if (!slugEdited.value) form.slug = slugify(form.name);
  markDirty();
}
function lineArray(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
function loadCourse(course) {
  Object.assign(form, {
    ...course,
    category_id: course.category_id || "",
    requirements: course.requirements?.length ? course.requirements : [""],
    modalities: course.modalities.map((modality) => ({
      ...modality,
      featuresText: (modality.features || []).join("\n"),
      bonusesText: (modality.bonuses || []).join("\n"),
      price: modality.price || "",
    })),
    faqs: course.faqs || [],
  });
  isDirty.value = false;
}
function payload(isPublished) {
  const { cover_media, cover, created_at, updated_at, ...attributes } = form;
  return {
    ...attributes,
    category_id: form.category_id || null,
    requirements: form.requirements.filter(Boolean),
    is_published: isPublished,
    modalities: form.modalities.map(
      ({ featuresText, bonusesText, ...modality }) => ({
        ...modality,
        features: lineArray(featuresText),
        bonuses: lineArray(bonusesText),
        price: modality.price === "" ? null : modality.price,
      }),
    ),
    faqs: form.faqs.map((faq, index) => ({
      ...faq,
      sort_order: faq.sort_order ?? index + 1,
    })),
  };
}
function addRequirement() {
  form.requirements.push("");
  markDirty();
}
function removeRequirement(index) {
  form.requirements.splice(index, 1);
  if (!form.requirements.length) form.requirements.push("");
  markDirty();
}
function addFaq() {
  form.faqs.push({
    question: "",
    answer: "",
    sort_order: form.faqs.length + 1,
  });
  markDirty();
}
function removeFaq(index) {
  form.faqs.splice(index, 1);
  markDirty();
}
async function save(isPublished) {
  error.value = "";
  saving.value = true;
  try {
    const response = isEdit.value
      ? await updateAdminCourse(route.params.id, payload(isPublished))
      : await createAdminCourse(payload(isPublished));
    loadCourse(response.data);
    isDirty.value = false;
    await router.replace({
      name: "admin-course-edit",
      params: { id: response.data.id },
    });
  } catch (requestError) {
    error.value =
      requestError.errors?.cover_media_id?.[0] ||
      requestError.errors?.cover_alt_text?.[0] ||
      requestError.errors?.name?.[0] ||
      requestError.errors?.slug?.[0] ||
      requestError.message;
  } finally {
    saving.value = false;
  }
}
function cancel() {
  if (
    !isDirty.value ||
    window.confirm("Existem alterações não salvas. Deseja sair mesmo assim?")
  )
    router.push({ name: "admin-courses" });
}
onBeforeRouteLeave(() => {
  if (isDirty.value && !saving.value)
    return window.confirm(
      "Existem alterações não salvas. Deseja sair mesmo assim?",
    );
});
onMounted(async () => {
  try {
    const categoryPayload = await getCategories();
    categories.value = categoryPayload.data;
    if (isEdit.value) {
      const coursePayload = await getAdminCourse(route.params.id);
      loadCourse(coursePayload.data);
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
    :title="isEdit ? 'Editar curso' : 'Novo curso'"
    :description="
      isEdit
        ? 'Altere as informações que aparecem no catálogo público.'
        : 'Preencha os dados para criar uma página pública dinâmica.'
    "
    ><template #actions
      ><button class="admin-button ghost" type="button" @click="cancel">
        Cancelar</button
      ><button
        class="admin-button secondary"
        type="button"
        :disabled="saving"
        @click="save(false)"
      >
        Salvar rascunho</button
      ><button
        class="admin-button primary"
        type="button"
        :disabled="saving"
        @click="save(true)"
      >
        {{ saving ? "Salvando…" : "Publicar" }}
      </button></template
    ></AdminPageHeader
  ><AdminState v-if="loading" message="Carregando curso…" />
  <form v-else class="course-form" @submit.prevent="save(form.is_published)">
    <p v-if="error" class="form-alert error" role="alert">{{ error }}</p>
    <section class="form-card">
      <div class="form-card-heading">
        <div>
          <h2>Identidade do curso</h2>
          <p>Informações principais para a página e o catálogo.</p>
        </div>
      </div>
      <div class="form-grid two">
        <label
          >Nome completo<input
            v-model="form.name"
            required
            maxlength="255"
            @input="updateSlug" /></label
        ><label
          >Nome curto<input
            v-model="form.short_name"
            maxlength="120"
            placeholder="Ex.: MOPP"
            @input="markDirty" /></label
        ><label
          >Slug<small>Usado na URL pública.</small
          ><input
            v-model="form.slug"
            required
            pattern="[a-z0-9-]+"
            @input="
              slugEdited = true;
              markDirty();
            "
          /><span class="input-hint"
            >/cursos/{{ form.slug || "nome-do-curso" }}</span
          ></label
        ><label
          >Categoria<select v-model="form.category_id" @change="markDirty">
            <option value="">Sem categoria</option>
            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select></label
        >
      </div>
      <label
        >Resumo<input
          v-model="form.summary"
          required
          maxlength="500"
          placeholder="Apresentação curta do curso."
          @input="markDirty" /></label
      ><label
        >Descrição<textarea
          v-model="form.description"
          rows="5"
          placeholder="Apresentação detalhada do curso e da oferta divulgada pelo parceiro."
          @input="markDirty"
        ></textarea>
      </label>
    </section>
    <section class="form-card">
      <div class="form-card-heading">
        <div>
          <h2>Mídia e publicação</h2>
          <p>A capa é usada como apoio visual no catálogo.</p>
        </div>
      </div>
      <MediaPicker
        :model-value="form.cover_media"
        v-model:legacy-url="form.cover_image_path"
        v-model:alt-text="form.cover_alt_text"
        :course-name="form.name"
        @update:model-value="selectedMedia"
        @change="markDirty"
      />
      <div class="form-grid two">
        <label
          >Ordem de exibição<input
            v-model.number="form.sort_order"
            type="number"
            min="0"
            @input="markDirty"
        /></label>
      </div>
      <div class="switch-row">
        <label
          ><input
            v-model="form.is_featured"
            type="checkbox"
            @change="markDirty"
          />
          Destacar na página inicial</label
        ><label
          ><input
            v-model="form.is_published"
            type="checkbox"
            @change="markDirty"
          />
          Publicar no catálogo</label
        >
      </div>
    </section>
    <section class="form-card">
      <div class="form-card-heading">
        <div>
          <h2>Requisitos gerais</h2>
          <p>Exibidos antes das modalidades, quando aplicável.</p>
        </div>
        <button class="text-button" type="button" @click="addRequirement">
          <Plus :size="16" />Adicionar requisito
        </button>
      </div>
      <div class="repeat-list">
        <div v-for="(_, index) in form.requirements" :key="index">
          <input
            v-model="form.requirements[index]"
            maxlength="500"
            placeholder="Descreva um requisito"
            @input="markDirty"
          /><button
            type="button"
            aria-label="Remover requisito"
            @click="removeRequirement(index)"
          >
            <Trash2 :size="17" />
          </button>
        </div>
      </div>
    </section>
    <section class="form-card">
      <div class="form-card-heading">
        <div>
          <h2>Modalidades</h2>
          <p>Formação e Atualização ficam juntas na mesma página pública.</p>
        </div>
      </div>
      <div class="modality-form-grid">
        <article
          v-for="modality in form.modalities"
          :key="modality.name"
          class="modality-form"
        >
          <div class="modality-form-title">
            <h3>{{ modality.name }}</h3>
            <label class="mini-switch"
              ><input
                v-model="modality.is_published"
                type="checkbox"
                @change="markDirty"
              />
              Ativa</label
            >
          </div>
          <div class="form-grid two">
            <label
              >Carga horária<input
                v-model="modality.workload"
                maxlength="80"
                placeholder="Ex.: 16 horas-aula"
                @input="markDirty" /></label
            ><label
              >Ordem<input
                v-model.number="modality.sort_order"
                type="number"
                min="0"
                @input="markDirty"
            /></label>
          </div>
          <label
            >Descrição<textarea
              v-model="modality.description"
              rows="3"
              placeholder="Explique para quem esta modalidade é indicada."
              @input="markDirty"
            ></textarea></label
          ><label
            >Informações e recursos<small
              >Uma linha por item: formato, avaliação, certificação, observações
              etc.</small
            ><textarea
              v-model="modality.featuresText"
              rows="5"
              @input="markDirty"
            ></textarea></label
          ><label
            >Bônus<small>Um item por linha.</small
            ><textarea
              v-model="modality.bonusesText"
              rows="3"
              @input="markDirty"
            ></textarea>
          </label>
          <div class="form-grid three">
            <label
              >Modo de preço<select
                v-model="modality.price_mode"
                @change="markDirty"
              >
                <option value="hidden">Oculto</option>
                <option value="consult">Consultar condições</option>
                <option value="from">A partir de</option>
                <option value="visible">Preço visível</option>
              </select></label
            ><label v-if="['from', 'visible'].includes(modality.price_mode)"
              >Valor<input
                v-model="modality.price"
                type="number"
                min="0"
                step="0.01"
                @input="markDirty" /></label
            ><label
              >Rótulo de preço<input
                v-model="modality.price_label"
                maxlength="255"
                placeholder="Ex.: Consulte condições"
                @input="markDirty"
            /></label>
          </div>
          <label
            >Mensagem personalizada de WhatsApp<textarea
              v-model="modality.whatsapp_message"
              rows="2"
              :placeholder="`Olá! Tenho interesse no curso ${form.short_name || form.name || 'X'} — ${modality.name}.`"
              @input="markDirty"
            ></textarea>
          </label>
          <div class="whatsapp-preview">
            <Eye :size="16" /><span>{{
              modality.whatsapp_message ||
              `Olá! Tenho interesse no curso ${form.short_name || form.name || "X"} — ${modality.name}.`
            }}</span>
          </div>
        </article>
      </div>
    </section>
    <section class="form-card">
      <button
        class="form-card-toggle"
        type="button"
        :aria-expanded="seoOpen"
        @click="seoOpen = !seoOpen"
      >
        <span
          ><strong>SEO</strong
          ><small>Título e descrição para mecanismos de busca.</small></span
        ><ChevronUp v-if="seoOpen" :size="19" /><ChevronDown
          v-else
          :size="19"
        />
      </button>
      <div v-if="seoOpen" class="form-grid">
        <label
          >Título SEO<input
            v-model="form.meta_title"
            maxlength="255"
            @input="markDirty" /></label
        ><label
          >Descrição SEO<textarea
            v-model="form.meta_description"
            maxlength="500"
            rows="3"
            @input="markDirty"
          ></textarea>
        </label>
      </div>
    </section>
    <section class="form-card">
      <div class="form-card-heading">
        <div>
          <h2>Perguntas frequentes do curso</h2>
          <p>Adicione apenas dúvidas relevantes a esta especialização.</p>
        </div>
        <button class="text-button" type="button" @click="addFaq">
          <Plus :size="16" />Adicionar pergunta
        </button>
      </div>
      <div v-if="!form.faqs.length" class="muted-box">
        Nenhuma pergunta específica cadastrada.
      </div>
      <div class="faq-editor">
        <div v-for="(faq, index) in form.faqs" :key="faq.id || index">
          <label
            >Pergunta<input
              v-model="faq.question"
              maxlength="255"
              @input="markDirty" /></label
          ><label
            >Resposta<textarea
              v-model="faq.answer"
              rows="3"
              @input="markDirty"
            ></textarea></label
          ><button type="button" class="text-danger" @click="removeFaq(index)">
            <Trash2 :size="16" />Remover
          </button>
        </div>
      </div>
    </section>
  </form>
</template>
