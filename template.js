

class App {
  constructor({ target, template, data, methods }) {
    this.reDict = {
      event: /@\w+="\w+"/g,
      handleBar: /{{.+}}/g,
      anyTag: /<.*?>/g,
      tagsWithEvents: /<.*?@\w+=".+".*?>/g,
      tagsWithIds: /<.*?id=".\w".*?>/g,
    }

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
    const expressions = template.match(handleBar)

    expressions.forEach(str => {
      const trimmed = str.slice(2, -2);   
      template = template.replace(str, this._data[trimmed]);
    });  
    
    this._target.innerHTML = template;
  }

}

const app = new App({
  target: document.querySelector('#app'),
  template: `
  <div>
    <h1>{{hi}} </h1>
    <button @click="sayHello">{{how}}</button>
    <p> {{hi}} </p>
  </div>`,
  data: {
    hi: 'Hello how are you?!',
    how: 'click this'
  },
  methods: {
    sayHello() {
      app.updateData('hi', 'Welcome to this site!')
    },
  },
});

// document.querySelector('#btn').addEventListener('click', () => {
//   app._methods.sayHello()
// });
