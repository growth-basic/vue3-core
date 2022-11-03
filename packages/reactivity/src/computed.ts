import { isFunction } from "@vue/shared";
import { ReactiveEffect } from "./effect";
const noop = () => {};

class ComputedRefImpl {
  dep = undefined;
  effect = undefined;
  __v_isRef = true; // 意味着这个属性需要使用.value进行取值
  _dirty = true; // 是脏的才进行执行,
  _value; // 默认的缓存结果
  constructor(getter, public setter) {
    // 源码中不能使用effect，因为只有取值的时候才开始执行
    // ReactiveEffect 执行的fn () => 调度函数
    this.effect = new ReactiveEffect(getter, () => {
      this._dirty = true; // 当响应式的数据发生变化了, 重新调用调度函数scheduler
    });
  }
  get value() {
    // 取值才执行，并且把取到的值放在缓存的结果上
    if (this._dirty) {
      this._value = this.effect.run();
      this._dirty = false; // 意味着取过了
    }
    return this._value;
  }

  set value(newValue) {
    this.setter(newValue);
  }
}

export function computed(getterOrOptions) {
  let onlyGetter = isFunction(getterOrOptions); // 只有getter
  let getter;
  let setter;
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = noop;
  } else {
    // getter方法必须存在
    getter = getterOrOptions.get;
    setter = getterOrOptions.set || noop;
  }
  // 返回一个计算属性
  return new ComputedRefImpl(getter, setter);
}
