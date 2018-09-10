
const app = new App({
  target: document.querySelector('#app'),
  data: {
    hi: 'Hello how are you?!',
    how: 'click this',
    pText: 'This is some text.',
    counter: 0,
    inputResult: '',
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
    showInput(e) {
      this.inputResult = e.target.value;
    }
  },
});

