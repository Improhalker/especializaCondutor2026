<script setup>
import SkeletonBase from "./SkeletonBase.vue";
import SkeletonText from "./SkeletonText.vue";
import SkeletonFaqList from "./SkeletonFaqList.vue";
</script>

<template>
  <div class="course-layout" role="status" aria-busy="true">
    <span class="sr-only">Carregando conteúdo</span>
    <div class="course-main" aria-hidden="true">
      <div class="course-content">
        <SkeletonBase variant="text" width="260px" height="30px" style="margin-bottom: 10px" />
        <SkeletonBase variant="text" width="72%" height="15px" style="margin-bottom: 22px" />
        <div class="modality-selector">
          <div class="skeleton-modality-option">
            <SkeletonBase variant="text" width="88px" height="16px" />
            <SkeletonBase variant="text" width="56px" height="12px" />
          </div>
          <div class="skeleton-modality-option">
            <SkeletonBase variant="text" width="88px" height="16px" />
            <SkeletonBase variant="text" width="56px" height="12px" />
          </div>
        </div>
        <article class="modality-detail">
          <div class="modality-head">
            <div>
              <SkeletonBase variant="text" width="110px" height="12px" style="margin-bottom: 10px" />
              <SkeletonBase variant="text" width="210px" height="24px" />
            </div>
          </div>
          <SkeletonText :lines="3" height="14px" gap="9px" />
          <div style="margin-top: 20px">
            <SkeletonText :lines="4" height="14px" gap="11px" width="85%" last-line-width="60%" />
          </div>
          <div class="modality-footer">
            <div>
              <SkeletonBase variant="text" width="150px" height="12px" />
            </div>
            <SkeletonBase variant="button" width="190px" height="46px" />
          </div>
        </article>
      </div>
      <section class="faq course-faq" aria-hidden="true">
        <SkeletonBase variant="text" width="250px" height="26px" style="margin-bottom: 20px" />
        <SkeletonFaqList :count="3" />
      </section>
    </div>
    <aside class="course-aside skeleton-on-dark" aria-hidden="true">
      <SkeletonBase variant="text" width="120px" height="12px" style="margin-bottom: 12px" />
      <SkeletonBase variant="text" width="80%" height="24px" style="margin-bottom: 14px" />
      <SkeletonText :lines="2" height="14px" gap="8px" />
      <SkeletonBase variant="button" width="100%" height="46px" style="margin-top: 18px" />
    </aside>
  </div>
</template>
