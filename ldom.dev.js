(function() {
	var LDOM = {
		eventListenerCounter: 0,
		eventListenerFunctions: {},
		functionsUsed: {}
	};

	function $(input) {
		if (typeof input === "string" && input[0] === "<" && input[input.length - 1] === ">") {
			return new LDOMObject(document.createElement(input.substring(1, input.length - 1)));
		} else if (input === window) {
			return new LDOMWindowObject();
		} else if (input === null || !isDefined(input)) {
			return new LDOMObjectList([]);
		} else if (isDefined(input.nodeType)) {
			return new LDOMObject(input);
		} else if (isDefined(input._LDOM)) {
			return input;
		} else if (Array.isArray(input)) {
			var elements = [];
			for (var i = 0; i < input.length; i++) {
				elements.push($(input[i]));
			}
			return new LDOMObjectList(elements);
		} else {
			return $(document).find(input);
		}
	}
	window.$ = $;
	window.getLDOMFunctionUsage = function() {
		var obj = new LDOMObject(document.createElement("null"));
		var keys = Object.keys(obj);
		var unused = [];
		for (var i = 0; i < keys.length; i++) {
			if (keys[i][0] !== "_" && !isDefined(LDOM.functionsUsed[keys[i]]) && typeof obj[keys[i]] === "function") {
				unused.push(keys[i]);
			}
		}
		return {
			used: Object.keys(LDOM.functionsUsed),
			unused: unused
		};
	}

	function LDOMObject(elem) {
		if (isDefined(elem._LDOM)) {
			return elem;
		}
		if (!(this instanceof LDOMObject)) {
			return new LDOMObject(elem);
		}
		this._LDOM = true;
		this.each = each;
		this.equals = equals;
		this.find = find;
		this.get = get;
		this.on = on;
		this.off = off;
		this.trigger = trigger;
		this.hide = hide;
		this.show = show;
		this.toggle = toggle;
		this.css = css;
		this.html = html;
		this.outerHTML = outerHTML;
		this.text = text;
		this.attr = attr;
		this.prop = prop;
		this.addClass = addClass;
		this.removeClass = removeClass;
		this.hasClass = hasClass;
		this.parent = parent;
		this.children = children;
		this.filter = filter;
		this.unique = unique;
		this.first = first;
		this.last = last;
		this.eq = eq;
		this.insertAfter = insertAfter;
		this.after = after;
		this.insertBefore = insertBefore;
		this.before = before;
		this.appendChild = appendChild;
		this.remove = remove;
		this.length = 1;
		this.isList = false;
		this.node = elem;
	}

	function LDOMObjectList(elems) {
		if (!(this instanceof LDOMObjectList)) {
			return new LDOMObjectList(elems);
		}
		var obj = new LDOMObject(document.createElement("null"));
		var keys = Object.keys(obj);
		for (var i = 0; i < keys.length; i++) {
			this[keys[i]] = obj[keys[i]];
		}
		delete this.node;
		this.elements = elems;
		this.length = elems.length;
		this.isList = true;
	}

	function LDOMWindowObject() {
		if (!(this instanceof LDOMWindowObject)) {
			return new LDOMWindowObject();
		}
		this.each = each;
		this.get = get;
		this.on = on;
		this.off = off;
		this.attr = attr;
		this.prop = prop;
		this.length = 1;
		this.isList = false;
		this.node = window;
	}

	function each(funct, reverse) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		var thats = getThats(this);
		var start = reverse ? thats.length - 1 : 0;
		var change = reverse ? -1 : 1;
		var end = (reverse ? 0 : thats.length - 1) + change;
		for (var i = start; i !== end; i += change) {
			var shouldContinue = funct.apply(thats[i], [i]);
			if (shouldContinue === false) {
				break;
			}
		}
		return this;
	}

	function equals(ldomObject) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		if (this.length !== ldomObject.length) {
			return false;
		}
		var thats = getThats(this);
		var thatsObj = getThats(ldomObject);
		if (thats.length !== thatsObj.length) {
			return false;
		}
		for (var i = 0; i < thats.length; i++) {
			if (thats[i].node !== thatsObj[i].node) {
				return false;
			}
		}
		return true;
	}

	function find(selector) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		var output = [];
		this.each(function() {
			var elems = this.node.querySelectorAll(selector);
			for (var i = 0; i < elems.length; i++) {
				output.push(elems[i]);
			}
		});
		return $(output);
	}

	function get(index) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		if (!isDefined(index)) {
			var nodes = [];
			this.each(function() {
				nodes.push(this.node);
			});
			return nodes;
		} else {
			var thats = getThats(this);
			if (thats.length === 0) {
				return null;
			}
			if (thats.length === 1) {
				index = 0;
			}
			if (index < 0) {
				index = Math.floor((thats.length - index) / thats.length) * thats.length - 1;
			}
			return thats[index].node;
		}
	}

	function on(eventName, handler) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		var eventId = ++LDOM.eventListenerCounter;
		var handlerWrapper = function(evt) {
			handler.apply($(this), [evt]);
		};
		this.each(function() {
			this.node.addEventListener(eventName, handlerWrapper);
		});
		if (!isDefined(LDOM.eventListenerFunctions[eventName])) {
			LDOM.eventListenerFunctions[eventName] = {};
		}
		LDOM.eventListenerFunctions[eventName][eventId] = handlerWrapper;
		return eventId;
	}

	function off(eventName, event) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		if (!isDefined(event)) {
			this.each(function() {
				if (!isDefined(LDOM.eventListenerFunctions[eventName])){
					return;
				}
				var event = Object.keys(LDOM.eventListenerFunctions[eventName]);
				for (var i = 0; i < event.length; i++) {
					this.off(eventName, event[i]);
				}
			});
		} else if (typeof event === "function") {
			this.each(function() {
				this.node.removeEventListener(eventName, event);
			});
		} else {
			this.each(function() {
				if (!isDefined(LDOM.eventListenerFunctions[eventName][event])) {
					return;
				}
				this.node.removeEventListener(eventName, LDOM.eventListenerFunctions[eventName][event]);
			});
		}
	}

	function trigger(eventName) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		var event = document.createEvent("Event");
		event.initEvent(eventName, true, true);
		this.each(function() {
			this.node.dispatchEvent(event);
		});
		return this;
	}

	function hide() {
		LDOM.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			if (this.node.hasAttribute("LDOM_hidden")) {
				return;
			}
			this.node.setAttribute("LDOM_hidden", true);
			if (this.node.style.display !== "") {
				this.node.setAttribute("LDOM_hidden_previous_display", this.node.style.display);
			}
			this.node.style.display = "none";
		});
		return this;
	}

	function show() {
		LDOM.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			if (!this.node.hasAttribute("LDOM_hidden") && this.node.style.display !== "none") {
				return;
			}
			if (this.node.hasAttribute("LDOM_hidden_previous_display")) {
				this.node.style.display = this.node.getAttribute("LDOM_hidden_previous_display");
				this.node.removeAttribute("LDOM_hidden_previous_display");
			} else {
				this.node.style.display = "";
			}
			this.node.removeAttribute("LDOM_hidden");
		});
		return this;
	}

	function toggle(show) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			if (show === false) {
				this.hide();
			} else if (this.node.hasAttribute("LDOM_hidden") || show) {
				this.show();
			} else {
				this.hide();
			}
		});
		return this;
	}

	function css(property, value) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		if (!isDefined(value)) {
			var thats = getThats(this);
			return thats.length > 0 ? window.getComputedStyle(thats[0].node)[property] : "";
		} else {
			this.each(function() {
				this.node.style[property] = value;
			});
			return this;
		}
	}

	function html(htmlString) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		if (!isDefined(htmlString)) {
			var thats = getThats(this);
			return thats.length > 0 ? thats[0].node.innerHTML : "";
		} else {
			this.each(function() {
				this.node.innerHTML = htmlString;
			});
			return this;
		}
	}

	function outerHTML(htmlString) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		if (!isDefined(htmlString)) {
			var thats = getThats(this);
			return thats.length > 0 ? thats[0].node.outerHTML : "";
		} else {
			this.each(function() {
				this.node.outerHTML = htmlString;
			});
		}
	}

	function text(textString) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		if (!isDefined(textString)) {
			var thats = getThats(this);
			return thats.length > 0 ? thats[0].node.innerText : "";
		} else {
			this.each(function() {
				this.node.innerText = textString;
			});
			return this;
		}
	}

	function attr(attributeName, value) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		if (!isDefined(value)) {
			var thats = getThats(this);
			return thats.length > 0 ? thats[0].node.getAttribute(attributeName) : "";
		} else {
			this.each(function() {
				this.node.setAttribute(attributeName, value);
			});
			return this;
		}
	}

	function prop(propertyName, value) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		if (!isDefined(value)) {
			var thats = getThats(this);
			return thats.length > 0 ? thats[0].node[propertyName] : "";
		} else {
			this.each(function() {
				this.node[propertyName] = value;
			});
			return this;
		}
	}

	function addClass(className) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			var classes = (this.node.getAttribute("class") || "").split(" ");
			var newClasses = className.split(" ");
			for (var i = 0; i < newClasses.length; i++) {
				if (classes.indexOf(newClasses[i]) === -1) {
					classes.push(newClasses[i]);
				}
			}
			this.node.setAttribute("class", classes.join(" ").trim());
		});
		return this;
	}

	function removeClass(className) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		if (!isDefined(className)) {
			this.each(function() {
				this.node.setAttribute("class", "");
			});
		} else {
			this.each(function() {
				var classes = (this.node.getAttribute("class") || "").split(" ");
				var newClasses = className.split(" ");
				for (var i = 0; i < newClasses.length; i++) {
					var classIndex = classes.indexOf(newClasses[i]);
					if (classIndex !== -1) {
						classes.splice(classIndex, 1);
					}
				}
				this.node.setAttribute("class", classes.join(" ").trim());
			});
		}
		return this;
	}

	function hasClass(className, all) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		var doesHaveClass = false;
		this.each(function() {
			var classes = (this.node.getAttribute("class") || "").split(" ");
			if (classes.indexOf(className) !== -1) {
				doesHaveClass = true;
				if (!all) {
					return false;
				}
			} else {
				doesHaveClass = false;
				if (all) {
					return false;
				}
			}
		});
		return doesHaveClass;
	}

	function parent() {
		LDOM.functionsUsed[arguments.callee.name] = true;
		var output = [];
		this.each(function() {
			output.push(this.node.parentNode);
		});
		return $(output);
	}

	function children() {
		LDOM.functionsUsed[arguments.callee.name] = true;
		var output = [];
		this.each(function() {
			var elems = this.node.children;
			for (var i = 0; i < elems.length; i++) {
				output.push(elems[i]);
			}
		});
		return $(output);
	}

	function filter(selector) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		var frag = document.createDocumentFragment();
		var indexCounter = 0;
		this.each(function() {
			var fragNode = this.node.cloneNode(false);
			fragNode.index = indexCounter++;
			frag.appendChild(fragNode);
		});
		var output = [];
		var elems = frag.querySelectorAll(selector);
		var thats = getThats(this);
		for (var i = 0; i < elems.length; i++) {
			output.push(thats[elems[i].index]);
		}
		return $(output);
	}

	function unique() {
		LDOM.functionsUsed[arguments.callee.name] = true;
		var output = [];
		var thats = getThats(this);
		var nodes = this.get();
		for (var i = 0; i < nodes.length; i++) {
			if (nodes.indexOf(nodes[i]) === i) {
				output.push(thats[i]);
			}
		}
		return $(output);
	}

	function first() {
		LDOM.functionsUsed[arguments.callee.name] = true;
		return this.eq(0);
	}

	function last() {
		LDOM.functionsUsed[arguments.callee.name] = true;
		return this.eq(-1);
	}

	function eq(index) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		var thats = getThats(this);
		if (thats.length === 0) {
			return $([]);
		}
		if (thats.length === 1) {
			index = 0;
		}
		if (index < 0) {
			index = Math.floor((thats.length - index) / thats.length) * thats.length - 1;
		}
		return thats[index];
	}

	function insertAfter(ldomObjectTarget) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			var callingNode = this.node;
			ldomObjectTarget.each(function() {
				this.node.parentNode.insertBefore(callingNode, this.node.nextSibling);
			});
		}, true);
		return this;
	}

	function after(newElement) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			var callingNode = this.node;
			newElement.each(function() {
				callingNode.parentNode.insertBefore(this.node, callingNode.nextSibling);
			}, true);
		});
		return this;
	}

	function insertBefore(ldomObjectTarget) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			var callingNode = this.node;
			ldomObjectTarget.each(function() {
				this.node.parentNode.insertBefore(callingNode, this.node);
			});
		});
		return this;
	}

	function before(newElement) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			var callingNode = this.node;
			newElement.each(function() {
				callingNode.parentNode.insertBefore(this.node, callingNode);
			});
		});
		return this;
	}

	function appendChild(childElement) {
		LDOM.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			var callingNode = this.node;
			childElement.each(function() {
				callingNode.appendChild(childElement.node);
			});
			this.node.appendChild(childElement.node);
		});
		return this;
	}

	function remove() {
		LDOM.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			this.node.parentNode.removeChild(this.node);
		});
		return this;
	}

	function getThats(obj) {
		var thats = [];
		if (obj.isList) {
			thats = obj.elements;
		} else {
			thats.push(obj);
		}
		return thats;
	}

	function isDefined(obj) {
		if (typeof obj === "undefined") {
			return false;
		}
		return true;
	}
})();
