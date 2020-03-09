/* globals $ */

var nullElement = $("<null>");
var keys = Object.keys(Object.getPrototypeOf(nullElement));
var methods = ["constructor"];

for (var i = 0; i < keys.length; i++) {
	if (keys[i][0] !== "_" && typeof nullElement[keys[i]] === "function") {
		methods.push(keys[i]);
	}
}

var testContainer = $("#testContainer");
var testContainerHTMLBackup = testContainer.html();
var tests = {};
for (var i = 0; i < methods.length; i++) {
	tests[methods[i]] = [];
	$("#testOutput").appendChild($("<div>").appendChild($("<details>").attr("id", "function-" + methods[i]).appendChild($("<summary>").text(methods[i] + ":").addClass("method-name"))));
}
function addTest(methodName, testName, run) {
	var testObj = {
		testName: testName.length > 0 ? testName + ": " : "",
		run: function(successCallback, failureCallback) {
			function assertMethodSkeleton(assertMethod, message, a, b) {
				var failureCallbackId;
				var errorObj = null;
				if (failureCallback) {
					failureCallbackId = setTimeout(function() {
						failureCallback(errorObj);
					}, 1);
				}
				try {
					assertMethod();
				} catch (e) {
					errorObj = e;
					return;
				}
				if (failureCallback) {
					clearTimeout(failureCallbackId);
				}
				if (successCallback) {
					setTimeout(function() {
						successCallback(message);
					}, 1);
				}
			}
			testContainer.html(testContainerHTMLBackup);
			run({
				equal: function(message, a, b) {
					assertMethodSkeleton(function() {
						if (a !== b) {
							message = message.trim() + " ";
							throw new Error("Assertion failed. " + message + "(Expected '" + a + "' === '" + b + "')");
						}
					}, message, a, b);
				},
				notEqual: function(message, a, b) {
					assertMethodSkeleton(function() {
						if (a === b) {
							message = message.trim() + " ";
							throw new Error("Assertion failed. " + message + "(Expected '" + a + "' !== '" + b + "')");
						}
					}, message, a, b);
				},
				greaterThan: function(message, a, b) {
					assertMethodSkeleton(function() {
						if (a < b) {
							message = message.trim() + " ";
							throw new Error("Assertion failed. " + message + "(Expected '" + a + "' > " + b + ")");
						}
					}, message, a, b);
				},
				lessThan: function(message, a, b) {
					assertMethodSkeleton(function() {
						if (a > b) {
							message = message.trim() + " ";
							throw new Error("Assertion failed. " + message + "(Expected '" + a + "' < '" + b + "')");
						}
					}, message, a, b);
				}
			});
		}
	};
	tests[methodName].push(testObj);
}



// ------------------------------ Tests ------------------------------


// constructor
addTest("constructor", "Aliased global variable", function(assert) {
	// eslint-disable-next-line no-undef
	assert.equal("LDOM aliased", $, LDOM);
});
addTest("constructor", "Create element", function(assert) {
	assert.equal("Created object contains 1 element", $("<input>").length, 1);
	assert.equal("Correct tag created", $("<input>").get(0).tagName, "INPUT");
	assert.equal("Correct custom tag created", $("<data-test-123>").get(0).tagName, "DATA-TEST-123");
	assert.equal("Selector doesn't create element", $("randomTag").length, 0);
});
addTest("constructor", "Window constructor", function(assert) {
	assert.equal("Window object created", $(window).length, 1);
	assert.notEqual("Window has `on` method", typeof $(window).on, "undefined");
	assert.equal("Window doesn't have `html` method", typeof $(window).html, "undefined");
});
addTest("constructor", "Null input", function(assert) {
	assert.equal("No args constructor contains no elements", $().length, 0);
	assert.equal("Null arg constructor contains no elements", $(null).length, 0);
});
addTest("constructor", "LDOM object input", function(assert) {
	var input = $("<div>");
	assert.equal("Returns same input", $(input), input);
	input = $(window);
	assert.equal("Returns same window", $(input), input);
	input = $("body");
	assert.notEqual("Returns different object", $("body"), input);
});
addTest("constructor", "DOM node input", function(assert) {
	var input = $(document.createElement("video"));
	assert.equal("Returns same input", $(input), input);
	assert.equal("Correct tag created", input.get(0).tagName, "VIDEO");
});
addTest("constructor", "DOM node array input", function(assert) {
	assert.equal("Empty array contains 0 elements", $([]).length, 0);
	var containerContents = document.querySelectorAll("#testContainer *");
	assert.equal("Builds object with correct number of elements", $(containerContents).length, containerContents.length);
	assert.equal("Preserves first item", $(containerContents).get(0), containerContents[0]);
	assert.equal("Preserves last item", $(containerContents).get(-1), containerContents[containerContents.length - 1]);
	assert.equal("Array literal", $([document.createElement("div"), document.createElement("img")]).length, 2);
});
addTest("constructor", "CSS selector string", function(assert) {
	assert.equal("Selector matches", $("#testContainer").length, 1);
	assert.equal("Complex selector", $("meta[charset]").attr("charset"), "UTF-8");
});


