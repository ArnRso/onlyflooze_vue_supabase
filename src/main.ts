import { createApp } from "vue";
import App from "@/App.vue";
import router from "./router";
import "./assets/main.css";
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query";
import "vue-multiselect/dist/vue-multiselect.css";

const app = createApp(App);
app.use(router);

// Ajout de TanStack Query
const queryClient = new QueryClient();
app.use(VueQueryPlugin, { queryClient });

app.mount("#app");
