### Vue

#### 1. Vue 的特性

1. 声明式渐进式框架
2. 采用虚拟 DOM
3. 区分编译时和运行时
4. Vue3 新增设计
   - 模块拆分
   - 重写 API
   - 扩展更方便: 自定义渲染器
   - 采用 RFC

### 2. Vue3 的架构

> Monorepo 是管理项目代码的一种方式, 指在一个项目中可以管理多个模块/包, 将模块拆分到 package 目录中，作为一个包来管理. 而且包与包之间可以相互引用
>
> 1. 一个仓库可以维护多个包,
> 2. 方便版本管理和依赖管理, 模块之间的引用，调用非常方便

1. Vue3 的组成
2. Vue3 的核心
3. Vue3 采用 Typescript

### 3. Vue3 环境搭建

> Vue3 使用 pnpm workspace 来实现 monorepo, pnpm 天生支持 monorepo 的开发模式

1. pnpm 安装的时候模块的时候，如果需要安装的是公共模块的包需要`pnpm install vue -w`, `-w:安装到工作目录下`
2. 打包的格式有哪些

- node 中使用的 commonjs cjs
- es6 esm-bundler esm-browser
- global script iife

  ```json
  <!-- 打包的配置文件 -->
  {
    "name": "@vue/reactivity",
    "version": "1.0.0",
    "description": "",
    "module": "dist/reactivity.esm-bundler.js", // 加载包的入口
    "unpkg": "dist/reactivity.global.js", // 全局导入
    "buildOptions": {
      "name": "VueReactivity", // 全局到处名称
      "formats": ["esm-browser", "esm-bundler", "cjs", "global"] // 打包的构建输出格式
    }
  }
  ```

3. 使用`pnpm install @vue/shared@workspace --filter @vue/reactivity`实现包之间的相互依赖

4. proxy 代理的问题，要配个 Reflect 使用，避免在数据修改的时候获取的是源对象，监控不到代理属性的修改

```js
let person = {
  name: "killian",
  get aliasName() {
    return "**" + this.name + "**";
  },
};

const proxy = new Proxy(person, {
  get(target, key, receiver) {
    console.log(123);
    return Reflect.get(target, key, receiver);
    //  return target[key];
  },
  set(target, key, value, receiver) {
    //  target[key] = value;
    //  return true;
    return Reflect.set(target, key, value, receiver);
  },
});
// 代理的对象获取值get方法只能触发一次，不能够劫持到this.name的变化，因为获取的this =>person不是代理对象
// 使用Reflect可以获取两次, 内部的this会指向当前的代理对象
console.log(proxy.aliasName);
```

5. reactive 的特点

   1. 被代理的对象再次代理会返回原对象,
   2. 被代理已存在的对象会直接返回
   3. 创建出来的对象是 proxy 的代理对象，配合 Reflect 使用

6. effect 的关联属性和激活的 effect
   > 为了使属性和当前的属性相关联，方面后面属性和 effect 进行收集

```JS
   effect(() => { // e1
      name
      effect(() => { // e2
       age
      })
      address
   })
   // 栈结构实现
   // let stack = []
   // e1进栈收集name e2进栈收集age 当e2执行完后后 让e2出站  e1收集address 可行
   // 链表结构
   // 1. let activeEffect = e1 e1.parent = null
   // 2. let activeEffect = e2 e2.parent = e1
   // 3. e2执行完毕后 let activeEffect = e2.parent; e2.parent = null
   // 4. activeEffect就是e1 可行
```

7.  track 收集当前对象的属性和 effect 的关系

    > 映射表的设计, 一个对象中属性可能在多个 effect 中使用

    ```js
    let effectMapping = {
      target: {
        name: [activeEffect, activeEffect],
      },
    };
    ```

8.  响应式数据依赖收集的逻辑实现是怎样实现的?

9.  清理 effect 中所有依赖的属性, 因为我们在执行判断逻辑的时候, 当我们更新不必要的属性的时候也会触发 effect 执行, 清除上一次的依赖收集可以避免 effect 重复执行
10. effect 的返回值 runner 手动执行实现和 stop 函数停止,以及 scheduler 组件更新实现
    > scheduler 组件提供一个更新函数，后续组件更新都是根据这个来实现的

### 计算属性

> 计算属性的目的是根据状态衍生出一个状态，我们希望这个属性有缓存功能，如果依赖的数据不发生变化不会重新计算
> 当我们取值的时候，会调用此方法， 当依赖的值发生变化的时候会重新计算
> 计算属性内部需要一个变量, 这个变量控制是否要重新执行`dirty`
> 内部认识 dirty 是 true 才是用户取值会执行此方法，拿到返回结果并转存起来，将 dirty 变为 false

### watch 属性的实现?

- 计算属性内部还是基于 effect 实现, 通过 dirty 是脏的去执行代码的变化 ?
  就是一个 effect 的执行，基于 effect 的 scheduler 获取前后的值，进行获取，immediate 记性默认执行一次
