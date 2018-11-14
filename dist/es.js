var pseudos = [
  ':active',
  ':any',
  ':checked',
  ':default',
  ':disabled',
  ':empty',
  ':enabled',
  ':first',
  ':first-child',
  ':first-of-type',
  ':fullscreen',
  ':focus',
  ':hover',
  ':indeterminate',
  ':in-range',
  ':invalid',
  ':last-child',
  ':last-of-type',
  ':left',
  ':link',
  ':only-child',
  ':only-of-type',
  ':optional',
  ':out-of-range',
  ':read-only',
  ':read-write',
  ':required',
  ':right',
  ':root',
  ':scope',
  ':target',
  ':valid',
  ':visited',

  // With value
  ':dir',
  ':lang',
  ':not',
  ':nth-child',
  ':nth-last-child',
  ':nth-last-of-type',
  ':nth-of-type',

  // Elements
  '::after',
  '::before',
  '::first-letter',
  '::first-line',
  '::selection',
  '::backdrop',
  '::placeholder',
  '::marker',
  '::spelling-error',
  '::grammar-error'
];

var popular = {
  ai : 'alignItems',
  b  : 'bottom',
  bc : 'backgroundColor',
  br : 'borderRadius',
  bs : 'boxShadow',
  c  : 'color',
  d  : 'display',
  f  : 'float',
  fd : 'flexDirection',
  ff : 'fontFamily',
  fs : 'fontSize',
  h  : 'height',
  jc : 'justifyContent',
  l  : 'left',
  lh : 'lineHeight',
  ls : 'letterSpacing',
  m  : 'margin',
  mb : 'marginBottom',
  ml : 'marginLeft',
  mr : 'marginRight',
  mt : 'marginTop',
  o  : 'opacity',
  p  : 'padding',
  pb : 'paddingBottom',
  pl : 'paddingLeft',
  pr : 'paddingRight',
  pt : 'paddingTop',
  r  : 'right',
  t  : 'top',
  ta : 'textAlign',
  td : 'textDecoration',
  tt : 'textTransform',
  w  : 'width'
};

var cssProperties = ['float'].concat(Object.keys(
  typeof document === 'undefined'
    ? {}
    : findWidth(document.documentElement.style)
).filter(function (p) { return p.indexOf('-') === -1 && p !== 'length'; }));

function findWidth(obj) {
  return obj
    ? obj.hasOwnProperty('width')
      ? obj
      : findWidth(Object.getPrototypeOf(obj))
    : {}
}

var memoize = function (fn, cache) {
  if ( cache === void 0 ) cache = {};

  return function (item) { return item in cache
    ? cache[item]
    : cache[item] = fn(item); };
};

function add(style, prop, values) {
  if (prop in style) // Recursively increase specificity
    { add(style, '!' + prop, values); }
  else
    { style[prop] = formatValues(prop, values); }
}

var vendorMap = Object.create(null, {});
var vendorValuePrefix = Object.create(null, {});

var vendorRegex = /^(o|O|ms|MS|Ms|moz|Moz|webkit|Webkit|WebKit)([A-Z])/;

var appendPx = memoize(function (prop) {
  var el = document.createElement('div');

  try {
    el.style[prop] = '1px';
    el.style.setProperty(prop, '1px');
    return el.style[prop].slice(-3) === '1px' ? 'px' : ''
  } catch (err) {
    return ''
  }
}, {
  flex: '',
  boxShadow: 'px',
  border: 'px',
  borderTop: 'px',
  borderRight: 'px',
  borderBottom: 'px',
  borderLeft: 'px'
});

function lowercaseFirst(string) {
  return string.charAt(0).toLowerCase() + string.slice(1)
}

function sanitize(styles) {
  return Object.keys(styles).reduce(function (acc, key) {
    var value = styles[key];

    if (!value && value !== 0 && value !== '')
      { return acc }

    if (key === 'content' && value.charAt(0) !== '"')
      { acc[key] = '"' + value + '"'; }
    else
      { add(acc, key, value); }

    return acc
  }, {})
}

