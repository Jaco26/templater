

class ComputedPropertyWatcher {
  constructor({ target, template, data, methods, computed }) {
    this._target = document.querySelector(target);
    this._template = template || this._target.innerHTML;
    this._data = data;
    this._computed = computed;
    this._methods = methods;
    this._vdom = {
      templateExpressions: {

      },
      computedDependencies: {

      },
      data: {

      },
    };

    this.wrapData();
    this.wrapComputed();
    this.wrapMethods();
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
    // Each time a computed proprty function references 'this.<someKey>',
    // cache that key as a dependecy of the computed property (registered undeder the
    // computed property's name). When a this._data property changes, this.notifyDependencies
    // invoke all computed properties who cached that dataKey as a dependency
    Object.keys(this._computed).forEach(key => {
      const fnStr = this._computed[key].toString();
      const fnBodyStr = fnStr.slice(fnStr.indexOf('{') + 1, fnStr.lastIndexOf('}'));
      this._vdom.computedDependencies[key] = Object.keys(this._data).reduce((accum, dataKey) => {
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

  wrapMethods() {
    Object.keys(this._methods).forEach(key => {
      this._vdom.data[key] = this._methods[key];
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
    const compDependencies = this._vdom.computedDependencies
    Object.keys(compDependencies).forEach(depKey => {
      if (compDependencies[depKey].includes(dataKey)) {        
        this._vdom.data[depKey] = this._computed[depKey].call(this._vdom.data);
      }
    });
  }

  compileTemplate() {
    const eventTagRe = /<.*?@\w+=".+".*?>/g;
    const eventDirRe = /@\w+="\w+(\(.*\))*"/g;
    const modelTagRe = /<.*?model=".+".*?>/g;
    const modelDirRe = /model="\w+"/g;
    const handleBarRe = /{{.+?}}/g;
    const dataDepRe = /this\.\w+/g;

  }

}




let counter = 0
const instance = new ComputedPropertyWatcher({
  data: {
    name: 'Jacob',
    num: 1,
    num2: 55,
  },
  methods: {
    listThis() {
      console.log(this.name, this.num, this.num2);      
    },
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

instance._vdom.data.listThis()