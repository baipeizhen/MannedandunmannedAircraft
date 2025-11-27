<template>
    <div class="wrape">
        <div>
            <el-checkbox v-model="checked1" label="扇区平均飞行时间" />
            <el-checkbox v-model="checked2" label="扇区平均飞行距离" />
            <el-checkbox v-model="checked3" label="扇区平均冲突" />
            <el-checkbox v-model="checked4" label="扇区平均流量" />
            <el-checkbox v-model="checked5" label="扇区平均复杂度" />
            <el-checkbox v-model="checked6" label="扇区平均容流比" />
        </div>
        <div class="chartBox">
            <div class="chartItem" v-if="checked1">
                <demo-chart :chartData="chartData" :legend="['历史实际平均时长', '预测平均时长']" metricKey="averageDuration"
                    yAxisName="扇区平均飞行时间"></demo-chart>
            </div>
            <div class="chartItem" v-if="checked2">
                <demo-chart :chartData="chartData" :legend="['历史平均飞行距离', '预测平均飞行距离']" metricKey="avergaeDistanceFlown"
                    yAxisName="扇区平均飞行距离"></demo-chart>
            </div>
            <div class="chartItem" v-if="checked3">
                <demo-chart :chartData="chartData" :legend="['历史冲突', '预测冲突']" metricKey="conflict"
                    yAxisName="冲突"></demo-chart>
            </div>
            <div class="chartItem" v-if="checked4">
                <demo-chart :chartData="chartData" :legend="['历史流量', '预测流量']" metricKey="flow"
                    yAxisName="流量"></demo-chart>
            </div>
            <div class="chartItem" v-if="checked5">
                <demo-chart :chartData="chartData" :legend="['历史复杂度', '预测复杂度']" metricKey="complexity"
                    yAxisName="复杂度"></demo-chart>
            </div>
            <div class="chartItem" v-if="checked6">
                <demo-chart :chartData="ratioCapacityAndFlowData" :legend="['历史容流比', '预测容流比']"
                    metricKey="ratioCapacityAndFlow" yAxisName="容流比">
                    <template v-slot:select>
                        <span>时间间隔：</span>
                        <el-select v-model="Particle" placeholder="请选择" style="width: 100px;" >
                            <el-option label="15分钟" value="15"></el-option>
                            <el-option label="1小时" value="60"></el-option>
                        </el-select>
                    </template>
                </demo-chart>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import WebSocketService from '@/utils/websocketService'
const wsService = new WebSocketService('ws://192.168.3.93:8082/uav/ws/performance')

import demoChart from './demoChart.vue';
import { ref, onMounted, onUnmounted ,watch} from 'vue'
let checked1 = ref(true)
let checked2 = ref(true)
let checked3 = ref(true)
let checked4 = ref(true)
let checked5 = ref(true)
let checked6 = ref(true)

let timer: number | null = null
interface ChartItem {
    hour: string;
    averageDuration?: number;
    avergaeDistanceFlown?: number;
    conflict?: number;
    flow?: number;
    complexity?: number;
    sector?: string;
    ratioCapacityAndFlow?: number;
}
interface ChartData {
    performances: ChartItem[];
    predictionList: ChartItem[];
    predictions: ChartItem[];
    fifteensFormerly: ChartItem[];
    fifteensFuture: ChartItem[];
    sixtyFormerly?: ChartItem[];
    sixtyFuture?: ChartItem[];
}
const chartData = ref<ChartData>({
    performances: [],
    predictionList: [],
    predictions: [],
    fifteensFormerly: [],
    fifteensFuture: [],
})
const ratioCapacityAndFlowData = ref<ChartData>({
    performances: [],
    predictionList: [],
    predictions: [],
    fifteensFormerly: [],
    fifteensFuture: [],
})
let Particle = ref('15')

