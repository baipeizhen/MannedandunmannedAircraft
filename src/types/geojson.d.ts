declare module "*.geojson" {
  const value: any; // 也能使用更具体的GeoJSON类型
  export default value;
}
