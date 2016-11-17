"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

/*
 FastClick: polyfill to remove click delays on browsers with touch UIs.

 @codingstandard ftlabs-jsv2
 @copyright The Financial Times Limited [All Rights Reserved]
 @license MIT License (see LICENSE.txt)
*/
(function () {
  function e(a, b) {
    function c(a, b) {
      return function () {
        return a.apply(b, arguments);
      };
    }var d;b = b || {};this.trackingClick = !1;this.trackingClickStart = 0;this.targetElement = null;this.lastTouchIdentifier = this.touchStartY = this.touchStartX = 0;this.touchBoundary = b.touchBoundary || 10;this.layer = a;this.tapDelay = b.tapDelay || 200;this.tapTimeout = b.tapTimeout || 700;if (!e.notNeeded(a)) {
      for (var f = "onMouse onClick onTouchStart onTouchMove onTouchEnd onTouchCancel".split(" "), h = 0, k = f.length; h < k; h++) {
        this[f[h]] = c(this[f[h]], this);
      }g && (a.addEventListener("mouseover", this.onMouse, !0), a.addEventListener("mousedown", this.onMouse, !0), a.addEventListener("mouseup", this.onMouse, !0));a.addEventListener("click", this.onClick, !0);a.addEventListener("touchstart", this.onTouchStart, !1);a.addEventListener("touchmove", this.onTouchMove, !1);a.addEventListener("touchend", this.onTouchEnd, !1);a.addEventListener("touchcancel", this.onTouchCancel, !1);Event.prototype.stopImmediatePropagation || (a.removeEventListener = function (b, c, d) {
        var e = Node.prototype.removeEventListener;
        "click" === b ? e.call(a, b, c.hijacked || c, d) : e.call(a, b, c, d);
      }, a.addEventListener = function (b, c, d) {
        var e = Node.prototype.addEventListener;"click" === b ? e.call(a, b, c.hijacked || (c.hijacked = function (a) {
          a.propagationStopped || c(a);
        }), d) : e.call(a, b, c, d);
      });"function" === typeof a.onclick && (d = a.onclick, a.addEventListener("click", function (a) {
        d(a);
      }, !1), a.onclick = null);
    }
  }var k = 0 <= navigator.userAgent.indexOf("Windows Phone"),
      g = 0 < navigator.userAgent.indexOf("Android") && !k,
      f = /iP(ad|hone|od)/.test(navigator.userAgent) && !k,
      l = f && /OS 4_\d(_\d)?/.test(navigator.userAgent),
      m = f && /OS [6-7]_\d/.test(navigator.userAgent),
      n = 0 < navigator.userAgent.indexOf("BB10");e.prototype.needsClick = function (a) {
    switch (a.nodeName.toLowerCase()) {case "button":case "select":case "textarea":
        if (a.disabled) return !0;break;case "input":
        if (f && "file" === a.type || a.disabled) return !0;break;case "label":case "iframe":case "video":
        return !0;}return (/\bneedsclick\b/.test(a.className)
    );
  };e.prototype.needsFocus = function (a) {
    switch (a.nodeName.toLowerCase()) {case "textarea":
        return !0;
      case "select":
        return !g;case "input":
        switch (a.type) {case "button":case "checkbox":case "file":case "image":case "radio":case "submit":
            return !1;}return !a.disabled && !a.readOnly;default:
        return (/\bneedsfocus\b/.test(a.className)
        );}
  };e.prototype.sendClick = function (a, b) {
    var c, d;document.activeElement && document.activeElement !== a && document.activeElement.blur();d = b.changedTouches[0];c = document.createEvent("MouseEvents");c.initMouseEvent(this.determineEventType(a), !0, !0, window, 1, d.screenX, d.screenY, d.clientX, d.clientY, !1, !1, !1, !1, 0, null);c.forwardedTouchEvent = !0;a.dispatchEvent(c);
  };e.prototype.determineEventType = function (a) {
    return g && "select" === a.tagName.toLowerCase() ? "mousedown" : "click";
  };e.prototype.focus = function (a) {
    var b;f && a.setSelectionRange && 0 !== a.type.indexOf("date") && "time" !== a.type && "month" !== a.type ? (b = a.value.length, a.setSelectionRange(b, b)) : a.focus();
  };e.prototype.updateScrollParent = function (a) {
    var b, c;b = a.fastClickScrollParent;if (!b || !b.contains(a)) {
      c = a;do {
        if (c.scrollHeight > c.offsetHeight) {
          b = c;a.fastClickScrollParent = c;break;
        }c = c.parentElement;
      } while (c);
    }b && (b.fastClickLastScrollTop = b.scrollTop);
  };e.prototype.getTargetElementFromEventTarget = function (a) {
    return a.nodeType === Node.TEXT_NODE ? a.parentNode : a;
  };e.prototype.onTouchStart = function (a) {
    var b, c, d;if (1 < a.targetTouches.length) return !0;b = this.getTargetElementFromEventTarget(a.target);c = a.targetTouches[0];if (f) {
      d = window.getSelection();if (d.rangeCount && !d.isCollapsed) return !0;if (!l) {
        if (c.identifier && c.identifier === this.lastTouchIdentifier) return a.preventDefault(), !1;
        this.lastTouchIdentifier = c.identifier;this.updateScrollParent(b);
      }
    }this.trackingClick = !0;this.trackingClickStart = a.timeStamp;this.targetElement = b;this.touchStartX = c.pageX;this.touchStartY = c.pageY;a.timeStamp - this.lastClickTime < this.tapDelay && a.preventDefault();return !0;
  };e.prototype.touchHasMoved = function (a) {
    a = a.changedTouches[0];var b = this.touchBoundary;return Math.abs(a.pageX - this.touchStartX) > b || Math.abs(a.pageY - this.touchStartY) > b ? !0 : !1;
  };e.prototype.onTouchMove = function (a) {
    if (!this.trackingClick) return !0;
    if (this.targetElement !== this.getTargetElementFromEventTarget(a.target) || this.touchHasMoved(a)) this.trackingClick = !1, this.targetElement = null;return !0;
  };e.prototype.findControl = function (a) {
    return void 0 !== a.control ? a.control : a.htmlFor ? document.getElementById(a.htmlFor) : a.querySelector("button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea");
  };e.prototype.onTouchEnd = function (a) {
    var b,
        c,
        d = this.targetElement;if (!this.trackingClick) return !0;if (a.timeStamp - this.lastClickTime < this.tapDelay) return this.cancelNextClick = !0;if (a.timeStamp - this.trackingClickStart > this.tapTimeout) return !0;this.cancelNextClick = !1;this.lastClickTime = a.timeStamp;b = this.trackingClickStart;this.trackingClick = !1;this.trackingClickStart = 0;m && (c = a.changedTouches[0], d = document.elementFromPoint(c.pageX - window.pageXOffset, c.pageY - window.pageYOffset) || d, d.fastClickScrollParent = this.targetElement.fastClickScrollParent);c = d.tagName.toLowerCase();if ("label" === c) {
      if (b = this.findControl(d)) {
        this.focus(d);if (g) return !1;
        d = b;
      }
    } else if (this.needsFocus(d)) {
      if (100 < a.timeStamp - b || f && window.top !== window && "input" === c) return this.targetElement = null, !1;this.focus(d);this.sendClick(d, a);f && "select" === c || (this.targetElement = null, a.preventDefault());return !1;
    }if (f && !l && (b = d.fastClickScrollParent) && b.fastClickLastScrollTop !== b.scrollTop) return !0;this.needsClick(d) || (a.preventDefault(), this.sendClick(d, a));return !1;
  };e.prototype.onTouchCancel = function () {
    this.trackingClick = !1;this.targetElement = null;
  };e.prototype.onMouse = function (a) {
    return this.targetElement && !a.forwardedTouchEvent && a.cancelable ? !this.needsClick(this.targetElement) || this.cancelNextClick ? (a.stopImmediatePropagation ? a.stopImmediatePropagation() : a.propagationStopped = !0, a.stopPropagation(), a.preventDefault(), !1) : !0 : !0;
  };e.prototype.onClick = function (a) {
    if (this.trackingClick) return this.targetElement = null, this.trackingClick = !1, !0;if ("submit" === a.target.type && 0 === a.detail) return !0;a = this.onMouse(a);a || (this.targetElement = null);return a;
  };e.prototype.destroy = function () {
    var a = this.layer;g && (a.removeEventListener("mouseover", this.onMouse, !0), a.removeEventListener("mousedown", this.onMouse, !0), a.removeEventListener("mouseup", this.onMouse, !0));a.removeEventListener("click", this.onClick, !0);a.removeEventListener("touchstart", this.onTouchStart, !1);a.removeEventListener("touchmove", this.onTouchMove, !1);a.removeEventListener("touchend", this.onTouchEnd, !1);a.removeEventListener("touchcancel", this.onTouchCancel, !1);
  };e.notNeeded = function (a) {
    var b, c;if ("undefined" === typeof window.ontouchstart) return !0;if (c = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [, 0])[1]) if (g) {
      if ((b = document.querySelector("meta[name=viewport]")) && (-1 !== b.content.indexOf("user-scalable=no") || 31 < c && document.documentElement.scrollWidth <= window.outerWidth)) return !0;
    } else return !0;return n && (b = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/), 10 <= b[1] && 3 <= b[2] && (b = document.querySelector("meta[name=viewport]")) && (-1 !== b.content.indexOf("user-scalable=no") || document.documentElement.scrollWidth <= window.outerWidth)) || "none" === a.style.msTouchAction || "manipulation" === a.style.touchAction || 27 <= +(/Firefox\/([0-9]+)/.exec(navigator.userAgent) || [, 0])[1] && (b = document.querySelector("meta[name=viewport]")) && (-1 !== b.content.indexOf("user-scalable=no") || document.documentElement.scrollWidth <= window.outerWidth) ? !0 : "none" === a.style.touchAction || "manipulation" === a.style.touchAction ? !0 : !1;
  };e.attach = function (a, b) {
    return new e(a, b);
  };"function" === typeof define && "object" === _typeof(define.amd) && define.amd ? define(function () {
    return e;
  }) : "undefined" !== typeof module && module.exports ? (module.exports = e.attach, module.exports.FastClick = e) : window.FastClick = e;
})();
//# sourceMappingURL=fastclick.js.map
