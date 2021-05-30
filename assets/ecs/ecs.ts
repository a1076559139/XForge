import * as cc from "cc"
import EcsComponent from "./EcsComponent";
import EcsEntity from "./EcsEntity";
import EcsSystem from "./EcsSystem";

class FlagManager {
    private flag: number = 0;
    private array: [number, number] = [0, 0];
    private cache: { [name: string]: [number, number] } = cc.js.createMap();

    get(type: typeof EcsComponent | EcsComponent | string): [number, number] {
        const name = (typeof type === 'string') ? type : cc.js.getClassName(type);
        if (!this.cache[name]) {
            if (this.flag < 32) {
                this.cache[name] = [0, 1 << this.flag++];
            } else if (this.flag < 64) {
                this.cache[name] = [1 << (this.flag++ - 32), 0];
            } else {
                throw new Error('当前component的种类超过64个, 请自行扩展flag');
            }
        }
        return this.cache[name];
    }
    gets<T extends EcsComponent>(types: (new () => T)[] | EcsComponent[]): [number, number] {
        this.array[0] = this.array[1] = 0;
        (types as any).forEach((type: typeof EcsComponent | EcsComponent) => {
            const _flag = this.get(type);
            this.array[0] = this.array[0] | _flag[0];
            this.array[1] = this.array[1] | _flag[1];
        })
        return this.array;
    }
}

class ComponentManager {
    private entitys: { [name: string]: Set<EcsEntity> } = cc.js.createMap();

    addEntity(name: string, entity: EcsEntity) {
        this.getEntitys(name).add(entity);
    }

    removeEntity(name: string, entity: EcsEntity) {
        if (this.hasEntitys(name)) {
            this.getEntitys(name).delete(entity);
        }
    }

    hasEntitys(name: string): Set<EcsEntity> | null {
        return this.entitys[name] || null;
    }

    getEntitys(name: string) {
        if (!this.entitys[name]) {
            this.entitys[name] = new Set();
        }
        return this.entitys[name];
    }

    getEntityUuid(component: EcsComponent) {
        return component.node.uuid;
    }

    getName<T extends EcsComponent>(type: (new () => T) | (typeof EcsComponent) | EcsComponent | string): string {
        return (typeof type === 'string') ? type : cc.js.getClassName(type);
    }

    each(callback: (value: Set<EcsEntity>) => void) {
        for (const key in this.entitys) {
            callback(this.entitys[key]);
        }
    }
}

class EntityManager {
    private cache: EcsEntity[] = [];
    private entitys: Map<string, EcsEntity> = new Map();

    has(uuid: string) {
        return this.entitys.get(uuid) || null;
    }

    get(uuid: string): EcsEntity {
        if (!this.entitys.has(uuid)) {
            let entity = null;
            if (this.cache.length) {
                entity = this.cache.pop() as EcsEntity;
                entity.uuid = uuid;
            } else {
                entity = new EcsEntity();
                entity.uuid = uuid;
            }
            this.entitys.set(uuid, entity);
        }

        return this.entitys.get(uuid) as EcsEntity;
    }

    put(entity: EcsEntity): void {
        this.entitys.delete(entity.uuid);
        this.cache.push(entity);
        entity.clear();
    }

    each(callback: (value: EcsEntity) => void) {
        this.entitys.forEach(callback);
    }
}

class SystemManager {
    private systemNames: string[] = [];
    private systems: EcsSystem[] = [];

    add(system: EcsSystem) {
        const sysName = cc.js.getClassName(system);
        const index = this.systemNames.indexOf(sysName);
        if (index == -1) {
            let i = this.systems.length - 1;
            for (const sort = system.sort; i >= 0; i--) {
                if (sort >= this.systems[i].sort) {
                    break;
                }
            }
            if (i === this.systems.length - 1) {
                this.systems.push(system);
                this.systemNames.push(sysName);
            } else {
                this.systems.splice(i + 1, 0, system);
                this.systemNames.splice(i + 1, 0, sysName);
            }
        } else {
            this.systems[index] = system;
        }

        console.log('[ECS] System Sort: ' + this.systemNames);
    }

