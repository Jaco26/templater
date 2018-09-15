
const app = new App({
  target: document.querySelector('#app'),
  data: {
    me: '',
    hi: 'Headline!',
    how: 'click this',
    pText: 'This is some text.',
    counter: 0,
    parent: {
      child: 'Hello hello I am the child'
    },
    inputResult: '',
    checkbox: false,
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
    },
  },
});

