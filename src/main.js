import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./styles/main.css";
import "./styles/admin.css";
import "./styles/media.css";
import "./styles/public.css";
createApp(App).use(router).mount("#app");
