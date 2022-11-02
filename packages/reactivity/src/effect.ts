// import { ReactiveEffect } from "vue";
export let activeEffect; // 当前正在执行的effect
function cleanupEffect(effect) {
  let { deps } = effect;
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect); // 让每个属性都失去和当前effect进行关联
  }
  effect.deps.length = 0;
}
class ReactiveEffect {
  public active = true; // effect是否是激活的
  public deps = []; // effect的依赖有哪些
  public parent = undefined;
  constructor(public fn, private scheduler) {}
  run() {
    if (!this.active) {
      return this.fn(); // 如果effect不是激活的直接执行此函数
    }
    // 其他的激活的装填
    // 收集当前这个effect依赖哪些属性
    try {
      this.parent = activeEffect;
      activeEffect = this;
      cleanupEffect(this); //当前的effect上有deps收集的属性
      return this.fn(); // 执行完毕后, 当effect函数执行的时候获取响应式的属性, 这个地方做了依赖收集
    } finally {
      activeEffect = this.parent; // 去除父级的effect
      this.parent = null;
    }
  }
  stop() {
    if (this.active) {
      cleanupEffect(this); // 现将属性的effect进行清除, 再进行effect停止
      this.active = false;
    }
  }
}
// 依赖收集，就是将当前的effect变成全局的，稍后取值的时候可以拿到这个全局正在激活的effect
export function effect(fn, options: any) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  _effect.run();
  const runner = _effect.run.bind(_effect); // bind强制指定当前的this指向.
  runner.effect = _effect;
  return runner;
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

export function trigger(target, key, newValue, oldValue) {
  // 当更新复制的时候让获取当前effect 重新执行
  // weakmap => {obj: map(key, set) }
  let depsMap = targetMap.get(target); // 获取effect收集的对象
  if (!depsMap) {
    return;
  }
  const deps = depsMap.get(key);
  if (deps) {
    const effects = [...deps]; // 拷贝一份为了防止set的特性，
    // 重新设置值的时候会重新出发依赖执行属性依赖的effect函数
    effects.forEach((effect) => {
      // 当我重新执行此effect时，会将当前执行的effect放到全局上activeEffect
      if (effect !== activeEffect) {
        if (effect.scheduler) {
          effect.scheduler();
        } else {
          effect.run();
        }
      }
    });
  }
}
