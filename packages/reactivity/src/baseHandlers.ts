import { isObject } from "@vue/shared";
import { activeEffect, track, trigger } from "./effect";
import { reactive, ReactiveFlags } from "./reactive";

// 抽出来，为了后续用于深层次递归
export const mutableHandlers = {
  get(target, key, receiver) {
    if (ReactiveFlags.IS_REACTIVE === key) {
      return true;
    }
    track(target, key);
    let r = Reflect.get(target, key, receiver); // 解决对象嵌套的问题
    if (isObject(r)) {
      // 判断是一个对象的时候 性能比较好, 只有用户在取值的时候, 才进行二次代理
      reactive(r); //
    }
    return r;
  },
  set(target, key, value, receiver) {
    let oldValue = target[key];
    let r = Reflect.set(target, key, value, receiver); // 赋值
    if (oldValue !== value) {
      // 当老值不等新值的时候触发更新操作
      trigger(target, key, value, oldValue);
    }
    return r;
  },
};