// each
addTest("each", "Iterates through all elements", function(assert) {
	var elementsRemaining = document.querySelectorAll("#testContainer div").length;
	$("#testContainer div").each(function(i) {
		elementsRemaining--;
		assert.equal("Element correct", this.get(0), document.querySelectorAll("#testContainer div")[i]);
	});
	assert.equal("All elements seen", elementsRemaining, 0);

	elementsRemaining = document.querySelectorAll("#testContainer div").length;
	$("#testContainer div").each(function(i) {
		elementsRemaining--;
		assert.equal("Element correct", this.get(0), document.querySelectorAll("#testContainer div")[i]);
	}, false);
	assert.equal("All elements seen", elementsRemaining, 0);
});
addTest("each", "`this` is an LDOM object", function(assert) {
	$("#testContainer div").each(function() {
		assert.equal("this is LDOM object", this, $(this));
		assert.equal("object contains one element", this.length, 1);
	});
});
addTest("each", "Iterates in reverse", function(assert) {
	var elementsRemaining = document.querySelectorAll("#testContainer div").length;
	$("#testContainer div").each(function(i) {
		elementsRemaining--;
		assert.equal("Element correct", this.get(0), document.querySelectorAll("#testContainer div")[i]);
	}, true);
	assert.equal("All elements seen", elementsRemaining, 0);
});
addTest("each", "Callback argument is the index", function(assert) {
	var lastIndex = -1;
	$("#testContainer div").each(function(index) {
		assert.equal("index greater than last", index, lastIndex + 1);
		lastIndex = index;
	});
	var lastIndex = $("#testContainer div").length;
	$("#testContainer div").each(function(index) {
		assert.equal("index less than last", index, lastIndex - 1);
		lastIndex = index;
	}, true);
});


// equals
addTest("equals", "", function(assert) {
	assert.equal("Objects are equal", $("#testContainer div").equals($("#testContainer").find("div")), true);
	assert.equal("Unordered objects are equal", $("#testContainer div").equals($(Array.prototype.slice.call(document.querySelectorAll("#testContainer div")).reverse())), true);
	assert.equal("Objects are not equal", $("#testContainer div").equals($("#testContainer").find("tr")), false);
});


// find
addTest("find", "", function(assert) {
	assert.equal("Find one element", $("#testContainer").find("#tableID").length, 1);
	assert.equal("Find all elements", $("#testContainer").find("tr").length, document.querySelectorAll("#testContainer tr").length);
	assert.equal("Find all elements of all objects", $("#testContainer tr").find("td").length, document.querySelectorAll("#testContainer td").length);
});


// get
addTest("get", "No arg", function(assert) {
	assert.equal("Returns array type", Array.isArray($("#testContainer tr").get()), true);
	assert.equal("Returns correct length array", $("#testContainer tr").get().length, document.querySelectorAll("#testContainer tr").length);
	assert.equal("Returns empty array", $("#noMatches").get().length, 0);
});
addTest("get", "Positive index", function(assert) {
	assert.equal("Returns null if no elements", $("#noMatches").get(0), null);
	assert.equal("Returns null if out of bounds", $("#testContainer tr").get(1000), null);
	var elements = document.querySelectorAll("#testContainer div");
	assert.equal("Returns correct element", $(elements).get(1), elements[1]);
});
addTest("get", "Negative index", function(assert) {
	assert.equal("Returns null if out of bounds", $("#testContainer tr").get(-1000), null);
	var elements = document.querySelectorAll("#testContainer div");
	assert.equal("Returns correct element", $(elements).get(-2), elements[elements.length - 2]);
});


