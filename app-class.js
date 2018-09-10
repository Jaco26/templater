
class App {
  constructor({ target, template, data, methods }) {
    this.reDict = {
      event: /@\w+="\w+"/g,
      handleBar: /{{.+}}/g,
      tagsWithEvents: /<.*?@\w+=".+".*?>/g,
      tagsWithHandleBarVals: /<.*?>.*{{\w+}}/g,
    };

    this.vDom = {
      data: {},
      listen: {},
    }
    
    this._target = target;
    this._template = template || target.innerHTML;
    this._data = this.wrapData(data);
    this._methods = this.bindMethodsToData(methods);

    this.compileTemplate();
  }

  bindMethodsToData(methods) {
    return Object.keys(methods).reduce((accum, methodKey) => {
      accum[methodKey] = methods[methodKey].bind(this._data);
      return accum;
    }, {});
  }

  wrapData(data) {
    return Object.keys(data).reduce((accum, dataKey) => {
      Object.defineProperty(accum, dataKey, {
        get: () => data[dataKey],
        set: val => {
          data[dataKey] = val;
          this.updateTextContent(dataKey);
        }
      });
      return accum;
    }, {});
  }

  setListeners() {
    if (this._methods && Object.keys(this._methods).length > 0) {
      Object.keys(this.vDom.listen).forEach(key => {
        const listen = this.vDom.listen[key];
        const targetEl = document.querySelector(`[data-listen-id="${listen.id}"]`)
        targetEl.addEventListener(listen.eventName, this._methods[key.slice(1, -1)]);
      });
    }
   
  }

  updateTextContent(dataKey) {
    const vDomElId = this.vDom.data[dataKey];
    if (vDomElId) {
      document.querySelector(`[data-data-id="${vDomElId}"]`).textContent = this._data[dataKey];
    }
  }

  compileTemplate() {
    const { tagsWithHandleBarVals, tagsWithEvents, handleBar, event } = this.reDict;
  
    let template = this._template;
    let dataIdCount = 0;
    let listenIdCount = 0;

    const hdlBarValTags = template.match(tagsWithHandleBarVals);
    if (hdlBarValTags) {
      hdlBarValTags.forEach(item => {
        const hdlBar = item.match(handleBar)[0].slice(2, -2);
        const hdlBarVal = this._data[hdlBar];
        const dataTag = `data-data-id="${dataIdCount}"`;
        const withHdlBarVal = item.replace(handleBar, `<span ${dataTag}>${hdlBarVal}</span>`);
        const final = withHdlBarVal;
        this.vDom.data[hdlBar] = dataIdCount;
        template = template.replace(item, final);
        dataIdCount += 1
      });
    }
    
    const eventTags = template.match(tagsWithEvents);
    if (eventTags) {
      eventTags.forEach(item => {
        const evt = item.match(event)[0];
        const eventName = evt.slice(1, evt.indexOf('='));
        const eventHandler = evt.slice(evt.indexOf('=') + 1);
        this.vDom.listen[eventHandler] = {
          id: listenIdCount,
          eventName,
        };
        template = template.replace(evt, ` data-listen-id="${listenIdCount}"`);
        listenIdCount += 1;
      });
    }
    
    this._target.innerHTML = template;
    this.setListeners();
  }
  

}