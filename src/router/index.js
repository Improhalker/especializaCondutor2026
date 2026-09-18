import { createRouter, createWebHistory } from "vue-router";
import NotFoundView from "../views/NotFoundView.vue";
import { setPageSeo } from "../services/seo";
import HomeView from "../views/HomeView.vue";
import CoursesView from "../views/CoursesView.vue";
import CourseView from "../views/CourseView.vue";
import AdminLayout from "../components/admin/AdminLayout.vue";
import AdminLoginView from "../views/admin/AdminLoginView.vue";
import AdminDashboardView from "../views/admin/AdminDashboardView.vue";
import AdminCoursesView from "../views/admin/AdminCoursesView.vue";
import AdminCourseFormView from "../views/admin/AdminCourseFormView.vue";
import AdminAttendancesView from "../views/admin/AdminAttendancesView.vue";
import AdminMediaView from "../views/admin/AdminMediaView.vue";
import AdminSettingsView from "../views/admin/AdminSettingsView.vue";
import AdminInitialPasswordView from "../views/admin/AdminInitialPasswordView.vue";
import { adminSession } from "../services/adminSession";

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: "/:pathMatch(.*)*", name: "not-found", component: NotFoundView },
    { path: "/", name: "home", component: HomeView },
    { path: "/cursos", name: "courses", component: CoursesView },
    {
      path: "/cursos/:slug",
      name: "course",
      component: CourseView,
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
          path: "midias",
          name: "admin-media",
          component: AdminMediaView,
          meta: { title: "Mídia" },
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
      ],
    },
  ],
});

router.beforeEach((to) => {
  if (to.meta.requiresAdmin && !adminSession.token)
    return { name: "admin-login" };
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
    to.name === "course" &&
    from.name === "course" &&
    to.params.slug === from.params.slug
  )
    return;
  setPageSeo(
    to.name === "course"
      ? "loading"
      : to.path.startsWith("/admin")
        ? "admin"
        : to.name,
  );
});
export default router;
