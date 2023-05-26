import { createApp } from 'vue'
import PageInteraction from './PageInteraction.vue'

const app_div = document.createElement('div');
app_div.id = 'app';
document.body.appendChild(app_div);

// Now mount the Vue app
createApp(PageInteraction).mount('#app');