// on
function noop() {
	0;
}
addTest("on", "Event ID increments", function(assert) {
	var id = $("#testContainer").on("change", noop);
	assert.equal("Event ID is one more than previously", $("#testContainer").on("input", noop), id + 1);
});
addTest("on", "Adds to all elements", function(assert) {
	var obj = $("#testContainer div");
	var eventCount = [];
	obj.each(function() {
		eventCount.push(typeof this.get(0)._LDOMEvents !== "undefined" ? this.get(0)._LDOMEvents.length : 0);
	});
	obj.on("load", noop);
	obj.each(function(i) {
		assert.equal("All elements have new event listeners", this.get(0)._LDOMEvents.length, eventCount[i] + 1);
	});
	obj.filter(".abc");
	var eventCount = [];
	obj.each(function() {
		eventCount.push(typeof this.get(0)._LDOMEvents !== "undefined" ? this.get(0)._LDOMEvents.length : 0);
	});
	obj.on("custom-event", noop);
	obj.each(function(i) {
		assert.equal("All elements have more new event listeners", this.get(0)._LDOMEvents.length, eventCount[i] + 1);
	});
});
addTest("on", "Event handler `this` is LDOM node", function(assert) {
	$("#testContainer").on("mouseover", function() {
		assert.equal("`this` is the correct LDOM node", this.get(0), $("#testContainer").get(0));
	});
	$("#testContainer").trigger("mouseover");
});
addTest("on", "Event handler arg is event data", function(assert) {
	$("#testContainer").on("mouseover", function(evt) {
		assert.equal("Event data type is correct", evt.type, "mouseover");
	});
	$("#testContainer").trigger("mouseover");
	var customEventData = {
		x: 10,
		y: 60,
		windowNode: window,
		nested: {
			custom: [1, 3, "hello"]	
		}
	};
	$("#testContainer").on("custom-event", function(evt) {
		assert.equal("Custom Event Data Present", customEventData.nested.custom, evt.nested.custom);
	});
	$("#testContainer").trigger("custom-event", customEventData);
});
addTest("on", "Stores metadata on node", function(assert) {
	$("#testContainer table").on("metadata-evt", noop);
	assert.notEqual("Metadata present", document.querySelector("#testContainer table")._LDOMEvents, undefined);
	assert.greaterThan("Metadata length greater than 0", document.querySelector("#testContainer table")._LDOMEvents.length, 0);
	assert.equal("Metadata present is array", Array.isArray(document.querySelector("#testContainer table")._LDOMEvents), true);
});


//off
addTest("off", "Removes all event listeners on element", function(assert) {
	$("#testContainer").on("test-event-1", noop);
	$("#testContainer").on("test-event-2", noop);
	assert.greaterThan("Event listeners list contains IDs", $("#testContainer").get(0)._LDOMEvents.length, 1);
	$("#testContainer").off();
	assert.equal("Event listeners list undefined", $("#testContainer").get(0)._LDOMEvents, undefined);
});
addTest("off", "Removes by event name", function(assert) {
	$("#testContainer").off();
	$("#testContainer").on("test-event-3", noop);
	$("#testContainer").on("test-event-4", noop);
	assert.equal("Event listeners added successfully", $("#testContainer").get(0)._LDOMEvents.length, 2);
	$("#testContainer").off("test-event-3");
	assert.equal("Event listener removed successfully", $("#testContainer").get(0)._LDOMEvents.length, 1);
	$("#testContainer").off("test-event-3");
});
addTest("off", "Removes by event ID", function(assert) {
	$("#testContainer").off();
	$("#testContainer").on("test-event-3", noop);
	var evtId = $("#testContainer").on("test-event-4", noop);
	$("#testContainer").on("test-event-5", noop);
	assert.equal("Event listeners added successfully", $("#testContainer").get(0)._LDOMEvents.length, 3);
	$("#testContainer").off(evtId);
	assert.equal("Event listener removed successfully", $("#testContainer").get(0)._LDOMEvents.length, 2);
	$("#testContainer").off(evtId);
});
addTest("off", "Removed function doesn't execute", function(assert) {
	var evtId = $("#testContainer").on("change", function() {
		assert.equal("This handler shouldn't execute", true, false);	
	});
	$("#testContainer").on("change", function() {
		assert.equal("This handler should execute", true, true);	
	});
	$("#testContainer").off(evtId);
	$("#testContainer").trigger("change");
});


