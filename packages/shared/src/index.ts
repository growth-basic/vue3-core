// 判断是否为一个对象
export function isObject(value) {
  return value !== null && typeof value === "object";
}
// 判断是否为一个函数
export function isFunction(value) {
  return typeof value === "function";
}
