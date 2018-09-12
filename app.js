
const app = new App({
  target: document.querySelector('#app'),
  data: {
    hi: 'Hello how are you?!',
    how: 'click this',
    pText: 'This is some text.',
    counter: 0,
    parent: {
      child: 'Hello hello I am the child'
    },
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
    },
    test() {
      console.log('Test if two listen directives in same tag will result in two events being registered!');
    },
  },
});

var btn = document.querySelectorAll('[data-listen-id="2"]')

// console.log(btn);
