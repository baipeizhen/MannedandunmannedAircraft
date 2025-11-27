<template>
  <el-container class="app-layout">
    <!-- 顶部 -->
    <el-header height="60px">
      <div class="horizontal-header">
        <div class="horizontal-header-left">
          <span>融合运行空域容流管理系统</span>
        </div>
        <el-menu :default-active="activeIndex" mode="horizontal" router text-color="#fff"
          class="horizontal-header-menu">
          <el-menu-item :index="item.path" v-for="item in menuList" :key="item.path" >{{
            item.title }}</el-menu-item>
        </el-menu>
      </div>
    </el-header>
    <el-main>
      <router-view></router-view>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { generateMenu } from '@/utils/menu'
import { routes } from '@/router'
import { useRoute } from 'vue-router'
const menuList = generateMenu(routes)
const activeIndex = ref('/home')
// 获取当前路由
const currentRoute = useRoute()
// 监听路由变化
watch(() => currentRoute.path, (newPath) => {
  activeIndex.value = newPath
})
</script>
<style lang="scss" scoped>
.app-layout {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;

  .el-header {
    padding: 0;
    border-bottom: 1px solid #36bcff;
    background-color: #282828;

    .horizontal-header {
      display: flex;
      align-items: center;
    }

    .horizontal-header-left {
      display: flex;
      align-items: center;
      width: auto;
      min-width: 200px;
      height: 100%;
      padding-left: 10px;
      padding-right: 40px;
      cursor: pointer;
      transition: all var(--pure-transition-duration) ease;


      span {
        display: inline-block;
        height: 32px;
        margin: 2px 0 0 12px;
        overflow: hidden;
        font-size: 18px;
        font-weight: 600;
        line-height: 32px;
        color: var(--el-color-primary);
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .horizontal-header-menu {
      flex: 1;
      align-items: center;
      min-width: 0;
      height: 100%;
    }

    .el-menu {
      // justify-content: center; 
      background: transparent;
      border-bottom: none;
    }
  }

  .el-main {
    background: #282828;
    padding: 0 !important;
    overflow: hidden;
  }
}
</style>