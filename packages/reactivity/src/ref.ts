import { isObject } from "@vue/shared";
import { activeEffect, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

export function ref(value) {
    return new RefImpl(value)
}

function toReactive(value) {
    return isObject(value) ? reactive(value): value

}

class RefImpl {
    dep = undefined
    _value;
    __v_isRef = true
    constructor( public rawValue) {
        this._value = toReactive(rawValue)
    }

    get value() {
        // 依赖收集
        if (activeEffect) {
            trackEffects(this.dep || (this.dep = new Set()))
        }
        return this._value
    }
    set value(newValue) {
        if (newValue !== this.rawValue) {
            this._value = toReactive(newValue)
            this.rawValue = newValue
        }
        triggerEffects(this.dep)
    }
}