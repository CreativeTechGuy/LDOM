(function() {
	var LDOMCache = {
		eventListenerCounter: 0,
		eventListenerFunctions: {},
		eventListenerFunctionsIds: {},
		functionsUsed: {}
	};

	function $(input) {
		if (typeof input === "string" && input[0] === "<" && input[input.length - 1] === ">") {
			return new LDOMObject(document.createElement(input.substring(1, input.length - 1)));
		} else if (input === window) {
			return new LDOMWindowObject();
		} else if (input === null || !input) {
			return new LDOMObject([]);
		} else if (input._LDOM) {
			return input;
		} else if (input.nodeType) {
			return new LDOMObject(input);
		} else if (Array.isArray(input)) {
			var elements = [];
			for (var i = 0; i < input.length; i++) {
				elements.push($(input[i]));
			}
			return new LDOMObject(elements);
		} else {
			return $(document).find(input);
		}
	}
	window.LDOM = $;
	window.$ = $;
	window.getLDOMFunctionUsage = function() {
		var obj = $("<null>");
		var keys = Object.keys(Object.getPrototypeOf(obj));
		var unused = [];
		for (var i = 0; i < keys.length; i++) {
			if (keys[i][0] !== "_" && !LDOMCache.functionsUsed[keys[i]] && typeof obj[keys[i]] === "function") {
				unused.push(keys[i]);
			}
		}
		return {
			used: Object.keys(LDOMCache.functionsUsed),
			unused: unused
		};
	};

	function LDOMObject(elem) {
		this._LDOM = true;
		if (Array.isArray(elem)) {
			this.length = elem.length;
			this.isList = true;
			this.elements = elem;
		} else {
			this.length = 1;
			this.isList = false;
			this.node = elem;
		}
	}

	LDOMObject.prototype.each = each;
	LDOMObject.prototype.equals = equals;
	LDOMObject.prototype.find = find;
	LDOMObject.prototype.get = get;
	LDOMObject.prototype.on = on;
	LDOMObject.prototype.off = off;
	LDOMObject.prototype.trigger = trigger;
	LDOMObject.prototype.hide = hide;
	LDOMObject.prototype.show = show;
	LDOMObject.prototype.toggle = toggle;
	LDOMObject.prototype.css = css;
	LDOMObject.prototype.html = html;
	LDOMObject.prototype.outerHTML = outerHTML;
	LDOMObject.prototype.text = text;
	LDOMObject.prototype.prop = prop;
	LDOMObject.prototype.attr = attr;
	LDOMObject.prototype.removeAttr = removeAttr;
	LDOMObject.prototype.addClass = addClass;
	LDOMObject.prototype.removeClass = removeClass;
	LDOMObject.prototype.hasClass = hasClass;
	LDOMObject.prototype.parent = parent;
	LDOMObject.prototype.children = children;
	LDOMObject.prototype.filter = filter;
	LDOMObject.prototype.unique = unique;
	LDOMObject.prototype.first = first;
	LDOMObject.prototype.last = last;
	LDOMObject.prototype.eq = eq;
	LDOMObject.prototype.insertAfter = insertAfter;
	LDOMObject.prototype.after = after;
	LDOMObject.prototype.insertBefore = insertBefore;
	LDOMObject.prototype.before = before;
	LDOMObject.prototype.appendChild = appendChild;
	LDOMObject.prototype.remove = remove;

	function LDOMWindowObject() {
		this._LDOMWindow = true;
		this._LDOM = true;
		this.length = 1;
		this.isList = false;
		this.node = window;
	}

	LDOMWindowObject.prototype.each = each;
	LDOMWindowObject.prototype.equals = equals;
	LDOMWindowObject.prototype.get = get;
	LDOMWindowObject.prototype.on = on;
	LDOMWindowObject.prototype.off = off;
	LDOMWindowObject.prototype.trigger = trigger;
	LDOMWindowObject.prototype.prop = prop;
	LDOMWindowObject.prototype.attr = attr;
	LDOMWindowObject.prototype.removeAttr = removeAttr;

	function each(funct, reverse) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
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
		LDOMCache.functionsUsed[arguments.callee.name] = true;
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
		LDOMCache.functionsUsed[arguments.callee.name] = true;
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
		LDOMCache.functionsUsed[arguments.callee.name] = true;
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
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		var eventId = ++LDOMCache.eventListenerCounter;
		var handlerWrapper = function(evt) {
			handler.apply($(this), [evt]);
		};
		this.each(function() {
			this.node.addEventListener(eventName, handlerWrapper);
			if (!this._LDOMWindow) {
				var eventIds = JSON.parse(this.node.getAttribute("LDOM_evts") || "[]");
				eventIds.push(eventId);
				this.node.setAttribute("LDOM_evts", JSON.stringify(eventIds));
			} else {
				var eventIds = JSON.parse(this.node._LDOM_window_evts || "[]");
				eventIds.push(eventId);
				this.node._LDOM_window_evts = JSON.stringify(eventIds);
			}
		});
		if (!LDOMCache.eventListenerFunctions[eventName]) {
			LDOMCache.eventListenerFunctions[eventName] = {};
		}
		LDOMCache.eventListenerFunctions[eventName][eventId] = {
			funct: handlerWrapper,
			count: this.length
		};
		LDOMCache.eventListenerFunctionsIds[eventId] = {
			name: eventName
		};
		return eventId;
	}

	function off(eventName, eventId) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		if (!isDefined(eventName) && !isDefined(eventId)) {
			this.each(function() {
				if (!this._LDOMWindow) {
					var eventIds = JSON.parse(this.node.getAttribute("LDOM_evts") || "[]");
				} else {
					var eventIds = JSON.parse(this.node._LDOM_window_evts || "[]");
				}
				for (var i = 0; i < eventIds.length; i++) {
					this.off(LDOMCache.eventListenerFunctionsIds[eventIds[i]].name, eventIds[i]);
				}
			});
		} else if (!isDefined(eventId)) {
			this.each(function() {
				if (!LDOMCache.eventListenerFunctions[eventName]) {
					return;
				}
				if (!this._LDOMWindow) {
					var eventIds = JSON.parse(this.node.getAttribute("LDOM_evts") || "[]");
				} else {
					var eventIds = JSON.parse(this.node._LDOM_window_evts || "[]");
				}
				for (var i = 0; i < eventIds.length; i++) {
					if (LDOMCache.eventListenerFunctionsIds[eventIds[i]].name === eventName) {
						this.off(eventName, eventIds[i]);
					}
				}
			});
		} else {
			this.each(function() {
				if (!LDOMCache.eventListenerFunctions[eventName][eventId]) {
					return;
				}
				var event = LDOMCache.eventListenerFunctions[eventName][eventId];
				this.node.removeEventListener(eventName, event.funct);
				if (!this._LDOMWindow) {
					var eventIds = JSON.parse(this.node.getAttribute("LDOM_evts") || "[]");
					eventIds.splice(eventIds.indexOf(eventId), 1);
					this.node.setAttribute("LDOM_evts", JSON.stringify(eventIds));
				} else {
					var eventIds = JSON.parse(this.node._LDOM_window_evts || "[]");
					eventIds.splice(eventIds.indexOf(eventId), 1);
					this.node._LDOM_window_evts = JSON.stringify(eventIds);
				}
				if (--event.count === 0) {
					delete LDOMCache.eventListenerFunctions[eventName][eventId];
					delete LDOMCache.eventListenerFunctionsIds[eventId];
				}
			});
		}
	}

	function trigger(eventName) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		var event = document.createEvent("Event");
		event.initEvent(eventName, true, true);
		this.each(function() {
			this.node.dispatchEvent(event);
		});
		return this;
	}

	function hide() {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
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
		LDOMCache.functionsUsed[arguments.callee.name] = true;
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
		LDOMCache.functionsUsed[arguments.callee.name] = true;
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
		LDOMCache.functionsUsed[arguments.callee.name] = true;
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
		LDOMCache.functionsUsed[arguments.callee.name] = true;
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
		LDOMCache.functionsUsed[arguments.callee.name] = true;
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
		LDOMCache.functionsUsed[arguments.callee.name] = true;
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

	function prop(propertyName, value) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
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

	function attr(attributeName, value) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
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

	function removeAttr(attributeName) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			this.node.removeAttribute(attributeName);
		});
		return this;
	}

	function addClass(className) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
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
		LDOMCache.functionsUsed[arguments.callee.name] = true;
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
		LDOMCache.functionsUsed[arguments.callee.name] = true;
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
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		var output = [];
		this.each(function() {
			output.push(this.node.parentNode);
		});
		return $(output);
	}

	function children() {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
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
		LDOMCache.functionsUsed[arguments.callee.name] = true;
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
		LDOMCache.functionsUsed[arguments.callee.name] = true;
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
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		return this.eq(0);
	}

	function last() {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		return this.eq(-1);
	}

	function eq(index) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
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
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			var callingNode = this.node;
			ldomObjectTarget.each(function() {
				this.node.parentNode.insertBefore(callingNode, this.node.nextSibling);
			});
		}, true);
		return this;
	}

	function after(newElement) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			var callingNode = this.node;
			newElement.each(function() {
				callingNode.parentNode.insertBefore(this.node, callingNode.nextSibling);
			}, true);
		});
		return this;
	}

	function insertBefore(ldomObjectTarget) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			var callingNode = this.node;
			ldomObjectTarget.each(function() {
				this.node.parentNode.insertBefore(callingNode, this.node);
			});
		});
		return this;
	}

	function before(newElement) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			var callingNode = this.node;
			newElement.each(function() {
				callingNode.parentNode.insertBefore(this.node, callingNode);
			});
		});
		return this;
	}

	function appendChild(childElement) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
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
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			if (this.off) {
				this.off();
			}
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