function assign(obj, obj2) {
  for (var key in obj2) {
    if (obj2.hasOwnProperty(key))
      { obj[key] = obj2[key]; }
  }
  return obj
}

function hyphenToCamelCase(hyphen) {
  return hyphen.slice(hyphen.charAt(0) === '-' ? 1 : 0).replace(/-([a-z])/g, function(match) {
    return match[1].toUpperCase()
  })
}

function camelCaseToHyphen(camelCase) {
  return camelCase.replace(/(\B[A-Z])/g, '-$1').toLowerCase()
}

function initials(camelCase) {
  return camelCase.charAt(0) + (camelCase.match(/([A-Z])/g) || []).join('').toLowerCase()
}

function objectToRules(style, selector, suffix, single) {
  if ( suffix === void 0 ) suffix = '';

  var base = {};

  var rules = [];

  Object.keys(style).forEach(function (prop) {
    if (prop.charAt(0) === '@')
      { rules.push(prop + '{' + objectToRules(style[prop], selector, suffix, single) + '}'); }
    else if (typeof style[prop] === 'object')
      { rules = rules.concat(objectToRules(style[prop], selector, suffix + prop, single)); }
    else
      { base[prop] = style[prop]; }
  });

  if (Object.keys(base).length) {
    rules.unshift(
      ((single || (suffix.charAt(0) === ' ') ? '' : '&') + '&' + suffix).replace(/&/g, selector) +
      '{' + stylesToCss(base) + '}'
    );
  }

  return rules
}

var selectorSplit = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;

function stylesToCss(style) {
  return Object.keys(style).reduce(function (acc, prop) { return acc + propToString(prop.replace(/!/g, ''), style[prop]); }
  , '')
}

function propToString(prop, value) {
  prop = prop in vendorMap ? vendorMap[prop] : prop;
  return (vendorRegex.test(prop) ? '-' : '')
    + (cssVar(prop)
      ? prop
      : camelCaseToHyphen(prop)
    )
    + ':'
    + value
    + ';'
}

function formatValues(prop, value) {
  return Array.isArray(value)
    ? value.map(function (v) { return formatValue(prop, v); }).join(' ')
    : typeof value === 'string'
      ? formatValues(prop, value.split(' '))
      : formatValue(prop, value)
}

function formatValue(prop, value) {
  return value in vendorValuePrefix
    ? vendorValuePrefix[value]
    : value + (isNaN(value) || value === null || typeof value === 'boolean' || cssVar(prop) ? '' : appendPx(prop))
}

function cssVar(prop) {
  return prop.charAt(0) === '-' && prop.charAt(1) === '-'
}

var styleSheet = typeof document === 'object' && document.createElement('style');
styleSheet && document.head && document.head.appendChild(styleSheet);

var sheet = styleSheet && styleSheet.sheet;

var debug = false;
var classes = Object.create(null, {});
var rules = [];
var count = 0;

var classPrefix = 'b' + ('000' + ((Math.random() * 46656) | 0).toString(36)).slice(-3) +
                    ('000' + ((Math.random() * 46656) | 0).toString(36)).slice(-3);

function setDebug(d) {
  debug = d;
}

function getSheet() {
  var content = rules.join('');
  rules = [];
  classes = Object.create(null, {});
  count = 0;
  return content
}

function getRules() {
  return rules
}

function insert(rule, index) {
  rules.push(rule);

  if (debug)
    { return styleSheet.textContent = rules.join('\n') }

  sheet && sheet.insertRule(rule, arguments.length > 1
    ? index
    : sheet.cssRules.length
  );
}

function createClass(style) {
  var json = JSON.stringify(style);

  if (json in classes)
    { return classes[json] }

  var className = classPrefix + (++count)
      , rules = objectToRules(style, '.' + className);

  for (var i = 0; i < rules.length; i++)
    { insert(rules[i]); }

  classes[json] = className;

  return className
}

/* eslint no-invalid-this: 0 */

var shorts = Object.create(null);

function bss(input, value) {
  var b = chain(bss);
  input && assign(b.__style, parse.apply(null, arguments));
  return b
}