const startMockData = () => {
    chartData.value={
  "performances": [
    {
      "hour": "08:00-09:00",
      "averageDuration": 22.0,
      "avergaeDistanceFlown": 118,
      "conflict": 3,
      "flow": 62,
      "complexity": 2.7,
      "sector": "SectorA",
      "ratioCapacityAndFlow": 0.5
    },
    {
      "hour": "09:00-10:00",
      "averageDuration": 24.0,
      "avergaeDistanceFlown": 124,
      "conflict": 4,
      "flow": 68,
      "complexity": 3.0,
      "sector": "SectorA",
      "ratioCapacityAndFlow": 0.55
    },
    {
      "hour": "10:00-11:00",
      "averageDuration": 26.0,
      "avergaeDistanceFlown": 130,
      "conflict": 5,
      "flow": 78,
      "complexity": 3.4,
      "sector": "SectorA",
      "ratioCapacityAndFlow": 0.6
    },
    {
      "hour": "11:00-12:00",
      "averageDuration": 28.0,
      "avergaeDistanceFlown": 136,
      "conflict": 6,
      "flow": 86,
      "complexity": 3.8,
      "sector": "SectorA",
      "ratioCapacityAndFlow": 0.65
    },
    {
      "hour": "12:00-13:00",
      "averageDuration": 29.0,
      "avergaeDistanceFlown": 142,
      "conflict": 7,
      "flow": 94,
      "complexity": 4.2,
      "sector": "SectorA",
      "ratioCapacityAndFlow": 0.7
    },
    {
      "hour": "13:00-14:00",
      "averageDuration": 27.0,
      "avergaeDistanceFlown": 135,
      "conflict": 6,
      "flow": 82,
      "complexity": 3.8,
      "sector": "SectorA",
      "ratioCapacityAndFlow": 0.75
    },
    {
      "hour": "14:00-15:00",
      "averageDuration": 24.5,
      "avergaeDistanceFlown": 125,
      "conflict": 5,
      "flow": 74,
      "complexity": 3.3,
      "sector": "SectorA",
      "ratioCapacityAndFlow": 0.8
    }
  ],
  "predictionList": [
    {
      "hour": "10:00-11:00",
      "averageDuration": 25.5,
      "avergaeDistanceFlown": 128,
      "conflict": 5,
      "flow": 76,
      "complexity": 3.3,
      "sector": "SectorA",
      "ratioCapacityAndFlow": 0.6
    },
    {
      "hour": "11:00-12:00",
      "averageDuration": 27.5,
      "avergaeDistanceFlown": 134,
      "conflict": 6,
      "flow": 84,
      "complexity": 3.7,
      "sector": "SectorA",
      "ratioCapacityAndFlow": 0.65
    },
    {
      "hour": "12:00-13:00",
      "averageDuration": 28.8,
      "avergaeDistanceFlown": 139,
      "conflict": 7,
      "flow": 89,
      "complexity": 4.0,
      "sector": "SectorA",
      "ratioCapacityAndFlow": 0.7
    },
    {
      "hour": "13:00-14:00",
      "averageDuration": 27.0,
      "avergaeDistanceFlown": 135,
      "conflict": 6,
      "flow": 82,
      "complexity": 3.8,
      "sector": "SectorA",
      "ratioCapacityAndFlow": 0.75
    },
    {
      "hour": "14:00-15:00",
      "averageDuration": 24.5,
      "avergaeDistanceFlown": 125,
      "conflict": 5,
      "flow": 74,
      "complexity": 3.3,
      "sector": "SectorA",
      "ratioCapacityAndFlow": 0.8
    }
  ],
  "predictions": [
    {
      "hour": "10:00-11:00",
      "averageDuration": 25.5,
      "avergaeDistanceFlown": 128,
      "conflict": 5,
      "flow": 76,
      "complexity": 3.3,
      "sector": "SectorA",
      "ratioCapacityAndFlow": 0.6
    },
    {
      "hour": "11:00-12:00",
      "averageDuration": 27.5,
      "avergaeDistanceFlown": 134,
      "conflict": 6,
      "flow": 84,
      "complexity": 3.7,
      "sector": "SectorA",
      "ratioCapacityAndFlow": 0.65
    },
    {
      "hour": "12:00-13:00",
      "averageDuration": 28.8,
      "avergaeDistanceFlown": 139,
      "conflict": 7,
      "flow": 89,
      "complexity": 4.0,
      "sector": "SectorA",
      "ratioCapacityAndFlow": 0.7
    },
    {
      "hour": "13:00-14:00",
      "averageDuration": 27.0,
      "avergaeDistanceFlown": 135,
      "conflict": 6,
      "flow": 82,
      "complexity": 3.8,
      "sector": "SectorA",
      "ratioCapacityAndFlow": 0.75
    },
    {
      "hour": "14:00-15:00",
      "averageDuration": 24.5,
      "avergaeDistanceFlown": 125,
      "conflict": 5,
      "flow": 74,
      "complexity": 3.3,
      "sector": "SectorA",
      "ratioCapacityAndFlow": 0.8
    }
  ],
  "fifteensFormerly": [
    {
      "hour": "06:00-06:15",
      "flow": 33,
      "ratioCapacityAndFlow": 0.66
    },
    {
      "hour": "06:15-06:30",
      "flow": 32,
      "ratioCapacityAndFlow": 0.64
    },
    {
      "hour": "06:30-06:45",
      "flow": 22,
      "ratioCapacityAndFlow": 0.44
    },
    {
      "hour": "07:00-07:15",
      "flow": 1,
      "ratioCapacityAndFlow": 0.02
    },
    {
      "hour": "07:30-07:45",
      "flow": 1,
      "ratioCapacityAndFlow": 0.02
    },
    {
      "hour": "07:45-08:00",
      "flow": 1,
      "ratioCapacityAndFlow": 0.02
    },
    {
      "hour": "08:00-08:15",
      "flow": 1,
      "ratioCapacityAndFlow": 0.02
    }
  ],
  "fifteensFuture": [
    {
      "hour": "06:00-06:15",
      "flow": 33,
      "ratioCapacityAndFlow": 0.66
    },
    {
      "hour": "06:15-06:30",
      "flow": 32,
      "ratioCapacityAndFlow": 0.64
    },
    {
      "hour": "06:30-06:45",
      "flow": 22,
      "ratioCapacityAndFlow": 0.44
    },
    {
      "hour": "07:00-07:15",
      "flow": 1,
      "ratioCapacityAndFlow": 0.02
    },
    {
      "hour": "07:30-07:45",
      "flow": 1,
      "ratioCapacityAndFlow": 0.02
    },
    {
      "hour": "07:45-08:00",
      "flow": 1,
      "ratioCapacityAndFlow": 0.02
    },
    {
      "hour": "08:00-08:15",
      "flow": 1,
      "ratioCapacityAndFlow": 0.02
    }
  ],
  "sixtyFuture": [
    {
      "hour": "06:00-07:00",
      "flow": 48,
      "ratioCapacityAndFlow": 0.48
    },
    {
      "hour": "07:00-08:00",
      "flow": 1,
      "ratioCapacityAndFlow": 0.01
    },
    {
      "hour": "08:00-09:00",
      "flow": 1,
      "ratioCapacityAndFlow": 0.01
    }
  ],
  "sixtyFormerly": [
    {
      "hour": "06:00-07:00",
      "flow": 48,
      "ratioCapacityAndFlow": 0.48
    },
    {
      "hour": "07:00-08:00",
      "flow": 1,
      "ratioCapacityAndFlow": 0.01
    },
    {
      "hour": "08:00-09:00",
      "flow": 1,
      "ratioCapacityAndFlow": 0.01
    }
  ]
}
if(Particle.value=='15'){
    ratioCapacityAndFlowData.value = {
            performances: chartData.value?.fifteensFormerly || [],
            predictionList: chartData.value?.fifteensFuture || [],
            predictions: chartData.value?.fifteensFormerly || [],
            fifteensFormerly: chartData.value?.fifteensFormerly || [],
            fifteensFuture: chartData.value?.fifteensFuture || [],
        }
}else if(Particle.value=='60'){
    ratioCapacityAndFlowData.value = {
            performances: chartData.value?.sixtyFormerly || [],
            predictionList: chartData.value?.sixtyFuture || [],
            predictions: chartData.value?.sixtyFormerly || [],
            fifteensFormerly: chartData.value?.sixtyFormerly || [],
            fifteensFuture: chartData.value?.sixtyFuture || [],
    }
}
    wsService.connect(data => {
        chartData.value = data
        if(Particle.value === '15'){
            ratioCapacityAndFlowData.value = {
            performances: chartData.value.fifteensFormerly,
            predictionList: chartData.value.fifteensFuture,
            predictions: chartData.value.fifteensFormerly,
            fifteensFormerly: chartData.value.fifteensFormerly,
            fifteensFuture: chartData.value.fifteensFuture,
        }
        }else if(Particle.value=='60'){
            ratioCapacityAndFlowData.value = {
            performances: chartData.value?.sixtyFormerly || [],
            predictionList: chartData.value?.sixtyFuture || [],
            predictions: chartData.value?.sixtyFormerly || [],
            fifteensFormerly: chartData.value?.sixtyFormerly || [],
            fifteensFuture: chartData.value?.sixtyFuture || [],
        }
        }
    })
}
const updateParticle = (value: string) => {
    if (value === '15') {
        ratioCapacityAndFlowData.value = {
            performances: chartData.value?.fifteensFormerly || [],
            predictionList: chartData.value?.fifteensFuture || [],
            predictions: chartData.value?.fifteensFormerly || [],
            fifteensFormerly: chartData.value?.fifteensFormerly || [],
            fifteensFuture: chartData.value?.fifteensFuture || [],
        }
    } else if (value === '60') {
        ratioCapacityAndFlowData.value = {
            performances: chartData.value?.sixtyFormerly || [],
            predictionList: chartData.value?.sixtyFuture || [],
            predictions: chartData.value?.sixtyFormerly || [],
            fifteensFormerly: chartData.value?.sixtyFormerly || [],
            fifteensFuture: chartData.value?.sixtyFuture || [],
        }
    }
}
watch(Particle, (newValue, oldValue) => {
    updateParticle(newValue)
}, { immediate: true })



onMounted(() => startMockData())
onUnmounted(() => {
    if (timer) {
        clearInterval(timer)
        timer = null
    }
    wsService.close()
})
</script>
<style scoped lang="scss">
.wrape {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;

    .chartBox {
        width: 100%;
        flex: 1;
        display: flex;
        flex-direction: column;

        .chartItem {
            width: 100%;
            height: auto;
        }
    }


}
</style>