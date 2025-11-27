<template>
  <div class="map-wrapper">
    <div class="map-toolbar">
      <div class="toolbar-item">
        <span class="label">航线ID</span>
        <el-select
          v-model="flightID"
          placeholder="请选择航线ID"
          style="width: 260px"
          clearable
          filterable
        >
          <el-option
            v-for="item in flightList"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </div>

      <div class="toolbar-item">
        <span class="label">场地选择</span>
      <el-select v-model="site" style="width: 200px">
        <el-option label="盐池前旗" value="盐池前旗" />
        <el-option label="盐池马合" value="盐池马合" />
      </el-select>
        <span class="label">跑道模式</span>
        <el-select v-model="type" style="width: 200px" v-if="site=='盐池马合'">
          <el-option label="盐池跑道15-马合跑道15" value="1" />
          <el-option label="盐池跑道15-马合跑道33" value="2" />
          <el-option label="盐池跑道33-马合跑道15" value="3" />
          <el-option label="盐池跑道33-马合跑道33" value="4" />
        </el-select>
        <el-select v-model="type" style="width: 200px" v-if="site=='盐池前旗'">
          <el-option label="盐池跑道15-前旗跑道12" value="1" />
          <el-option label="盐池跑道15-前旗跑道30" value="2" />
          <el-option label="盐池跑道33-前旗跑道12" value="3" />
          <el-option label="盐池跑道33-前旗跑道30" value="4" />
        </el-select>

      </div>
    </div>
    <div class="flight-info">
      <span style="margin-right: 10px;">有人机数量：{{ mavNum }}</span>
      <span>无人机数量：{{ uavNum }}</span>
    </div>
    <div id="map" class="map-container">
      <div class="coordinates-display">
      {{ latitude }},{{ longitude }}
    </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { onMounted, ref, watch, onUnmounted } from 'vue'
