import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Easel from "@/views/Easel.vue";
import { WebGLRenderer } from 'three';

Vue.use(VueRouter);

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0xffffff);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "Home",
    component: Easel,
    props: {
      renderer,
      canvas: renderer.domElement
    }
  },
  {
    path: "/settings",
    name: "Settings",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/Settings.vue")
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
