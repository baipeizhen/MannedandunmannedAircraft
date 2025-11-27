import request from '@/utils/request'
// 地图路线数据
export function getFlightRouteList(model,scene){
    return request({
        url: '/uav/flight/route/getFlightRouteList/'+model+'/'+scene,
        method: 'get'
    })
}
// 地图电子围栏
export function getElectronicFenceList(){
    return request({
        url: '/uav/flight/route/getFenceAddress',
        method: 'get'
    })
}
// 点信息接口
export function getPointInfoList(){
    return request({
        url: '/uav/flight/route/getPointInfoList',
        method: 'get'
    })
}
// 修改场景模式
export function updateScene(data: any){
    return request({
        url: 'uav/uav/flight/updateScene',
        method: 'put',
        data
    })
}
// 获取容流比
export function getPermeability(){
    return request({
        url: 'uav/uav/flight/getPermeability',
        method: 'get'
    })
}
// 初始化场景模式
export function getScene(){
    return request({
        url: 'uav/uav/flight/getScene',
        method: 'get'
    })
}