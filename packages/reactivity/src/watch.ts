import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";
function traverse(source, s = new Set()) {
  if (!isObject(source)) {
    return source;
  }

  if (s.has(source)) {
    return source;
  }
  s.add(source);
  // 考虑循环应用的问题， 采用set来解决此问题, 递归进行取值
  for (const key in source) {
    traverse(source[key], s); // 递归进行取值
  }
  return source;
}

function doWatch (source, cb, {immediate}: any = {}) {
  let getter;
  if (isReactive(source)) {
    // 无论是对象还是函数，最终都会被处理成函数
    getter = () => traverse(source); // effect函数， 直接调用run的时候，会执行此函数，直接返回对象，对象不会进行依赖收集, 只有访问属性的时候才进行依赖收集
    // 默认的effect 在组建中使用 渲染effect 计算属性effect 用户effect
  } else if (isFunction(source)) {
    getter = source
  }
  let oldValue;
  let cleanup;
  const onCleanup = (userCb) => {
    cleanup = userCb
  }
  const job = () => {
    if (cb) { // 存在回调函数,说明是watch
          // 内部要调用cb，也就是watch回调方法
      let newValue = effect.run(); // 执行回调获取新的值
      if (cleanup) cleanup()
      cb(newValue, oldValue, onCleanup);
      oldValue = newValue;
    } else { // 说明是watchEffect
      effect.run() // 让effect重新执行， 调用run方法会重新做清理和依赖收集的工作
    }
  };
  // 修改了新值，进行重新计算，重新执行回调获取新值
  const effect = new ReactiveEffect(getter, job);
  if (immediate) { // immediate 默认会执行一次回调
    return job();
  }
  oldValue = effect.run(); // 保留老值
}
// watch 就是effect 状态会收集watch effect, 状态发生变化 会触发scheduler
export function watch(source, cb, { immediate } = {} as any) {
  doWatch(source, cb, immediate)
}

export function watchEffect(effect, options) {
  doWatch(effect, null, options)
}