import { getFlightRouteList, getElectronicFenceList, getPointInfoList } from '@/api/mapPage'
import WebSocketService from '@/utils/websocketService'
import { updateScene, getScene } from '@/api/mapPage'
const wsService = new WebSocketService('ws://192.168.3.69:8082/uav/ws/uavStatus')
const mavNum = ref(0)
const uavNum = ref(0)
// 全局变量，用于存储当前显示的提示框和重合路线信息
let currentTooltip: L.Popup | null = null;
let flightID = ref('')
let flightList = ref([])
// 航线数据
let flightData = ref([])
// 电子围栏区域
let areaData = []
const type = ref('1')
const site = ref('盐池前旗')
let map: L.Map
const flightLayers = ref<{
  [key: string]: {
    layerGroup: L.LayerGroup,
    waypoints: any[],
    polyline: L.Polyline,
    originalStyle: L.PolylineOptions; // 必须包含原始样式
  }
}>({})
let pointInfoList = ref([])
// 定义路线图层组和点图层组
const routesLayerGroup = L.layerGroup();
const airportLayerGroup = L.layerGroup();
const waypointLayerGroup = L.layerGroup();
const airportNameLayerGroup = L.layerGroup(); // 机场名称图层
const waypointNameLayerGroup = L.layerGroup(); // 航路点名称图层
interface FlightData {
  flightID: number
  lon: number
  lat: number
  tas: number
  callSign: string
  height: number
  heading: number,
  Type: string
}
const latitude = ref(null)
const longitude = ref(null)
const flightMarkers: Record<number, L.Marker> = {}
onMounted(async () => {
  // 初始化地图
  map = L.map('map', {
    minZoom: 4, // 设置最小缩放级别
    maxZoom: 18 // 可选：同时设置最大缩放级别
  }).setView([38.06326727488724,107.34313042037782], 10);
  const response = await fetch('/json/china.json')
  const geojsonData = await response.json()
const geojsonLayer = L.geoJSON(geojsonData, {
  style: {
    color: '#3e3f40',    // 边界颜色
    weight: 2,           // 边界线宽
    fillColor: '#141414',// 填充颜色
    fillOpacity: 1       // 填充透明度
  },
  // 核心：遍历每个要素，添加弹窗
  onEachFeature: function (feature, layer) {
    // 1. 检查要素属性中是否有“名称字段”（此处以 "name" 为例，需与你的 GeoJSON 匹配）
    if (feature.properties && feature.properties.name) {
      
      // （可选）鼠标悬停时显示提示文字
      layer.bindTooltip(feature.properties.name, { 
        permanent: false, // 非永久显示
        direction: 'top'  // 提示框在要素上方
      });
    }
  }
}).addTo(map);
    // 获取GeoJSON的边界范围
  const bounds = geojsonLayer.getBounds();

  // 设置地图最大边界，限制用户不能拖出该范围
  map.setMaxBounds(bounds);
  map.on('mousemove', (e) => {
    latitude.value = e.latlng.lat;
    longitude.value = e.latlng.lng;
  });
  await getFlightRouteList(type.value,site.value).then((res: any) => {
    if (res.code === 0) {
      flightData.value = res.data
      flightList.value = res.data.map((item: any) => {
        return item.key
      })
    }
  })
  await getElectronicFenceList().then((res: any) => {
    if (res.code === 0) {
      areaData = res.data
    }
    const areaCoordinates = areaData.map(point => [point.lat, point.log]);
    L.polygon(areaCoordinates, {
      color: '#87CEFA',      // 边框颜色（浅蓝色）
      weight: 1,             // 边框宽度
      opacity: 0.8,          // 边框透明度
      fillColor: '#87CEFA',  // 填充颜色（浅蓝色）
      fillOpacity: 0.3       // 填充透明度（0.3使区域半透明）
    }).addTo(map);
      renderRoutes(flightData.value)
  })
  await getPointInfoList().then((res: any) => {
    if (res.code === 0) {
      pointInfoList.value = res.data;
      renderPoints()
    }
  });
  // 获取场景模式
  await getScene().then((res: any) => {
    if (res.code === 0) {
      console.log(res);
      type.value = String(res.data.type)
      site.value = res.data.scene
      
    }
  })
 // ========== 模拟数据开关 ==========
const useMockData = true; // 开发时设为 true，上线前改为 false

if (useMockData) {
  // 模拟飞行器数据（包括 MAV 和 UAV）
  const mockFlightData: FlightData[] = [
    {
      flightID: 1001,
      lon: 107.35,
      lat: 38.07,
      tas: 250,
      callSign: 'CES123',
      height: 3000,
      heading: 45,
      Type: 'MAV'
    },
    {
      flightID: 1002,
      lon: 107.33,
      lat: 38.05,
      tas: 180,
      callSign: 'UAV001',
      height: 1500,
      heading: 135,
      Type: 'UAV'
    },
    {
      flightID: 1003,
      lon: 107.36,
      lat: 38.04,
      tas: 200,
      callSign: 'UAV002',
      height: 1200,
      heading: 270,
      Type: 'UAV'
    }
  ];

  // 模拟定时推送（每2秒更新一次位置，模拟动态效果）
  let intervalId: number | null = null;
  const simulateMovement = () => {
    // 简单移动：给每个飞行器加一点偏移（实际项目中可更复杂）
    const movedData = mockFlightData.map((item, index) => ({
      ...item,
      lon: item.lon + (Math.random() - 0.5) * 0.002,
      lat: item.lat + (Math.random() - 0.5) * 0.002,
      heading: (item.heading + (index === 0 ? 1 : -1)) % 360 // 缓慢转向
    }));

    // 调用与 WebSocket 相同的数据处理逻辑
    const arrayData = processWebSocketData(movedData);
    mavNum.value = arrayData.filter(flight => flight.Type === 'MAV').length;
    uavNum.value = arrayData.filter(flight => flight.Type === 'UAV').length;

    arrayData.forEach(flight => {
      const latlng = L.latLng(flight.lat, flight.lon); // 注意：mock 中是 lat/lon，但你的接口用 latitude/longitude
      const typeClassMap = {
        'MAV': 'flight-MAV',
        'UAV': 'flight-UAV',
      };
      const planeClass = typeClassMap[flight.Type] || 'flight-MAV';

      if (flightMarkers[flight.flightID]) {
        const marker = flightMarkers[flight.flightID];
        marker.setLatLng(latlng);
        marker.setIcon(
          L.divIcon({
            className: `${planeClass}`,
            html: `<div class="plane" style="transform: rotate(${flight.heading}deg)"></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          })
        );
        marker.setTooltipContent(
          `呼号: ${flight.callSign}<br>真空速: ${flight.tas} km/h<br>高度: ${flight.height} m<br>id编号: ${flight.flightID}<br> 类型: ${flight.Type}<br>经度: ${flight.lon}<br>纬度: ${flight.lat}<br>`
        );
      } else {
        const marker = L.marker(latlng, {
          icon: L.divIcon({
            className: `${planeClass}`,
            html: `<div class="plane" style="transform: rotate(${flight.heading}deg)"></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          }),
        }).addTo(map);

        marker.bindTooltip(
          `呼号: ${flight.callSign}<br>真空速: ${flight.tas} km/h<br>高度: ${flight.height} m<br>id编号: ${flight.flightID}<br> 类型: ${flight.Type}<br>经度: ${flight.lon}<br>纬度: ${flight.lat}<br>`,
          {
            permanent: false,
            direction: 'top',
            offset: L.point(0, -20),
          }
        );

        flightMarkers[flight.flightID] = marker;
      }
    });
  };

  // 首次立即执行
  simulateMovement();
  // 每2秒更新一次
  intervalId = window.setInterval(simulateMovement, 2000);

  // 清理定时器（组件卸载时）
  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
  });
}
  wsService.connect((data: FlightData[]) => {
    console.log(data, 'uavStatus');
    console.log(Array.isArray(data));
    console.log(typeof data);
    const arrayData = processWebSocketData(data);
    console.log(arrayData, 'arrayData');
    // 统计有人机和无人机数量
    mavNum.value = arrayData.filter(flight => flight.type === 'MAV').length
    uavNum.value = arrayData.filter(flight => flight.type === 'UAV').length
    arrayData.forEach(flight => {
      // console.log(flight, 'flight');
      const latlng = L.latLng(flight.latitude, flight.longitude)
      const typeClassMap = {
        'MAV': 'flight-MAV',
        'UAV': 'flight-UAV',
      };
      const planeClass = typeClassMap[flight.type] || 'flight-MAV';
      // 如果已有 marker，更新位置
      if (flightMarkers[flight.flightID]) {
        const marker = flightMarkers[flight.flightID]
        marker.setLatLng(latlng)
        marker.setIcon(
          L.divIcon({
            className: `${planeClass}`,
            html: `<div class="plane" style="transform: rotate(${flight.heading}deg)"></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          })
        )
        marker.setTooltipContent(
          `呼号: ${flight.callsign}<br>真空速: ${flight.tas} km/h<br>高度: ${flight.altitude} m<br>id编号: ${flight.id}<br> 类型: ${flight.type}<br>经度: ${flight.longitude}<br>纬度: ${flight.latitude}<br>`
        )
      } else {
        // 新建 marker
        const marker = L.marker(latlng, {
          icon: L.divIcon({
            className: `${planeClass}`,
            html: `<div class="plane" style="transform: rotate(${flight.heading}deg)"></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          }),
        }).addTo(map)

        marker.bindTooltip(
          `呼号: ${flight.callsign}<br>真空速: ${flight.tas} km/h<br>高度: ${flight.altitude} m<br>id编号: ${flight.id}<br> 类型: ${flight.type}<br>经度: ${flight.longitude}<br>纬度: ${flight.latitude}<br>`,
          {
            permanent: false,
            direction: 'top',
            offset: L.point(0, -20),
          }
        )

        flightMarkers[flight.flightID] = marker
      }
    })
  })
  const overlayMaps = {
    '路线图层  ': routesLayerGroup,      // 路线图层
    '机场图层  ': airportLayerGroup,     // 机场点图层
    '航路点图层': waypointLayerGroup,   // 航路点图层
    '机场名称图层': airportNameLayerGroup, // 新增
    '航路点名称图层': waypointNameLayerGroup // 新增
  };

  L.control.layers({}, overlayMaps).addTo(map)

})
// onUnmounted(() => {
//   wsService.close()
// })
// 监听航线ID变化，展示指定路线（修正后）
watch(() => flightID.value, (newValue) => {

  if (newValue) {
    const targetArr = flightData.value.filter(item => item.key === newValue)
    renderRoutes(targetArr)
  } else {
    renderRoutes(flightData.value)
  }
});
watch(() => type.value,async (newValue) => { 
  flightID.value=''
   await updateScene({ type: type.value,scene: site.value })
    await getFlightRouteList(newValue,site.value).then((res: any) => {
    if (res.code === 0) {
      flightData.value = res.data
      flightList.value = res.data.map(item => item.key)
      renderRoutes(flightData.value)
    }
  })
});
watch(() => site.value,async (newValue) => { 
  flightID.value=''
  if(type.value=='1'){
    await getFlightRouteList(type.value,newValue).then((res: any) => {
      if (res.code === 0) {
        flightData.value = res.data
        flightList.value = res.data.map(item => item.key)
        renderRoutes(flightData.value)
      }
    })
  }else{
    type.value='1'
  }
  await updateScene({ type: '1',scene: newValue })
})

