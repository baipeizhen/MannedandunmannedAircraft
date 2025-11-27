import request from '@/utils/request'

// 优化策略查看
export function getFlightPlanList() {
  return request({
    url: '/uav/uav/flight/getFlightPlanList',
    method: 'get',
  })
}