//trigger
addTest("trigger", "Send event", function(assert) {
	var eventTriggers = 0;
	$("#testContainer tr").on("input", function() {
		eventTriggers++;
	});
	$("#testContainer tr").trigger("input");
	setTimeout(function() {
		assert.greaterThan("Received Events", eventTriggers, 1);
	}, 1);
});
addTest("trigger", "Triggers native Event handlers", function(assert) {
	var eventTriggers = 0;
	document.querySelector("#testContainer tr").addEventListener("abc", function() {
		eventTriggers++;
	});
	$("#testContainer tr").trigger("abc");
	setTimeout(function() {
		assert.equal("Received Events", eventTriggers, 1);
	}, 1);
});
addTest("trigger", "Send custom event data", function(assert) {
	var customData = {
		id: 10,
		str: "Hello",
		arr: [1, 5, "hello"],
		obj: {
			person: {
				age: 10
			}
		}
	};
	$("#testContainer").on("input", function(evt) {
		assert.equal("Custom number data", customData.id, evt.id);
		assert.equal("Custom string data", customData.str, evt.str);
		assert.equal("Custom array data", customData.arr, evt.arr);
		assert.equal("Custom object data", customData.obj, evt.obj);
	});
	$("#testContainer").trigger("input", customData);
});


//hide
addTest("hide", "Sets display to none", function(assert) {
	$("#testContainer tr").hide();
	$("#testContainer tr").each(function() {
		assert.equal("Display is none", this.get(0).style.display, "none");
	});
});
addTest("hide", "Sets node attributes", function(assert) {
	$("#testContainer tr").css("display", "inline-block").hide();
	$("#testContainer tr").each(function() {
		assert.equal("Previous style attribute", this.attr("data-LDOM-hidden-previous-display"), "inline-block");
	});
});
addTest("hide", "Sets important", function(assert) {
	$("#testContainer tr").css("display", "inline-block", true).hide();
	$("#testContainer tr").each(function() {
		assert.equal("Display is none", this.get(0).style.display, "none");
		assert.equal("Display important", this.get(0).style.getPropertyPriority("display"), "important");
	});
});


//show
addTest("show", "Sets display to emptystring", function(assert) {
	$("#testContainer tr").css("display", "none").show();
	$("#testContainer tr").each(function() {
		assert.equal("Element is visible", this.get(0).style.display, "");
	});
});
addTest("show", "Sets display back to previous", function(assert) {
	$("#testContainer tr").css("display", "inline-block").hide().show();
	$("#testContainer tr").each(function() {
		assert.equal("Element style is reverted", this.get(0).style.display, "inline-block");
	});
});
addTest("show", "Sets important", function(assert) {
	$("#testContainer tr").css("display", "inline-block", true).hide().show();
	$("#testContainer tr").each(function() {
		assert.equal("Display is reverted", this.get(0).style.display, "inline-block");
		assert.equal("Display important", this.get(0).style.getPropertyPriority("display"), "important");
	});
});