    remove(system: EcsSystem) {
        const sysName = cc.js.getClassName(system);
        const index = this.systemNames.indexOf(sysName);
        if (index >= 0) {
            this.systems.splice(index, 1);
            this.systemNames.splice(index, 1);
        }
    }

    each(callback: (value: EcsSystem) => void) {
        this.systems.forEach(callback);
    }
}

class TimerManager {
    private timers: [any, Function, number, number, number][] = [];

    on(target: any, callback: Function, frameCount = 1, times = 1) {
        this.timers.push([target, callback, frameCount, times, 0]);
    }

    off(callback: Function, target?: any) {
        for (let index = this.timers.length - 1; index >= 0; index--) {
            const timer = this.timers[index];
            if (timer[1] === callback && (target ? timer[0] === target : true)) {
                this.timers.splice(index, 1);
            }
        }
    }

    handle(data1?: any, data2?: any, data3?: any, data4?: any, data5?: any) {
        for (let index = 0; index < this.timers.length; index++) {
            const timer = this.timers[index];
            if (++timer[4] >= timer[2]) {
                timer[1].call(timer[0], data1, data2, data3, data4, data5);
                if (--timer[3] <= 0) {
                    this.timers.splice(index--, 1);
                }
            }
        }
    }
}

class ECS {
    private flagManager = new FlagManager();
    private entityManager = new EntityManager();
    private systemManager = new SystemManager();
    private componentManager = new ComponentManager();
    private emptyArray: EcsEntity[] = [];
    private outArray: EcsEntity[] = [];

    /**
     * ecs定时器，基于update驱动
     * @example
     * updateTimer.on(this,()=>cc.log(1),3,2) // 3个update后执行cc.log(1)，循环2次
     */
    public readonly updateTimer = new TimerManager();
    /**
     * ecs定时器，基于excute驱动
     */
    public readonly excuteTimer = new TimerManager();

    /**
     * 添加一个组件
     * @param component 
     */
    public addComponent(component: EcsComponent) {
        const entityUuid = this.componentManager.getEntityUuid(component);
        const componentName = this.componentManager.getName(component);
        const componentFlag = this.flagManager.get(componentName);

        const entity = this.entityManager.get(entityUuid);
        entity.addComponent(component, componentFlag);

        this.componentManager.addEntity(componentName, entity);
    };

    /**
     * 移除一个组件
     * @param component 
     */
    public removeComponent(component: EcsComponent) {
        const entityUuid = this.componentManager.getEntityUuid(component);
        const componentName = this.componentManager.getName(component);
        const componentFlag = this.flagManager.get(component);

        const entity = this.entityManager.get(entityUuid);
        entity.removeComponent(component, componentFlag);

        this.componentManager.removeEntity(componentName, entity);

        if (entity.size() == 0) this.entityManager.put(entity);
    };

    /**
     * 根据ecsComponent获取对应的ecsEntity
     * @param target 
     */
    public getTargetEntity(target: EcsComponent | EcsComponent[]): EcsEntity | null {
        if (target instanceof Array) {
            return this.entityManager.has(this.componentManager.getEntityUuid(target[0]));
        } else {
            return this.entityManager.has(this.componentManager.getEntityUuid(target));
        }
    }

    /**
     * 根据类型获取单个ecsEntity
     * @param types 
     */
    public getEntity<T extends EcsComponent>(types: (new () => T) | (new () => T)[]): EcsEntity | null {
        return this.getEntitys(types, this.outArray)[0] || null;
    }

