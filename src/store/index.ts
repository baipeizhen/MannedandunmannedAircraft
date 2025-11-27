import { createPinia } from "pinia"; 
import type { App } from 'vue';
import {useMapStore} from './modules/flight'
const pinia = createPinia();
export const setupStore = (app: App) => {
  app.use(pinia);
};
export {
  useMapStore,
};
export default pinia;