function setProp(prop, value) {
  Object.defineProperty(bss, prop, {
    configurable: true,
    value: value
  });
}

Object.defineProperties(bss, {
  __style: {
    configurable: true,
    writable: true,
    value: {}
  },
  valueOf: {
    configurable: true,
    writable: true,
    value: function ValueOf() {
      return '.' + this.class
    }
  }
});

setProp('setDebug', setDebug);

setProp('$keyframes', keyframes);
setProp('$media', $media);
setProp('$import', $import);
setProp('$nest', $nest);
setProp('getSheet', getSheet);
setProp('getRules', getRules);
setProp('helper', helper);
setProp('css', css);
setProp('classPrefix', classPrefix);

function chain(instance) {
  var newInstance = Object.create(bss, {
    __style: {
      value: assign({}, instance.__style)
    },
    style: {
      enumerable: true,
      get: function() {
        var this$1 = this;

        return Object.keys(this.__style).reduce(function (acc, key) {
          if (typeof this$1.__style[key] === 'number' || typeof this$1.__style[key] === 'string')
            { acc[key.replace(/^!/, '')] = this$1.__style[key]; }
          return acc
        }, {})
      }
    }
  });

  if (instance === bss)
    { bss.__style = {}; }

  return newInstance
}

cssProperties.forEach(function (prop) {
  var vendor = prop.match(vendorRegex);
  if (vendor) {
    var unprefixed = lowercaseFirst(prop.replace(vendorRegex, '$2'));
    if (cssProperties.indexOf(unprefixed) === -1) {
      if (unprefixed === 'flexDirection')
        { vendorValuePrefix.flex = '-' + vendor[1].toLowerCase() + '-flex'; }

      vendorMap[unprefixed] = prop;
      setProp(unprefixed, setter(prop));
      setProp(short(unprefixed), bss[unprefixed]);
      return
    }
  }

  setProp(prop, setter(prop));
  setProp(short(prop), bss[prop]);
});

setProp('content', function Content(arg) {
  var b = chain(this);
  b.__style.content = '"' + arg + '"';
  return b
});

Object.defineProperty(bss, 'class', {
  set: function(value) {
    this.__class = value;
  },
  get: function() {
    return this.__class || createClass(this.__style)
  }
});

function $media(value, style) {
  var b = chain(this);
  if (value)
    { b.__style['@media ' + value] = parse(style); }

  return b
}

function $import(value) {
  if (value)
    { insert('@import ' + value + ';', 0); }

  return chain(this)
}

function $nest(selector, properties) {
  var b = chain(this);
  if (arguments.length === 1)
    { Object.keys(selector).forEach(function (x) { return addNest(b.__style, x, selector[x]); }); }
  else if (selector)
    { addNest(b.__style, selector, properties); }

  return b
}

function addNest(style, selector, properties) {
  style[
    selector.split(selectorSplit).map(function (x) {
      x = x.trim();
      return (x.charAt(0) === ':' || x.charAt(0) === '[' ? '' : ' ') + x
    }).join(',&')
  ] = parse(properties);
}

pseudos.forEach(function (name) { return setProp('$' + hyphenToCamelCase(name.replace(/:/g, '')), function Pseudo(value, style) {
    var b = chain(this);
    if (value || style)
      { b.__style[name + (style ? '(' + value + ')' : '')] = parse(style || value); }
    return b
  }); }
);

function setter(prop) {
  return function CssProperty(value) {
    var b = chain(this);
    if (!value && value !== 0)
      { delete b.__style[prop]; }
    else if (arguments.length > 0)
      { add(b.__style, prop, Array.prototype.slice.call(arguments)); }

    return b
  }
}

function css(selector, style) {
  if (arguments.length === 1)
    { Object.keys(selector).forEach(function (key) { return addCss(key, selector[key]); }); }
  else
    { addCss(selector, style); }

  return chain(this)
}

function addCss(selector, style) {
  objectToRules(parse(style), selector, '', true).forEach(insert);
}