//toggle
addTest("toggle", "Alternates show/hide - show", function(assert) {
	$("#testContainer tr").css("display", "none").toggle();
	$("#testContainer tr").each(function() {
		assert.equal("Element is visible", this.get(0).style.display, "");
	});
});
addTest("toggle", "Alternates show/hide - hide", function(assert) {
	$("#testContainer tr").css("display", "inline-block").toggle();
	$("#testContainer tr").each(function() {
		assert.equal("Element is hidden", this.get(0).style.display, "none");
	});
});
addTest("toggle", "Show - true", function(assert) {
	$("#testContainer tr").css("display", "inline-block").toggle(true);
	$("#testContainer tr").each(function() {
		assert.equal("Element is still shown", this.get(0).style.display, "inline-block");
	});
});
addTest("toggle", "Show - false", function(assert) {
	$("#testContainer tr").css("display", "inline-block").toggle(false);
	$("#testContainer tr").each(function() {
		assert.equal("Element is hidden", this.get(0).style.display, "none");
	});
});
addTest("toggle", "Show - false - already hidden", function(assert) {
	$("#testContainer tr").hide().toggle(false);
	$("#testContainer tr").each(function() {
		assert.equal("Element is still hidden", this.get(0).style.display, "none");
	});
});


//css
addTest("css", "Gets computed style", function(assert) {
	assert.equal("Font-size is correct", $("#testContainer td").css("font-size"), "15px");
});
addTest("css", "Gets computed style of first element", function(assert) {
	$("#testContainer td").eq(1).css("font-size", "20px");
	assert.equal("First elem font-size is correct", $("#testContainer td").css("font-size"), "15px");
});
addTest("css", "Set style", function(assert) {
	$("#testContainer td").css("font-size", "19px");
	$("#testContainer td").each(function() {
		assert.equal("Font-size is correct", this.css("font-size"), "19px");
	});
});
addTest("css", "Set style important", function(assert) {
	$("#testContainer td").css("font-size", "19px", true);
	$("#testContainer td").each(function() {
		assert.equal("Font-size is correct", this.css("font-size"), "19px");
		assert.equal("Set important", this.get(0).style.getPropertyPriority("font-size"), "important");
	});
});
addTest("css", "Set style important - false", function(assert) {
	$("#testContainer td").css("font-size", "19px", false);
	$("#testContainer td").each(function() {
		assert.equal("Font-size is correct", this.css("font-size"), "19px");
		assert.equal("Not important", this.get(0).style.getPropertyPriority("font-size"), "");
	});
});


//html
addTest("html", "Get innerHTML of first element", function(assert) {
	assert.equal("innerHTML matches", $("#testContainer div").html(), document.querySelector("#testContainer div").innerHTML);
});
addTest("html", "Sets innerHTML", function(assert) {
	$("#testContainer div").html("<test>123</test>");
	assert.equal("innerHTML matches", $("#testContainer div").html(), "<test>123</test>");
});
addTest("html", "Remove elements which have become detatched from DOM", function(assert) {
	var remainingElements = $("#testContainer div").html("<test>123</test>");
	assert.equal("Elements removed", remainingElements.length, document.querySelectorAll("#testContainer div").length);
});


//outerHTML
addTest("outerHTML", "Get outerHTML of first element", function(assert) {
	assert.equal("outerHTML matches", $("#testContainer div").outerHTML(), document.querySelector("#testContainer div").outerHTML);
});
addTest("outerHTML", "Sets outerHTML", function(assert) {
	$("#testContainer div").eq(0).outerHTML("<test>123</test>");
	assert.equal("Element tag changed", $("#testContainer test").length, 1);
});
addTest("outerHTML", "Remove elements which have become detatched from DOM", function(assert) {
	var remainingElements = $("#testContainer div").outerHTML("<test>123</test>");
	assert.equal("Elements removed", remainingElements.length, document.querySelectorAll("#testContainer div").length);
});


//text
addTest("text", "Get innerText of first element", function(assert) {
	assert.equal("innerText matches", $("#testContainer div").text(), document.querySelector("#testContainer div").innerText);
});
addTest("text", "Sets innerText", function(assert) {
	$("#testContainer div").text("Happy");
	assert.equal("innerText matches", $("#testContainer div").text(), "Happy");
});
addTest("text", "Remove elements which have become detatched from DOM", function(assert) {
	var remainingElements = $("#testContainer div").text("Happy");
	assert.equal("Elements removed", remainingElements.length, document.querySelectorAll("#testContainer div").length);
});


//prop
addTest("prop", "Get prop", function(assert) {
	assert.equal("Matches", $("#testContainer table").prop("nodeName"), document.querySelector("#testContainer table").nodeName);
});
addTest("prop", "Set prop", function(assert) {
	$("#testContainer table").prop("hidden", true);
	assert.equal("Matches", document.querySelector("#testContainer table").hidden, true);
});


