<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import { Star } from "lucide-vue-next";
import AdminPageHeader from "../../components/admin/AdminPageHeader.vue";
import HeroMediaField from "../../components/admin/HeroMediaField.vue";
import AdminState from "../../components/admin/AdminState.vue";
import TestimonialCard from "../../components/testimonials/TestimonialCard.vue";
import { createAdminTestimonial, getAdminTestimonial, updateAdminTestimonial } from "../../services/adminApi";

defineProps({ id: String });
const route = useRoute();
const router = useRouter();
const isEdit = computed(() => Boolean(route.params.id));
const loading = ref(isEdit.value);
const saving = ref(false);
const error = ref("");
const isDirty = ref(false);

const form = reactive({
  name: "",
  content: "",
  rating: 5,
  avatar_media_id: null,
  avatar_media: null,
  is_published: false,
  sort_order: 0,
});

function markDirty() {
  isDirty.value = true;
}
function setRating(value) {
  form.rating = value;
  markDirty();
}
function selectedAvatar(media) {
  form.avatar_media = media;
  form.avatar_media_id = media?.id || null;
  markDirty();
}
function loadTestimonial(testimonial) {
  Object.assign(form, {
    name: testimonial.name,
    content: testimonial.content,
    rating: testimonial.rating,
    avatar_media_id: testimonial.avatar_media_id,
    avatar_media: testimonial.avatar_media,
    is_published: testimonial.is_published,
    sort_order: testimonial.sort_order,
  });
  isDirty.value = false;
}
function payload(isPublished) {
  return {
    name: form.name,
    content: form.content,
    rating: form.rating,
    avatar_media_id: form.avatar_media_id,
    is_published: isPublished,
    sort_order: form.sort_order,
  };
}
async function save(isPublished) {
  error.value = "";
  saving.value = true;
  try {
    const response = isEdit.value
      ? await updateAdminTestimonial(route.params.id, payload(isPublished))
      : await createAdminTestimonial(payload(isPublished));
    loadTestimonial(response.data);
    isDirty.value = false;
    await router.replace({ name: "admin-testimonial-edit", params: { id: response.data.id } });
  } catch (requestError) {
    error.value =
      requestError.errors?.avatar_media_id?.[0] ||
      requestError.errors?.name?.[0] ||
      requestError.errors?.content?.[0] ||
      requestError.errors?.rating?.[0] ||
      requestError.message;
  } finally {
    saving.value = false;
  }
}
function cancel() {
  if (!isDirty.value || window.confirm("Existem alterações não salvas. Deseja sair mesmo assim?"))
    router.push({ name: "admin-testimonials" });
}
onBeforeRouteLeave(() => {
  if (isDirty.value && !saving.value)
    return window.confirm("Existem alterações não salvas. Deseja sair mesmo assim?");
});
onMounted(async () => {
  try {
    if (isEdit.value) {
      const testimonialPayload = await getAdminTestimonial(route.params.id);
      loadTestimonial(testimonialPayload.data);
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
    :title="isEdit ? 'Editar depoimento' : 'Novo depoimento'"
    :description="isEdit ? 'Altere as informações exibidas no carrossel público.' : 'Cadastre um novo depoimento para o carrossel da página inicial.'"
    ><template #actions
      ><button class="admin-button ghost" type="button" @click="cancel">Cancelar</button
      ><button class="admin-button secondary" type="button" :disabled="saving" @click="save(false)">Salvar rascunho</button
      ><button class="admin-button primary" type="button" :disabled="saving" @click="save(true)">
        {{ saving ? "Salvando…" : "Publicar" }}
      </button></template
    ></AdminPageHeader
  ><AdminState v-if="loading" message="Carregando depoimento…" />
  <div v-else class="testimonial-form-layout">
    <form class="course-form" @submit.prevent="save(form.is_published)">
      <p v-if="error" class="form-alert error" role="alert">{{ error }}</p>
      <section class="form-card">
        <div class="form-card-heading">
          <div>
            <h2>Depoimento</h2>
            <p>Nome da pessoa e o texto que será exibido publicamente.</p>
          </div>
        </div>
        <label>Nome<input v-model="form.name" required maxlength="255" @input="markDirty" /></label>
        <label>Texto do depoimento<textarea v-model="form.content" required rows="5" maxlength="2000" @input="markDirty"></textarea></label>
        <label
          >Avaliação
          <div class="star-picker" role="radiogroup" aria-label="Avaliação de 1 a 5 estrelas">
            <button
              v-for="n in 5"
              :key="n"
              type="button"
              class="star-picker-button"
              role="radio"
              :aria-checked="n === form.rating"
              :aria-label="`${n} estrela${n > 1 ? 's' : ''}`"
              @click="setRating(n)"
            >
              <Star :size="26" :fill="n <= form.rating ? '#e8a723' : 'transparent'" :color="n <= form.rating ? '#e8a723' : '#cfdce6'" />
            </button>
          </div>
        </label>
      </section>
      <section class="form-card">
        <div class="form-card-heading">
          <div>
            <h2>Foto e publicação</h2>
            <p>A foto é opcional — sem ela, mostramos as iniciais do nome.</p>
          </div>
        </div>
        <HeroMediaField :media="form.avatar_media" label="Foto do depoimento" description="Formatos aceitos: JPG, PNG ou WebP." @select="selectedAvatar" />
        <div class="form-grid two">
          <label>Ordem de exibição<input v-model.number="form.sort_order" type="number" min="0" @input="markDirty" /></label>
        </div>
        <div class="switch-row">
          <label><input v-model="form.is_published" type="checkbox" @change="markDirty" />Publicar no carrossel</label>
        </div>
      </section>
    </form>
    <aside class="testimonial-preview">
      <p class="testimonial-preview-label">Prévia do card</p>
      <TestimonialCard
        :name="form.name || 'Nome da pessoa'"
        :content="form.content || 'O texto do depoimento aparecerá aqui.'"
        :rating="form.rating"
        :avatar-url="form.avatar_media?.url || ''"
        :avatar-alt="form.name"
      />
    </aside>
  </div>
</template>
