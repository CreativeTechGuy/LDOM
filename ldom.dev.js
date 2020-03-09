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
				var obj = $(input[i]);
				if (obj.length > 0) {
					elements.push(obj);
				}
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
			this._elements = elem;
		} else {
			this.length = 1;
			this._node = elem;
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
	LDOMObject.prototype.first = first;
	LDOMObject.prototype.last = last;
	LDOMObject.prototype.eq = eq;
	LDOMObject.prototype.insertAfter = insertAfter;
	LDOMObject.prototype.insertBefore = insertBefore;
	LDOMObject.prototype.appendChild = appendChild;
	LDOMObject.prototype.prependChild = prependChild;
	LDOMObject.prototype.remove = remove;

	function LDOMWindowObject() {
		this._LDOM = true;
		this.length = 1;
		this._node = window;
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
		var elementsArray = getElementsArray(this);
		var start = reverse ? elementsArray.length - 1 : 0;
		var change = reverse ? -1 : 1;
		var end = (reverse ? 0 : elementsArray.length - 1) + change;
		for (var i = start; i !== end; i += change) {
			var shouldContinue = funct.apply(elementsArray[i], [i]);
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
		var thisElementsArray = getElementsArray(this);
		var otherElementsArray = getElementsArray(ldomObject);
		if (thisElementsArray.length !== otherElementsArray.length) {
			return false;
		}
		var otherNodes = [];
		for (var i = 0; i < otherElementsArray.length; i++) {
			otherNodes.push(otherElementsArray[i]._node);
		}
		for (var i = 0; i < thisElementsArray.length; i++) {
			if (otherNodes.indexOf(thisElementsArray[i]._node) === -1) {
				return false;
			}
		}
		return true;
	}

	function find(selector) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		var output = [];
		this.each(function() {
			var elems = this._node.querySelectorAll(selector);
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
				nodes.push(this._node);
			});
			return nodes;
		} else {
			var elementsArray = getElementsArray(this);
			if (index < 0) {
				index = elementsArray.length + index;
			}
			if (!isDefined(elementsArray[index])) {
				return null;
			}
			return elementsArray[index]._node;
		}
	}

	function on(eventName, handler) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		var eventId = ++LDOMCache.eventListenerCounter;
		var handlerWrapper = function(evt) {
			handler.apply($(this), [evt]);
		};
		this.each(function() {
			this._node.addEventListener(eventName, handlerWrapper);
			var eventIds = this._node._LDOMEvents || [];
			eventIds.push(eventId);
			this._node._LDOMEvents = eventIds;
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
				var eventIds = this._node._LDOMEvents || [];
				for (var i = eventIds.length - 1; i >= 0; i--) {
					this.off(eventIds[i]);
				}
			});
		} else if (typeof eventName === "string") {
			this.each(function() {
				if (!LDOMCache.eventListenerFunctions[eventName]) {
					return;
				}
				var eventIds = this._node._LDOMEvents || [];
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
				this._node.removeEventListener(eventName, event.funct);
				var eventIds = this._node._LDOMEvents || [];
				eventIds.splice(eventIds.indexOf(eventId), 1);
				if (eventIds.length === 0) {
					delete this._node._LDOMEvents;
				} else {
					this._node._LDOMEvents = eventIds;
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
				that._node.dispatchEvent(event);
			}, 0);
		});
		return this;
	}

	function hide() {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			if (this._node.style.display === "none") {
				return;
			}
			var isImportant = false;
			if (this._node.style.display !== "") {
				this._node.setAttribute("data-LDOM-hidden-previous-display", this._node.style.display);
				if (this._node.style.getPropertyPriority("display") === "important") {
					this._node.setAttribute("data-LDOM-hidden-previous-display-important", "true");
					isImportant = true;
				}
			}
			this._node.style.setProperty("display", "none", isImportant ? "important" : "");
		});
		return this;
	}

	function show() {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			if (this._node.hasAttribute("data-LDOM-hidden-previous-display")) {
				this._node.style.setProperty("display", this._node.getAttribute("data-LDOM-hidden-previous-display"), this._node.hasAttribute("data-LDOM-hidden-previous-display-important") ? "important" : "");
				this._node.removeAttribute("data-LDOM-hidden-previous-display");
				this._node.removeAttribute("data-LDOM-hidden-previous-display-important");
			} else if (this._node.style.display === "none") {
				this._node.style.display = "";
			}
		});
		return this;
	}

	function toggle(show) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			var shouldShow = this._node.hasAttribute("data-LDOM-hidden-previous-display") || this._node.style.display === "none";
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
			var elementsArray = getElementsArray(this);
			return elementsArray.length > 0 ? window.getComputedStyle(elementsArray[0]._node)[property] : "";
		} else {
			this.each(function() {
				this._node.style.setProperty(property, value, isImportant ? "important" : "");
			});
			return this;
		}
	}

	function html(htmlString) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		if (!isDefined(htmlString)) {
			var elementsArray = getElementsArray(this);
			return elementsArray.length > 0 ? elementsArray[0]._node.innerHTML : "";
		} else {
			return setPropertyAndRemoveDetatchedNodes(this, "innerHTML", htmlString);
		}
	}

	function outerHTML(htmlString) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		if (!isDefined(htmlString)) {
			var elementsArray = getElementsArray(this);
			return elementsArray.length > 0 ? elementsArray[0]._node.outerHTML : "";
		} else {
			return setPropertyAndRemoveDetatchedNodes(this, "outerHTML", htmlString);
		}
	}

	function text(textString) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		if (!isDefined(textString)) {
			var elementsArray = getElementsArray(this);
			return elementsArray.length > 0 ? elementsArray[0]._node.innerText : "";
		} else {
			return setPropertyAndRemoveDetatchedNodes(this, "innerText", textString);
		}
	}

	function prop(propertyName, value) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		if (!isDefined(value)) {
			var elementsArray = getElementsArray(this);
			return elementsArray.length > 0 ? elementsArray[0]._node[propertyName] : "";
		} else {
			this.each(function() {
				this._node[propertyName] = value;
			});
			return this;
		}
	}

	function attr(attributeName, value) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		if (!isDefined(value)) {
			var elementsArray = getElementsArray(this);
			return elementsArray.length > 0 ? elementsArray[0]._node.getAttribute(attributeName) : "";
		} else {
			this.each(function() {
				this._node.setAttribute(attributeName, value);
			});
			return this;
		}
	}

	function removeAttr(attributeName) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			this._node.removeAttribute(attributeName);
		});
		return this;
	}

	function addClass(className) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			var classes = (this._node.getAttribute("class") || "").split(" ");
			var newClasses = className.split(" ");
			for (var i = 0; i < newClasses.length; i++) {
				if (classes.indexOf(newClasses[i]) === -1) {
					classes.push(newClasses[i]);
				}
			}
			this._node.setAttribute("class", classes.join(" ").trim());
		});
		return this;
	}

	function removeClass(className) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		if (!isDefined(className)) {
			this.each(function() {
				this._node.removeAttribute("class");
			});
		} else {
			this.each(function() {
				var classes = (this._node.getAttribute("class") || "").split(" ");
				var newClasses = className.split(" ");
				for (var i = 0; i < newClasses.length; i++) {
					var classIndex = classes.indexOf(newClasses[i]);
					if (classIndex !== -1) {
						classes.splice(classIndex, 1);
					}
				}
				this._node.setAttribute("class", classes.join(" ").trim());
			});
		}
		return this;
	}

	function hasClass(className, all) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		var doesHaveClass = false;
		this.each(function() {
			var classes = (this._node.getAttribute("class") || "").split(" ");
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
			if (output.indexOf(this._node.parentNode) === -1) {
				output.push(this._node.parentNode);
			}
		});
		return $(output);
	}

	function children() {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		var output = [];
		this.each(function() {
			var elems = this._node.children;
			for (var i = 0; i < elems.length; i++) {
				output.push(elems[i]);
			}
		});
		return $(output);
	}

	function filter(selector) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		if (!selector) {
			return $([]);
		}
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
			if (this._node[matchesMethod](selector)) {
				output.push(this);
			}
		});
		return $(output);
	}

	function first() {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		var elementsArray = getElementsArray(this);
		if (elementsArray.length === 0) {
			return $([]);
		}
		return elementsArray[0];
	}

	function last() {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		var elementsArray = getElementsArray(this);
		if (elementsArray.length === 0) {
			return $([]);
		}
		return elementsArray[elementsArray.length - 1];
	}

	function eq(index) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		var elementsArray = getElementsArray(this);
		if (index < 0) {
			index = elementsArray.length + index;
		}
		if (!isDefined(elementsArray[index])) {
			return $([]);
		}
		return elementsArray[index];
	}

	function insertAfter(ldomObjectTarget) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			var callingNode = this._node;
			ldomObjectTarget.each(function() {
				this._node.parentNode.insertBefore(callingNode.cloneNode(true), this._node.nextSibling);
			});
		}, true);
		return this;
	}

	function insertBefore(ldomObjectTarget) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			var callingNode = this._node;
			ldomObjectTarget.each(function() {
				this._node.parentNode.insertBefore(callingNode.cloneNode(true), this._node);
			});
		});
		return this;
	}

	function appendChild(childElement) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			var callingNode = this._node;
			childElement.each(function() {
				callingNode.appendChild(this._node.cloneNode(true));
			});
		});
		return this;
	}

	function prependChild(childElement) {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			var callingNode = this._node;
			childElement.each(function() {
				callingNode.insertBefore(this._node.cloneNode(true), callingNode.firstChild);
			}, true);
		});
		return this;
	}

	function remove() {
		LDOMCache.functionsUsed[arguments.callee.name] = true;
		this.each(function() {
			if (isDefined(this.off)) {
				this.off();
			}
			this._node.parentNode.removeChild(this._node);
		});
	}

	// Internal Helper Functions

	function setPropertyAndRemoveDetatchedNodes(ldomObject, property, value) {
		ldomObject.each(function() {
			this.inPage = document.body.contains(this._node);
		});
		ldomObject.each(function() {
			this._node[property] = value;
		});
		var output = [];
		ldomObject.each(function() {
			if (!this.inPage || document.body.contains(this._node)) {
				output.push(this);
			}
			delete this.inPage;
		});
		return $(output);
	}

	function getElementsArray(obj) {
		if (obj._elements) {
			return obj._elements;
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
