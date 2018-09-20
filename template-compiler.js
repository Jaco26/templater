const TemplateComp = (() => {
  const reDict = {
    event: /@\w+="\w+(\(.*\))*"/g,
    eventHandler: /(?!@\w+=)"\w+(\(.+\)?)*>*"/g,
    args: /\(.+\)/g,
    tagsWithEvents: /<.*?@\w+=".+".*?>/g,
    handleBar: /{{.+}}/g,
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

  function evaluateExpression(expression) {
    if (this._methods[expression]) {
      return this._methods[expression]();
    }
    if (this._data[expression]) {
      return this._data[expression];
    }


  }

  function handleTemplateExpressions(template, expressions) {
    evaluateExpression()
    let expressionId = 1;
    expressions.forEach(exp => {
      const trimmedExp = exp.slice(2, -2).trim();
      template = template.replace(exp, `<span data-exp-id="${expressionId}"></span>`);
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
      handleTemplateListenDirectives(template, listenDirectives);
    }

    this._vDom = Object.assign(this._vDom, vDom);
    this._target.innerHTML = template;
  }

  return {
    compileTemplate,
  }

})();