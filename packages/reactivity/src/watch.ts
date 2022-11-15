import { isObject } from "@vue/shared";
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
  for (const key in source) {
    traverse(source[key], s); // 递归进行取值
  }
  return source;
}

function doWatch () {
  
}

export function watch(source, cb, { immediate } = {} as any) {
  let getter;
  if (isReactive(source)) {
    // 无论是对象还是函数，最终都会被处理成函数
    getter = () => traverse(source); // effect函数， 直接调用run的时候，会执行此函数，直接返回对象，只有访问属性的时候才进行依赖收集
    // 默认的effect 在组建中使用 渲染effect 计算属性effect 用户effect
  }
  let oldValue;
  const job = () => {
    // 内部要调用cb，也就是watvh回调方法
    let newValue = effect.run();
    cb(newValue, oldValue);
    oldValue = newValue;
  };
  const effect = new ReactiveEffect(getter, job);
  if (immediate) {
    job();
  }
  oldValue = effect.run(); // 保留老值
}
