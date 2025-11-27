<template>
    <div class="flight-plan-list">
        <el-row style="margin-bottom: 10px;margin-top: 10px;">
            <el-col :span="5">
                <span>航班号：</span>
                <el-select v-model="callsign"  placeholder="请输入航班号" style="width: 200px;" filterable :clearable="true">
                    <el-option v-for="item in callsignList" :key="item.value" :value="item.value" :label="item.label"></el-option>
                </el-select>
            </el-col>
            <el-col :span="5">
                <span>起飞机场：</span>
                <el-select v-model="depAP"  placeholder="请输入起飞机场" style="width: 200px;" filterable :clearable="true">
                    <el-option v-for="item in depAPList" :key="item.value" :value="item.value" :label="item.label"></el-option>
                </el-select>
            </el-col>
            <el-col :span="5">
                <span>落地机场：</span>
                <el-select v-model="arrAP"  placeholder="请输入落地机场" style="width: 200px;" filterable :clearable="true">
                    <el-option v-for="item in arrAPList" :key="item.value" :value="item.value" :label="item.label"></el-option>
                </el-select>
            </el-col>
        </el-row>
        <el-table :data="flightPlanList"  style="width: 100%;" height="1000" v-loading="loading" empty-text="暂无数据" :header-cell-style="{ fontWeight: 'bold',color:'#000' }" :cell-style="{ background:'#F5F5F5' }">
            <el-table-column prop="flightID" label="航班ID" align="center"></el-table-column>
            <el-table-column prop="callsign" label="航班号" align="center"></el-table-column>
            <el-table-column prop="acfttype" label="机型" align="center"></el-table-column>
            <el-table-column prop="depAP" label="起飞机场" align="center"></el-table-column>
            <el-table-column prop="arrAP" label="落地机场" align="center"></el-table-column>
            <el-table-column prop="sobt" label="计划撤轮档时间" align="center" width="180"></el-table-column>
            <el-table-column prop="sibt" label="计划挡轮档时间" align="center" width="180"></el-table-column>
            <el-table-column prop="cldt" label="计算落地时间" align="center" width="180"></el-table-column>
            <el-table-column prop="ctot" label="计算起飞时间" align="center" width="180"></el-table-column>
            <el-table-column prop="eldt" label="计划落地时间" align="center" width="180"  ></el-table-column>
            <el-table-column prop="etot" label="计划起飞时间" align="center" width="180"></el-table-column>
            <el-table-column prop="route" label="飞行航路" align="center" show-overflow-tooltip></el-table-column>
        </el-table>
    </div>
</template>
<script lang="ts" setup>
import { getFlightPlanList } from '@/api/optimizationStrategy'
import { onMounted, ref,watch } from 'vue'

const callsign = ref('')
const depAP = ref('')
const callsignList = ref([])
const depAPList = ref([])
const arrAPList = ref([])
const arrAP = ref('')
const flightPlanList = ref([])
const loading = ref(true)
const orgiintableData = ref([])
onMounted(() => {
    getFlightPlanList().then((res: any) => {
        console.log(res)
        if (res.code == '0') {
            loading.value = false
            flightPlanList.value = res.data
            orgiintableData.value = res.data
            callsignList.value = [...new Set(res.data.map((item: any) => item.callsign))].map((item: string) => {
                return {
                    value: item,
                    label: item
                }
            })
            depAPList.value = [...new Set(res.data.map((item: any) => item.depAP))].map((item: string) => {
                return {
                    value: item,
                    label: item
                }
            })
            arrAPList.value = [...new Set(res.data.map((item: any) => item.arrAP))].map((item: string) => {
                return {
                    value: item,
                    label: item
                }
            })
        }
    }).catch(() => {
        loading.value = false
    }).finally(() => {
        loading.value = false
    })
})
watch([callsign, depAP, arrAP], (newValues) => {
    // newValues[0] = 新的航班号、newValues[1] = 新的起飞机场、newValues[2] = 新的落地机场
    const [newCallsign, newDepAP, newArrAP] = newValues

    // 从原始数据中筛选符合所有条件的记录
    const filteredData = orgiintableData.value.filter((item: any) => {
        // 条件1：航班号匹配（空值则不筛选）
        const isCallsignMatch = !newCallsign || item.callsign === newCallsign
        // 条件2：起飞机场匹配（空值则不筛选）
        const isDepAPMatch = !newDepAP || item.depAP === newDepAP
        // 条件3：落地机场匹配（空值则不筛选）
        const isArrAPMatch = !newArrAP || item.arrAP === newArrAP

        // 所有条件都满足才保留
        return isCallsignMatch && isDepAPMatch && isArrAPMatch
    })

    // 更新表格展示数据
    flightPlanList.value = filteredData
}, {
    immediate: true, // 初始加载时立即执行一次（确保表格初始数据正确）
    deep: false // 筛选条件是基本类型（字符串），无需深度监听
})
</script>
<style scoped lang="scss">
.flight-plan-list {
   width: 100%;
   height: 100%;
   overflow: hidden;
}
</style>
