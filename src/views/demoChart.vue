<template>
    <div class="chart-visualization">
      <slot name="select"></slot>
        <div ref="chartRef" style="width: 100%; height: 100%"></div>
    </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import { onMounted, onUnmounted, ref, watch, toRefs } from 'vue'

interface DataItem {
  hour: string
  [key: string]: any
}

interface ChartData {
  performances: DataItem[]
  predictionList: DataItem[]
  predictions: DataItem[]
}

const props = defineProps<{
  chartData: ChartData
  legend: string[]
  metricKey: string
  yAxisName: string
}>()

const { chartData, legend, metricKey, yAxisName } = toRefs(props)

const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const initChart = () => {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  renderChart()
}

const renderChart = () => {
  if (!chart) return

  // 收集所有 hour，去重
  const allHoursSet = new Set<string>([
    ...chartData.value.performances.map(d => d.hour),
    ...chartData.value.predictionList.map(d => d.hour),
    ...chartData.value.predictions.map(d => d.hour)
  ])
  const allHours = Array.from(allHoursSet)

  // 比如提取开始时间排序
  allHours.sort((a, b) => {
    const getStartMinute = (h: string) => {
      const [start] = h.split('-')
      const [hh, mm] = start.split(':').map(Number)
      return hh * 60 + mm
    }
    return getStartMinute(a) - getStartMinute(b)
  })

  // 工具函数：根据 hour 匹配值
  const getValue = (list: DataItem[], hour: string) => {
    const item = list.find(d => d.hour === hour)
    return item ? item[metricKey.value] ?? null : null
  }

  // 历史数据 series
  const performanceData = allHours.map(h => getValue(chartData.value.performances, h))

  // 预测数据（predictionList + predictions 合并）
  const predictionData = allHours.map(h => {
    const v1 = getValue(chartData.value.predictionList, h)
    const v2 = getValue(chartData.value.predictions, h)
    return v1 ?? v2
  })

  // 找到最后一个历史 hour，用 markLine 标注
  let lastIndex = -1
  if (chartData.value.performances.length > 0) {
    const lastHour = chartData.value.performances[chartData.value.performances.length - 1].hour
    lastIndex = allHours.indexOf(lastHour)
  }

  const series: any[] = [
    {
  name: legend.value[0],
  type: 'line',
  smooth: true,
  data: performanceData,
  lineStyle: { type: 'solid', color: '#5470C6' },
  symbol: 'circle',
  areaStyle: {   // ✅ 新增的配置，开启面积图
    opacity: 0.4,
    color: '#5470C6'
  },
  markLine: lastIndex >= 0 ? {
    symbol: 'none',
    label: { show: false },
    lineStyle: { color: 'red', type: 'dashed' },
    data: [{ xAxis: lastIndex }]
  } : undefined
},
    {
      name: legend.value[1],
      type: 'line',
      smooth: true,
      data: predictionData,
      lineStyle: { type: 'dashed', color: '#91CC75' },
      symbol: 'circle'
    },
    {
      name: legend.value[1],
      type: 'bar',
      data: allHours.map(h => getValue(chartData.value.predictionList, h)),
      barWidth: '40%',
      itemStyle: {
        color: 'rgba(255, 192, 0, 0.6)'
      },
      tooltip:{
        show:false
      }
    }
  ]

  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: legend.value, textStyle: { color: '#fff', fontSize: 12 } },
    grid: { top: '20%', bottom: '12%' },
    xAxis: { type: 'category', data: allHours, axisLabel: { color: '#fff' } },
    yAxis: { type: 'value', name: yAxisName.value, axisLabel: { color: '#fff' },nameTextStyle: { color: '#fff' } },
    series,
    dataZoom: [
    {
      type: 'slider',        // 底部滑动条
      show: allHours.length > 20,
      xAxisIndex: 0,
      start: 0,              // 默认起始百分比
      end: 100,               // 默认显示 100% 数据
      height: 20,            // 滚动条高度
      bottom: 5,             // 距离底部的距离
      handleSize: '80%',     // 滑块大小
      handleStyle: { 
        color: '#91cc75', 
        borderColor: '#fff' 
      },
      backgroundColor: 'rgba(255,255,255,0.1)',
      fillerColor: 'rgba(145,204,117,0.4)',
      textStyle: { color: '#fff' }
    },
    {
      type: 'inside',        // 支持鼠标滚轮和拖拽
      xAxisIndex: 0,
      start: 0,
      end: 50
    }
  ]
  }

  chart.setOption(option, true)
}


// 父组件数据变化自动更新图表
watch(chartData, () => renderChart(), { deep: true })

onMounted(() => {
  initChart()
  const handleResize = () => chart?.resize()
  window.addEventListener('resize', handleResize)
  onUnmounted(() => window.removeEventListener('resize', handleResize))
})

onUnmounted(() => {
  chart?.dispose()
  chart = null
})
</script>


<style scoped>
.chart-visualization {
    width: 100%;
    height: 400px;
}
</style>