function processWebSocketData(data) {
  // 首先尝试基本类型检查
  if (Array.isArray(data)) {
    return data;
  }

  // 如果是字符串，尝试多种方式解析
  if (typeof data === 'string') {
    // 去除可能的前后空格
    const trimmed = data.trim();

    // 检查是否看起来像数组
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        // 尝试JSON解析
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        console.warn('JSON解析失败，尝试手动处理:', e);
        // 解析失败时，尝试用更宽松的方式处理
        return [trimmed];
      }
    } else {
      // 不是数组格式的字符串，包装为数组
      return [trimmed];
    }
  }

  // 既不是数组也不是字符串，包装为数组
  return [data];
}
function renderRoutes(flightData) {
  // 清空已有图层，避免重复渲染
  routesLayerGroup.clearLayers();
  flightLayers.value = {};

  flightData.forEach(route => {
    const routeId = route.key;
    const waypoints = route.value.sort((a, b) => a.sequence - b.sequence);
    const coordinates = waypoints.map(point => [point.latitude, point.longitude]);

    const firstWaypoint = waypoints[0];
    const originalStyle: L.PolylineOptions = {
      color: getColorForRoute(routeId, firstWaypoint.type),
      weight: 1,
      opacity: 0.9,
      dashArray: '0',
      lineJoin: 'round'
    };

    const polyline = L.polyline(coordinates, originalStyle).addTo(routesLayerGroup);

    // 保存完整信息（包含 originalStyle）
    flightLayers.value[routeId] = {
      layerGroup: routesLayerGroup,
      waypoints,
      polyline,
      originalStyle: originalStyle // 关键：保存原始样式
    };

    // 鼠标悬停事件（保持不变）
    polyline.on('mouseover', (e: L.LeafletMouseEvent) => {
      polyline.setStyle({
        weight: 10,
        opacity: 1,
        color: originalStyle.color
      });
      getHoverPointName(e, polyline, routeId, waypoints);
    });

    // 鼠标离开事件（使用保存的 originalStyle 恢复）
    polyline.on('mouseout', () => {
      polyline.setStyle(flightLayers.value[routeId].originalStyle); // 关键：使用保存的样式
      if (currentTooltip) {
        map.removeLayer(currentTooltip);
        currentTooltip = null;
      }
    });
  });

  // 只添加一次图层组到地图
  if (!map.hasLayer(routesLayerGroup)) {
    routesLayerGroup.addTo(map);
  }
}
function renderPoints() {
  // 清空旧图层
  airportLayerGroup.clearLayers();
  waypointLayerGroup.clearLayers();
  airportNameLayerGroup.clearLayers();
  waypointNameLayerGroup.clearLayers();

  pointInfoList.value.forEach((point: any) => {
    const pointCoords = [point.latitude, point.longitude] as [number, number];

    if (point.type === 'airport') {
      // 创建机场图标
      const marker = L.marker(pointCoords, {
        icon: createDynamicIcon('airport', map.getZoom())
      })
        .bindPopup(`
          <div>
            <b>${point.chineseName}</b><br>
             ${point.name}<br>
          </div>
        `)
        .addTo(airportLayerGroup);

      // 名称
      L.marker(pointCoords, {
        icon: L.divIcon({
          className: 'airport-name-icon',
          html: `<div class="name-label">${point.name}</div>`,
          iconSize: [100, 20],
          iconAnchor: [50, -10]
        })
      }).addTo(airportNameLayerGroup);

    } else if (point.type === 'waypoint') {
      // 航路点
      const marker = L.marker(pointCoords, {
        icon: createDynamicIcon('waypoint', map.getZoom())
      })
        .bindPopup(`<div>${point.name}</div>`)
        .addTo(waypointLayerGroup);

      L.marker(pointCoords, {
        icon: L.divIcon({
          className: 'waypoint-name-icon',
          html: `<div class="name-label">${point.name}</div>`,
          iconSize: [100, 20],
          iconAnchor: [50, -10]
        })
      }).addTo(waypointNameLayerGroup);
    }
  });

  // 添加图层
  airportLayerGroup.addTo(map);
  waypointLayerGroup.addTo(map);
  airportNameLayerGroup.addTo(map);
  waypointNameLayerGroup.addTo(map);

  // ✅ 监听地图缩放动态调整 marker 大小
  map.on('zoom', () => {
    const zoom = map.getZoom();
    airportLayerGroup.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        layer.setIcon(createDynamicIcon('airport', zoom));
      }
    });
    waypointLayerGroup.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        layer.setIcon(createDynamicIcon('waypoint', zoom));
      }
    });
  });
}

