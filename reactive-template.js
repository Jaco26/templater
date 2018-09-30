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

class ReactiveTemplate {
  constructor({ target, data, methods, template }) {
    this._target = document.querySelector(target);
    this._vDom = {
      eventListeners: {},
      models: {},
      expressions: {},
      dataDependents: {}
    };
    this._data = this.wrapData(data);
    this._methods = this.wrapMethods(methods);

    this.errorHandler = {
      compileTemplateError: [],
    }

    this.compileTemplate(template || this._target.innerHTML);
  }

  notifyVDom(key) {
    const effectedDependentExpressions = this._vDom.dataDependents[key].reduce((accum, exprKey) => {
      accum.push(this._vDom.expressions[exprKey]);
      return accum;
    }, []);
    this.evaluateTemplateExpressions(effectedDependentExpressions)
  }

  wrapData(appData) {
    return Object.keys(appData).reduce((accum, key) => {
      this._vDom.dataDependents[key] = [];
      Object.defineProperty(accum, key, {
        get: () => appData[key],
        set: val => {
          appData[key] = val;
          this.notifyVDom(key);
        },
      });
      return accum;
    }, {});
  }

  wrapMethods(appMethods) {
    return Object.keys(appMethods).reduce((accum, key) => {
      accum[key] = appMethods[key].bind(this._data);
      return accum;
    }, {});
  }

  bindModels() {
    const models = this._vDom.models;
    if (models) {
      Object.keys(models).forEach(key => {
        const el = document.querySelector(models[key].domKey);
        el.addEventListener('input', (e) => {
          this._data[key] = e.target.value;
        });
      });
    }
  }

  setListeners() {
    const listeners = this._vDom.eventListeners;
    if (listeners) {
      Object.keys(listeners).forEach(key => {
        const evtName = listeners[key].eventName;        
        const handlerName = listeners[key].handler.name;
        const handlerArgs = this.evaluateTemplateFnArguments(listeners[key].handler.args);        
        const el = document.querySelector(listeners[key].domKey);        
        el.addEventListener(evtName, (function (e) {
          this._methods[handlerName].apply(this._data, handlerArgs);
        }).bind(this))
      });
    }
  }

  setReferences() {
    const expressions = this._vDom.expressions;
    if (expressions) {
      Object.keys(expressions).forEach(key => {
        expressions[key].el = document.querySelector(expressions[key].domKey);
      });
    }
  }

  evaluateTemplateFnArguments(args) {
    return args.map(exp => utils.evaluate.call(this._data, exp));
  }

  evaluateTemplateExpressions(exprs) {
    const expressions = exprs || this._vDom.expressions;
    if (expressions) {
      Object.keys(expressions).forEach(key => {
        expressions[key].el.textContent = utils.evaluate.call(this._data, expressions[key].exp);
      });
    }
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
    let handleBarCount = 1;

    const tagsWithEventDirectives = template.match(eventTagRe);
    if (tagsWithEventDirectives) {
      tagsWithEventDirectives.forEach(tag => {
        let newTag = tag;        
        const tagEvents = newTag.match(eventDirRe);
        tagEvents.forEach((evt, i) => {
          const evtName = evt.slice(1, evt.indexOf('='));
          const fnInokeStr = evt.slice(evt.indexOf('=') + 2, -1);          
          this._vDom.eventListeners[eventListenerCount] = {
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

    const tagsWithModelDirectives = template.match(modelTagRe);
    if (tagsWithModelDirectives) {
      tagsWithModelDirectives.forEach(tag => {
        let newTag = tag;
        const modelDir = newTag.match(modelDirRe)[0];
        const model = modelDir.slice(modelDir.indexOf('=') + 2, -1);
        this._vDom.models[model] = {
          domKey: `[data-model-id="${modelCount}"]`,
        };
        newTag = newTag.replace(modelDir, `data-model-id="${modelCount}"`);
        template = template.replace(tag, newTag);
        modelCount += 1
      });
    }

    const handleBarExpressions = template.match(handleBarRe);
    if (handleBarExpressions) {
      handleBarExpressions.forEach(expression => {
        const expStr = expression.slice(2, -2).trim();
        this._vDom.expressions[handleBarCount] = {
          exp: expStr,
          domKey: `[data-exp-id="${handleBarCount}"]`
        }
        const dataDeps = expStr.match(dataDepRe);
        dataDeps.forEach(dep => {
          const depKey = dep.slice(dep.indexOf('.') + 1);
          if (!this._vDom.dataDependents[depKey]) {
            this.errorHandler.compileTemplateError.push(`${depKey} was referenced in the template but it was not defined on the instance.`);
          } else {
            this._vDom.dataDependents[depKey] = [...this._vDom.dataDependents[depKey], handleBarCount];
          }
        });
        template = template.replace(expression, `<span data-exp-id="${handleBarCount}"></span>`);
        handleBarCount += 1;
      });
    }

    this._target.innerHTML = template;

    this.bindModels();
    this.setListeners();
    this.setReferences();
    this.evaluateTemplateExpressions();

    this.logErrors();

  }

  logErrors() {
    Object.keys(this.errorHandler).forEach(key => {
      this.errorHandler[key].forEach(err => {
        console.error(`${key}: ${err}`);
      });
      this.errorHandler[key] = [];
    });
  }

}