    /**
     * 根据类型获取多个ecsEntity
     * @param types 
     */
    public getEntitys<T extends EcsComponent>(types: (new () => T) | (new () => T)[] | (typeof EcsComponent)[] | (typeof EcsComponent), out?: EcsEntity[]): EcsEntity[] {
        if (!out) out = [];
        if (out !== this.emptyArray) out.length = 0;

        if (types instanceof Array) {
            if (types.length) {
                if (out !== this.emptyArray) this.emptyArray.length = 0;
                const flags = this.flagManager.gets(types);
                const entitys = this.getEntitys(types[0], this.emptyArray);
                for (let index = 0; index < entitys.length; index++) {
                    entitys[index].check(flags) && out.push(entitys[index]);
                }
            }
        } else {
            const componentName = this.componentManager.getName(types);
            const entity = this.componentManager.hasEntitys(componentName);
            if (entity && entity.size) {
                const values = entity.values();
                for (let value = values.next(); value.done === false; value = values.next()) {
                    out.push(value.value);
                }
            }
        }

        return out;
    };

    public getSingleComponent<T extends EcsComponent>(type: (new () => T)): T | null {
        return this.getEntity(type)?.getComponent(type) || null;
    }

    /**
     * 添加一个系统
     * @param system 
     */
    public addSystem(system: EcsSystem) {
        this.systemManager.add(system);
    }

    /**
     * 移除一个系统
     * @param system 
     */
    public removeSystem(system: EcsSystem) {
        this.systemManager.remove(system);
    }


    private updateSystem(data1?: any, data2?: any, data3?: any, data4?: any, data5?: any) {
        this.systemManager.each(function (system) {
            system.ecsUpdate(data1, data2, data3, data4, data5);
        })
    }

    private excuteSystem(data1?: any, data2?: any, data3?: any, data4?: any, data5?: any) {
        this.systemManager.each(function (system) {
            system.ecsExcute(data1, data2, data3, data4, data5);
        })
    }

    private updateComponent(data1?: any, data2?: any, data3?: any, data4?: any, data5?: any) {
        this.entityManager.each(function (entity) {
            entity.eachComponent(function (component: any) {
                component.ecsUpdate(data1, data2, data3, data4, data5);
            })
        })
    }

    private excuteComponent(data1?: any, data2?: any, data3?: any, data4?: any, data5?: any) {
        this.entityManager.each(function (entity) {
            entity.eachComponent(function (component: any) {
                component.ecsExcute(data1, data2, data3, data4, data5);
            })
        })
    }

    /**
     * 一般可以由manager的update驱动
     */
    public update(data1?: any, data2?: any, data3?: any, data4?: any, data5?: any) {
        this.updateTimer.handle(data1, data2, data3, data4, data5);
        this.updateComponent(data1, data2, data3, data4, data5);
        this.updateSystem(data1, data2, data3, data4, data5);
    }

    /**
     * 等同于update，一般情况下用不到，但是某些特殊情况下，比如：
     * 帧同步模式下，需要一个渲染帧(update)和一个逻辑帧，这个逻辑帧就可以用excute来驱动了
     * 
     * 当然也可以用两套cs做渲染和逻辑的控制
     */
    public excute(data1?: any, data2?: any, data3?: any, data4?: any, data5?: any) {
        this.excuteTimer.handle(data1, data2, data3, data4, data5);
        this.excuteComponent(data1, data2, data3, data4, data5);
        this.excuteSystem(data1, data2, data3, data4, data5);
    }
}

class ECSManager extends ECS {
    private ecss: Map<string, ECS> = new Map();

    public getECS(ecsName: string): ECS {
        if (!ecsName || ecsName === 'default') {
            return this;
        }
        if (!this.ecss.has(ecsName)) {
            this.ecss.set(ecsName, new ECS());
        }

        return this.ecss.get(ecsName) as ECS;
    }

    public deleteECS(ecsName: string) {
        if (this.ecss.has(ecsName)) {
            this.ecss.delete(ecsName);
        }
    }

    public clearECSs() {
        this.ecss.clear();
    }
}

export default new ECSManager();