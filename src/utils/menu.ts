import type { RouteRecordRaw } from "vue-router";

export interface MenuItem {
  title: string;
  icon?: string;
  path: string;
  children?: MenuItem[];
}

export function generateMenu(routes: RouteRecordRaw[]): MenuItem[] {
  return routes
    .filter((route) => route.meta?.title)
    .map((route) => ({
      title: route.meta!.title as string,
      path: route.path,
    }));
}