//attr
addTest("attr", "Get attr", function(assert) {
	assert.equal("Matches", $("#testContainer").attr("id"), document.querySelector("#testContainer").id);
});
addTest("attr", "Set attr", function(assert) {
	$("#testContainer table").attr("id", "aTable");
	assert.equal("Matches", document.querySelector("#testContainer table").id, "aTable");
});


//removeAttr
addTest("removeAttr", "Attribute removed", function(assert) {
	$("#tableID").removeAttr("id");
	assert.equal("Removed", $("#tableID").length, 0);
});


//addClass
addTest("addClass", "Add new class from nothing", function(assert) {
	$("#testContainer td").addClass("row-class-name");
	$("#testContainer td").each(function() {
		assert.equal("Class is set", this.attr("class"), "row-class-name");
	});
});
addTest("addClass", "Add additional class", function(assert) {
	$("#testContainer td").addClass("row-class-name").addClass("class-2");
	$("#testContainer td").each(function() {
		assert.equal("Class is set", this.attr("class"), "row-class-name class-2");
	});
});
addTest("addClass", "Add duplicate class", function(assert) {
	$("#testContainer td").addClass("row-class-name").addClass("row-class-name");
	$("#testContainer td").each(function() {
		assert.equal("Class is set", this.attr("class"), "row-class-name");
	});
});
addTest("addClass", "Add multiple classes", function(assert) {
	$("#testContainer td").addClass("row-class-name class-2");
	$("#testContainer td").each(function() {
		assert.equal("Class is set", this.attr("class"), "row-class-name class-2");
	});
});


//removeClass
addTest("removeClass", "Remove all classes", function(assert) {
	$("#testContainer td").addClass("row-class-name class-2 class-3");
	$("#testContainer td").removeClass();
	$("#testContainer td").each(function() {
		assert.equal("Class is removed", this.prop("className"), "");
	});
});
addTest("removeClass", "Remove class that exists", function(assert) {
	$("#testContainer td").addClass("row-class-name class-2 class-3");
	$("#testContainer td").removeClass("class-2");
	$("#testContainer td").each(function() {
		assert.equal("Class is removed", this.prop("className"), "row-class-name class-3");
	});
});
addTest("removeClass", "Remove class that doesn't exist", function(assert) {
	$("#testContainer td").addClass("row-class-name class-2 class-3");
	$("#testContainer td").removeClass("class-4");
	$("#testContainer td").each(function() {
		assert.equal("Class is not removed", this.prop("className"), "row-class-name class-2 class-3");
	});
});
addTest("removeClass", "Remove multiple classes", function(assert) {
	$("#testContainer td").addClass("row-class-name class-2 class-3");
	$("#testContainer td").removeClass("row-class-name class-3");
	$("#testContainer td").each(function() {
		assert.equal("Classes are removed", this.prop("className"), "class-2");
	});
});


//hasClass
addTest("hasClass", "Does any element have class", function(assert) {
	$("#testContainer td").addClass("row-class-name class-2 class-3");
	assert.equal("Has class", $("#testContainer td").hasClass("row-class-name"), true);
});
addTest("hasClass", "Does any element have class - none", function(assert) {
	$("#testContainer td").addClass("row-class-name class-2 class-3");
	assert.equal("Does not have class", $("#testContainer td").hasClass("not-a-class"), false);
});
addTest("hasClass", "Do all elements have class", function(assert) {
	$("#testContainer td").eq(0).addClass("class-1 class-random");
	$("#testContainer td").eq(1).addClass("class-1 class-abc");
	assert.equal("Has class", $("#testContainer td").hasClass("class-1", true), true);
});
addTest("hasClass", "Do all elements not have class", function(assert) {
	$("#testContainer td").eq(0).addClass("class-1 class-random");
	$("#testContainer td").eq(1).addClass("class-1 class-abc");
	assert.equal("Has class", $("#testContainer td").hasClass("class-abc", true), false);
});


