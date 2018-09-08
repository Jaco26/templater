

class App {
  constructor({ target, template, data, methods }) {
    this.reDict = {
      event: /@\w+="\w+"/g,
      handleBar: /{{.+}}/g,
      anyTag: /<.*?>/g,
      tagsWithEvents: /<.*?@\w+=".+".*?>/g,
      tagsWithIds: /<.*?id=".\w".*?>/g,
    };
    this.evtTags = [];

    this._target = target;
    this._template = template || target.innerHTML.trim();
    this._data = this.wrapData(data);
    this._methods = methods;

    this.compileTemplate();
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
    const { handleBar, tagsWithEvents } = this.reDict;
    this.evtTags = template.match(tagsWithEvents);
    const expressions = template.match(handleBar);
    expressions.forEach(str => {
      const trimmed = str.slice(2, -2);   
      template = template.replace(str, this._data[trimmed]);
    });  
    this._target.innerHTML = template;
    this.setListeners();
  }

  setListeners() {
    console.log(this.evtTags);
    this.evtTags.forEach(evtTag => {
      const evtDirective = evtTag.match(this.reDict.event)[0];
      const evtName = evtDirective.slice(1, evtDirective.indexOf('='));
      
      console.log(evtName);
      
      document.addEventListener()
    });
  }

}

const app = new App({
  target: document.querySelector('#app'),
  data: {
    hi: 'Hello how are you?!',
    how: 'click this',
    pText: 'This is some text.'
  },
  methods: {
    sayHello() {
      const name = prompt('What is your name?');
      app._data.pText = `Hello ${name}! Thanks for visiting!`
    },
  },
});

document.querySelector('#btn').addEventListener('click', app._methods.sayHello);
