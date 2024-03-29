import { isObject } from "@vue/shared";
import { mutableHandlers } from "./baseHandlers";
import { activeEffect, track } from "./effect";
export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}
// 扩展是否为reactive响应式对象
export function isReactive(target) {
  return !!(target && target[ReactiveFlags.IS_REACTIVE]);
}

const reactiveMap = new WeakMap(); // key只能是对象
export function reactive(target) {
  // 不对非对象的类型进行处理
  if (!isObject(target)) {
    return target;
  }
  // 当target是代理过的对象的时候，会触发get方法,当get方法中target[ReactiveFlags.IS_REACTIVE]发现这个属性是被调离过的就直接返回
  // 能触发get方法的肯定是被代理过的对象
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }
  // 缓存代理对象，下次这个对象再进行代理的时候再缓存中直接获取
  const exisitsProxy = reactiveMap.get(target);
  if (exisitsProxy) {
    return exisitsProxy;
  }
  // 设置代理对象，会在原对象上进行获取
  // 我通过代理对象获取和设置对象属性的时候，你会获取和设置原对象上属性
  const proxy = new Proxy(target, mutableHandlers);

  return proxy;
}
