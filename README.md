<h1 align="center">LDOM</h1>

A Lightweight JavaScript library to interact with the browser DOM.

Full documentation, customizers, downloaders and examples available at [lightweightdom.com](http://lightweightdom.com).

<h2 align="center">Getting Started</h2>

LDOM is a Lightweight (about 8% of the size of jQuery) way to interact with the browser DOM (Document Object Model).

If you are familiar with jQuery, then LDOM will feel very similar. In many common use cases, LDOM can simply be a drop-in replacement to jQuery without any problems. One way that LDOM is so much smaller and faster than jQuery is that it doesn't support all of the ancient browsers that jQuery does. That being said, by using LDOM, here are the minimum browser versions that are supported. (Basically any browser since 2013)

| Browser | Version |
|---------|---------|
| Chrome  | 29      |
| Firefox | 23      |
| Safari  | 6       |
| IE      | 9       |
| Edge    | all     |
| Opera   | 12      |

<h2 align="center">Example Usage</h2>
<h3 align="center">Comparison between LDOM and Vanilla JavaScript</h3>

---

<h3 align="center">Set the text of all buttons.</h3>

#### LDOM
```js
$("button").text("I am a Button");
```
#### Vanilla JavaScript
```js
var buttons = document.querySelectorAll("button");
for (var i = 0; i < buttons.length; i++) {
	buttons[i].innerText = "I am a Button";	
}
```
---

<h3 align="center">Add a class to all parents of buttons.</h3>

#### LDOM
```js
$("button").parent().addClass("button-parent");
```
#### Vanilla JavaScript
```js
var buttons = document.querySelectorAll("button");
for (var i = 0; i < buttons.length; i++) {
	if (buttons[i].parentNode.className.split(" ").indexOf("button-parent") === -1) {
		buttons[i].parentNode.className += " " + "button-parent";	
	}
}
```
---

<h3 align="center">Add a click event to all buttons. Remove that event from a certain button.</h3>

#### LDOM
```js
var activateButtonEventId = $("button").on("click", function(){
	this.addClass("button-active");	
});
$("button").eq(1).off("click", activateButtonEventId);
```
#### Vanilla JavaScript
```js
var buttons = document.querySelectorAll("button");
for (var i = 0; i < buttons.length; i++) {
	buttons[i].addEventListener("click", addButtonActiveClass);
}
buttons[1].removeEventListener("click", addButtonActiveClass);

function addButtonActiveClass(){
	if (buttons[i].className.split(" ").indexOf("button-active") === -1) {
		buttons[i].className += " " + "button-active";	
	}
}
```
---


<h3 align="center">Create a text element and insert it after each button.</h3>

#### LDOM
```js
$("<text>").css("text-align", "center").text("Click the button above!").insertAfter($("button"));
```
#### Vanilla JavaScript
```js
var textElem = document.createElement("text");
textElem.style.textAlign = "center";
textElem.innerText = "Click the button above!";
var buttons = document.querySelectorAll("button");
for (var i = 0; i < buttons.length; i++) {
	buttons[i].parentNode.insertBefore(textElem, buttons[i].nextSibling);
}
```
---

## Like what you see so far?
## Full documentation, customizers, downloaders and examples available at [lightweightdom.com](http://lightweightdom.com).
