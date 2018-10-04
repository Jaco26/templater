

class ComputedPropertyWatcher {
  constructor({ data, computed }) {
    this._data = data;
    this._computed = computed;
    this._vdom = {
      compDependencies: {

      },
      data: {

      },
    };

    this.wrapData();
    this.wrapComputed();
  }

  wrapData() {
    Object.keys(this._data).forEach(key => {
      Object.defineProperty(this._vdom.data, key, {
        get: () => this._data[key],
        set: val => {
          this._data[key] = val;
          this.notifyDependencies(key);
        }
      });
    });
  }

  wrapComputed() {
    Object.keys(this._computed).forEach(key => {
      const fnStr = this._computed[key].toString();
      const fnBodyStr = fnStr.slice(fnStr.indexOf('{') + 1, fnStr.lastIndexOf('}'));
      this._vdom.compDependencies[key] = Object.keys(this._data).reduce((accum, dataKey) => {
        if (fnBodyStr.match('this.' + dataKey)) {
          accum.push(dataKey);
        }
        return accum;
      }, []);
    });

    // evaluate computed properties
    Object.keys(this._computed).forEach(key => {
      this._vdom.data[key] = this._computed[key].call(this._vdom.data);
    });
  }


  setDepRefs(dataKeys, computed) {
    let compPropsCount = 1;
    Object.keys(computed).forEach(key => {
      const fnStr = computed[key].toString();
      const fnBodyStr = fnStr.slice(fnStr.indexOf('{') + 1, fnStr.lastIndexOf('}'));
      this.computedDependencies[compPropsCount] = dataKeys.reduce((accum, dataKey) => {
        if (fnBodyStr.match('this.' + dataKey)) {
          accum.push('this.' + dataKey)
        }
        return accum;
      }, []);
      compPropsCount += 1;
    });
  }

  notifyDependencies(dataKey) {
    const compDependencies = this._vdom.compDependencies
    Object.keys(compDependencies).forEach(depKey => {
      if (compDependencies[depKey].includes(dataKey)) {        
        this._vdom.data[depKey] = this._computed[depKey].call(this._vdom.data);
      }
    });
  }


}

let counter = 0
const instance = new ComputedPropertyWatcher({
  data: {
    name: 'Jacob',
    num: 1,
    num2: 55,
  },
  computed: {
    nameToUpper() {
      return this.name.toUpperCase();
    },
    sumOfNums() {
      return this.num + this.num2;
    }
  }
})

console.log(instance._vdom.data);

instance._vdom.data.name = 'Caroline'
instance._vdom.data.num2 = 22

console.log(instance._vdom.data);

instance._vdom.data.num2 = 12

console.log(instance._vdom.data);

