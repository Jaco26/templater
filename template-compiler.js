const TemplateComp = (() => {
  const reDict = {
    event: /@\w+="\w+(\(.*\))*"/g,
    eventHandler: /(?!@\w+=)"\w+(\(.+\)?)*>*"/g,
    args: /\(.+\)/g,
    tagsWithEvents: /<.*?@\w+=".+".*?>/g,
    handleBar: /{{.+?}}/g,
    tagsWithJModels: /<.*?j-model=".+".*?>/g,
    jModel: /j-model="\w+"/g,

    betweenQuotes: /".+"/g
  };

  const vDom = {
    expressions: {

    },
    listen: {

    },
    model: {

    },
  };

  function isMethod(exp, methods) {
    let args;
    const calledMethod = /\w+\(.*?\)/g;


    if (methods[exp] || calledMethod.test(exp) && methods[exp.slice(0, exp.indexOf('('))]) {
      console.log(methods[exp.slice(0, exp.indexOf('('))]);
      console.log('GETTTTT', exp);

      args = exp.match(/\(.+\)/g)[0].slice(1, -1).split(',').map(arg => {
        if (Number(arg)) {
          return Number(arg);
        } else {
          return arg.trim();
        }
      });
    }


    // if (methods[exp] /* || methods[exp].slice(0, exp.indexOf('(') )*/ && toCall.test(exp)) {
    //   args = exp.match(/\(.+\)/g)[0].slice(1, -1).split(',').map(arg =>  {
    //     if (Number(arg)) {
    //       return Number(arg);
    //     } else {
    //       return arg.trim();
    //     }
    //   });
    // }
    console.log(args);
  }

  function isData(exp, data) {

  }

  function evaluateExpression(expression) {

    isMethod(expression, this._methods);

    if (this._data[expression]) {
      return this._data[expression];
    }

    if (this._methods[expression]) {
      return this._methods[expression]();
    }

    return eval(expression);
  }

  function handleTemplateExpressions(template, expressions) {
    // const bundledData = bundleAppData();
    let expressionId = 1;
    expressions.forEach(exp => {
      const trimmedExp = exp.slice(2, -2).trim();
      const val = evaluateExpression(trimmedExp);
      template = template.replace(exp, `<span data-exp-id="${expressionId}">${val}</span>`);
      vDom.expressions[expressionId] = trimmedExp;
      expressionId += 1;
    });
    return template;
  }

  function handleTemplateListenDirectives(template, listenDirectives) {
    let listenId = 1;
    console.log(listenDirectives);

  }


  function compileTemplate() {
    evaluateExpression = evaluateExpression.bind(this); // IMPORTANT: give evaluateExpression access to the App instance properties 

    let template = this._template;

    const expressions = template.match(reDict.handleBar);
    if (expressions) {
      template = handleTemplateExpressions(template, expressions);
    }

    const listenDirectives = template.match(reDict.tagsWithEvents);
    if (listenDirectives) {
      template = handleTemplateListenDirectives(template, listenDirectives);
    }

    this._vDom = Object.assign(this._vDom, vDom);
    this._target.innerHTML = template;
  }

  return {
    compileTemplate,
  }

})();