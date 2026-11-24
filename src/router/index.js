import { createRouter, createWebHistory } from "vue-router";
import NotFoundView from "../views/NotFoundView.vue";
import { setPageSeo } from "../services/seo";
import { INDEXABLE_PAGES } from "../services/publicPages";
import HomeView from "../views/HomeView.vue";
import CoursesView from "../views/CoursesView.vue";
import CourseView from "../views/CourseView.vue";
import AboutView from "../views/AboutView.vue";
import PrivacyView from "../views/PrivacyView.vue";
import TermsView from "../views/TermsView.vue";
import BlogView from "../views/BlogView.vue";
import BlogPostView from "../views/BlogPostView.vue";
import AdminLayout from "../components/admin/AdminLayout.vue";
import AdminLoginView from "../views/admin/AdminLoginView.vue";
import AdminDashboardView from "../views/admin/AdminDashboardView.vue";
import AdminCoursesView from "../views/admin/AdminCoursesView.vue";
import AdminCourseFormView from "../views/admin/AdminCourseFormView.vue";
import AdminTestimonialsView from "../views/admin/AdminTestimonialsView.vue";
import AdminTestimonialFormView from "../views/admin/AdminTestimonialFormView.vue";
import AdminFaqsView from "../views/admin/AdminFaqsView.vue";
import AdminFaqFormView from "../views/admin/AdminFaqFormView.vue";
import AdminAttendancesView from "../views/admin/AdminAttendancesView.vue";
import AdminMediaView from "../views/admin/AdminMediaView.vue";
import AdminAppearanceView from "../views/admin/AdminAppearanceView.vue";
import AdminSettingsView from "../views/admin/AdminSettingsView.vue";
import AdminLogsView from "../views/admin/AdminLogsView.vue";
import AdminBlogPostsView from "../views/admin/AdminBlogPostsView.vue";
import AdminBlogPostFormView from "../views/admin/AdminBlogPostFormView.vue";
import AdminBlogCommentsView from "../views/admin/AdminBlogCommentsView.vue";
import AdminInitialPasswordView from "../views/admin/AdminInitialPasswordView.vue";
import { adminSession } from "../services/adminSession";

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: "/:pathMatch(.*)*", name: "not-found", component: NotFoundView },
    { path: INDEXABLE_PAGES.home, name: "home", component: HomeView },
    { path: INDEXABLE_PAGES.courses, name: "courses", component: CoursesView },
    { path: INDEXABLE_PAGES.about, name: "about", component: AboutView },
    { path: INDEXABLE_PAGES.privacy, name: "privacy", component: PrivacyView },
    { path: INDEXABLE_PAGES.terms, name: "terms", component: TermsView },
    {
      path: "/cursos/:slug",
      name: "course",
      component: CourseView,
      props: true,
    },
    { path: INDEXABLE_PAGES.blog, name: "blog", component: BlogView },
    {
      path: "/blog/:slug",
      name: "blog-post",
      component: BlogPostView,
      props: true,
    },
    {
      path: "/admin/login",
      name: "admin-login",
      component: AdminLoginView,
      meta: { adminPublic: true },
    },
    {
      path: "/admin/primeiro-acesso",
      name: "admin-initial-password",
      component: AdminInitialPasswordView,
      meta: { requiresAdmin: true, passwordChange: true },
    },
    {
      path: "/admin",
      component: AdminLayout,
      meta: { requiresAdmin: true },
      children: [
        {
          path: "",
          name: "admin-dashboard",
          component: AdminDashboardView,
          meta: { title: "Visão geral" },
        },
        {
          path: "cursos",
          name: "admin-courses",
          component: AdminCoursesView,
          meta: { title: "Cursos" },
        },
        {
          path: "cursos/novo",
          name: "admin-course-new",
          component: AdminCourseFormView,
          meta: { title: "Novo curso" },
        },
        {
          path: "cursos/:id/editar",
          name: "admin-course-edit",
          component: AdminCourseFormView,
          props: true,
          meta: { title: "Editar curso" },
        },
        {
          path: "depoimentos",
          name: "admin-testimonials",
          component: AdminTestimonialsView,
          meta: { title: "Depoimentos" },
        },
        {
          path: "depoimentos/novo",
          name: "admin-testimonial-new",
          component: AdminTestimonialFormView,
          meta: { title: "Novo depoimento" },
        },
        {
          path: "depoimentos/:id/editar",
          name: "admin-testimonial-edit",
          component: AdminTestimonialFormView,
          props: true,
          meta: { title: "Editar depoimento" },
        },
        {
          path: "blog",
          name: "admin-blog",
          component: AdminBlogPostsView,
          meta: { title: "Blog" },
        },
        {
          path: "blog/novo",
          name: "admin-blog-new",
          component: AdminBlogPostFormView,
          meta: { title: "Novo artigo" },
        },
        {
          path: "blog/:id/editar",
          name: "admin-blog-edit",
          component: AdminBlogPostFormView,
          props: true,
          meta: { title: "Editar artigo" },
        },
        {
          path: "blog/comentarios",
          name: "admin-blog-comments",
          component: AdminBlogCommentsView,
          meta: { title: "Comentários do blog" },
        },
        {
          path: "faqs",
          name: "admin-faqs",
          component: AdminFaqsView,
          meta: { title: "FAQs" },
        },
        {
          path: "faqs/nova",
          name: "admin-faq-new",
          component: AdminFaqFormView,
          meta: { title: "Nova FAQ" },
        },
        {
          path: "faqs/:id/editar",
          name: "admin-faq-edit",
          component: AdminFaqFormView,
          props: true,
          meta: { title: "Editar FAQ" },
        },
        {
          path: "midias",
          name: "admin-media",
          component: AdminMediaView,
          meta: { title: "Mídia" },
        },
        {
          path: "aparencia",
          name: "admin-appearance",
          component: AdminAppearanceView,
          meta: { title: "Aparência das páginas" },
        },
        {
          path: "atendimentos",
          name: "admin-attendances",
          component: AdminAttendancesView,
          meta: { title: "Atendimentos" },
        },
        {
          path: "configuracoes",
          name: "admin-settings",
          component: AdminSettingsView,
          meta: { title: "Configurações" },
        },
        {
          path: "logs",
          name: "admin-logs",
          component: AdminLogsView,
          meta: { title: "Logs" },
        },
      ],
    },
  ],
});

router.beforeEach((to) => {
  if (to.meta.requiresAdmin && !adminSession.token)
    return { name: "admin-login", query: { redirect: to.fullPath } };
  if (to.name === "admin-login" && adminSession.token)
    return {
      name: adminSession.user?.must_change_password
        ? "admin-initial-password"
        : "admin-dashboard",
    };
  if (
    to.meta.requiresAdmin &&
    adminSession.user?.must_change_password &&
    !to.meta.passwordChange
  )
    return { name: "admin-initial-password" };
  if (
    to.meta.passwordChange &&
    adminSession.user &&
    !adminSession.user.must_change_password
  )
    return { name: "admin-dashboard" };
});

router.afterEach((to, from) => {
  if (
    ["course", "blog-post"].includes(to.name) &&
    from.name === to.name &&
    to.params.slug === from.params.slug
  )
    return;
  if (to.name === "blog" && from.name === "blog") return;
  setPageSeo(
    to.name === "course"
      ? "loading"
      : to.name === "blog-post"
        ? "loading-article"
        : to.path.startsWith("/admin")
        ? "admin"
        : to.name,
  );
});
export default router;
