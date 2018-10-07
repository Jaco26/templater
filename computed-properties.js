const utils = {
  evaluate: function (exprStr) {
    const func = Function('"use strict";return (' + exprStr + ')');    
    return func.call(this);
  },
  parseTemplateFnInvoke: function(fnInvokeStr) {
    const wArgsRe = /\w+\(.+\)/g;
    const parensWArgsRe = /\(.+\)/g;
    const handler = {
      name: fnInvokeStr.match(/\w+/g)[0], // in case the fnInvokeStr ends with `()`
      args: [],
    };
    if (wArgsRe.test(fnInvokeStr)) {
      handler.args = fnInvokeStr.match(parensWArgsRe)[0] // => "(arg1, arg2, ...)"
        .slice(1, -1) // => "arg1, arg2, ..."
        .split(',') // => ["arg1", " arg2", ...]
        .map(arg => arg.trim()); // => ["arg1", "arg2", ...] 
    } 
    return handler;
  }
}

class ReactiveTemplate{
  constructor({ target, template, templateScope, data, methods, computed }) {
    this._target = document.querySelector(target);
    this._templateScope = templateScope || 'this'
    this._data = data;
    this._computed = computed;
    this._methods = methods;
    this._vdom = {
      templateExpressions: {},
      templateEventDirectives: {},
      templateDataDependents: {},
      computedDependencies: {},
      data: {},
    };

    this.wrapData();
    this.wrapComputed();
    this.wrapMethods();
    this.compileTemplate(template || this._target.innerHTML)
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
        if (fnBodyStr.match(`${this._templateScope}.` + dataKey)) {
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

  compileTemplate(inputTemplate) {
    const eventTagRe = /<.*?@\w+=".+".*?>/g;
    const eventDirRe = /@\w+="\w+(\(.*\))*"/g;
    const modelTagRe = /<.*?model=".+".*?>/g;
    const modelDirRe = /model="\w+"/g;
    const handleBarRe = /{{.+?}}/g;
    const dataDepRe = /this\.\w+/g;

    let template = inputTemplate;

    let eventListenerCount = 1;
    let modelCount = 1;
    let expressionCount = 1;

    const tagsWithEventDirectives = template.match(eventTagRe);
    if (tagsWithEventDirectives) {
      tagsWithEventDirectives.forEach(tag => {
        let newTag = tag;        
        const tagEvents = newTag.match(eventDirRe);
        tagEvents.forEach((evt, i) => {
          const evtName = evt.slice(1, evt.indexOf('='));
          const fnInokeStr = evt.slice(evt.indexOf('=') + 2, -1);          
          this._vDom.templateEventDirectives[eventListenerCount] = {
            eventName: evtName,
            domKey: `[data-event${i + 1}-id="${eventListenerCount}"]`,
            handler: utils.parseTemplateFnInvoke(fnInokeStr)
          };          
          newTag = newTag.replace(evt, `data-event${i + 1}-id="${eventListenerCount}"`);
          eventListenerCount += 1;
        });
        template = template.replace(tag, newTag);
      });
    }

    const templateExpressions = template.match(handleBarRe);
    if (templateExpressions) {
      templateExpressions.forEach(expression => {
        const expressionStr = expression.slice(2, -2).trim()
        this._vdom.templateExpressions[expressionCount] = {
          exp: expressionStr,
          domKey: `[data-exp-id="${expressionCount}"]`,
        };
        const dataDependencies = expressionStr.match(dataDepRe);
        if (dataDependencies) {
          dataDependencies.forEach(dep => {
            const depKey = dep.slice(dep.indexOf('.') + 1);
            if (!this._vdom.templateDataDependents[depKey]) {
              // handle error
            } else {
              this._vdom.templateDataDependents[depKey] = [...this._vdom.templateDataDependents[depKey], expressionCount];
            }
          });
        }
        template = template.replace(expression, `<span data-exp-id="${expressionCount}"></span>`);
        expressionCount += 1;
      });
    }

  }

}




// const instance = new ComputedPropertyWatcher({
//   data: {
//     name: 'Jacob',
//     num: 1,
//     num2: 55,
//   },
//   methods: {
//     listThis() {
//       console.log(this.name, this.num, this.num2);      
//     },
//   },
//   computed: {
//     nameToUpper() {
//       return this.name.toUpperCase();
//     },
//     sumOfNums() {
//       return this.num + this.num2;
//     }
//   }
// })

// console.log(instance._vdom.data);

// instance._vdom.data.name = 'Caroline'
// instance._vdom.data.num2 = 22

// console.log(instance._vdom.data);

// instance._vdom.data.num2 = 12

// console.log(instance._vdom.data);

// instance._vdom.data.listThis()