function helper(name, styling) {
  if (arguments.length === 1)
    { return Object.keys(name).forEach(function (key) { return helper(key, name[key]); }) }

  delete bss[name]; // Needed to avoid weird get calls in chrome

  if (typeof styling === 'function') {
    helper[name] = styling;
    Object.defineProperty(bss, name, {
      configurable: true,
      value: function Helper() {
        var b = chain(this);
        var result = styling.apply(null, arguments);
        assign(b.__style, result.__style);
        return b
      }
    });
  } else {
    helper[name] = parse(styling);
    Object.defineProperty(bss, name, {
      configurable: true,
      get: function() {
        var b = chain(this);
        assign(b.__style, parse(styling));
        return b
      }
    });
  }
}

bss.helper('$animate', function (value, props) { return bss.animation(bss.$keyframes(props) + ' ' + value); }
);

function short(prop) {
  var acronym = initials(prop)
      , short = popular[acronym] && popular[acronym] !== prop ? prop : acronym;

  shorts[short] = prop;
  return short
}

var stringToObject = memoize(function (string) {
  var last = ''
    , prev;

  return string.trim().split(/;|\n/).reduce(function (acc, line) {
    line = last + line.trim();
    last = line.charAt(line.length - 1) === ',' ? line : '';
    if (last)
      { return acc }

    if (line.charAt(0) === ',') {
      acc[prev] += line;
      return acc
    }

    var ref = line.replace(/[ :]+/, ' ').split(' ');
    var key = ref[0];
    var tokens = ref.slice(1);

    if (!key)
      { return acc }

    var prop = key.charAt(0) === '-' && key.charAt(1) === '-'
      ? key
      : hyphenToCamelCase(key);

    prev = shorts[prop] || prop;

    if (prop in helper) {
      typeof helper[prop] === 'function'
        ? assign(acc, helper[prop].apply(helper, tokens).__style)
        : assign(acc, helper[prop]);
    } else if (tokens.length > 0) {
      add(acc, prev, tokens);
    }

    return acc
  }, {})
});

var count$1 = 0;
var keyframeCache = {};

function keyframes(props) {
  var content = Object.keys(props).reduce(function (acc, key) { return acc + key + '{' + stylesToCss(parse(props[key])) + '}'; }
  , '');

  if (content in keyframeCache)
    { return keyframeCache[content] }

  var name = classPrefix + count$1++;
  keyframeCache[content] = name;
  insert('@keyframes ' + name + '{' + content + '}');

  return name
}

function parse(input, value) {
  var arguments$1 = arguments;
  var obj;

  if (typeof input === 'string') {
    if (typeof value === 'string' || typeof value === 'number')
      { return (( obj = {}, obj[input] = value, obj )) }

    return stringToObject(input)
  } else if (Array.isArray(input) && typeof input[0] === 'string') {
    var str = '';
    for (var i = 0; i < input.length; i++)
      { str += input[i] + (arguments$1[i + 1] || ''); }
    return stringToObject(str)
  }

  return input.__style || sanitize(input)
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var _classnames_2_2_6_classnames = createCommonjsModule(function (module) {
/*!
  Copyright (c) 2017 Jed Watson.
  Licensed under the MIT License (MIT), see
  http://jedwatson.github.io/classnames
*/
/* global define */

(function () {

	var hasOwn = {}.hasOwnProperty;

	function classNames () {
		var classes = [];

		for (var i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if (!arg) continue;

			var argType = typeof arg;

			if (argType === 'string' || argType === 'number') {
				classes.push(arg);
			} else if (Array.isArray(arg) && arg.length) {
				var inner = classNames.apply(null, arg);
				if (inner) {
					classes.push(inner);
				}
			} else if (argType === 'object') {
				for (var key in arg) {
					if (hasOwn.call(arg, key) && arg[key]) {
						classes.push(key);
					}
				}
			}
		}

		return classes.join(' ');
	}

	if (module.exports) {
		classNames.default = classNames;
		module.exports = classNames;
	} else {
		window.classNames = classNames;
	}
}());
});

function b (input, ...args) {
    return bss(input).class + ' ' + _classnames_2_2_6_classnames(...args)
}

export default b;
