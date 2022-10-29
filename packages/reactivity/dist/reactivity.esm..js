// packages/reactivity/src/effect.ts
var activeEffect;
var ReactiveEffect = class {
  constructor(fn) {
    this.fn = fn;
    this.active = true;
    this.deps = [];
    this.parent = void 0;
  }
  run() {
    if (!this.active) {
      return this.fn();
    }
    try {
      this.parent = activeEffect;
      activeEffect = this;
      return this.fn();
    } finally {
      activeEffect = this.parent;
      this.parent = null;
    }
  }
};
function effect(fn) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
}
var targetMap = /* @__PURE__ */ new WeakMap();
function track(target, key) {
  if (!activeEffect) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, dep = /* @__PURE__ */ new Set());
  }
  let shouldTrack = !dep.has(activeEffect);
  if (shouldTrack) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}

// packages/shared/src/index.ts
function isObject(value) {
  return value !== null && typeof value === "object";
}

// packages/reactivity/src/reactive.ts
var ReactiveFlags = /* @__PURE__ */ ((ReactiveFlags2) => {
  ReactiveFlags2["IS_REACTIVE"] = "_v_isReactive";
  return ReactiveFlags2;
})(ReactiveFlags || {});
var mutableHandlers = {
  get(target, key, receiver) {
    if ("_v_isReactive" /* IS_REACTIVE */ === key) {
      return true;
    }
    console.log(activeEffect, key);
    track(target, key);
    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {
    return Reflect.set(target, key, value, receiver);
  }
};
var reactiveMap = /* @__PURE__ */ new WeakMap();
function reactive(target) {
  if (!isObject(target)) {
    return target;
  }
  if (target["_v_isReactive" /* IS_REACTIVE */]) {
    return target;
  }
  const exisitsProxy = reactiveMap.get(target);
  if (exisitsProxy) {
    return exisitsProxy;
  }
  const proxy = new Proxy(target, mutableHandlers);
  return proxy;
}
export {
  ReactiveFlags,
  activeEffect,
  effect,
  reactive,
  track
};
//# sourceMappingURL=reactivity.esm..js.map
