// import { ReactiveEffect } from "vue";
export let activeEffect; // 当前正在执行的effect
class ReactiveEffect {
  public active = true; // effect是否是激活的
  public deps = []; // effect的依赖有哪些
  public parent = undefined;
  constructor(public fn) {}
  run() {
    if (!this.active) {
      return this.fn(); // 如果effect不是激活的直接执行此函数
    }
    // 其他的激活的装填
    // 收集当前这个effect依赖哪些属性
    try {
      this.parent = activeEffect;
      activeEffect = this;
      return this.fn(); // 执行完毕后, 当effect函数执行的时候获取响应式的属性
    } finally {
      activeEffect = this.parent; // 去除父级的effect
      this.parent = null;
    }
  }
}
// 依赖收集，就是将当前的effect变成全局的，稍后取值的时候可以拿到这个全局正在激活的effect
export function effect(fn) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
}

// 映射表的设计
// 1. 一个对象中属性可能在多个effect中使用
//
const targetMap = new WeakMap();
export function track(target, key) {
  // target代理对象的取值没有发生在effect中
  if (!activeEffect) {
    return;
  }
  //
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    // 第一次获取的时候, key 是一个字符串
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  let shouldTrack = !dep.has(activeEffect);
  if (shouldTrack) {
    dep.add(activeEffect); // 属性记住effect
    activeEffect.deps.push(dep); // effect收集属性, 后续需要使用effect做清理工作
    // 一个属性对接多个effect 一个effect会有多个属性 多对多的关系
  }
}
