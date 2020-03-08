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
		} else if (input === null || !input) {
			return new LDOMObject([]);
		} else if (input._LDOM) {
			return input;
		} else if (input === window) {
			return new LDOMWindowObject();
		} else if (input.nodeType > 0) {
			return new LDOMObject(input);
		} else if (typeof input !== "string" && typeof input.length !== "undefined") {
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
	window.$ = window.$ || $;
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
		var thatsObjNodes = [];
		for (var i = 0; i < thatsObj.length; i++) {
			thatsObjNodes.push(thatsObj[i].node);
		}
		for (var i = 0; i < thats.length; i++) {
			if (thatsObjNodes.indexOf(thats[i].node) === -1) {
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
			if (index < 0) {
				index = thats.length + index;
			}
			if (!isDefined(thats[index])) {
				return null;
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
			var eventIds = this.node._LDOMEvents || [];
			eventIds.push(eventId);
			this.node._LDOMEvents = eventIds;
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

	function off(eventName) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		if (!isDefined(eventName)) {
			this.each(function() {
				var eventIds = this.node._LDOMEvents || [];
				for (var i = eventIds.length - 1; i >= 0; i--) {
					this.off(eventIds[i]);
				}
			});
		} else if (typeof eventName === "string") {
			this.each(function() {
				if (!LDOMCache.eventListenerFunctions[eventName]) {
					return;
				}
				var eventIds = this.node._LDOMEvents || [];
				for (var i = eventIds.length - 1; i >= 0; i--) {
					if (LDOMCache.eventListenerFunctionsIds[eventIds[i]].name === eventName) {
						this.off(eventIds[i]);
					}
				}
			});
		} else if (typeof eventName === "number") {
			var eventId = eventName;
			this.each(function() {
				if (!LDOMCache.eventListenerFunctionsIds[eventId]) {
					return;
				}
				var eventName = LDOMCache.eventListenerFunctionsIds[eventId].name;
				if (!LDOMCache.eventListenerFunctions[eventName][eventId]) {
					return;
				}
				var event = LDOMCache.eventListenerFunctions[eventName][eventId];
				this.node.removeEventListener(eventName, event.funct);
				var eventIds = this.node._LDOMEvents || [];
				eventIds.splice(eventIds.indexOf(eventId), 1);
				if (eventIds.length === 0) {
					delete this.node._LDOMEvents;
				} else {
					this.node._LDOMEvents = eventIds;
				}
				if (--event.count === 0) {
					delete LDOMCache.eventListenerFunctions[eventName][eventId];
					if (Object.keys(LDOMCache.eventListenerFunctions[eventName]).length === 0) {
						delete LDOMCache.eventListenerFunctions[eventName];
					}
					delete LDOMCache.eventListenerFunctionsIds[eventId];
				}
			});
		}
	}

	function trigger(eventName, data) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		var event = document.createEvent("Event");
		event.initEvent(eventName, true, true);
		for (var key in (data || {})) {
			event[key] = data[key];
		}
		this.each(function() {
			var that = this;
			setTimeout(function() {
				that.node.dispatchEvent(event);
			}, 0);
		});
		return this;
	}

	function hide() {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			if (this.node.style.display === "none") {
				return;
			}
			var isImportant = false;
			if (this.node.style.display !== "") {
				this.node.setAttribute("data-LDOM-hidden-previous-display", this.node.style.display);
				if (this.node.style.getPropertyPriority("display") === "important") {
					this.node.setAttribute("data-LDOM-hidden-previous-display-important", "true");
					isImportant = true;
				}
			}
			this.node.style.setProperty("display", "none", isImportant ? "important" : "");
		});
		return this;
	}

	function show() {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			if (this.node.hasAttribute("data-LDOM-hidden-previous-display")) {
				this.node.style.setProperty("display", this.node.getAttribute("data-LDOM-hidden-previous-display"), this.node.hasAttribute("data-LDOM-hidden-previous-display-important") ? "important" : "");
				this.node.removeAttribute("data-LDOM-hidden-previous-display");
				this.node.removeAttribute("data-LDOM-hidden-previous-display-important");
			} else if (this.node.style.display === "none") {
				this.node.style.display = "";
			}
		});
		return this;
	}

	function toggle(show) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			var shouldShow = this.node.hasAttribute("data-LDOM-hidden-previous-display") || this.node.style.display === "none";
			if (isDefined(show)) {
				shouldShow = show;
			}
			if (shouldShow) {
				this.show()
			} else {
				this.hide();
			}
		});
		return this;
	}

	function css(property, value, isImportant) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		if (!isDefined(value)) {
			var thats = getThats(this);
			return thats.length > 0 ? window.getComputedStyle(thats[0].node)[property] : "";
		} else {
			this.each(function() {
				this.node.style.setProperty(property, value, isImportant ? "important" : "");
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
				this.node.removeAttribute("class");
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
		var matchesMethod = "matches";
		if (Element.prototype.matches) {
			matchesMethod = "matches";
		} else if (Element.prototype.matchesSelector) {
			matchesMethod = "matchesSelector";
		} else if (Element.prototype.msMatchesSelector) {
			matchesMethod = "msMatchesSelector";
		} else if (Element.prototype.webkitMatchesSelector) {
			matchesMethod = "webkitMatchesSelector";
		}
		var output = [];
		this.each(function() {
			if (this.node[matchesMethod](selector)) {
				output.push(this.node);
			}
		});
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
		var thats = getThats(this);
		if (thats.length === 0) {
			return null;
		}
		return thats[0];
	}

	function last() {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		var thats = getThats(this);
		if (thats.length === 0) {
			return null;
		}
		return thats[thats.length - 1];
	}

	function eq(index) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		var thats = getThats(this);
		if (index < 0) {
			index = thats.length + index;
		}
		if (!isDefined(thats[index])) {
			return null;
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
		if (obj.isList) {
			return obj.elements;
		} else {
			return [obj];
		}
	}

	function isDefined(obj) {
		if (typeof obj === "undefined") {
			return false;
		}
		return true;
	}
})();
