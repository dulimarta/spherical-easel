import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Easel from "@/views/Easel.vue";
import Login from "@/views/Login.vue";
import PhotoCropper from "@/views/PhotoCropper.vue";
import TeacherDashboard from "@/views/TeacherDashboard.vue";
import StudentDashboard from "@/views/StudentDashboard.vue";
let routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Home",
    component: Easel
  },
  {
    path: "/account",
    name: "Account",
    component: Login
  },
  {
    /* Use this path to automatically load a saved construction */
    path: "/construction/:documentId",
    name: "Construction",
    component: Easel,
    props: true
  },
  {
    path: "/settings",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/Settings.vue"),
    children: [
      {
        path: "/",
        component: () => import("@/views/ProfilePicture.vue")
      },
      {
        name: "PhotoCapture",
        path: "photocapture",
        component: () => import("@/views/PhotoCapture.vue")
      },
      {
        name: "PhotoCropper",
        path: "photocropper/:image",
        component: PhotoCropper,
        props: true
      }
    ]
  },
  {
    name: "Teacher Dashboard",
    path: "/teacher-dashboard",
    component: TeacherDashboard
  },
  {
    name: "Student Dashboard",
    path: "/student-dashboard",
    component: StudentDashboard
  }

];

if (import.meta.env.MODE !== "production") {
  routes.push({
    /* A rudimentary tool to clean up unused SVG/script files in Firebase Storage */
    path: "/firebase-cleanup",
    component: () => import("@/components/FirebaseStorageGarbageCollector.vue")
  });
}

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});
