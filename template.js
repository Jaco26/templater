

class App {
  constructor({ target, template, data, methods }) {
    this.dict = {
      evtTags: [],
      reDict: {
        event: /@\w+="\w+"/g,
        handleBar: /{{.+}}/g,
        anyTag: /<.*?>/g,
        tagsWithEvents: /<.*?@\w+=".+".*?>/g,
        tagsWithIds: /<.*?id=".\w".*?>/g,
      },
    };

    this._target = target;
    this._template = template || target.innerHTML.trim();
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
          this.compileTemplate();
        }
      });
      return accum;
    }, {});
  }

  compileTemplate() {
    let template = this._template;
    const { handleBar, tagsWithEvents } = this.dict.reDict;
    this.dict.evtTags = template.match(tagsWithEvents);
    const expressions = template.match(handleBar);
    expressions.forEach(str => {
      const trimmed = str.slice(2, -2);   
      template = template.replace(str, this._data[trimmed]);
    });  
    this._target.innerHTML = template;
    this.setListeners();
  }

  setListeners() {
    const nodes = this._target.childNodes;
    this.dict.evtTags.forEach((evtTag, i) => {
      const evtDirective = evtTag.match(this.dict.reDict.event)[0];
      if (evtDirective) {
        const tagIdAttr = evtTag.match(/id="[\w-]+"/g)[0];
        const evtName = evtDirective.slice(1, evtDirective.indexOf('='));
        const evtHandler = evtDirective.slice(evtDirective.indexOf('=') + 1).match(/\w/g).join('');
        const idName = tagIdAttr.slice(tagIdAttr.indexOf('=') + 1).match(/[\w-]/g).join('');       
        let targetNode;
        nodes.forEach(node => {
          if (node.id === idName) {
            targetNode = node;
          }
        });
        targetNode.addEventListener(evtName, this._methods[evtHandler])
      }
    });
  }

}

const app = new App({
  target: document.querySelector('#app'),
  data: {
    hi: 'Hello how are you?!',
    how: 'click this',
    pText: 'This is some text.',
    counter: 0,
  },
  methods: {
    sayHello() {
      const name = prompt('What is your name?');
      this.pText = `Hello ${name}! Thanks for visiting!`
    },
    sayGoodbye() {      
      alert('Goodbye!')
    },
    addOne() {
      this.counter += 1;
    }
  },
});

