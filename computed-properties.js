class WithComputedProps {
  constructor({ data, computed }) {
    this.test = 'Hello'
    this.computedDependencies = {
      
    };
    this.allData = this.setAllData(data, computed);
    console.log(this.allData);
    
  }

  setAllData(data, computed) {
    const result = {};
    const dataKeys = Object.keys(data)
    
    dataKeys.forEach(key => {
      Object.defineProperty(result, key, {
        get: () => data[key],
        set: val => {
          data[key] = val;
          this.notifyDependencies(key)
        }
      });
    });

    this.setDepRefs(dataKeys, computed);
    Object.assign(result, result, this.evaluateComputed(data, computed));

    // console.log(this.computedDependencies);
    console.log(result);
    
  }

  evaluateComputed(data, computed) {    
    return Object.keys(computed).reduce((accum, key) => {
      accum[key] = computed[key].call(data);
      return accum;
    }, {});
  }

  setDepRefs(dataKeys, computed) {
    let compPropsCount = 1;
    Object.keys(computed).forEach(key => {
      const fnStr = computed[key].toString();      
      const fnBodyStr = fnStr.slice(fnStr.indexOf('{') + 1, fnStr.lastIndexOf('}'));
      this.computedDependencies[compPropsCount] = dataKeys.reduce((accum, dataKey) => {
        if (fnBodyStr.match('this.' + dataKey)) {
          accum.push('this.'+dataKey)
        }
        return accum;
      }, []);
      compPropsCount += 1;
    });
  }
}



const instance = new WithComputedProps({
  data: {
    name: 'Jacob',
    age: 9,
  },
  computed: {
    nameToUpper() {
      return this.name.toUpperCase() + this.age;
    },
  },
});

