class ReactiveTemplate {
  constructor({ target, data, methods, template }) {
    this._target = document.querySelector(target);
    this._template = template || this._target.innerHTML;

    this._vDom = {
      eventListeners: {},
      models: {},
      expressions: {},
      dataDependents: {}
    };

    this._data = this.wrapData(data);
    this._methods = this.wrapMethods(methods);

    this.compileTemplate();
  }

  notifyVDom(key) {
    const effectedDependentExpressions = this._vDom.dataDependents[key].reduce((accum, exprKey) => {
      accum.push(this._vDom.expressions[exprKey]);
      return accum;
    }, []);
    this.evaluateExpressions(effectedDependentExpressions)
  }

  wrapData(appData) {
    return Object.keys(appData).reduce((accum, key) => {
      this._vDom.dataDependents[key] = [];
      Object.defineProperty(accum, key, {
        get: () => appData[key],
        set: val => {
          appData[key] = val
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
        const evtName = listeners[key].name;
        const handler = listeners[key].handler;
        const el = document.querySelector(listeners[key].domKey);
        el.addEventListener(evtName, handler);
      });
    }
  }

  evaluateExpressions(exprs) {
    const expressions = exprs || this._vDom.expressions;
    if (expressions) {
      Object.keys(expressions).forEach(key => {
        const el = document.querySelector(expressions[key].domKey);
        const expVal = evaluate.call(this._data, expressions[key].exp)

        function evaluate(exprStr) {
          return eval(exprStr);
        }

        el.textContent = expVal;
      });
    }
  }

  compileTemplate() {
    const eventTagRe = /<.*?@\w+=".+".*?>/g;
    const eventDirRe = /@\w+="\w+(\(.*\))*"/g;
    const modelTagRe = /<.*?model=".+".*?>/g;
    const modelDirRe = /model="\w+"/g;
    const handleBarRe = /{{.+}}/g;
    const dataDepRe = /this\.\w+/g;

    let template = this._template;

    let eventListenerCount = 1;
    let modelCount = 1;
    let handleBarCount = 1;

    const tagsWithEventDirectives = template.match(eventTagRe);
    if (tagsWithEventDirectives) {
      tagsWithEventDirectives.forEach(tag => {
        let newTag = tag
        const tagEvents = newTag.match(eventDirRe);
        tagEvents.forEach((evt, i) => {
          const evtName = evt.slice(1, evt.indexOf('='));
          const evtHandler = evt.slice(evt.indexOf('=') + 2, -1);
          this._vDom.eventListeners[eventListenerCount] = {
            name: evtName,
            domKey: `[data-event${i + 1}-id="${eventListenerCount}"]`,
            handler: this._methods[evtHandler],
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
        // console.log(dataDeps);
        dataDeps.forEach(dep => {
          const depKey = dep.slice(dep.indexOf('.') + 1);
          this._vDom.dataDependents[depKey] = [...this._vDom.dataDependents[depKey], handleBarCount]
        });
        template = template.replace(expression, `<span data-exp-id="${handleBarCount}"></span>`)
        handleBarCount += 1;
      });
    }

    this._target.innerHTML = template;

    this.bindModels();
    this.setListeners();
    this.evaluateExpressions();

  }


}