/**
 * 根据缩放级别动态生成 icon
 */
function createDynamicIcon(type: 'airport' | 'waypoint', zoom: number) {
  // 基础大小
  const baseSize = type === 'airport' ? 6 : 4;

  // 随 zoom 缩放 (你可以调整比例因子)
  const scale = Math.pow(zoom / 10, 0.8);
  const size = Math.min(6, Math.min(baseSize * scale, 10));

  // 根据类型创建不同样式
  if (type === 'airport') {
    return L.divIcon({
      className: 'airport-icon',
      html: `<div style="width:${size}px;height:${size}px;"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  } else {
    return L.divIcon({
      className: 'custom-waypoint-icon',
      html: `<div class="circle" style="width:${size}px;height:${size}px;background-color:'#282828';"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }
}
function getHoverPointName(
  e: L.LeafletMouseEvent,
  polyline: L.Polyline,
  routeId: string,
  waypoints: any[]
) {

  // 1. 将鼠标经纬度转换为地图像素坐标
  const mousePixel = map.latLngToLayerPoint(e.latlng);

  // 2. 遍历所有航点，计算与鼠标位置的距离
  let minDistance = Infinity;
  let closestWaypoint: any = null;

  waypoints.forEach((waypoint) => {
    // 将航点经纬度转换为像素坐标
    const waypointPixel = map.latLngToLayerPoint([
      waypoint.latitude,
      waypoint.longitude
    ]);

    // 计算鼠标与航点的像素距离（勾股定理）
    const distance = Math.sqrt(
      Math.pow(mousePixel.x - waypointPixel.x, 2) +
      Math.pow(mousePixel.y - waypointPixel.y, 2)
    );

    // 记录最近的航点
    if (distance < minDistance) {
      minDistance = distance;
      closestWaypoint = waypoint;
    }
  });

  // 3. 当距离小于阈值（避免误判），获取并使用name
  // if (closestWaypoint && minDistance < 30) { // 30像素阈值可调整
  const hoverName = routeId;

  // 如需显示在页面上，可调用提示框函数
  showNameTooltip(e.latlng, hoverName);
  // }
}
// 显示悬浮点name的提示框
function showNameTooltip(latlng: L.LatLng, routeId: any) {
  // 移除已有提示框
  if (currentTooltip) {
    map.removeLayer(currentTooltip);
  }

  // 创建新提示框
  currentTooltip = L.popup({
    closeButton: false, // 无关闭按钮
    offset: [0, -15], // 向上偏移避免遮挡鼠标
    autoClose: false // 不自动关闭
  })
    .setLatLng(latlng)
    .setContent(`<div style="color:white; padding:3px 8px;">
  <div>${routeId}</div>
  </div>`)
    .openOn(map);
}
// 为不同航线生成唯一颜色
function getColorForRoute(routeId: string, type: string): string {
  // 计算哈希值（保持原有逻辑，确保同航线颜色一致）
  let hash = 0;
  for (let i = 0; i < routeId.length; i++) {
    hash = routeId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % 3; // 取0-2索引

  // 根据type返回不同色系
  const colors = type === 'MAV'
    ? ['#3399FF', '#33CCFF', '#66B2FF'] // MAV用蓝色系
    : ['#FF6666', '#FF9999', '#FFB2B2']; // UAV用红色系

  return colors[index];
}
</script>

<style scoped>
:deep(.leaflet-interactive:focus) {
  outline: none !important; /* 完全移除聚焦轮廓 */
  outline-offset: 0 !important; /* 确保没有偏移产生的额外边框 */
}

/* 可选：若部分元素仍有边框，可针对性加强（如多边形、折线） */
:deep(.leaflet-polygon.leaflet-interactive:focus),
:deep(.leaflet-polyline.leaflet-interactive:focus) {
  outline: none !important;
} 
.map-toolbar {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 40px;
  background: rgba(0, 0, 0, 0.5);
  padding: 10px 25px;
  border-radius: 8px;
  color: white;
  z-index: 1000;
}
.toolbar-item {
  display: flex;
  align-items: center;
}
.toolbar-item .label {
  margin-right: 10px;
  color: #fff;
  font-weight: 500;
  text-wrap: nowrap;
}
.toolbar-item .el-select {
  margin-right: 15px;
}
.coordinates-display {
  position: absolute;
  bottom: 20px;
  left: 20px;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 999;
  color: #ccc;
}

:deep(.name-label) {
  color: #fff !important;
  font-weight: bold;
  font-size: 12px;
  text-shadow: 0 0 2px rgba(0,0,0,0.7);
}
:deep(.flight-MAV .plane) {
  width: 20px;
  height: 20px;
  background: url('/src/assets/images/airplane.png') no-repeat;
  background-size: contain;
  transform-origin: center center;
}

:deep(.flight-UAV .plane) {
  width: 20px;
  height: 20px;
  background: url('/src/assets/images/airplane2.png') no-repeat;
  background-size: contain;
  transform-origin: center center;
}

:deep(.leaflet-bottom.leaflet-right) {
  display: none !important;
}

.map-wrapper {
  position: relative;
  /* 作为搜索框的定位容器 */
  width: 100%;
  height: 100%;
  /* 全屏显示 */
}


.flight-info {
  position: absolute;
  right: 10px;
  bottom: 20px;
  z-index: 999;
  color: white;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 5px 10px;
  border-radius: 5px;
}

:deep(.leaflet-control-layers-overlays) {
  text-align: left !important;
}

.map-container {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #282828;
}

/* 自定义标记样式 */
:deep(.airport-icon div) {
  background-color: orange;
  height: 100%;
  border-radius: 50%;
}

:deep(.custom-end-icon div) {
  background-color: #f54242;
  color: white;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  border: 2px solid white;
}

:deep(.custom-waypoint-icon div) {
  background-color: #fff;
  height: 100%;
  border-radius: 50%;
}

/* 弹窗样式调整 */
:deep(.leaflet-popup-content-wrapper),
:deep(.leaflet-popup-tip) {
  background-color: #2c3e50;
  color: #ecf0f1;
  border: none;
  box-shadow: 0 3px 14px rgba(0, 0, 0, 0.4);
}

/* 图层控制器样式 */
:deep(.leaflet-control-layers) {
  background-color: #2c3e50;
  color: white;
  border: none;
}

:deep(.leaflet-control-layers label) {
  color: white;
}

:deep(.leaflet-control-layers-separator) {
  background-color: #444;
}
</style>