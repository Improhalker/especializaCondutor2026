<script setup>
import SkeletonBase from "./SkeletonBase.vue";
import SkeletonText from "./SkeletonText.vue";
</script>

<template>
  <section class="section testimonials" role="status" aria-busy="true">
    <span class="sr-only">Carregando conteúdo</span>
    <div class="container">
      <div class="section-heading" aria-hidden="true">
        <SkeletonBase variant="text" width="110px" height="12px" style="margin-bottom: 12px" />
        <SkeletonBase variant="text" width="55%" height="34px" style="margin-bottom: 10px" />
        <SkeletonBase variant="text" width="42%" height="16px" />
      </div>
      <div class="testimonial-carousel" aria-hidden="true">
        <div class="testimonial-carousel-viewport">
          <div class="testimonial-track">
            <div v-for="n in 3" :key="n" class="testimonial-slide">
              <div class="testimonial-card">
                <SkeletonText :lines="3" height="13px" gap="8px" />
                <footer class="testimonial-footer">
                  <SkeletonBase circle width="44px" height="44px" />
                  <SkeletonBase variant="text" width="120px" height="14px" />
                </footer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