//parent
addTest("parent", "Get all parents", function(assert) {
	assert.equal("Parent count correct", $("#testContainer .abc").parent().length, $("#testContainer .abc").length);
});
addTest("parent", "Get all parents - removing duplicates", function(assert) {
	assert.equal("Parent count correct", $("#testContainer div").parent().length, 2);
});


//children
addTest("children", "Get all children", function(assert) {
	assert.equal("Child count correct", $("#testContainer tr").children().length, $("#testContainer th, #testContainer td").length);
});


//filter
addTest("filter", "Remove elements that don't match", function(assert) {
	assert.equal("Filtered count", $("#testContainer *").filter("div").length, $("#testContainer div").length);
});
addTest("filter", "No selector", function(assert) {
	assert.equal("Filtered count", $("#testContainer *").filter("").length, 0);
});


//first
addTest("first", "Gets first element", function(assert) {
	assert.equal("First element", $("#testContainer div").first().get(0), document.querySelector("#testContainer div"));
});
addTest("first", "Gets null when empty list", function(assert) {
	assert.equal("First element null", $("#testContainer .none").first().get(0), null);
});


//last
addTest("last", "Gets last element", function(assert) {
	assert.equal("Last element", $("#testContainer tr").last().get(0), document.querySelectorAll("#testContainer tr")[1]);
});
addTest("last", "Gets null when empty list", function(assert) {
	assert.equal("Last element null", $("#testContainer .none").last().get(0), null);
});


//eq
addTest("eq", "Get positive index", function(assert) {
	assert.equal("Elements equal", $("#testContainer *").eq(3).get(0), document.querySelectorAll("#testContainer *")[3]);
});
addTest("eq", "Get negative index", function(assert) {
	var elems = document.querySelectorAll("#testContainer *");
	assert.equal("Elements equal", $("#testContainer *").eq(-2).get(0), elems[elems.length - 2]);
});
addTest("eq", "Get index out of bounds", function(assert) {
	assert.equal("Negative index - Element empty", $("#testContainer *").eq(-100).get(0), null);
	assert.equal("Positive index - Element null", $("#testContainer *").eq(100).get(0), null);
});


//insertAfter
addTest("insertAfter", "Insert elements", function(assert) {
	var sourceElems = $("#testContainer td").insertAfter($("#testContainer th"));
	assert.equal("Elements copied", $("#testContainer td").length, 6);
	assert.equal("Elements in correct order", $("#testContainer tr").first().children().eq(1).text(), sourceElems.eq(0).text());
	assert.equal("Elements in correct order", $("#testContainer tr").first().children().eq(2).text(), sourceElems.eq(1).text());
	assert.equal("Elements in correct order", $("#testContainer tr").first().children().eq(4).text(), sourceElems.eq(0).text());
	assert.equal("Elements in correct order", $("#testContainer tr").first().children().eq(5).text(), sourceElems.eq(1).text());
});


//insertBefore
addTest("insertBefore", "Insert elements", function(assert) {
	var sourceElems = $("#testContainer td").insertBefore($("#testContainer th"));
	assert.equal("Elements copied", $("#testContainer td").length, 6);
	assert.equal("Elements in correct order", $("#testContainer tr").first().children().eq(0).text(), sourceElems.eq(0).text());
	assert.equal("Elements in correct order", $("#testContainer tr").first().children().eq(1).text(), sourceElems.eq(1).text());
	assert.equal("Elements in correct order", $("#testContainer tr").first().children().eq(3).text(), sourceElems.eq(0).text());
	assert.equal("Elements in correct order", $("#testContainer tr").first().children().eq(4).text(), sourceElems.eq(1).text());
});


//appendChild
addTest("appendChild", "Insert elements", function(assert) {
	var sourceElems = $("#testContainer td");
	$("#testContainer tr").appendChild(sourceElems);
	assert.equal("Elements copied", $("#testContainer td").length, 6);
	assert.equal("Elements in correct order", $("#testContainer tr").first().children().eq(2).text(), sourceElems.eq(0).text());
	assert.equal("Elements in correct order", $("#testContainer tr").first().children().eq(3).text(), sourceElems.eq(1).text());
	assert.equal("Elements in correct order", $("#testContainer tr").last().children().eq(2).text(), sourceElems.eq(0).text());
	assert.equal("Elements in correct order", $("#testContainer tr").last().children().eq(3).text(), sourceElems.eq(1).text());
});


