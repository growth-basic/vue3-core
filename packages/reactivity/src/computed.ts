import { isFunction } from "@vue/shared";
import {
  activeEffect,
  ReactiveEffect,
  trackEffects,
  triggerEffects,
} from "./effect";
const noop = () => {};

class ComputedRefImpl {
  public dep = undefined;
  public effect = undefined;
  public __v_isRef = true; // 意味着这个属性需要使用.value进行取值
  public _dirty = true; // 是脏的才进行执行,  默认是脏的
  public _value; // 默认的缓存结果
  constructor(getter, public setter) {
    // 源码中不能使用effect(() => {}) 会立即执行，因为计算属性只有取值的时候才开始执行
    // ReactiveEffect 执行的fn () => 调度函数， 找到当前依赖的属性，当前计算属性依赖的属性发生变化, 执行scheduler的回调函数，将计算属性值修改为脏的，在下次取值的时候从新计算属性
    // 当前的getter会进行再effect中执行一次
    this.effect = new ReactiveEffect(getter, () => {
      this._dirty = true; // 当响应式的数据发生变化了, 重新调用调度函数scheduler
      // 当值变化的时候，让计算属性依赖收集的effect重新执行
      console.log(this.dep, "dep//");
      // 当计算属性依赖的值发生变化
      triggerEffects(this.dep); // 当对象属性的值发生变化的时候, 计算属性会重新变为脏的, 计算属性会重新执行
    });
  }
  get value() {
    // 取值才执行，并且把取到的值放在缓存的结果上
    // 重新执行的时候因为_dirty变为true 会重新获取值
    if (activeEffect) {
      // 如果有activeEffect，说明这个计算属性在effect中执行
      // 需要让计算属性收集这个依赖
      // 用户取值的时候发生收集功能, 用于下次再出发更新的时候执行需要更新的effect
      // 使用当前计算属性依赖取值的时候, 收集当前activeEffect
      trackEffects(this.dep || (this.dep = new Set()));
    }
    if (this._dirty) { // 只有是脏的时候才能重新执行, 不是脏的就直接获取缓存
      this._value = this.effect.run(); 
      this._dirty = false; // 意味着取过了
    }
    return this._value;
  }

  set value(newValue) { // 给计算属性.value 复制的时候此操作
    // 取值的时候看当前是否有effect
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