//prependChild
addTest("prependChild", "Insert elements", function(assert) {
	var sourceElems = $("#testContainer td");
	$("#testContainer tr").prependChild(sourceElems);
	assert.equal("Elements copied", $("#testContainer td").length, 6);
	assert.equal("Elements in correct order", $("#testContainer tr").first().children().eq(0).text(), sourceElems.eq(0).text());
	assert.equal("Elements in correct order", $("#testContainer tr").first().children().eq(1).text(), sourceElems.eq(1).text());
	assert.equal("Elements in correct order", $("#testContainer tr").last().children().eq(0).text(), sourceElems.eq(0).text());
	assert.equal("Elements in correct order", $("#testContainer tr").last().children().eq(1).text(), sourceElems.eq(1).text());
});


//remove
addTest("remove", "Remove elements", function(assert) {
	$("#testContainer tr").remove();
	assert.equal("Elements removed", $("#testContainer tr").length, 0);
});
addTest("remove", "Remove hierarchy of elements", function(assert) {
	$("#testContainer div").remove();
	assert.equal("Elements removed", $("#testContainer div").length, 0);
});
addTest("remove", "Remove event listeners", function(assert) {
	var elems = $("#testContainer span");
	elems.on("click", function() {
		assert.equal("This handler shouldn't execute", true, false);	
	});
	elems.remove();
	elems.trigger("click");
	assert.equal("Event removed", typeof elems.get(0)._LDOMEvents, "undefined");
});



// ------------------------------ End Tests ------------------------------

for (var i = 0; i < methods.length; i++) {
	var method = methods[i];
	$("#function-" + method).find("summary").appendChild(
		$("<span>").addClass("test-stats").appendChild(
			$("<span>").text("-").attr("id", "function-successCount-" + method)
		).appendChild(
			$("<span>").text(" / ")
		).appendChild(
			$("<span>").text("-").attr("id", "function-totalCount-" + method)
		)
	);
}

var testQueue = [];
var totalSuccess = 0;
var totalCount = 0;
var methodSuccesses = {};
var methodAssertions = {};
for (var i = 0; i < methods.length; i++) {
	var method = methods[i];
	methodSuccesses[method] = 0;
	methodAssertions[method] = 0;
	for (var j = 0; j < tests[method].length; j++) {
		testQueue.push({
			method: method,
			testData: tests[method][j]
		});
	}
}
runTests();
function runTests() {
	if (testQueue.length === 0) {
		if (totalCount === totalSuccess) {
			$("#aggregate-totalCount").parent().addClass("test-success");
		} else {
			$("#aggregate-totalCount").parent().addClass("test-fail");
		}
		return;
	}
	var test = testQueue.shift();
	var method = test.method;
	test = test.testData;
	test.run(function(testCaseName) {
		methodAssertions[method]++;
		methodSuccesses[method]++;
		totalSuccess++;
		totalCount++;
		$("#function-totalCount-" + method).text(methodAssertions[method]);
		$("#function-successCount-" + method).text(methodSuccesses[method]);
		if (methodSuccesses[method] === methodAssertions[method]) {
			$("#function-successCount-" + method).parent().addClass("test-success");
		}
		$("#function-" + method).appendChild($("<div>").text(test.testName + testCaseName).addClass("test-success").addClass("test-case"));

		$("#aggregate-totalCount").text(totalCount);
		$("#aggregate-successCount").text(totalSuccess);
	}, function(e) {
		methodAssertions[method]++;
		totalCount++;
		console.error(e);
		$("#function-" + method).appendChild($("<div>").text(test.testName + e).removeClass().addClass("test-fail").addClass("test-case"));
		$("#function-successCount-" + method).text(methodSuccesses[method]).parent().removeClass().addClass("test-fail");
		$("#function-totalCount-" + method).text(methodAssertions[method]);
		$("#function-" + method).attr("open", "");

		$("#aggregate-totalCount").text(totalCount);
	});
	setTimeout(runTests, 5);
}