(function () {
	'use strict';

	// https://developers.google.com/web/fundamentals/getting-started/primers/promises

	function get(url) {
		// Return a new promise.
		return new Promise(function (resolve, reject) {
			// Do the usual XHR stuff
			var req = new XMLHttpRequest();
			req.open('GET', url);

			req.onload = function () {
				// This is called even on 404 etc
				// so check the status
				if (req.status == 200) {
					// Resolve the promise with the response text
					resolve(req.response);
				} else {
					// Otherwise reject with the status text
					// which will hopefully be a meaningful error
					reject(Error(req.statusText));
				}
			};

			// Handle network errors
			req.onerror = function () {
				reject(Error("Network Error"));
			};

			// Make the request
			req.send();
		});
	}

	function ascending(a, b) {
	  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
	}

	function bisector(compare) {
	  if (compare.length === 1) compare = ascendingComparator(compare);
	  return {
	    left: function(a, x, lo, hi) {
	      if (lo == null) lo = 0;
	      if (hi == null) hi = a.length;
	      while (lo < hi) {
	        var mid = lo + hi >>> 1;
	        if (compare(a[mid], x) < 0) lo = mid + 1;
	        else hi = mid;
	      }
	      return lo;
	    },
	    right: function(a, x, lo, hi) {
	      if (lo == null) lo = 0;
	      if (hi == null) hi = a.length;
	      while (lo < hi) {
	        var mid = lo + hi >>> 1;
	        if (compare(a[mid], x) > 0) hi = mid;
	        else lo = mid + 1;
	      }
	      return lo;
	    }
	  };
	}

	function ascendingComparator(f) {
	  return function(d, x) {
	    return ascending(f(d), x);
	  };
	}

	var ascendingBisect = bisector(ascending);
	var bisectRight = ascendingBisect.right;

	function sequence(start, stop, step) {
	  start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

	  var i = -1,
	      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
	      range = new Array(n);

	  while (++i < n) {
	    range[i] = start + i * step;
	  }

	  return range;
	}

	var e10 = Math.sqrt(50),
	    e5 = Math.sqrt(10),
	    e2 = Math.sqrt(2);

	function ticks(start, stop, count) {
	  var step = tickStep(start, stop, count);
	  return sequence(
	    Math.ceil(start / step) * step,
	    Math.floor(stop / step) * step + step / 2, // inclusive
	    step
	  );
	}

	function tickStep(start, stop, count) {
	  var step0 = Math.abs(stop - start) / Math.max(0, count),
	      step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
	      error = step0 / step1;
	  if (error >= e10) step1 *= 10;
	  else if (error >= e5) step1 *= 5;
	  else if (error >= e2) step1 *= 2;
	  return stop < start ? -step1 : step1;
	}

	var slice$1 = Array.prototype.slice;

	function identity$1(x) {
	  return x;
	}

	var top = 1,
	    right = 2,
	    bottom = 3,
	    left = 4,
	    epsilon = 1e-6;

	function translateX(scale0, scale1, d) {
	  var x = scale0(d);
	  return "translate(" + (isFinite(x) ? x : scale1(d)) + ",0)";
	}

	function translateY(scale0, scale1, d) {
	  var y = scale0(d);
	  return "translate(0," + (isFinite(y) ? y : scale1(d)) + ")";
	}

	function center(scale) {
	  var offset = scale.bandwidth() / 2;
	  if (scale.round()) offset = Math.round(offset);
	  return function(d) {
	    return scale(d) + offset;
	  };
	}

	function entering() {
	  return !this.__axis;
	}

	function axis(orient, scale) {
	  var tickArguments = [],
	      tickValues = null,
	      tickFormat = null,
	      tickSizeInner = 6,
	      tickSizeOuter = 6,
	      tickPadding = 3;

	  function axis(context) {
	    var values = tickValues == null ? (scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain()) : tickValues,
	        format = tickFormat == null ? (scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : identity$1) : tickFormat,
	        spacing = Math.max(tickSizeInner, 0) + tickPadding,
	        transform = orient === top || orient === bottom ? translateX : translateY,
	        range = scale.range(),
	        range0 = range[0] + 0.5,
	        range1 = range[range.length - 1] + 0.5,
	        position = (scale.bandwidth ? center : identity$1)(scale.copy()),
	        selection = context.selection ? context.selection() : context,
	        path = selection.selectAll(".domain").data([null]),
	        tick = selection.selectAll(".tick").data(values, scale).order(),
	        tickExit = tick.exit(),
	        tickEnter = tick.enter().append("g").attr("class", "tick"),
	        line = tick.select("line"),
	        text = tick.select("text"),
	        k = orient === top || orient === left ? -1 : 1,
	        x, y = orient === left || orient === right ? (x = "x", "y") : (x = "y", "x");

	    path = path.merge(path.enter().insert("path", ".tick")
	        .attr("class", "domain")
	        .attr("stroke", "#000"));

	    tick = tick.merge(tickEnter);

	    line = line.merge(tickEnter.append("line")
	        .attr("stroke", "#000")
	        .attr(x + "2", k * tickSizeInner)
	        .attr(y + "1", 0.5)
	        .attr(y + "2", 0.5));

	    text = text.merge(tickEnter.append("text")
	        .attr("fill", "#000")
	        .attr(x, k * spacing)
	        .attr(y, 0.5)
	        .attr("dy", orient === top ? "0em" : orient === bottom ? "0.71em" : "0.32em"));

	    if (context !== selection) {
	      path = path.transition(context);
	      tick = tick.transition(context);
	      line = line.transition(context);
	      text = text.transition(context);

	      tickExit = tickExit.transition(context)
	          .attr("opacity", epsilon)
	          .attr("transform", function(d) { return transform(position, this.parentNode.__axis || position, d); });

	      tickEnter
	          .attr("opacity", epsilon)
	          .attr("transform", function(d) { return transform(this.parentNode.__axis || position, position, d); });
	    }

	    tickExit.remove();

	    path
	        .attr("d", orient === left || orient == right
	            ? "M" + k * tickSizeOuter + "," + range0 + "H0.5V" + range1 + "H" + k * tickSizeOuter
	            : "M" + range0 + "," + k * tickSizeOuter + "V0.5H" + range1 + "V" + k * tickSizeOuter);

	    tick
	        .attr("opacity", 1)
	        .attr("transform", function(d) { return transform(position, position, d); });

	    line
	        .attr(x + "2", k * tickSizeInner);

	    text
	        .attr(x, k * spacing)
	        .text(format);

	    selection.filter(entering)
	        .attr("fill", "none")
	        .attr("font-size", 10)
	        .attr("font-family", "sans-serif")
	        .attr("text-anchor", orient === right ? "start" : orient === left ? "end" : "middle");

	    selection
	        .each(function() { this.__axis = position; });
	  }

	  axis.scale = function(_) {
	    return arguments.length ? (scale = _, axis) : scale;
	  };

	  axis.ticks = function() {
	    return tickArguments = slice$1.call(arguments), axis;
	  };

	  axis.tickArguments = function(_) {
	    return arguments.length ? (tickArguments = _ == null ? [] : slice$1.call(_), axis) : tickArguments.slice();
	  };

	  axis.tickValues = function(_) {
	    return arguments.length ? (tickValues = _ == null ? null : slice$1.call(_), axis) : tickValues && tickValues.slice();
	  };

	  axis.tickFormat = function(_) {
	    return arguments.length ? (tickFormat = _, axis) : tickFormat;
	  };

	  axis.tickSize = function(_) {
	    return arguments.length ? (tickSizeInner = tickSizeOuter = +_, axis) : tickSizeInner;
	  };

	  axis.tickSizeInner = function(_) {
	    return arguments.length ? (tickSizeInner = +_, axis) : tickSizeInner;
	  };

	  axis.tickSizeOuter = function(_) {
	    return arguments.length ? (tickSizeOuter = +_, axis) : tickSizeOuter;
	  };

	  axis.tickPadding = function(_) {
	    return arguments.length ? (tickPadding = +_, axis) : tickPadding;
	  };

	  return axis;
	}

	function axisBottom(scale) {
	  return axis(bottom, scale);
	}

	function axisLeft(scale) {
	  return axis(left, scale);
	}

	var noop = {value: function() {}};

	function dispatch() {
	  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
	    if (!(t = arguments[i] + "") || (t in _)) throw new Error("illegal type: " + t);
	    _[t] = [];
	  }
	  return new Dispatch(_);
	}

	function Dispatch(_) {
	  this._ = _;
	}

	function parseTypenames(typenames, types) {
	  return typenames.trim().split(/^|\s+/).map(function(t) {
	    var name = "", i = t.indexOf(".");
	    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
	    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
	    return {type: t, name: name};
	  });
	}

	Dispatch.prototype = dispatch.prototype = {
	  constructor: Dispatch,
	  on: function(typename, callback) {
	    var _ = this._,
	        T = parseTypenames(typename + "", _),
	        t,
	        i = -1,
	        n = T.length;

	    // If no callback was specified, return the callback of the given type and name.
	    if (arguments.length < 2) {
	      while (++i < n) if ((t = (typename = T[i]).type) && (t = get$1(_[t], typename.name))) return t;
	      return;
	    }

	    // If a type was specified, set the callback for the given type and name.
	    // Otherwise, if a null callback was specified, remove callbacks of the given name.
	    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
	    while (++i < n) {
	      if (t = (typename = T[i]).type) _[t] = set(_[t], typename.name, callback);
	      else if (callback == null) for (t in _) _[t] = set(_[t], typename.name, null);
	    }

	    return this;
	  },
	  copy: function() {
	    var copy = {}, _ = this._;
	    for (var t in _) copy[t] = _[t].slice();
	    return new Dispatch(copy);
	  },
	  call: function(type, that) {
	    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
	    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
	    for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
	  },
	  apply: function(type, that, args) {
	    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
	    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
	  }
	};

	function get$1(type, name) {
	  for (var i = 0, n = type.length, c; i < n; ++i) {
	    if ((c = type[i]).name === name) {
	      return c.value;
	    }
	  }
	}

	function set(type, name, callback) {
	  for (var i = 0, n = type.length; i < n; ++i) {
	    if (type[i].name === name) {
	      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
	      break;
	    }
	  }
	  if (callback != null) type.push({name: name, value: callback});
	  return type;
	}

	var xhtml = "http://www.w3.org/1999/xhtml";

	var namespaces = {
	  svg: "http://www.w3.org/2000/svg",
	  xhtml: xhtml,
	  xlink: "http://www.w3.org/1999/xlink",
	  xml: "http://www.w3.org/XML/1998/namespace",
	  xmlns: "http://www.w3.org/2000/xmlns/"
	};

	function namespace(name) {
	  var prefix = name += "", i = prefix.indexOf(":");
	  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
	  return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name;
	}

	function creatorInherit(name) {
	  return function() {
	    var document = this.ownerDocument,
	        uri = this.namespaceURI;
	    return uri === xhtml && document.documentElement.namespaceURI === xhtml
	        ? document.createElement(name)
	        : document.createElementNS(uri, name);
	  };
	}

	function creatorFixed(fullname) {
	  return function() {
	    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
	  };
	}

	function creator(name) {
	  var fullname = namespace(name);
	  return (fullname.local
	      ? creatorFixed
	      : creatorInherit)(fullname);
	}

	var matcher = function(selector) {
	  return function() {
	    return this.matches(selector);
	  };
	};

	if (typeof document !== "undefined") {
	  var element = document.documentElement;
	  if (!element.matches) {
	    var vendorMatches = element.webkitMatchesSelector
	        || element.msMatchesSelector
	        || element.mozMatchesSelector
	        || element.oMatchesSelector;
	    matcher = function(selector) {
	      return function() {
	        return vendorMatches.call(this, selector);
	      };
	    };
	  }
	}

	var matcher$1 = matcher;

	var filterEvents = {};

	var event = null;

	if (typeof document !== "undefined") {
	  var element$1 = document.documentElement;
	  if (!("onmouseenter" in element$1)) {
	    filterEvents = {mouseenter: "mouseover", mouseleave: "mouseout"};
	  }
	}

	function filterContextListener(listener, index, group) {
	  listener = contextListener(listener, index, group);
	  return function(event) {
	    var related = event.relatedTarget;
	    if (!related || (related !== this && !(related.compareDocumentPosition(this) & 8))) {
	      listener.call(this, event);
	    }
	  };
	}

	function contextListener(listener, index, group) {
	  return function(event1) {
	    var event0 = event; // Events can be reentrant (e.g., focus).
	    event = event1;
	    try {
	      listener.call(this, this.__data__, index, group);
	    } finally {
	      event = event0;
	    }
	  };
	}

	function parseTypenames$1(typenames) {
	  return typenames.trim().split(/^|\s+/).map(function(t) {
	    var name = "", i = t.indexOf(".");
	    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
	    return {type: t, name: name};
	  });
	}

	function onRemove(typename) {
	  return function() {
	    var on = this.__on;
	    if (!on) return;
	    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
	      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
	        this.removeEventListener(o.type, o.listener, o.capture);
	      } else {
	        on[++i] = o;
	      }
	    }
	    if (++i) on.length = i;
	    else delete this.__on;
	  };
	}

	function onAdd(typename, value, capture) {
	  var wrap = filterEvents.hasOwnProperty(typename.type) ? filterContextListener : contextListener;
	  return function(d, i, group) {
	    var on = this.__on, o, listener = wrap(value, i, group);
	    if (on) for (var j = 0, m = on.length; j < m; ++j) {
	      if ((o = on[j]).type === typename.type && o.name === typename.name) {
	        this.removeEventListener(o.type, o.listener, o.capture);
	        this.addEventListener(o.type, o.listener = listener, o.capture = capture);
	        o.value = value;
	        return;
	      }
	    }
	    this.addEventListener(typename.type, listener, capture);
	    o = {type: typename.type, name: typename.name, value: value, listener: listener, capture: capture};
	    if (!on) this.__on = [o];
	    else on.push(o);
	  };
	}

	function selection_on(typename, value, capture) {
	  var typenames = parseTypenames$1(typename + ""), i, n = typenames.length, t;

	  if (arguments.length < 2) {
	    var on = this.node().__on;
	    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
	      for (i = 0, o = on[j]; i < n; ++i) {
	        if ((t = typenames[i]).type === o.type && t.name === o.name) {
	          return o.value;
	        }
	      }
	    }
	    return;
	  }

	  on = value ? onAdd : onRemove;
	  if (capture == null) capture = false;
	  for (i = 0; i < n; ++i) this.each(on(typenames[i], value, capture));
	  return this;
	}

	function customEvent(event1, listener, that, args) {
	  var event0 = event;
	  event1.sourceEvent = event;
	  event = event1;
	  try {
	    return listener.apply(that, args);
	  } finally {
	    event = event0;
	  }
	}

	function sourceEvent() {
	  var current = event, source;
	  while (source = current.sourceEvent) current = source;
	  return current;
	}

	function point(node, event) {
	  var svg = node.ownerSVGElement || node;

	  if (svg.createSVGPoint) {
	    var point = svg.createSVGPoint();
	    point.x = event.clientX, point.y = event.clientY;
	    point = point.matrixTransform(node.getScreenCTM().inverse());
	    return [point.x, point.y];
	  }

	  var rect = node.getBoundingClientRect();
	  return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
	}

	function mouse(node) {
	  var event = sourceEvent();
	  if (event.changedTouches) event = event.changedTouches[0];
	  return point(node, event);
	}

	function none() {}

	function selector(selector) {
	  return selector == null ? none : function() {
	    return this.querySelector(selector);
	  };
	}

	function selection_select(select) {
	  if (typeof select !== "function") select = selector(select);

	  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
	      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
	        if ("__data__" in node) subnode.__data__ = node.__data__;
	        subgroup[i] = subnode;
	      }
	    }
	  }

	  return new Selection(subgroups, this._parents);
	}

	function empty() {
	  return [];
	}

	function selectorAll(selector) {
	  return selector == null ? empty : function() {
	    return this.querySelectorAll(selector);
	  };
	}

	function selection_selectAll(select) {
	  if (typeof select !== "function") select = selectorAll(select);

	  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
	      if (node = group[i]) {
	        subgroups.push(select.call(node, node.__data__, i, group));
	        parents.push(node);
	      }
	    }
	  }

	  return new Selection(subgroups, parents);
	}

	function selection_filter(match) {
	  if (typeof match !== "function") match = matcher$1(match);

	  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
	      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
	        subgroup.push(node);
	      }
	    }
	  }

	  return new Selection(subgroups, this._parents);
	}

	function sparse(update) {
	  return new Array(update.length);
	}

	function selection_enter() {
	  return new Selection(this._enter || this._groups.map(sparse), this._parents);
	}

	function EnterNode(parent, datum) {
	  this.ownerDocument = parent.ownerDocument;
	  this.namespaceURI = parent.namespaceURI;
	  this._next = null;
	  this._parent = parent;
	  this.__data__ = datum;
	}

	EnterNode.prototype = {
	  constructor: EnterNode,
	  appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
	  insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
	  querySelector: function(selector) { return this._parent.querySelector(selector); },
	  querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
	};

	function constant$1(x) {
	  return function() {
	    return x;
	  };
	}

	var keyPrefix = "$"; // Protect against keys like “__proto__”.

	function bindIndex(parent, group, enter, update, exit, data) {
	  var i = 0,
	      node,
	      groupLength = group.length,
	      dataLength = data.length;

	  // Put any non-null nodes that fit into update.
	  // Put any null nodes into enter.
	  // Put any remaining data into enter.
	  for (; i < dataLength; ++i) {
	    if (node = group[i]) {
	      node.__data__ = data[i];
	      update[i] = node;
	    } else {
	      enter[i] = new EnterNode(parent, data[i]);
	    }
	  }

	  // Put any non-null nodes that don’t fit into exit.
	  for (; i < groupLength; ++i) {
	    if (node = group[i]) {
	      exit[i] = node;
	    }
	  }
	}

	function bindKey(parent, group, enter, update, exit, data, key) {
	  var i,
	      node,
	      nodeByKeyValue = {},
	      groupLength = group.length,
	      dataLength = data.length,
	      keyValues = new Array(groupLength),
	      keyValue;

	  // Compute the key for each node.
	  // If multiple nodes have the same key, the duplicates are added to exit.
	  for (i = 0; i < groupLength; ++i) {
	    if (node = group[i]) {
	      keyValues[i] = keyValue = keyPrefix + key.call(node, node.__data__, i, group);
	      if (keyValue in nodeByKeyValue) {
	        exit[i] = node;
	      } else {
	        nodeByKeyValue[keyValue] = node;
	      }
	    }
	  }

	  // Compute the key for each datum.
	  // If there a node associated with this key, join and add it to update.
	  // If there is not (or the key is a duplicate), add it to enter.
	  for (i = 0; i < dataLength; ++i) {
	    keyValue = keyPrefix + key.call(parent, data[i], i, data);
	    if (node = nodeByKeyValue[keyValue]) {
	      update[i] = node;
	      node.__data__ = data[i];
	      nodeByKeyValue[keyValue] = null;
	    } else {
	      enter[i] = new EnterNode(parent, data[i]);
	    }
	  }

	  // Add any remaining nodes that were not bound to data to exit.
	  for (i = 0; i < groupLength; ++i) {
	    if ((node = group[i]) && (nodeByKeyValue[keyValues[i]] === node)) {
	      exit[i] = node;
	    }
	  }
	}

	function selection_data(value, key) {
	  if (!value) {
	    data = new Array(this.size()), j = -1;
	    this.each(function(d) { data[++j] = d; });
	    return data;
	  }

	  var bind = key ? bindKey : bindIndex,
	      parents = this._parents,
	      groups = this._groups;

	  if (typeof value !== "function") value = constant$1(value);

	  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
	    var parent = parents[j],
	        group = groups[j],
	        groupLength = group.length,
	        data = value.call(parent, parent && parent.__data__, j, parents),
	        dataLength = data.length,
	        enterGroup = enter[j] = new Array(dataLength),
	        updateGroup = update[j] = new Array(dataLength),
	        exitGroup = exit[j] = new Array(groupLength);

	    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

	    // Now connect the enter nodes to their following update node, such that
	    // appendChild can insert the materialized enter node before this node,
	    // rather than at the end of the parent node.
	    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
	      if (previous = enterGroup[i0]) {
	        if (i0 >= i1) i1 = i0 + 1;
	        while (!(next = updateGroup[i1]) && ++i1 < dataLength);
	        previous._next = next || null;
	      }
	    }
	  }

	  update = new Selection(update, parents);
	  update._enter = enter;
	  update._exit = exit;
	  return update;
	}

	function selection_exit() {
	  return new Selection(this._exit || this._groups.map(sparse), this._parents);
	}

	function selection_merge(selection$$1) {

	  for (var groups0 = this._groups, groups1 = selection$$1._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
	    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
	      if (node = group0[i] || group1[i]) {
	        merge[i] = node;
	      }
	    }
	  }

	  for (; j < m0; ++j) {
	    merges[j] = groups0[j];
	  }

	  return new Selection(merges, this._parents);
	}

	function selection_order() {

	  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
	    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
	      if (node = group[i]) {
	        if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
	        next = node;
	      }
	    }
	  }

	  return this;
	}

	function selection_sort(compare) {
	  if (!compare) compare = ascending$1;

	  function compareNode(a, b) {
	    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
	  }

	  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
	      if (node = group[i]) {
	        sortgroup[i] = node;
	      }
	    }
	    sortgroup.sort(compareNode);
	  }

	  return new Selection(sortgroups, this._parents).order();
	}

	function ascending$1(a, b) {
	  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
	}

	function selection_call() {
	  var callback = arguments[0];
	  arguments[0] = this;
	  callback.apply(null, arguments);
	  return this;
	}

	function selection_nodes() {
	  var nodes = new Array(this.size()), i = -1;
	  this.each(function() { nodes[++i] = this; });
	  return nodes;
	}

	function selection_node() {

	  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
	    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
	      var node = group[i];
	      if (node) return node;
	    }
	  }

	  return null;
	}

	function selection_size() {
	  var size = 0;
	  this.each(function() { ++size; });
	  return size;
	}

	function selection_empty() {
	  return !this.node();
	}

	function selection_each(callback) {

	  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
	    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
	      if (node = group[i]) callback.call(node, node.__data__, i, group);
	    }
	  }

	  return this;
	}

	function attrRemove(name) {
	  return function() {
	    this.removeAttribute(name);
	  };
	}

	function attrRemoveNS(fullname) {
	  return function() {
	    this.removeAttributeNS(fullname.space, fullname.local);
	  };
	}

	function attrConstant(name, value) {
	  return function() {
	    this.setAttribute(name, value);
	  };
	}

	function attrConstantNS(fullname, value) {
	  return function() {
	    this.setAttributeNS(fullname.space, fullname.local, value);
	  };
	}

	function attrFunction(name, value) {
	  return function() {
	    var v = value.apply(this, arguments);
	    if (v == null) this.removeAttribute(name);
	    else this.setAttribute(name, v);
	  };
	}

	function attrFunctionNS(fullname, value) {
	  return function() {
	    var v = value.apply(this, arguments);
	    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
	    else this.setAttributeNS(fullname.space, fullname.local, v);
	  };
	}

	function selection_attr(name, value) {
	  var fullname = namespace(name);

	  if (arguments.length < 2) {
	    var node = this.node();
	    return fullname.local
	        ? node.getAttributeNS(fullname.space, fullname.local)
	        : node.getAttribute(fullname);
	  }

	  return this.each((value == null
	      ? (fullname.local ? attrRemoveNS : attrRemove) : (typeof value === "function"
	      ? (fullname.local ? attrFunctionNS : attrFunction)
	      : (fullname.local ? attrConstantNS : attrConstant)))(fullname, value));
	}

	function window$1(node) {
	  return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
	      || (node.document && node) // node is a Window
	      || node.defaultView; // node is a Document
	}

	function styleRemove(name) {
	  return function() {
	    this.style.removeProperty(name);
	  };
	}

	function styleConstant(name, value, priority) {
	  return function() {
	    this.style.setProperty(name, value, priority);
	  };
	}

	function styleFunction(name, value, priority) {
	  return function() {
	    var v = value.apply(this, arguments);
	    if (v == null) this.style.removeProperty(name);
	    else this.style.setProperty(name, v, priority);
	  };
	}

	function selection_style(name, value, priority) {
	  var node;
	  return arguments.length > 1
	      ? this.each((value == null
	            ? styleRemove : typeof value === "function"
	            ? styleFunction
	            : styleConstant)(name, value, priority == null ? "" : priority))
	      : window$1(node = this.node())
	          .getComputedStyle(node, null)
	          .getPropertyValue(name);
	}

	function propertyRemove(name) {
	  return function() {
	    delete this[name];
	  };
	}

	function propertyConstant(name, value) {
	  return function() {
	    this[name] = value;
	  };
	}

	function propertyFunction(name, value) {
	  return function() {
	    var v = value.apply(this, arguments);
	    if (v == null) delete this[name];
	    else this[name] = v;
	  };
	}

	function selection_property(name, value) {
	  return arguments.length > 1
	      ? this.each((value == null
	          ? propertyRemove : typeof value === "function"
	          ? propertyFunction
	          : propertyConstant)(name, value))
	      : this.node()[name];
	}

	function classArray(string) {
	  return string.trim().split(/^|\s+/);
	}

	function classList(node) {
	  return node.classList || new ClassList(node);
	}

	function ClassList(node) {
	  this._node = node;
	  this._names = classArray(node.getAttribute("class") || "");
	}

	ClassList.prototype = {
	  add: function(name) {
	    var i = this._names.indexOf(name);
	    if (i < 0) {
	      this._names.push(name);
	      this._node.setAttribute("class", this._names.join(" "));
	    }
	  },
	  remove: function(name) {
	    var i = this._names.indexOf(name);
	    if (i >= 0) {
	      this._names.splice(i, 1);
	      this._node.setAttribute("class", this._names.join(" "));
	    }
	  },
	  contains: function(name) {
	    return this._names.indexOf(name) >= 0;
	  }
	};

	function classedAdd(node, names) {
	  var list = classList(node), i = -1, n = names.length;
	  while (++i < n) list.add(names[i]);
	}

	function classedRemove(node, names) {
	  var list = classList(node), i = -1, n = names.length;
	  while (++i < n) list.remove(names[i]);
	}

	function classedTrue(names) {
	  return function() {
	    classedAdd(this, names);
	  };
	}

	function classedFalse(names) {
	  return function() {
	    classedRemove(this, names);
	  };
	}

	function classedFunction(names, value) {
	  return function() {
	    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
	  };
	}

	function selection_classed(name, value) {
	  var names = classArray(name + "");

	  if (arguments.length < 2) {
	    var list = classList(this.node()), i = -1, n = names.length;
	    while (++i < n) if (!list.contains(names[i])) return false;
	    return true;
	  }

	  return this.each((typeof value === "function"
	      ? classedFunction : value
	      ? classedTrue
	      : classedFalse)(names, value));
	}

	function textRemove() {
	  this.textContent = "";
	}

	function textConstant(value) {
	  return function() {
	    this.textContent = value;
	  };
	}

	function textFunction(value) {
	  return function() {
	    var v = value.apply(this, arguments);
	    this.textContent = v == null ? "" : v;
	  };
	}

	function selection_text(value) {
	  return arguments.length
	      ? this.each(value == null
	          ? textRemove : (typeof value === "function"
	          ? textFunction
	          : textConstant)(value))
	      : this.node().textContent;
	}

	function htmlRemove() {
	  this.innerHTML = "";
	}

	function htmlConstant(value) {
	  return function() {
	    this.innerHTML = value;
	  };
	}

	function htmlFunction(value) {
	  return function() {
	    var v = value.apply(this, arguments);
	    this.innerHTML = v == null ? "" : v;
	  };
	}

	function selection_html(value) {
	  return arguments.length
	      ? this.each(value == null
	          ? htmlRemove : (typeof value === "function"
	          ? htmlFunction
	          : htmlConstant)(value))
	      : this.node().innerHTML;
	}

	function raise() {
	  if (this.nextSibling) this.parentNode.appendChild(this);
	}

	function selection_raise() {
	  return this.each(raise);
	}

	function lower() {
	  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
	}

	function selection_lower() {
	  return this.each(lower);
	}

	function selection_append(name) {
	  var create = typeof name === "function" ? name : creator(name);
	  return this.select(function() {
	    return this.appendChild(create.apply(this, arguments));
	  });
	}

	function constantNull() {
	  return null;
	}

	function selection_insert(name, before) {
	  var create = typeof name === "function" ? name : creator(name),
	      select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
	  return this.select(function() {
	    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
	  });
	}

	function remove() {
	  var parent = this.parentNode;
	  if (parent) parent.removeChild(this);
	}

	function selection_remove() {
	  return this.each(remove);
	}

	function selection_datum(value) {
	  return arguments.length
	      ? this.property("__data__", value)
	      : this.node().__data__;
	}

	function dispatchEvent(node, type, params) {
	  var window = window$1(node),
	      event = window.CustomEvent;

	  if (event) {
	    event = new event(type, params);
	  } else {
	    event = window.document.createEvent("Event");
	    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
	    else event.initEvent(type, false, false);
	  }

	  node.dispatchEvent(event);
	}

	function dispatchConstant(type, params) {
	  return function() {
	    return dispatchEvent(this, type, params);
	  };
	}

	function dispatchFunction(type, params) {
	  return function() {
	    return dispatchEvent(this, type, params.apply(this, arguments));
	  };
	}

	function selection_dispatch(type, params) {
	  return this.each((typeof params === "function"
	      ? dispatchFunction
	      : dispatchConstant)(type, params));
	}

	var root = [null];

	function Selection(groups, parents) {
	  this._groups = groups;
	  this._parents = parents;
	}

	function selection() {
	  return new Selection([[document.documentElement]], root);
	}

	Selection.prototype = selection.prototype = {
	  constructor: Selection,
	  select: selection_select,
	  selectAll: selection_selectAll,
	  filter: selection_filter,
	  data: selection_data,
	  enter: selection_enter,
	  exit: selection_exit,
	  merge: selection_merge,
	  order: selection_order,
	  sort: selection_sort,
	  call: selection_call,
	  nodes: selection_nodes,
	  node: selection_node,
	  size: selection_size,
	  empty: selection_empty,
	  each: selection_each,
	  attr: selection_attr,
	  style: selection_style,
	  property: selection_property,
	  classed: selection_classed,
	  text: selection_text,
	  html: selection_html,
	  raise: selection_raise,
	  lower: selection_lower,
	  append: selection_append,
	  insert: selection_insert,
	  remove: selection_remove,
	  datum: selection_datum,
	  on: selection_on,
	  dispatch: selection_dispatch
	};

	function select(selector) {
	  return typeof selector === "string"
	      ? new Selection([[document.querySelector(selector)]], [document.documentElement])
	      : new Selection([[selector]], root);
	}

	function touch(node, touches, identifier) {
	  if (arguments.length < 3) identifier = touches, touches = sourceEvent().changedTouches;

	  for (var i = 0, n = touches ? touches.length : 0, touch; i < n; ++i) {
	    if ((touch = touches[i]).identifier === identifier) {
	      return point(node, touch);
	    }
	  }

	  return null;
	}

	function noevent() {
	  event.preventDefault();
	  event.stopImmediatePropagation();
	}

	function dragDisable(view) {
	  var root = view.document.documentElement,
	      selection$$1 = select(view).on("dragstart.drag", noevent, true);
	  if ("onselectstart" in root) {
	    selection$$1.on("selectstart.drag", noevent, true);
	  } else {
	    root.__noselect = root.style.MozUserSelect;
	    root.style.MozUserSelect = "none";
	  }
	}

	function yesdrag(view, noclick) {
	  var root = view.document.documentElement,
	      selection$$1 = select(view).on("dragstart.drag", null);
	  if (noclick) {
	    selection$$1.on("click.drag", noevent, true);
	    setTimeout(function() { selection$$1.on("click.drag", null); }, 0);
	  }
	  if ("onselectstart" in root) {
	    selection$$1.on("selectstart.drag", null);
	  } else {
	    root.style.MozUserSelect = root.__noselect;
	    delete root.__noselect;
	  }
	}

	function define(constructor, factory, prototype) {
	  constructor.prototype = factory.prototype = prototype;
	  prototype.constructor = constructor;
	}

	function extend(parent, definition) {
	  var prototype = Object.create(parent.prototype);
	  for (var key in definition) prototype[key] = definition[key];
	  return prototype;
	}

	function Color() {}

	var darker = 0.7;
	var brighter = 1 / darker;

	var reI = "\\s*([+-]?\\d+)\\s*",
	    reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*",
	    reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
	    reHex3 = /^#([0-9a-f]{3})$/,
	    reHex6 = /^#([0-9a-f]{6})$/,
	    reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$"),
	    reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$"),
	    reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$"),
	    reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$"),
	    reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$"),
	    reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

	var named = {
	  aliceblue: 0xf0f8ff,
	  antiquewhite: 0xfaebd7,
	  aqua: 0x00ffff,
	  aquamarine: 0x7fffd4,
	  azure: 0xf0ffff,
	  beige: 0xf5f5dc,
	  bisque: 0xffe4c4,
	  black: 0x000000,
	  blanchedalmond: 0xffebcd,
	  blue: 0x0000ff,
	  blueviolet: 0x8a2be2,
	  brown: 0xa52a2a,
	  burlywood: 0xdeb887,
	  cadetblue: 0x5f9ea0,
	  chartreuse: 0x7fff00,
	  chocolate: 0xd2691e,
	  coral: 0xff7f50,
	  cornflowerblue: 0x6495ed,
	  cornsilk: 0xfff8dc,
	  crimson: 0xdc143c,
	  cyan: 0x00ffff,
	  darkblue: 0x00008b,
	  darkcyan: 0x008b8b,
	  darkgoldenrod: 0xb8860b,
	  darkgray: 0xa9a9a9,
	  darkgreen: 0x006400,
	  darkgrey: 0xa9a9a9,
	  darkkhaki: 0xbdb76b,
	  darkmagenta: 0x8b008b,
	  darkolivegreen: 0x556b2f,
	  darkorange: 0xff8c00,
	  darkorchid: 0x9932cc,
	  darkred: 0x8b0000,
	  darksalmon: 0xe9967a,
	  darkseagreen: 0x8fbc8f,
	  darkslateblue: 0x483d8b,
	  darkslategray: 0x2f4f4f,
	  darkslategrey: 0x2f4f4f,
	  darkturquoise: 0x00ced1,
	  darkviolet: 0x9400d3,
	  deeppink: 0xff1493,
	  deepskyblue: 0x00bfff,
	  dimgray: 0x696969,
	  dimgrey: 0x696969,
	  dodgerblue: 0x1e90ff,
	  firebrick: 0xb22222,
	  floralwhite: 0xfffaf0,
	  forestgreen: 0x228b22,
	  fuchsia: 0xff00ff,
	  gainsboro: 0xdcdcdc,
	  ghostwhite: 0xf8f8ff,
	  gold: 0xffd700,
	  goldenrod: 0xdaa520,
	  gray: 0x808080,
	  green: 0x008000,
	  greenyellow: 0xadff2f,
	  grey: 0x808080,
	  honeydew: 0xf0fff0,
	  hotpink: 0xff69b4,
	  indianred: 0xcd5c5c,
	  indigo: 0x4b0082,
	  ivory: 0xfffff0,
	  khaki: 0xf0e68c,
	  lavender: 0xe6e6fa,
	  lavenderblush: 0xfff0f5,
	  lawngreen: 0x7cfc00,
	  lemonchiffon: 0xfffacd,
	  lightblue: 0xadd8e6,
	  lightcoral: 0xf08080,
	  lightcyan: 0xe0ffff,
	  lightgoldenrodyellow: 0xfafad2,
	  lightgray: 0xd3d3d3,
	  lightgreen: 0x90ee90,
	  lightgrey: 0xd3d3d3,
	  lightpink: 0xffb6c1,
	  lightsalmon: 0xffa07a,
	  lightseagreen: 0x20b2aa,
	  lightskyblue: 0x87cefa,
	  lightslategray: 0x778899,
	  lightslategrey: 0x778899,
	  lightsteelblue: 0xb0c4de,
	  lightyellow: 0xffffe0,
	  lime: 0x00ff00,
	  limegreen: 0x32cd32,
	  linen: 0xfaf0e6,
	  magenta: 0xff00ff,
	  maroon: 0x800000,
	  mediumaquamarine: 0x66cdaa,
	  mediumblue: 0x0000cd,
	  mediumorchid: 0xba55d3,
	  mediumpurple: 0x9370db,
	  mediumseagreen: 0x3cb371,
	  mediumslateblue: 0x7b68ee,
	  mediumspringgreen: 0x00fa9a,
	  mediumturquoise: 0x48d1cc,
	  mediumvioletred: 0xc71585,
	  midnightblue: 0x191970,
	  mintcream: 0xf5fffa,
	  mistyrose: 0xffe4e1,
	  moccasin: 0xffe4b5,
	  navajowhite: 0xffdead,
	  navy: 0x000080,
	  oldlace: 0xfdf5e6,
	  olive: 0x808000,
	  olivedrab: 0x6b8e23,
	  orange: 0xffa500,
	  orangered: 0xff4500,
	  orchid: 0xda70d6,
	  palegoldenrod: 0xeee8aa,
	  palegreen: 0x98fb98,
	  paleturquoise: 0xafeeee,
	  palevioletred: 0xdb7093,
	  papayawhip: 0xffefd5,
	  peachpuff: 0xffdab9,
	  peru: 0xcd853f,
	  pink: 0xffc0cb,
	  plum: 0xdda0dd,
	  powderblue: 0xb0e0e6,
	  purple: 0x800080,
	  rebeccapurple: 0x663399,
	  red: 0xff0000,
	  rosybrown: 0xbc8f8f,
	  royalblue: 0x4169e1,
	  saddlebrown: 0x8b4513,
	  salmon: 0xfa8072,
	  sandybrown: 0xf4a460,
	  seagreen: 0x2e8b57,
	  seashell: 0xfff5ee,
	  sienna: 0xa0522d,
	  silver: 0xc0c0c0,
	  skyblue: 0x87ceeb,
	  slateblue: 0x6a5acd,
	  slategray: 0x708090,
	  slategrey: 0x708090,
	  snow: 0xfffafa,
	  springgreen: 0x00ff7f,
	  steelblue: 0x4682b4,
	  tan: 0xd2b48c,
	  teal: 0x008080,
	  thistle: 0xd8bfd8,
	  tomato: 0xff6347,
	  turquoise: 0x40e0d0,
	  violet: 0xee82ee,
	  wheat: 0xf5deb3,
	  white: 0xffffff,
	  whitesmoke: 0xf5f5f5,
	  yellow: 0xffff00,
	  yellowgreen: 0x9acd32
	};

	define(Color, color, {
	  displayable: function() {
	    return this.rgb().displayable();
	  },
	  toString: function() {
	    return this.rgb() + "";
	  }
	});

	function color(format) {
	  var m;
	  format = (format + "").trim().toLowerCase();
	  return (m = reHex3.exec(format)) ? (m = parseInt(m[1], 16), new Rgb((m >> 8 & 0xf) | (m >> 4 & 0x0f0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1)) // #f00
	      : (m = reHex6.exec(format)) ? rgbn(parseInt(m[1], 16)) // #ff0000
	      : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
	      : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
	      : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
	      : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
	      : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
	      : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
	      : named.hasOwnProperty(format) ? rgbn(named[format])
	      : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
	      : null;
	}

	function rgbn(n) {
	  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
	}

	function rgba(r, g, b, a) {
	  if (a <= 0) r = g = b = NaN;
	  return new Rgb(r, g, b, a);
	}

	function rgbConvert(o) {
	  if (!(o instanceof Color)) o = color(o);
	  if (!o) return new Rgb;
	  o = o.rgb();
	  return new Rgb(o.r, o.g, o.b, o.opacity);
	}

	function rgb(r, g, b, opacity) {
	  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
	}

	function Rgb(r, g, b, opacity) {
	  this.r = +r;
	  this.g = +g;
	  this.b = +b;
	  this.opacity = +opacity;
	}

	define(Rgb, rgb, extend(Color, {
	  brighter: function(k) {
	    k = k == null ? brighter : Math.pow(brighter, k);
	    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
	  },
	  darker: function(k) {
	    k = k == null ? darker : Math.pow(darker, k);
	    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
	  },
	  rgb: function() {
	    return this;
	  },
	  displayable: function() {
	    return (0 <= this.r && this.r <= 255)
	        && (0 <= this.g && this.g <= 255)
	        && (0 <= this.b && this.b <= 255)
	        && (0 <= this.opacity && this.opacity <= 1);
	  },
	  toString: function() {
	    var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
	    return (a === 1 ? "rgb(" : "rgba(")
	        + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
	        + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
	        + Math.max(0, Math.min(255, Math.round(this.b) || 0))
	        + (a === 1 ? ")" : ", " + a + ")");
	  }
	}));

	function hsla(h, s, l, a) {
	  if (a <= 0) h = s = l = NaN;
	  else if (l <= 0 || l >= 1) h = s = NaN;
	  else if (s <= 0) h = NaN;
	  return new Hsl(h, s, l, a);
	}

	function hslConvert(o) {
	  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
	  if (!(o instanceof Color)) o = color(o);
	  if (!o) return new Hsl;
	  if (o instanceof Hsl) return o;
	  o = o.rgb();
	  var r = o.r / 255,
	      g = o.g / 255,
	      b = o.b / 255,
	      min = Math.min(r, g, b),
	      max = Math.max(r, g, b),
	      h = NaN,
	      s = max - min,
	      l = (max + min) / 2;
	  if (s) {
	    if (r === max) h = (g - b) / s + (g < b) * 6;
	    else if (g === max) h = (b - r) / s + 2;
	    else h = (r - g) / s + 4;
	    s /= l < 0.5 ? max + min : 2 - max - min;
	    h *= 60;
	  } else {
	    s = l > 0 && l < 1 ? 0 : h;
	  }
	  return new Hsl(h, s, l, o.opacity);
	}

	function hsl(h, s, l, opacity) {
	  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
	}

	function Hsl(h, s, l, opacity) {
	  this.h = +h;
	  this.s = +s;
	  this.l = +l;
	  this.opacity = +opacity;
	}

	define(Hsl, hsl, extend(Color, {
	  brighter: function(k) {
	    k = k == null ? brighter : Math.pow(brighter, k);
	    return new Hsl(this.h, this.s, this.l * k, this.opacity);
	  },
	  darker: function(k) {
	    k = k == null ? darker : Math.pow(darker, k);
	    return new Hsl(this.h, this.s, this.l * k, this.opacity);
	  },
	  rgb: function() {
	    var h = this.h % 360 + (this.h < 0) * 360,
	        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
	        l = this.l,
	        m2 = l + (l < 0.5 ? l : 1 - l) * s,
	        m1 = 2 * l - m2;
	    return new Rgb(
	      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
	      hsl2rgb(h, m1, m2),
	      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
	      this.opacity
	    );
	  },
	  displayable: function() {
	    return (0 <= this.s && this.s <= 1 || isNaN(this.s))
	        && (0 <= this.l && this.l <= 1)
	        && (0 <= this.opacity && this.opacity <= 1);
	  }
	}));

	/* From FvD 13.37, CSS Color Module Level 3 */
	function hsl2rgb(h, m1, m2) {
	  return (h < 60 ? m1 + (m2 - m1) * h / 60
	      : h < 180 ? m2
	      : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
	      : m1) * 255;
	}

	var deg2rad = Math.PI / 180;
	var rad2deg = 180 / Math.PI;

	var Kn = 18,
	    Xn = 0.950470, // D65 standard referent
	    Yn = 1,
	    Zn = 1.088830,
	    t0 = 4 / 29,
	    t1 = 6 / 29,
	    t2 = 3 * t1 * t1,
	    t3 = t1 * t1 * t1;

	function labConvert(o) {
	  if (o instanceof Lab) return new Lab(o.l, o.a, o.b, o.opacity);
	  if (o instanceof Hcl) {
	    var h = o.h * deg2rad;
	    return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
	  }
	  if (!(o instanceof Rgb)) o = rgbConvert(o);
	  var b = rgb2xyz(o.r),
	      a = rgb2xyz(o.g),
	      l = rgb2xyz(o.b),
	      x = xyz2lab((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn),
	      y = xyz2lab((0.2126729 * b + 0.7151522 * a + 0.0721750 * l) / Yn),
	      z = xyz2lab((0.0193339 * b + 0.1191920 * a + 0.9503041 * l) / Zn);
	  return new Lab(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
	}

	function lab(l, a, b, opacity) {
	  return arguments.length === 1 ? labConvert(l) : new Lab(l, a, b, opacity == null ? 1 : opacity);
	}

	function Lab(l, a, b, opacity) {
	  this.l = +l;
	  this.a = +a;
	  this.b = +b;
	  this.opacity = +opacity;
	}

	define(Lab, lab, extend(Color, {
	  brighter: function(k) {
	    return new Lab(this.l + Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
	  },
	  darker: function(k) {
	    return new Lab(this.l - Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
	  },
	  rgb: function() {
	    var y = (this.l + 16) / 116,
	        x = isNaN(this.a) ? y : y + this.a / 500,
	        z = isNaN(this.b) ? y : y - this.b / 200;
	    y = Yn * lab2xyz(y);
	    x = Xn * lab2xyz(x);
	    z = Zn * lab2xyz(z);
	    return new Rgb(
	      xyz2rgb( 3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
	      xyz2rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z),
	      xyz2rgb( 0.0556434 * x - 0.2040259 * y + 1.0572252 * z),
	      this.opacity
	    );
	  }
	}));

	function xyz2lab(t) {
	  return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
	}

	function lab2xyz(t) {
	  return t > t1 ? t * t * t : t2 * (t - t0);
	}

	function xyz2rgb(x) {
	  return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
	}

	function rgb2xyz(x) {
	  return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
	}

	function hclConvert(o) {
	  if (o instanceof Hcl) return new Hcl(o.h, o.c, o.l, o.opacity);
	  if (!(o instanceof Lab)) o = labConvert(o);
	  var h = Math.atan2(o.b, o.a) * rad2deg;
	  return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
	}

	function hcl(h, c, l, opacity) {
	  return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c, l, opacity == null ? 1 : opacity);
	}

	function Hcl(h, c, l, opacity) {
	  this.h = +h;
	  this.c = +c;
	  this.l = +l;
	  this.opacity = +opacity;
	}

	define(Hcl, hcl, extend(Color, {
	  brighter: function(k) {
	    return new Hcl(this.h, this.c, this.l + Kn * (k == null ? 1 : k), this.opacity);
	  },
	  darker: function(k) {
	    return new Hcl(this.h, this.c, this.l - Kn * (k == null ? 1 : k), this.opacity);
	  },
	  rgb: function() {
	    return labConvert(this).rgb();
	  }
	}));

	var A = -0.14861,
	    B = +1.78277,
	    C = -0.29227,
	    D = -0.90649,
	    E = +1.97294,
	    ED = E * D,
	    EB = E * B,
	    BC_DA = B * C - D * A;

	function cubehelixConvert(o) {
	  if (o instanceof Cubehelix) return new Cubehelix(o.h, o.s, o.l, o.opacity);
	  if (!(o instanceof Rgb)) o = rgbConvert(o);
	  var r = o.r / 255,
	      g = o.g / 255,
	      b = o.b / 255,
	      l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB),
	      bl = b - l,
	      k = (E * (g - l) - C * bl) / D,
	      s = Math.sqrt(k * k + bl * bl) / (E * l * (1 - l)), // NaN if l=0 or l=1
	      h = s ? Math.atan2(k, bl) * rad2deg - 120 : NaN;
	  return new Cubehelix(h < 0 ? h + 360 : h, s, l, o.opacity);
	}

	function cubehelix(h, s, l, opacity) {
	  return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s, l, opacity == null ? 1 : opacity);
	}

	function Cubehelix(h, s, l, opacity) {
	  this.h = +h;
	  this.s = +s;
	  this.l = +l;
	  this.opacity = +opacity;
	}

	define(Cubehelix, cubehelix, extend(Color, {
	  brighter: function(k) {
	    k = k == null ? brighter : Math.pow(brighter, k);
	    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
	  },
	  darker: function(k) {
	    k = k == null ? darker : Math.pow(darker, k);
	    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
	  },
	  rgb: function() {
	    var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad,
	        l = +this.l,
	        a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
	        cosh = Math.cos(h),
	        sinh = Math.sin(h);
	    return new Rgb(
	      255 * (l + a * (A * cosh + B * sinh)),
	      255 * (l + a * (C * cosh + D * sinh)),
	      255 * (l + a * (E * cosh)),
	      this.opacity
	    );
	  }
	}));

	function basis(t1, v0, v1, v2, v3) {
	  var t2 = t1 * t1, t3 = t2 * t1;
	  return ((1 - 3 * t1 + 3 * t2 - t3) * v0
	      + (4 - 6 * t2 + 3 * t3) * v1
	      + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2
	      + t3 * v3) / 6;
	}

	function basis$1(values) {
	  var n = values.length - 1;
	  return function(t) {
	    var i = t <= 0 ? (t = 0) : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n),
	        v1 = values[i],
	        v2 = values[i + 1],
	        v0 = i > 0 ? values[i - 1] : 2 * v1 - v2,
	        v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
	    return basis((t - i / n) * n, v0, v1, v2, v3);
	  };
	}

	function constant$3(x) {
	  return function() {
	    return x;
	  };
	}

	function linear(a, d) {
	  return function(t) {
	    return a + t * d;
	  };
	}

	function exponential(a, b, y) {
	  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
	    return Math.pow(a + t * b, y);
	  };
	}

	function hue(a, b) {
	  var d = b - a;
	  return d ? linear(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant$3(isNaN(a) ? b : a);
	}

	function gamma(y) {
	  return (y = +y) === 1 ? nogamma : function(a, b) {
	    return b - a ? exponential(a, b, y) : constant$3(isNaN(a) ? b : a);
	  };
	}

	function nogamma(a, b) {
	  var d = b - a;
	  return d ? linear(a, d) : constant$3(isNaN(a) ? b : a);
	}

	var interpolateRgb = (function rgbGamma(y) {
	  var color$$1 = gamma(y);

	  function rgb$$1(start, end) {
	    var r = color$$1((start = rgb(start)).r, (end = rgb(end)).r),
	        g = color$$1(start.g, end.g),
	        b = color$$1(start.b, end.b),
	        opacity = nogamma(start.opacity, end.opacity);
	    return function(t) {
	      start.r = r(t);
	      start.g = g(t);
	      start.b = b(t);
	      start.opacity = opacity(t);
	      return start + "";
	    };
	  }

	  rgb$$1.gamma = rgbGamma;

	  return rgb$$1;
	})(1);

	function rgbSpline(spline) {
	  return function(colors) {
	    var n = colors.length,
	        r = new Array(n),
	        g = new Array(n),
	        b = new Array(n),
	        i, color$$1;
	    for (i = 0; i < n; ++i) {
	      color$$1 = rgb(colors[i]);
	      r[i] = color$$1.r || 0;
	      g[i] = color$$1.g || 0;
	      b[i] = color$$1.b || 0;
	    }
	    r = spline(r);
	    g = spline(g);
	    b = spline(b);
	    color$$1.opacity = 1;
	    return function(t) {
	      color$$1.r = r(t);
	      color$$1.g = g(t);
	      color$$1.b = b(t);
	      return color$$1 + "";
	    };
	  };
	}

	var rgbBasis = rgbSpline(basis$1);

	function array$1(a, b) {
	  var nb = b ? b.length : 0,
	      na = a ? Math.min(nb, a.length) : 0,
	      x = new Array(nb),
	      c = new Array(nb),
	      i;

	  for (i = 0; i < na; ++i) x[i] = interpolateValue(a[i], b[i]);
	  for (; i < nb; ++i) c[i] = b[i];

	  return function(t) {
	    for (i = 0; i < na; ++i) c[i] = x[i](t);
	    return c;
	  };
	}

	function date(a, b) {
	  var d = new Date;
	  return a = +a, b -= a, function(t) {
	    return d.setTime(a + b * t), d;
	  };
	}

	function interpolateNumber(a, b) {
	  return a = +a, b -= a, function(t) {
	    return a + b * t;
	  };
	}

	function object(a, b) {
	  var i = {},
	      c = {},
	      k;

	  if (a === null || typeof a !== "object") a = {};
	  if (b === null || typeof b !== "object") b = {};

	  for (k in b) {
	    if (k in a) {
	      i[k] = interpolateValue(a[k], b[k]);
	    } else {
	      c[k] = b[k];
	    }
	  }

	  return function(t) {
	    for (k in i) c[k] = i[k](t);
	    return c;
	  };
	}

	var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
	    reB = new RegExp(reA.source, "g");

	function zero(b) {
	  return function() {
	    return b;
	  };
	}

	function one(b) {
	  return function(t) {
	    return b(t) + "";
	  };
	}

	function interpolateString(a, b) {
	  var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
	      am, // current match in a
	      bm, // current match in b
	      bs, // string preceding current number in b, if any
	      i = -1, // index in s
	      s = [], // string constants and placeholders
	      q = []; // number interpolators

	  // Coerce inputs to strings.
	  a = a + "", b = b + "";

	  // Interpolate pairs of numbers in a & b.
	  while ((am = reA.exec(a))
	      && (bm = reB.exec(b))) {
	    if ((bs = bm.index) > bi) { // a string precedes the next number in b
	      bs = b.slice(bi, bs);
	      if (s[i]) s[i] += bs; // coalesce with previous string
	      else s[++i] = bs;
	    }
	    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
	      if (s[i]) s[i] += bm; // coalesce with previous string
	      else s[++i] = bm;
	    } else { // interpolate non-matching numbers
	      s[++i] = null;
	      q.push({i: i, x: interpolateNumber(am, bm)});
	    }
	    bi = reB.lastIndex;
	  }

	  // Add remains of b.
	  if (bi < b.length) {
	    bs = b.slice(bi);
	    if (s[i]) s[i] += bs; // coalesce with previous string
	    else s[++i] = bs;
	  }

	  // Special optimization for only a single match.
	  // Otherwise, interpolate each of the numbers and rejoin the string.
	  return s.length < 2 ? (q[0]
	      ? one(q[0].x)
	      : zero(b))
	      : (b = q.length, function(t) {
	          for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
	          return s.join("");
	        });
	}

	function interpolateValue(a, b) {
	  var t = typeof b, c;
	  return b == null || t === "boolean" ? constant$3(b)
	      : (t === "number" ? interpolateNumber
	      : t === "string" ? ((c = color(b)) ? (b = c, interpolateRgb) : interpolateString)
	      : b instanceof color ? interpolateRgb
	      : b instanceof Date ? date
	      : Array.isArray(b) ? array$1
	      : isNaN(b) ? object
	      : interpolateNumber)(a, b);
	}

	function interpolateRound(a, b) {
	  return a = +a, b -= a, function(t) {
	    return Math.round(a + b * t);
	  };
	}

	var degrees = 180 / Math.PI;

	var identity$2 = {
	  translateX: 0,
	  translateY: 0,
	  rotate: 0,
	  skewX: 0,
	  scaleX: 1,
	  scaleY: 1
	};

	function decompose(a, b, c, d, e, f) {
	  var scaleX, scaleY, skewX;
	  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
	  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
	  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
	  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
	  return {
	    translateX: e,
	    translateY: f,
	    rotate: Math.atan2(b, a) * degrees,
	    skewX: Math.atan(skewX) * degrees,
	    scaleX: scaleX,
	    scaleY: scaleY
	  };
	}

	var cssNode,
	    cssRoot,
	    cssView,
	    svgNode;

	function parseCss(value) {
	  if (value === "none") return identity$2;
	  if (!cssNode) cssNode = document.createElement("DIV"), cssRoot = document.documentElement, cssView = document.defaultView;
	  cssNode.style.transform = value;
	  value = cssView.getComputedStyle(cssRoot.appendChild(cssNode), null).getPropertyValue("transform");
	  cssRoot.removeChild(cssNode);
	  value = value.slice(7, -1).split(",");
	  return decompose(+value[0], +value[1], +value[2], +value[3], +value[4], +value[5]);
	}

	function parseSvg(value) {
	  if (value == null) return identity$2;
	  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
	  svgNode.setAttribute("transform", value);
	  if (!(value = svgNode.transform.baseVal.consolidate())) return identity$2;
	  value = value.matrix;
	  return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
	}

	function interpolateTransform(parse, pxComma, pxParen, degParen) {

	  function pop(s) {
	    return s.length ? s.pop() + " " : "";
	  }

	  function translate(xa, ya, xb, yb, s, q) {
	    if (xa !== xb || ya !== yb) {
	      var i = s.push("translate(", null, pxComma, null, pxParen);
	      q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
	    } else if (xb || yb) {
	      s.push("translate(" + xb + pxComma + yb + pxParen);
	    }
	  }

	  function rotate(a, b, s, q) {
	    if (a !== b) {
	      if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
	      q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b)});
	    } else if (b) {
	      s.push(pop(s) + "rotate(" + b + degParen);
	    }
	  }

	  function skewX(a, b, s, q) {
	    if (a !== b) {
	      q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b)});
	    } else if (b) {
	      s.push(pop(s) + "skewX(" + b + degParen);
	    }
	  }

	  function scale(xa, ya, xb, yb, s, q) {
	    if (xa !== xb || ya !== yb) {
	      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
	      q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
	    } else if (xb !== 1 || yb !== 1) {
	      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
	    }
	  }

	  return function(a, b) {
	    var s = [], // string constants and placeholders
	        q = []; // number interpolators
	    a = parse(a), b = parse(b);
	    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
	    rotate(a.rotate, b.rotate, s, q);
	    skewX(a.skewX, b.skewX, s, q);
	    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
	    a = b = null; // gc
	    return function(t) {
	      var i = -1, n = q.length, o;
	      while (++i < n) s[(o = q[i]).i] = o.x(t);
	      return s.join("");
	    };
	  };
	}

	var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
	var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

	var rho = Math.SQRT2,
	    rho2 = 2,
	    rho4 = 4,
	    epsilon2 = 1e-12;

	function cosh(x) {
	  return ((x = Math.exp(x)) + 1 / x) / 2;
	}

	function sinh(x) {
	  return ((x = Math.exp(x)) - 1 / x) / 2;
	}

	function tanh(x) {
	  return ((x = Math.exp(2 * x)) - 1) / (x + 1);
	}

	// p0 = [ux0, uy0, w0]
	// p1 = [ux1, uy1, w1]
	function interpolateZoom(p0, p1) {
	  var ux0 = p0[0], uy0 = p0[1], w0 = p0[2],
	      ux1 = p1[0], uy1 = p1[1], w1 = p1[2],
	      dx = ux1 - ux0,
	      dy = uy1 - uy0,
	      d2 = dx * dx + dy * dy,
	      i,
	      S;

	  // Special case for u0 ≅ u1.
	  if (d2 < epsilon2) {
	    S = Math.log(w1 / w0) / rho;
	    i = function(t) {
	      return [
	        ux0 + t * dx,
	        uy0 + t * dy,
	        w0 * Math.exp(rho * t * S)
	      ];
	    };
	  }

	  // General case.
	  else {
	    var d1 = Math.sqrt(d2),
	        b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1),
	        b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1),
	        r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0),
	        r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
	    S = (r1 - r0) / rho;
	    i = function(t) {
	      var s = t * S,
	          coshr0 = cosh(r0),
	          u = w0 / (rho2 * d1) * (coshr0 * tanh(rho * s + r0) - sinh(r0));
	      return [
	        ux0 + u * dx,
	        uy0 + u * dy,
	        w0 * coshr0 / cosh(rho * s + r0)
	      ];
	    };
	  }

	  i.duration = S * 1000;

	  return i;
	}

	function cubehelix$1(hue$$1) {
	  return (function cubehelixGamma(y) {
	    y = +y;

	    function cubehelix$$1(start, end) {
	      var h = hue$$1((start = cubehelix(start)).h, (end = cubehelix(end)).h),
	          s = nogamma(start.s, end.s),
	          l = nogamma(start.l, end.l),
	          opacity = nogamma(start.opacity, end.opacity);
	      return function(t) {
	        start.h = h(t);
	        start.s = s(t);
	        start.l = l(Math.pow(t, y));
	        start.opacity = opacity(t);
	        return start + "";
	      };
	    }

	    cubehelix$$1.gamma = cubehelixGamma;

	    return cubehelix$$1;
	  })(1);
	}

	cubehelix$1(hue);
	var cubehelixLong = cubehelix$1(nogamma);

	var frame = 0, // is an animation frame pending?
	    timeout = 0, // is a timeout pending?
	    interval = 0, // are any timers active?
	    pokeDelay = 1000, // how frequently we check for clock skew
	    taskHead,
	    taskTail,
	    clockLast = 0,
	    clockNow = 0,
	    clockSkew = 0,
	    clock = typeof performance === "object" && performance.now ? performance : Date,
	    setFrame = typeof requestAnimationFrame === "function" ? requestAnimationFrame : function(f) { setTimeout(f, 17); };

	function now() {
	  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
	}

	function clearNow() {
	  clockNow = 0;
	}

	function Timer() {
	  this._call =
	  this._time =
	  this._next = null;
	}

	Timer.prototype = timer.prototype = {
	  constructor: Timer,
	  restart: function(callback, delay, time) {
	    if (typeof callback !== "function") throw new TypeError("callback is not a function");
	    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
	    if (!this._next && taskTail !== this) {
	      if (taskTail) taskTail._next = this;
	      else taskHead = this;
	      taskTail = this;
	    }
	    this._call = callback;
	    this._time = time;
	    sleep();
	  },
	  stop: function() {
	    if (this._call) {
	      this._call = null;
	      this._time = Infinity;
	      sleep();
	    }
	  }
	};

	function timer(callback, delay, time) {
	  var t = new Timer;
	  t.restart(callback, delay, time);
	  return t;
	}

	function timerFlush() {
	  now(); // Get the current time, if not already set.
	  ++frame; // Pretend we’ve set an alarm, if we haven’t already.
	  var t = taskHead, e;
	  while (t) {
	    if ((e = clockNow - t._time) >= 0) t._call.call(null, e);
	    t = t._next;
	  }
	  --frame;
	}

	function wake() {
	  clockNow = (clockLast = clock.now()) + clockSkew;
	  frame = timeout = 0;
	  try {
	    timerFlush();
	  } finally {
	    frame = 0;
	    nap();
	    clockNow = 0;
	  }
	}

	function poke() {
	  var now = clock.now(), delay = now - clockLast;
	  if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
	}

	function nap() {
	  var t0, t1 = taskHead, t2, time = Infinity;
	  while (t1) {
	    if (t1._call) {
	      if (time > t1._time) time = t1._time;
	      t0 = t1, t1 = t1._next;
	    } else {
	      t2 = t1._next, t1._next = null;
	      t1 = t0 ? t0._next = t2 : taskHead = t2;
	    }
	  }
	  taskTail = t0;
	  sleep(time);
	}

	function sleep(time) {
	  if (frame) return; // Soonest alarm already set, or will be.
	  if (timeout) timeout = clearTimeout(timeout);
	  var delay = time - clockNow;
	  if (delay > 24) {
	    if (time < Infinity) timeout = setTimeout(wake, delay);
	    if (interval) interval = clearInterval(interval);
	  } else {
	    if (!interval) clockLast = clockNow, interval = setInterval(poke, pokeDelay);
	    frame = 1, setFrame(wake);
	  }
	}

	function timeout$1(callback, delay, time) {
	  var t = new Timer;
	  delay = delay == null ? 0 : +delay;
	  t.restart(function(elapsed) {
	    t.stop();
	    callback(elapsed + delay);
	  }, delay, time);
	  return t;
	}

	var emptyOn = dispatch("start", "end", "interrupt");
	var emptyTween = [];

	var CREATED = 0;
	var SCHEDULED = 1;
	var STARTING = 2;
	var STARTED = 3;
	var RUNNING = 4;
	var ENDING = 5;
	var ENDED = 6;

	function schedule(node, name, id, index, group, timing) {
	  var schedules = node.__transition;
	  if (!schedules) node.__transition = {};
	  else if (id in schedules) return;
	  create(node, id, {
	    name: name,
	    index: index, // For context during callback.
	    group: group, // For context during callback.
	    on: emptyOn,
	    tween: emptyTween,
	    time: timing.time,
	    delay: timing.delay,
	    duration: timing.duration,
	    ease: timing.ease,
	    timer: null,
	    state: CREATED
	  });
	}

	function init(node, id) {
	  var schedule = node.__transition;
	  if (!schedule || !(schedule = schedule[id]) || schedule.state > CREATED) throw new Error("too late");
	  return schedule;
	}

	function set$1(node, id) {
	  var schedule = node.__transition;
	  if (!schedule || !(schedule = schedule[id]) || schedule.state > STARTING) throw new Error("too late");
	  return schedule;
	}

	function get$2(node, id) {
	  var schedule = node.__transition;
	  if (!schedule || !(schedule = schedule[id])) throw new Error("too late");
	  return schedule;
	}

	function create(node, id, self) {
	  var schedules = node.__transition,
	      tween;

	  // Initialize the self timer when the transition is created.
	  // Note the actual delay is not known until the first callback!
	  schedules[id] = self;
	  self.timer = timer(schedule, 0, self.time);

	  function schedule(elapsed) {
	    self.state = SCHEDULED;
	    self.timer.restart(start, self.delay, self.time);

	    // If the elapsed delay is less than our first sleep, start immediately.
	    if (self.delay <= elapsed) start(elapsed - self.delay);
	  }

	  function start(elapsed) {
	    var i, j, n, o;

	    // If the state is not SCHEDULED, then we previously errored on start.
	    if (self.state !== SCHEDULED) return stop();

	    for (i in schedules) {
	      o = schedules[i];
	      if (o.name !== self.name) continue;

	      // While this element already has a starting transition during this frame,
	      // defer starting an interrupting transition until that transition has a
	      // chance to tick (and possibly end); see d3/d3-transition#54!
	      if (o.state === STARTED) return timeout$1(start);

	      // Interrupt the active transition, if any.
	      // Dispatch the interrupt event.
	      if (o.state === RUNNING) {
	        o.state = ENDED;
	        o.timer.stop();
	        o.on.call("interrupt", node, node.__data__, o.index, o.group);
	        delete schedules[i];
	      }

	      // Cancel any pre-empted transitions. No interrupt event is dispatched
	      // because the cancelled transitions never started. Note that this also
	      // removes this transition from the pending list!
	      else if (+i < id) {
	        o.state = ENDED;
	        o.timer.stop();
	        delete schedules[i];
	      }
	    }

	    // Defer the first tick to end of the current frame; see d3/d3#1576.
	    // Note the transition may be canceled after start and before the first tick!
	    // Note this must be scheduled before the start event; see d3/d3-transition#16!
	    // Assuming this is successful, subsequent callbacks go straight to tick.
	    timeout$1(function() {
	      if (self.state === STARTED) {
	        self.state = RUNNING;
	        self.timer.restart(tick, self.delay, self.time);
	        tick(elapsed);
	      }
	    });

	    // Dispatch the start event.
	    // Note this must be done before the tween are initialized.
	    self.state = STARTING;
	    self.on.call("start", node, node.__data__, self.index, self.group);
	    if (self.state !== STARTING) return; // interrupted
	    self.state = STARTED;

	    // Initialize the tween, deleting null tween.
	    tween = new Array(n = self.tween.length);
	    for (i = 0, j = -1; i < n; ++i) {
	      if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
	        tween[++j] = o;
	      }
	    }
	    tween.length = j + 1;
	  }

	  function tick(elapsed) {
	    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
	        i = -1,
	        n = tween.length;

	    while (++i < n) {
	      tween[i].call(null, t);
	    }

	    // Dispatch the end event.
	    if (self.state === ENDING) {
	      self.on.call("end", node, node.__data__, self.index, self.group);
	      stop();
	    }
	  }

	  function stop() {
	    self.state = ENDED;
	    self.timer.stop();
	    delete schedules[id];
	    for (var i in schedules) return; // eslint-disable-line no-unused-vars
	    delete node.__transition;
	  }
	}

	function interrupt(node, name) {
	  var schedules = node.__transition,
	      schedule$$1,
	      active,
	      empty = true,
	      i;

	  if (!schedules) return;

	  name = name == null ? null : name + "";

	  for (i in schedules) {
	    if ((schedule$$1 = schedules[i]).name !== name) { empty = false; continue; }
	    active = schedule$$1.state > STARTING && schedule$$1.state < ENDING;
	    schedule$$1.state = ENDED;
	    schedule$$1.timer.stop();
	    if (active) schedule$$1.on.call("interrupt", node, node.__data__, schedule$$1.index, schedule$$1.group);
	    delete schedules[i];
	  }

	  if (empty) delete node.__transition;
	}

	function selection_interrupt(name) {
	  return this.each(function() {
	    interrupt(this, name);
	  });
	}

	function tweenRemove(id, name) {
	  var tween0, tween1;
	  return function() {
	    var schedule$$1 = set$1(this, id),
	        tween = schedule$$1.tween;

	    // If this node shared tween with the previous node,
	    // just assign the updated shared tween and we’re done!
	    // Otherwise, copy-on-write.
	    if (tween !== tween0) {
	      tween1 = tween0 = tween;
	      for (var i = 0, n = tween1.length; i < n; ++i) {
	        if (tween1[i].name === name) {
	          tween1 = tween1.slice();
	          tween1.splice(i, 1);
	          break;
	        }
	      }
	    }

	    schedule$$1.tween = tween1;
	  };
	}

	function tweenFunction(id, name, value) {
	  var tween0, tween1;
	  if (typeof value !== "function") throw new Error;
	  return function() {
	    var schedule$$1 = set$1(this, id),
	        tween = schedule$$1.tween;

	    // If this node shared tween with the previous node,
	    // just assign the updated shared tween and we’re done!
	    // Otherwise, copy-on-write.
	    if (tween !== tween0) {
	      tween1 = (tween0 = tween).slice();
	      for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
	        if (tween1[i].name === name) {
	          tween1[i] = t;
	          break;
	        }
	      }
	      if (i === n) tween1.push(t);
	    }

	    schedule$$1.tween = tween1;
	  };
	}

	function transition_tween(name, value) {
	  var id = this._id;

	  name += "";

	  if (arguments.length < 2) {
	    var tween = get$2(this.node(), id).tween;
	    for (var i = 0, n = tween.length, t; i < n; ++i) {
	      if ((t = tween[i]).name === name) {
	        return t.value;
	      }
	    }
	    return null;
	  }

	  return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
	}

	function tweenValue(transition, name, value) {
	  var id = transition._id;

	  transition.each(function() {
	    var schedule$$1 = set$1(this, id);
	    (schedule$$1.value || (schedule$$1.value = {}))[name] = value.apply(this, arguments);
	  });

	  return function(node) {
	    return get$2(node, id).value[name];
	  };
	}

	function interpolate(a, b) {
	  var c;
	  return (typeof b === "number" ? interpolateNumber
	      : b instanceof color ? interpolateRgb
	      : (c = color(b)) ? (b = c, interpolateRgb)
	      : interpolateString)(a, b);
	}

	function attrRemove$1(name) {
	  return function() {
	    this.removeAttribute(name);
	  };
	}

	function attrRemoveNS$1(fullname) {
	  return function() {
	    this.removeAttributeNS(fullname.space, fullname.local);
	  };
	}

	function attrConstant$1(name, interpolate$$1, value1) {
	  var value00,
	      interpolate0;
	  return function() {
	    var value0 = this.getAttribute(name);
	    return value0 === value1 ? null
	        : value0 === value00 ? interpolate0
	        : interpolate0 = interpolate$$1(value00 = value0, value1);
	  };
	}

	function attrConstantNS$1(fullname, interpolate$$1, value1) {
	  var value00,
	      interpolate0;
	  return function() {
	    var value0 = this.getAttributeNS(fullname.space, fullname.local);
	    return value0 === value1 ? null
	        : value0 === value00 ? interpolate0
	        : interpolate0 = interpolate$$1(value00 = value0, value1);
	  };
	}

	function attrFunction$1(name, interpolate$$1, value) {
	  var value00,
	      value10,
	      interpolate0;
	  return function() {
	    var value0, value1 = value(this);
	    if (value1 == null) return void this.removeAttribute(name);
	    value0 = this.getAttribute(name);
	    return value0 === value1 ? null
	        : value0 === value00 && value1 === value10 ? interpolate0
	        : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
	  };
	}

	function attrFunctionNS$1(fullname, interpolate$$1, value) {
	  var value00,
	      value10,
	      interpolate0;
	  return function() {
	    var value0, value1 = value(this);
	    if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
	    value0 = this.getAttributeNS(fullname.space, fullname.local);
	    return value0 === value1 ? null
	        : value0 === value00 && value1 === value10 ? interpolate0
	        : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
	  };
	}

	function transition_attr(name, value) {
	  var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate;
	  return this.attrTween(name, typeof value === "function"
	      ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)(fullname, i, tweenValue(this, "attr." + name, value))
	      : value == null ? (fullname.local ? attrRemoveNS$1 : attrRemove$1)(fullname)
	      : (fullname.local ? attrConstantNS$1 : attrConstant$1)(fullname, i, value));
	}

	function attrTweenNS(fullname, value) {
	  function tween() {
	    var node = this, i = value.apply(node, arguments);
	    return i && function(t) {
	      node.setAttributeNS(fullname.space, fullname.local, i(t));
	    };
	  }
	  tween._value = value;
	  return tween;
	}

	function attrTween(name, value) {
	  function tween() {
	    var node = this, i = value.apply(node, arguments);
	    return i && function(t) {
	      node.setAttribute(name, i(t));
	    };
	  }
	  tween._value = value;
	  return tween;
	}

	function transition_attrTween(name, value) {
	  var key = "attr." + name;
	  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
	  if (value == null) return this.tween(key, null);
	  if (typeof value !== "function") throw new Error;
	  var fullname = namespace(name);
	  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
	}

	function delayFunction(id, value) {
	  return function() {
	    init(this, id).delay = +value.apply(this, arguments);
	  };
	}

	function delayConstant(id, value) {
	  return value = +value, function() {
	    init(this, id).delay = value;
	  };
	}

	function transition_delay(value) {
	  var id = this._id;

	  return arguments.length
	      ? this.each((typeof value === "function"
	          ? delayFunction
	          : delayConstant)(id, value))
	      : get$2(this.node(), id).delay;
	}

	function durationFunction(id, value) {
	  return function() {
	    set$1(this, id).duration = +value.apply(this, arguments);
	  };
	}

	function durationConstant(id, value) {
	  return value = +value, function() {
	    set$1(this, id).duration = value;
	  };
	}

	function transition_duration(value) {
	  var id = this._id;

	  return arguments.length
	      ? this.each((typeof value === "function"
	          ? durationFunction
	          : durationConstant)(id, value))
	      : get$2(this.node(), id).duration;
	}

	function easeConstant(id, value) {
	  if (typeof value !== "function") throw new Error;
	  return function() {
	    set$1(this, id).ease = value;
	  };
	}

	function transition_ease(value) {
	  var id = this._id;

	  return arguments.length
	      ? this.each(easeConstant(id, value))
	      : get$2(this.node(), id).ease;
	}

	function transition_filter(match) {
	  if (typeof match !== "function") match = matcher$1(match);

	  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
	      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
	        subgroup.push(node);
	      }
	    }
	  }

	  return new Transition(subgroups, this._parents, this._name, this._id);
	}

	function transition_merge(transition$$1) {
	  if (transition$$1._id !== this._id) throw new Error;

	  for (var groups0 = this._groups, groups1 = transition$$1._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
	    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
	      if (node = group0[i] || group1[i]) {
	        merge[i] = node;
	      }
	    }
	  }

	  for (; j < m0; ++j) {
	    merges[j] = groups0[j];
	  }

	  return new Transition(merges, this._parents, this._name, this._id);
	}

	function start(name) {
	  return (name + "").trim().split(/^|\s+/).every(function(t) {
	    var i = t.indexOf(".");
	    if (i >= 0) t = t.slice(0, i);
	    return !t || t === "start";
	  });
	}

	function onFunction(id, name, listener) {
	  var on0, on1, sit = start(name) ? init : set$1;
	  return function() {
	    var schedule$$1 = sit(this, id),
	        on = schedule$$1.on;

	    // If this node shared a dispatch with the previous node,
	    // just assign the updated shared dispatch and we’re done!
	    // Otherwise, copy-on-write.
	    if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

	    schedule$$1.on = on1;
	  };
	}

	function transition_on(name, listener) {
	  var id = this._id;

	  return arguments.length < 2
	      ? get$2(this.node(), id).on.on(name)
	      : this.each(onFunction(id, name, listener));
	}

	function removeFunction(id) {
	  return function() {
	    var parent = this.parentNode;
	    for (var i in this.__transition) if (+i !== id) return;
	    if (parent) parent.removeChild(this);
	  };
	}

	function transition_remove() {
	  return this.on("end.remove", removeFunction(this._id));
	}

	function transition_select(select$$1) {
	  var name = this._name,
	      id = this._id;

	  if (typeof select$$1 !== "function") select$$1 = selector(select$$1);

	  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
	      if ((node = group[i]) && (subnode = select$$1.call(node, node.__data__, i, group))) {
	        if ("__data__" in node) subnode.__data__ = node.__data__;
	        subgroup[i] = subnode;
	        schedule(subgroup[i], name, id, i, subgroup, get$2(node, id));
	      }
	    }
	  }

	  return new Transition(subgroups, this._parents, name, id);
	}

	function transition_selectAll(select$$1) {
	  var name = this._name,
	      id = this._id;

	  if (typeof select$$1 !== "function") select$$1 = selectorAll(select$$1);

	  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
	      if (node = group[i]) {
	        for (var children = select$$1.call(node, node.__data__, i, group), child, inherit = get$2(node, id), k = 0, l = children.length; k < l; ++k) {
	          if (child = children[k]) {
	            schedule(child, name, id, k, children, inherit);
	          }
	        }
	        subgroups.push(children);
	        parents.push(node);
	      }
	    }
	  }

	  return new Transition(subgroups, parents, name, id);
	}

	var Selection$1 = selection.prototype.constructor;

	function transition_selection() {
	  return new Selection$1(this._groups, this._parents);
	}

	function styleRemove$1(name, interpolate$$1) {
	  var value00,
	      value10,
	      interpolate0;
	  return function() {
	    var style = window$1(this).getComputedStyle(this, null),
	        value0 = style.getPropertyValue(name),
	        value1 = (this.style.removeProperty(name), style.getPropertyValue(name));
	    return value0 === value1 ? null
	        : value0 === value00 && value1 === value10 ? interpolate0
	        : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
	  };
	}

	function styleRemoveEnd(name) {
	  return function() {
	    this.style.removeProperty(name);
	  };
	}

	function styleConstant$1(name, interpolate$$1, value1) {
	  var value00,
	      interpolate0;
	  return function() {
	    var value0 = window$1(this).getComputedStyle(this, null).getPropertyValue(name);
	    return value0 === value1 ? null
	        : value0 === value00 ? interpolate0
	        : interpolate0 = interpolate$$1(value00 = value0, value1);
	  };
	}

	function styleFunction$1(name, interpolate$$1, value) {
	  var value00,
	      value10,
	      interpolate0;
	  return function() {
	    var style = window$1(this).getComputedStyle(this, null),
	        value0 = style.getPropertyValue(name),
	        value1 = value(this);
	    if (value1 == null) value1 = (this.style.removeProperty(name), style.getPropertyValue(name));
	    return value0 === value1 ? null
	        : value0 === value00 && value1 === value10 ? interpolate0
	        : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
	  };
	}

	function transition_style(name, value, priority) {
	  var i = (name += "") === "transform" ? interpolateTransformCss : interpolate;
	  return value == null ? this
	          .styleTween(name, styleRemove$1(name, i))
	          .on("end.style." + name, styleRemoveEnd(name))
	      : this.styleTween(name, typeof value === "function"
	          ? styleFunction$1(name, i, tweenValue(this, "style." + name, value))
	          : styleConstant$1(name, i, value), priority);
	}

	function styleTween(name, value, priority) {
	  function tween() {
	    var node = this, i = value.apply(node, arguments);
	    return i && function(t) {
	      node.style.setProperty(name, i(t), priority);
	    };
	  }
	  tween._value = value;
	  return tween;
	}

	function transition_styleTween(name, value, priority) {
	  var key = "style." + (name += "");
	  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
	  if (value == null) return this.tween(key, null);
	  if (typeof value !== "function") throw new Error;
	  return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
	}

	function textConstant$1(value) {
	  return function() {
	    this.textContent = value;
	  };
	}

	function textFunction$1(value) {
	  return function() {
	    var value1 = value(this);
	    this.textContent = value1 == null ? "" : value1;
	  };
	}

	function transition_text(value) {
	  return this.tween("text", typeof value === "function"
	      ? textFunction$1(tweenValue(this, "text", value))
	      : textConstant$1(value == null ? "" : value + ""));
	}

	function transition_transition() {
	  var name = this._name,
	      id0 = this._id,
	      id1 = newId();

	  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
	      if (node = group[i]) {
	        var inherit = get$2(node, id0);
	        schedule(node, name, id1, i, group, {
	          time: inherit.time + inherit.delay + inherit.duration,
	          delay: 0,
	          duration: inherit.duration,
	          ease: inherit.ease
	        });
	      }
	    }
	  }

	  return new Transition(groups, this._parents, name, id1);
	}

	var id = 0;

	function Transition(groups, parents, name, id) {
	  this._groups = groups;
	  this._parents = parents;
	  this._name = name;
	  this._id = id;
	}

	function transition(name) {
	  return selection().transition(name);
	}

	function newId() {
	  return ++id;
	}

	var selection_prototype = selection.prototype;

	Transition.prototype = transition.prototype = {
	  constructor: Transition,
	  select: transition_select,
	  selectAll: transition_selectAll,
	  filter: transition_filter,
	  merge: transition_merge,
	  selection: transition_selection,
	  transition: transition_transition,
	  call: selection_prototype.call,
	  nodes: selection_prototype.nodes,
	  node: selection_prototype.node,
	  size: selection_prototype.size,
	  empty: selection_prototype.empty,
	  each: selection_prototype.each,
	  on: transition_on,
	  attr: transition_attr,
	  attrTween: transition_attrTween,
	  style: transition_style,
	  styleTween: transition_styleTween,
	  text: transition_text,
	  remove: transition_remove,
	  tween: transition_tween,
	  delay: transition_delay,
	  duration: transition_duration,
	  ease: transition_ease
	};

	function cubicInOut(t) {
	  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
	}

	var pi = Math.PI;

	var tau = 2 * Math.PI;

	var defaultTiming = {
	  time: null, // Set on use.
	  delay: 0,
	  duration: 250,
	  ease: cubicInOut
	};

	function inherit(node, id) {
	  var timing;
	  while (!(timing = node.__transition) || !(timing = timing[id])) {
	    if (!(node = node.parentNode)) {
	      return defaultTiming.time = now(), defaultTiming;
	    }
	  }
	  return timing;
	}

	function selection_transition(name) {
	  var id,
	      timing;

	  if (name instanceof Transition) {
	    id = name._id, name = name._name;
	  } else {
	    id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
	  }

	  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
	      if (node = group[i]) {
	        schedule(node, name, id, i, group, timing || inherit(node, id));
	      }
	    }
	  }

	  return new Transition(groups, this._parents, name, id);
	}

	selection.prototype.interrupt = selection_interrupt;
	selection.prototype.transition = selection_transition;

	var pi$1 = Math.PI;

	var pi$2 = Math.PI;

	var prefix = "$";

	function Map() {}

	Map.prototype = map$1.prototype = {
	  constructor: Map,
	  has: function(key) {
	    return (prefix + key) in this;
	  },
	  get: function(key) {
	    return this[prefix + key];
	  },
	  set: function(key, value) {
	    this[prefix + key] = value;
	    return this;
	  },
	  remove: function(key) {
	    var property = prefix + key;
	    return property in this && delete this[property];
	  },
	  clear: function() {
	    for (var property in this) if (property[0] === prefix) delete this[property];
	  },
	  keys: function() {
	    var keys = [];
	    for (var property in this) if (property[0] === prefix) keys.push(property.slice(1));
	    return keys;
	  },
	  values: function() {
	    var values = [];
	    for (var property in this) if (property[0] === prefix) values.push(this[property]);
	    return values;
	  },
	  entries: function() {
	    var entries = [];
	    for (var property in this) if (property[0] === prefix) entries.push({key: property.slice(1), value: this[property]});
	    return entries;
	  },
	  size: function() {
	    var size = 0;
	    for (var property in this) if (property[0] === prefix) ++size;
	    return size;
	  },
	  empty: function() {
	    for (var property in this) if (property[0] === prefix) return false;
	    return true;
	  },
	  each: function(f) {
	    for (var property in this) if (property[0] === prefix) f(this[property], property.slice(1), this);
	  }
	};

	function map$1(object, f) {
	  var map = new Map;

	  // Copy constructor.
	  if (object instanceof Map) object.each(function(value, key) { map.set(key, value); });

	  // Index array by numeric index or specified key function.
	  else if (Array.isArray(object)) {
	    var i = -1,
	        n = object.length,
	        o;

	    if (f == null) while (++i < n) map.set(i, object[i]);
	    else while (++i < n) map.set(f(o = object[i], i, object), o);
	  }

	  // Convert object to map.
	  else if (object) for (var key in object) map.set(key, object[key]);

	  return map;
	}

	function Set() {}

	var proto = map$1.prototype;

	Set.prototype = set$2.prototype = {
	  constructor: Set,
	  has: proto.has,
	  add: function(value) {
	    value += "";
	    this[prefix + value] = value;
	    return this;
	  },
	  remove: proto.remove,
	  clear: proto.clear,
	  values: proto.keys,
	  size: proto.size,
	  empty: proto.empty,
	  each: proto.each
	};

	function set$2(object, f) {
	  var set = new Set;

	  // Copy constructor.
	  if (object instanceof Set) object.each(function(value) { set.add(value); });

	  // Otherwise, assume it’s an array.
	  else if (object) {
	    var i = -1, n = object.length;
	    if (f == null) while (++i < n) set.add(object[i]);
	    else while (++i < n) set.add(f(object[i], i, object));
	  }

	  return set;
	}

	function objectConverter(columns) {
	  return new Function("d", "return {" + columns.map(function(name, i) {
	    return JSON.stringify(name) + ": d[" + i + "]";
	  }).join(",") + "}");
	}

	function customConverter(columns, f) {
	  var object = objectConverter(columns);
	  return function(row, i) {
	    return f(object(row), i, columns);
	  };
	}

	// Compute unique columns in order of discovery.
	function inferColumns(rows) {
	  var columnSet = Object.create(null),
	      columns = [];

	  rows.forEach(function(row) {
	    for (var column in row) {
	      if (!(column in columnSet)) {
	        columns.push(columnSet[column] = column);
	      }
	    }
	  });

	  return columns;
	}

	function dsv(delimiter) {
	  var reFormat = new RegExp("[\"" + delimiter + "\n]"),
	      delimiterCode = delimiter.charCodeAt(0);

	  function parse(text, f) {
	    var convert, columns, rows = parseRows(text, function(row, i) {
	      if (convert) return convert(row, i - 1);
	      columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
	    });
	    rows.columns = columns;
	    return rows;
	  }

	  function parseRows(text, f) {
	    var EOL = {}, // sentinel value for end-of-line
	        EOF = {}, // sentinel value for end-of-file
	        rows = [], // output rows
	        N = text.length,
	        I = 0, // current character index
	        n = 0, // the current line number
	        t, // the current token
	        eol; // is the current token followed by EOL?

	    function token() {
	      if (I >= N) return EOF; // special case: end of file
	      if (eol) return eol = false, EOL; // special case: end of line

	      // special case: quotes
	      var j = I, c;
	      if (text.charCodeAt(j) === 34) {
	        var i = j;
	        while (i++ < N) {
	          if (text.charCodeAt(i) === 34) {
	            if (text.charCodeAt(i + 1) !== 34) break;
	            ++i;
	          }
	        }
	        I = i + 2;
	        c = text.charCodeAt(i + 1);
	        if (c === 13) {
	          eol = true;
	          if (text.charCodeAt(i + 2) === 10) ++I;
	        } else if (c === 10) {
	          eol = true;
	        }
	        return text.slice(j + 1, i).replace(/""/g, "\"");
	      }

	      // common case: find next delimiter or newline
	      while (I < N) {
	        var k = 1;
	        c = text.charCodeAt(I++);
	        if (c === 10) eol = true; // \n
	        else if (c === 13) { eol = true; if (text.charCodeAt(I) === 10) ++I, ++k; } // \r|\r\n
	        else if (c !== delimiterCode) continue;
	        return text.slice(j, I - k);
	      }

	      // special case: last token before EOF
	      return text.slice(j);
	    }

	    while ((t = token()) !== EOF) {
	      var a = [];
	      while (t !== EOL && t !== EOF) {
	        a.push(t);
	        t = token();
	      }
	      if (f && (a = f(a, n++)) == null) continue;
	      rows.push(a);
	    }

	    return rows;
	  }

	  function format(rows, columns) {
	    if (columns == null) columns = inferColumns(rows);
	    return [columns.map(formatValue).join(delimiter)].concat(rows.map(function(row) {
	      return columns.map(function(column) {
	        return formatValue(row[column]);
	      }).join(delimiter);
	    })).join("\n");
	  }

	  function formatRows(rows) {
	    return rows.map(formatRow).join("\n");
	  }

	  function formatRow(row) {
	    return row.map(formatValue).join(delimiter);
	  }

	  function formatValue(text) {
	    return text == null ? ""
	        : reFormat.test(text += "") ? "\"" + text.replace(/\"/g, "\"\"") + "\""
	        : text;
	  }

	  return {
	    parse: parse,
	    parseRows: parseRows,
	    format: format,
	    formatRows: formatRows
	  };
	}

	var csv = dsv(",");

	var tsv = dsv("\t");
	var tsvParseRows = tsv.parseRows;

	function tree_add(d) {
	  var x = +this._x.call(null, d),
	      y = +this._y.call(null, d);
	  return add(this.cover(x, y), x, y, d);
	}

	function add(tree, x, y, d) {
	  if (isNaN(x) || isNaN(y)) return tree; // ignore invalid points

	  var parent,
	      node = tree._root,
	      leaf = {data: d},
	      x0 = tree._x0,
	      y0 = tree._y0,
	      x1 = tree._x1,
	      y1 = tree._y1,
	      xm,
	      ym,
	      xp,
	      yp,
	      right,
	      bottom,
	      i,
	      j;

	  // If the tree is empty, initialize the root as a leaf.
	  if (!node) return tree._root = leaf, tree;

	  // Find the existing leaf for the new point, or add it.
	  while (node.length) {
	    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
	    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
	    if (parent = node, !(node = node[i = bottom << 1 | right])) return parent[i] = leaf, tree;
	  }

	  // Is the new point is exactly coincident with the existing point?
	  xp = +tree._x.call(null, node.data);
	  yp = +tree._y.call(null, node.data);
	  if (x === xp && y === yp) return leaf.next = node, parent ? parent[i] = leaf : tree._root = leaf, tree;

	  // Otherwise, split the leaf node until the old and new point are separated.
	  do {
	    parent = parent ? parent[i] = new Array(4) : tree._root = new Array(4);
	    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
	    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
	  } while ((i = bottom << 1 | right) === (j = (yp >= ym) << 1 | (xp >= xm)));
	  return parent[j] = node, parent[i] = leaf, tree;
	}

	function addAll(data) {
	  var d, i, n = data.length,
	      x,
	      y,
	      xz = new Array(n),
	      yz = new Array(n),
	      x0 = Infinity,
	      y0 = Infinity,
	      x1 = -Infinity,
	      y1 = -Infinity;

	  // Compute the points and their extent.
	  for (i = 0; i < n; ++i) {
	    if (isNaN(x = +this._x.call(null, d = data[i])) || isNaN(y = +this._y.call(null, d))) continue;
	    xz[i] = x;
	    yz[i] = y;
	    if (x < x0) x0 = x;
	    if (x > x1) x1 = x;
	    if (y < y0) y0 = y;
	    if (y > y1) y1 = y;
	  }

	  // If there were no (valid) points, inherit the existing extent.
	  if (x1 < x0) x0 = this._x0, x1 = this._x1;
	  if (y1 < y0) y0 = this._y0, y1 = this._y1;

	  // Expand the tree to cover the new points.
	  this.cover(x0, y0).cover(x1, y1);

	  // Add the new points.
	  for (i = 0; i < n; ++i) {
	    add(this, xz[i], yz[i], data[i]);
	  }

	  return this;
	}

	function tree_cover(x, y) {
	  if (isNaN(x = +x) || isNaN(y = +y)) return this; // ignore invalid points

	  var x0 = this._x0,
	      y0 = this._y0,
	      x1 = this._x1,
	      y1 = this._y1;

	  // If the quadtree has no extent, initialize them.
	  // Integer extent are necessary so that if we later double the extent,
	  // the existing quadrant boundaries don’t change due to floating point error!
	  if (isNaN(x0)) {
	    x1 = (x0 = Math.floor(x)) + 1;
	    y1 = (y0 = Math.floor(y)) + 1;
	  }

	  // Otherwise, double repeatedly to cover.
	  else if (x0 > x || x > x1 || y0 > y || y > y1) {
	    var z = x1 - x0,
	        node = this._root,
	        parent,
	        i;

	    switch (i = (y < (y0 + y1) / 2) << 1 | (x < (x0 + x1) / 2)) {
	      case 0: {
	        do parent = new Array(4), parent[i] = node, node = parent;
	        while (z *= 2, x1 = x0 + z, y1 = y0 + z, x > x1 || y > y1);
	        break;
	      }
	      case 1: {
	        do parent = new Array(4), parent[i] = node, node = parent;
	        while (z *= 2, x0 = x1 - z, y1 = y0 + z, x0 > x || y > y1);
	        break;
	      }
	      case 2: {
	        do parent = new Array(4), parent[i] = node, node = parent;
	        while (z *= 2, x1 = x0 + z, y0 = y1 - z, x > x1 || y0 > y);
	        break;
	      }
	      case 3: {
	        do parent = new Array(4), parent[i] = node, node = parent;
	        while (z *= 2, x0 = x1 - z, y0 = y1 - z, x0 > x || y0 > y);
	        break;
	      }
	    }

	    if (this._root && this._root.length) this._root = node;
	  }

	  // If the quadtree covers the point already, just return.
	  else return this;

	  this._x0 = x0;
	  this._y0 = y0;
	  this._x1 = x1;
	  this._y1 = y1;
	  return this;
	}

	function tree_data() {
	  var data = [];
	  this.visit(function(node) {
	    if (!node.length) do data.push(node.data); while (node = node.next)
	  });
	  return data;
	}

	function tree_extent(_) {
	  return arguments.length
	      ? this.cover(+_[0][0], +_[0][1]).cover(+_[1][0], +_[1][1])
	      : isNaN(this._x0) ? undefined : [[this._x0, this._y0], [this._x1, this._y1]];
	}

	function Quad(node, x0, y0, x1, y1) {
	  this.node = node;
	  this.x0 = x0;
	  this.y0 = y0;
	  this.x1 = x1;
	  this.y1 = y1;
	}

	function tree_find(x, y, radius) {
	  var data,
	      x0 = this._x0,
	      y0 = this._y0,
	      x1,
	      y1,
	      x2,
	      y2,
	      x3 = this._x1,
	      y3 = this._y1,
	      quads = [],
	      node = this._root,
	      q,
	      i;

	  if (node) quads.push(new Quad(node, x0, y0, x3, y3));
	  if (radius == null) radius = Infinity;
	  else {
	    x0 = x - radius, y0 = y - radius;
	    x3 = x + radius, y3 = y + radius;
	    radius *= radius;
	  }

	  while (q = quads.pop()) {

	    // Stop searching if this quadrant can’t contain a closer node.
	    if (!(node = q.node)
	        || (x1 = q.x0) > x3
	        || (y1 = q.y0) > y3
	        || (x2 = q.x1) < x0
	        || (y2 = q.y1) < y0) continue;

	    // Bisect the current quadrant.
	    if (node.length) {
	      var xm = (x1 + x2) / 2,
	          ym = (y1 + y2) / 2;

	      quads.push(
	        new Quad(node[3], xm, ym, x2, y2),
	        new Quad(node[2], x1, ym, xm, y2),
	        new Quad(node[1], xm, y1, x2, ym),
	        new Quad(node[0], x1, y1, xm, ym)
	      );

	      // Visit the closest quadrant first.
	      if (i = (y >= ym) << 1 | (x >= xm)) {
	        q = quads[quads.length - 1];
	        quads[quads.length - 1] = quads[quads.length - 1 - i];
	        quads[quads.length - 1 - i] = q;
	      }
	    }

	    // Visit this point. (Visiting coincident points isn’t necessary!)
	    else {
	      var dx = x - +this._x.call(null, node.data),
	          dy = y - +this._y.call(null, node.data),
	          d2 = dx * dx + dy * dy;
	      if (d2 < radius) {
	        var d = Math.sqrt(radius = d2);
	        x0 = x - d, y0 = y - d;
	        x3 = x + d, y3 = y + d;
	        data = node.data;
	      }
	    }
	  }

	  return data;
	}

	function tree_remove(d) {
	  if (isNaN(x = +this._x.call(null, d)) || isNaN(y = +this._y.call(null, d))) return this; // ignore invalid points

	  var parent,
	      node = this._root,
	      retainer,
	      previous,
	      next,
	      x0 = this._x0,
	      y0 = this._y0,
	      x1 = this._x1,
	      y1 = this._y1,
	      x,
	      y,
	      xm,
	      ym,
	      right,
	      bottom,
	      i,
	      j;

	  // If the tree is empty, initialize the root as a leaf.
	  if (!node) return this;

	  // Find the leaf node for the point.
	  // While descending, also retain the deepest parent with a non-removed sibling.
	  if (node.length) while (true) {
	    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
	    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
	    if (!(parent = node, node = node[i = bottom << 1 | right])) return this;
	    if (!node.length) break;
	    if (parent[(i + 1) & 3] || parent[(i + 2) & 3] || parent[(i + 3) & 3]) retainer = parent, j = i;
	  }

	  // Find the point to remove.
	  while (node.data !== d) if (!(previous = node, node = node.next)) return this;
	  if (next = node.next) delete node.next;

	  // If there are multiple coincident points, remove just the point.
	  if (previous) return (next ? previous.next = next : delete previous.next), this;

	  // If this is the root point, remove it.
	  if (!parent) return this._root = next, this;

	  // Remove this leaf.
	  next ? parent[i] = next : delete parent[i];

	  // If the parent now contains exactly one leaf, collapse superfluous parents.
	  if ((node = parent[0] || parent[1] || parent[2] || parent[3])
	      && node === (parent[3] || parent[2] || parent[1] || parent[0])
	      && !node.length) {
	    if (retainer) retainer[j] = node;
	    else this._root = node;
	  }

	  return this;
	}

	function removeAll(data) {
	  for (var i = 0, n = data.length; i < n; ++i) this.remove(data[i]);
	  return this;
	}

	function tree_root() {
	  return this._root;
	}

	function tree_size() {
	  var size = 0;
	  this.visit(function(node) {
	    if (!node.length) do ++size; while (node = node.next)
	  });
	  return size;
	}

	function tree_visit(callback) {
	  var quads = [], q, node = this._root, child, x0, y0, x1, y1;
	  if (node) quads.push(new Quad(node, this._x0, this._y0, this._x1, this._y1));
	  while (q = quads.pop()) {
	    if (!callback(node = q.node, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1) && node.length) {
	      var xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
	      if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
	      if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
	      if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
	      if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
	    }
	  }
	  return this;
	}

	function tree_visitAfter(callback) {
	  var quads = [], next = [], q;
	  if (this._root) quads.push(new Quad(this._root, this._x0, this._y0, this._x1, this._y1));
	  while (q = quads.pop()) {
	    var node = q.node;
	    if (node.length) {
	      var child, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
	      if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
	      if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
	      if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
	      if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
	    }
	    next.push(q);
	  }
	  while (q = next.pop()) {
	    callback(q.node, q.x0, q.y0, q.x1, q.y1);
	  }
	  return this;
	}

	function defaultX(d) {
	  return d[0];
	}

	function tree_x(_) {
	  return arguments.length ? (this._x = _, this) : this._x;
	}

	function defaultY(d) {
	  return d[1];
	}

	function tree_y(_) {
	  return arguments.length ? (this._y = _, this) : this._y;
	}

	function quadtree(nodes, x, y) {
	  var tree = new Quadtree(x == null ? defaultX : x, y == null ? defaultY : y, NaN, NaN, NaN, NaN);
	  return nodes == null ? tree : tree.addAll(nodes);
	}

	function Quadtree(x, y, x0, y0, x1, y1) {
	  this._x = x;
	  this._y = y;
	  this._x0 = x0;
	  this._y0 = y0;
	  this._x1 = x1;
	  this._y1 = y1;
	  this._root = undefined;
	}

	function leaf_copy(leaf) {
	  var copy = {data: leaf.data}, next = copy;
	  while (leaf = leaf.next) next = next.next = {data: leaf.data};
	  return copy;
	}

	var treeProto = quadtree.prototype = Quadtree.prototype;

	treeProto.copy = function() {
	  var copy = new Quadtree(this._x, this._y, this._x0, this._y0, this._x1, this._y1),
	      node = this._root,
	      nodes,
	      child;

	  if (!node) return copy;

	  if (!node.length) return copy._root = leaf_copy(node), copy;

	  nodes = [{source: node, target: copy._root = new Array(4)}];
	  while (node = nodes.pop()) {
	    for (var i = 0; i < 4; ++i) {
	      if (child = node.source[i]) {
	        if (child.length) nodes.push({source: child, target: node.target[i] = new Array(4)});
	        else node.target[i] = leaf_copy(child);
	      }
	    }
	  }

	  return copy;
	};

	treeProto.add = tree_add;
	treeProto.addAll = addAll;
	treeProto.cover = tree_cover;
	treeProto.data = tree_data;
	treeProto.extent = tree_extent;
	treeProto.find = tree_find;
	treeProto.remove = tree_remove;
	treeProto.removeAll = removeAll;
	treeProto.root = tree_root;
	treeProto.size = tree_size;
	treeProto.visit = tree_visit;
	treeProto.visitAfter = tree_visitAfter;
	treeProto.x = tree_x;
	treeProto.y = tree_y;

	var initialAngle = Math.PI * (3 - Math.sqrt(5));

	// Computes the decimal coefficient and exponent of the specified number x with
	// significant digits p, where x is positive and p is in [1, 21] or undefined.
	// For example, formatDecimal(1.23) returns ["123", 0].
	function formatDecimal(x, p) {
	  if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
	  var i, coefficient = x.slice(0, i);

	  // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
	  // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
	  return [
	    coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
	    +x.slice(i + 1)
	  ];
	}

	function exponent$1(x) {
	  return x = formatDecimal(Math.abs(x)), x ? x[1] : NaN;
	}

	function formatGroup(grouping, thousands) {
	  return function(value, width) {
	    var i = value.length,
	        t = [],
	        j = 0,
	        g = grouping[0],
	        length = 0;

	    while (i > 0 && g > 0) {
	      if (length + g + 1 > width) g = Math.max(1, width - length);
	      t.push(value.substring(i -= g, i + g));
	      if ((length += g + 1) > width) break;
	      g = grouping[j = (j + 1) % grouping.length];
	    }

	    return t.reverse().join(thousands);
	  };
	}

	function formatDefault(x, p) {
	  x = x.toPrecision(p);

	  out: for (var n = x.length, i = 1, i0 = -1, i1; i < n; ++i) {
	    switch (x[i]) {
	      case ".": i0 = i1 = i; break;
	      case "0": if (i0 === 0) i0 = i; i1 = i; break;
	      case "e": break out;
	      default: if (i0 > 0) i0 = 0; break;
	    }
	  }

	  return i0 > 0 ? x.slice(0, i0) + x.slice(i1 + 1) : x;
	}

	var prefixExponent;

	function formatPrefixAuto(x, p) {
	  var d = formatDecimal(x, p);
	  if (!d) return x + "";
	  var coefficient = d[0],
	      exponent = d[1],
	      i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
	      n = coefficient.length;
	  return i === n ? coefficient
	      : i > n ? coefficient + new Array(i - n + 1).join("0")
	      : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
	      : "0." + new Array(1 - i).join("0") + formatDecimal(x, Math.max(0, p + i - 1))[0]; // less than 1y!
	}

	function formatRounded(x, p) {
	  var d = formatDecimal(x, p);
	  if (!d) return x + "";
	  var coefficient = d[0],
	      exponent = d[1];
	  return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
	      : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
	      : coefficient + new Array(exponent - coefficient.length + 2).join("0");
	}

	var formatTypes = {
	  "": formatDefault,
	  "%": function(x, p) { return (x * 100).toFixed(p); },
	  "b": function(x) { return Math.round(x).toString(2); },
	  "c": function(x) { return x + ""; },
	  "d": function(x) { return Math.round(x).toString(10); },
	  "e": function(x, p) { return x.toExponential(p); },
	  "f": function(x, p) { return x.toFixed(p); },
	  "g": function(x, p) { return x.toPrecision(p); },
	  "o": function(x) { return Math.round(x).toString(8); },
	  "p": function(x, p) { return formatRounded(x * 100, p); },
	  "r": formatRounded,
	  "s": formatPrefixAuto,
	  "X": function(x) { return Math.round(x).toString(16).toUpperCase(); },
	  "x": function(x) { return Math.round(x).toString(16); }
	};

	// [[fill]align][sign][symbol][0][width][,][.precision][type]
	var re = /^(?:(.)?([<>=^]))?([+\-\( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?([a-z%])?$/i;

	function formatSpecifier(specifier) {
	  return new FormatSpecifier(specifier);
	}

	function FormatSpecifier(specifier) {
	  if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);

	  var match,
	      fill = match[1] || " ",
	      align = match[2] || ">",
	      sign = match[3] || "-",
	      symbol = match[4] || "",
	      zero = !!match[5],
	      width = match[6] && +match[6],
	      comma = !!match[7],
	      precision = match[8] && +match[8].slice(1),
	      type = match[9] || "";

	  // The "n" type is an alias for ",g".
	  if (type === "n") comma = true, type = "g";

	  // Map invalid types to the default format.
	  else if (!formatTypes[type]) type = "";

	  // If zero fill is specified, padding goes after sign and before digits.
	  if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

	  this.fill = fill;
	  this.align = align;
	  this.sign = sign;
	  this.symbol = symbol;
	  this.zero = zero;
	  this.width = width;
	  this.comma = comma;
	  this.precision = precision;
	  this.type = type;
	}

	FormatSpecifier.prototype.toString = function() {
	  return this.fill
	      + this.align
	      + this.sign
	      + this.symbol
	      + (this.zero ? "0" : "")
	      + (this.width == null ? "" : Math.max(1, this.width | 0))
	      + (this.comma ? "," : "")
	      + (this.precision == null ? "" : "." + Math.max(0, this.precision | 0))
	      + this.type;
	};

	var prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

	function identity$3(x) {
	  return x;
	}

	function formatLocale(locale) {
	  var group = locale.grouping && locale.thousands ? formatGroup(locale.grouping, locale.thousands) : identity$3,
	      currency = locale.currency,
	      decimal = locale.decimal;

	  function newFormat(specifier) {
	    specifier = formatSpecifier(specifier);

	    var fill = specifier.fill,
	        align = specifier.align,
	        sign = specifier.sign,
	        symbol = specifier.symbol,
	        zero = specifier.zero,
	        width = specifier.width,
	        comma = specifier.comma,
	        precision = specifier.precision,
	        type = specifier.type;

	    // Compute the prefix and suffix.
	    // For SI-prefix, the suffix is lazily computed.
	    var prefix = symbol === "$" ? currency[0] : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
	        suffix = symbol === "$" ? currency[1] : /[%p]/.test(type) ? "%" : "";

	    // What format function should we use?
	    // Is this an integer type?
	    // Can this type generate exponential notation?
	    var formatType = formatTypes[type],
	        maybeSuffix = !type || /[defgprs%]/.test(type);

	    // Set the default precision if not specified,
	    // or clamp the specified precision to the supported range.
	    // For significant precision, it must be in [1, 21].
	    // For fixed precision, it must be in [0, 20].
	    precision = precision == null ? (type ? 6 : 12)
	        : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
	        : Math.max(0, Math.min(20, precision));

	    function format(value) {
	      var valuePrefix = prefix,
	          valueSuffix = suffix,
	          i, n, c;

	      if (type === "c") {
	        valueSuffix = formatType(value) + valueSuffix;
	        value = "";
	      } else {
	        value = +value;

	        // Convert negative to positive, and compute the prefix.
	        // Note that -0 is not less than 0, but 1 / -0 is!
	        var valueNegative = (value < 0 || 1 / value < 0) && (value *= -1, true);

	        // Perform the initial formatting.
	        value = formatType(value, precision);

	        // If the original value was negative, it may be rounded to zero during
	        // formatting; treat this as (positive) zero.
	        if (valueNegative) {
	          i = -1, n = value.length;
	          valueNegative = false;
	          while (++i < n) {
	            if (c = value.charCodeAt(i), (48 < c && c < 58)
	                || (type === "x" && 96 < c && c < 103)
	                || (type === "X" && 64 < c && c < 71)) {
	              valueNegative = true;
	              break;
	            }
	          }
	        }

	        // Compute the prefix and suffix.
	        valuePrefix = (valueNegative ? (sign === "(" ? sign : "-") : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
	        valueSuffix = valueSuffix + (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + (valueNegative && sign === "(" ? ")" : "");

	        // Break the formatted value into the integer “value” part that can be
	        // grouped, and fractional or exponential “suffix” part that is not.
	        if (maybeSuffix) {
	          i = -1, n = value.length;
	          while (++i < n) {
	            if (c = value.charCodeAt(i), 48 > c || c > 57) {
	              valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
	              value = value.slice(0, i);
	              break;
	            }
	          }
	        }
	      }

	      // If the fill character is not "0", grouping is applied before padding.
	      if (comma && !zero) value = group(value, Infinity);

	      // Compute the padding.
	      var length = valuePrefix.length + value.length + valueSuffix.length,
	          padding = length < width ? new Array(width - length + 1).join(fill) : "";

	      // If the fill character is "0", grouping is applied after padding.
	      if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

	      // Reconstruct the final output based on the desired alignment.
	      switch (align) {
	        case "<": return valuePrefix + value + valueSuffix + padding;
	        case "=": return valuePrefix + padding + value + valueSuffix;
	        case "^": return padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
	      }
	      return padding + valuePrefix + value + valueSuffix;
	    }

	    format.toString = function() {
	      return specifier + "";
	    };

	    return format;
	  }

	  function formatPrefix(specifier, value) {
	    var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
	        e = Math.max(-8, Math.min(8, Math.floor(exponent$1(value) / 3))) * 3,
	        k = Math.pow(10, -e),
	        prefix = prefixes[8 + e / 3];
	    return function(value) {
	      return f(k * value) + prefix;
	    };
	  }

	  return {
	    format: newFormat,
	    formatPrefix: formatPrefix
	  };
	}

	var locale;
	var format;
	var formatPrefix;

	defaultLocale({
	  decimal: ".",
	  thousands: ",",
	  grouping: [3],
	  currency: ["$", ""]
	});

	function defaultLocale(definition) {
	  locale = formatLocale(definition);
	  format = locale.format;
	  formatPrefix = locale.formatPrefix;
	  return locale;
	}

	function precisionFixed(step) {
	  return Math.max(0, -exponent$1(Math.abs(step)));
	}

	function precisionPrefix(step, value) {
	  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent$1(value) / 3))) * 3 - exponent$1(Math.abs(step)));
	}

	function precisionRound(step, max) {
	  step = Math.abs(step), max = Math.abs(max) - step;
	  return Math.max(0, exponent$1(max) - exponent$1(step)) + 1;
	}

	// Adds floating point numbers with twice the normal precision.
	// Reference: J. R. Shewchuk, Adaptive Precision Floating-Point Arithmetic and
	// Fast Robust Geometric Predicates, Discrete & Computational Geometry 18(3)
	// 305–363 (1997).
	// Code adapted from GeographicLib by Charles F. F. Karney,
	// http://geographiclib.sourceforge.net/

	function adder() {
	  return new Adder;
	}

	function Adder() {
	  this.reset();
	}

	Adder.prototype = {
	  constructor: Adder,
	  reset: function() {
	    this.s = // rounded value
	    this.t = 0; // exact error
	  },
	  add: function(y) {
	    add$1(temp, y, this.t);
	    add$1(this, temp.s, this.s);
	    if (this.s) this.t += temp.t;
	    else this.s = temp.t;
	  },
	  valueOf: function() {
	    return this.s;
	  }
	};

	var temp = new Adder;

	function add$1(adder, a, b) {
	  var x = adder.s = a + b,
	      bv = x - a,
	      av = x - bv;
	  adder.t = (a - av) + (b - bv);
	}

	var pi$3 = Math.PI;

	var areaRingSum = adder();

	var areaSum = adder();

	var deltaSum = adder();

	var lengthSum = adder();

	var areaSum$1 = adder(),
	    areaRingSum$1 = adder();

	var lengthSum$1 = adder();

	var sum$1 = adder();

	// Returns the 2D cross product of AB and AC vectors, i.e., the z-component of

	var array$2 = Array.prototype;

	var map$2 = array$2.map;
	var slice$4 = array$2.slice;

	var implicit = {name: "implicit"};

	function ordinal(range) {
	  var index = map$1(),
	      domain = [],
	      unknown = implicit;

	  range = range == null ? [] : slice$4.call(range);

	  function scale(d) {
	    var key = d + "", i = index.get(key);
	    if (!i) {
	      if (unknown !== implicit) return unknown;
	      index.set(key, i = domain.push(d));
	    }
	    return range[(i - 1) % range.length];
	  }

	  scale.domain = function(_) {
	    if (!arguments.length) return domain.slice();
	    domain = [], index = map$1();
	    var i = -1, n = _.length, d, key;
	    while (++i < n) if (!index.has(key = (d = _[i]) + "")) index.set(key, domain.push(d));
	    return scale;
	  };

	  scale.range = function(_) {
	    return arguments.length ? (range = slice$4.call(_), scale) : range.slice();
	  };

	  scale.unknown = function(_) {
	    return arguments.length ? (unknown = _, scale) : unknown;
	  };

	  scale.copy = function() {
	    return ordinal()
	        .domain(domain)
	        .range(range)
	        .unknown(unknown);
	  };

	  return scale;
	}

	function band() {
	  var scale = ordinal().unknown(undefined),
	      domain = scale.domain,
	      ordinalRange = scale.range,
	      range$$1 = [0, 1],
	      step,
	      bandwidth,
	      round = false,
	      paddingInner = 0,
	      paddingOuter = 0,
	      align = 0.5;

	  delete scale.unknown;

	  function rescale() {
	    var n = domain().length,
	        reverse = range$$1[1] < range$$1[0],
	        start = range$$1[reverse - 0],
	        stop = range$$1[1 - reverse];
	    step = (stop - start) / Math.max(1, n - paddingInner + paddingOuter * 2);
	    if (round) step = Math.floor(step);
	    start += (stop - start - step * (n - paddingInner)) * align;
	    bandwidth = step * (1 - paddingInner);
	    if (round) start = Math.round(start), bandwidth = Math.round(bandwidth);
	    var values = sequence(n).map(function(i) { return start + step * i; });
	    return ordinalRange(reverse ? values.reverse() : values);
	  }

	  scale.domain = function(_) {
	    return arguments.length ? (domain(_), rescale()) : domain();
	  };

	  scale.range = function(_) {
	    return arguments.length ? (range$$1 = [+_[0], +_[1]], rescale()) : range$$1.slice();
	  };

	  scale.rangeRound = function(_) {
	    return range$$1 = [+_[0], +_[1]], round = true, rescale();
	  };

	  scale.bandwidth = function() {
	    return bandwidth;
	  };

	  scale.step = function() {
	    return step;
	  };

	  scale.round = function(_) {
	    return arguments.length ? (round = !!_, rescale()) : round;
	  };

	  scale.padding = function(_) {
	    return arguments.length ? (paddingInner = paddingOuter = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
	  };

	  scale.paddingInner = function(_) {
	    return arguments.length ? (paddingInner = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
	  };

	  scale.paddingOuter = function(_) {
	    return arguments.length ? (paddingOuter = Math.max(0, Math.min(1, _)), rescale()) : paddingOuter;
	  };

	  scale.align = function(_) {
	    return arguments.length ? (align = Math.max(0, Math.min(1, _)), rescale()) : align;
	  };

	  scale.copy = function() {
	    return band()
	        .domain(domain())
	        .range(range$$1)
	        .round(round)
	        .paddingInner(paddingInner)
	        .paddingOuter(paddingOuter)
	        .align(align);
	  };

	  return rescale();
	}

	function constant$9(x) {
	  return function() {
	    return x;
	  };
	}

	function number$1(x) {
	  return +x;
	}

	var unit = [0, 1];

	function deinterpolateLinear(a, b) {
	  return (b -= (a = +a))
	      ? function(x) { return (x - a) / b; }
	      : constant$9(b);
	}

	function deinterpolateClamp(deinterpolate) {
	  return function(a, b) {
	    var d = deinterpolate(a = +a, b = +b);
	    return function(x) { return x <= a ? 0 : x >= b ? 1 : d(x); };
	  };
	}

	function reinterpolateClamp(reinterpolate) {
	  return function(a, b) {
	    var r = reinterpolate(a = +a, b = +b);
	    return function(t) { return t <= 0 ? a : t >= 1 ? b : r(t); };
	  };
	}

	function bimap(domain, range, deinterpolate, reinterpolate) {
	  var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
	  if (d1 < d0) d0 = deinterpolate(d1, d0), r0 = reinterpolate(r1, r0);
	  else d0 = deinterpolate(d0, d1), r0 = reinterpolate(r0, r1);
	  return function(x) { return r0(d0(x)); };
	}

	function polymap(domain, range, deinterpolate, reinterpolate) {
	  var j = Math.min(domain.length, range.length) - 1,
	      d = new Array(j),
	      r = new Array(j),
	      i = -1;

	  // Reverse descending domains.
	  if (domain[j] < domain[0]) {
	    domain = domain.slice().reverse();
	    range = range.slice().reverse();
	  }

	  while (++i < j) {
	    d[i] = deinterpolate(domain[i], domain[i + 1]);
	    r[i] = reinterpolate(range[i], range[i + 1]);
	  }

	  return function(x) {
	    var i = bisectRight(domain, x, 1, j) - 1;
	    return r[i](d[i](x));
	  };
	}

	function copy(source, target) {
	  return target
	      .domain(source.domain())
	      .range(source.range())
	      .interpolate(source.interpolate())
	      .clamp(source.clamp());
	}

	// deinterpolate(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
	// reinterpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding domain value x in [a,b].
	function continuous(deinterpolate, reinterpolate) {
	  var domain = unit,
	      range = unit,
	      interpolate$$1 = interpolateValue,
	      clamp = false,
	      piecewise,
	      output,
	      input;

	  function rescale() {
	    piecewise = Math.min(domain.length, range.length) > 2 ? polymap : bimap;
	    output = input = null;
	    return scale;
	  }

	  function scale(x) {
	    return (output || (output = piecewise(domain, range, clamp ? deinterpolateClamp(deinterpolate) : deinterpolate, interpolate$$1)))(+x);
	  }

	  scale.invert = function(y) {
	    return (input || (input = piecewise(range, domain, deinterpolateLinear, clamp ? reinterpolateClamp(reinterpolate) : reinterpolate)))(+y);
	  };

	  scale.domain = function(_) {
	    return arguments.length ? (domain = map$2.call(_, number$1), rescale()) : domain.slice();
	  };

	  scale.range = function(_) {
	    return arguments.length ? (range = slice$4.call(_), rescale()) : range.slice();
	  };

	  scale.rangeRound = function(_) {
	    return range = slice$4.call(_), interpolate$$1 = interpolateRound, rescale();
	  };

	  scale.clamp = function(_) {
	    return arguments.length ? (clamp = !!_, rescale()) : clamp;
	  };

	  scale.interpolate = function(_) {
	    return arguments.length ? (interpolate$$1 = _, rescale()) : interpolate$$1;
	  };

	  return rescale();
	}

	function tickFormat(domain, count, specifier) {
	  var start = domain[0],
	      stop = domain[domain.length - 1],
	      step = tickStep(start, stop, count == null ? 10 : count),
	      precision;
	  specifier = formatSpecifier(specifier == null ? ",f" : specifier);
	  switch (specifier.type) {
	    case "s": {
	      var value = Math.max(Math.abs(start), Math.abs(stop));
	      if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
	      return formatPrefix(specifier, value);
	    }
	    case "":
	    case "e":
	    case "g":
	    case "p":
	    case "r": {
	      if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
	      break;
	    }
	    case "f":
	    case "%": {
	      if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
	      break;
	    }
	  }
	  return format(specifier);
	}

	function linearish(scale) {
	  var domain = scale.domain;

	  scale.ticks = function(count) {
	    var d = domain();
	    return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
	  };

	  scale.tickFormat = function(count, specifier) {
	    return tickFormat(domain(), count, specifier);
	  };

	  scale.nice = function(count) {
	    var d = domain(),
	        i = d.length - 1,
	        n = count == null ? 10 : count,
	        start = d[0],
	        stop = d[i],
	        step = tickStep(start, stop, n);

	    if (step) {
	      step = tickStep(Math.floor(start / step) * step, Math.ceil(stop / step) * step, n);
	      d[0] = Math.floor(start / step) * step;
	      d[i] = Math.ceil(stop / step) * step;
	      domain(d);
	    }

	    return scale;
	  };

	  return scale;
	}

	function linear$2() {
	  var scale = continuous(deinterpolateLinear, interpolateNumber);

	  scale.copy = function() {
	    return copy(scale, linear$2());
	  };

	  return linearish(scale);
	}

	var t0$1 = new Date,
	    t1$1 = new Date;

	function newInterval(floori, offseti, count, field) {

	  function interval(date) {
	    return floori(date = new Date(+date)), date;
	  }

	  interval.floor = interval;

	  interval.ceil = function(date) {
	    return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
	  };

	  interval.round = function(date) {
	    var d0 = interval(date),
	        d1 = interval.ceil(date);
	    return date - d0 < d1 - date ? d0 : d1;
	  };

	  interval.offset = function(date, step) {
	    return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
	  };

	  interval.range = function(start, stop, step) {
	    var range = [];
	    start = interval.ceil(start);
	    step = step == null ? 1 : Math.floor(step);
	    if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
	    do range.push(new Date(+start)); while (offseti(start, step), floori(start), start < stop)
	    return range;
	  };

	  interval.filter = function(test) {
	    return newInterval(function(date) {
	      if (date >= date) while (floori(date), !test(date)) date.setTime(date - 1);
	    }, function(date, step) {
	      if (date >= date) while (--step >= 0) while (offseti(date, 1), !test(date)) {} // eslint-disable-line no-empty
	    });
	  };

	  if (count) {
	    interval.count = function(start, end) {
	      t0$1.setTime(+start), t1$1.setTime(+end);
	      floori(t0$1), floori(t1$1);
	      return Math.floor(count(t0$1, t1$1));
	    };

	    interval.every = function(step) {
	      step = Math.floor(step);
	      return !isFinite(step) || !(step > 0) ? null
	          : !(step > 1) ? interval
	          : interval.filter(field
	              ? function(d) { return field(d) % step === 0; }
	              : function(d) { return interval.count(0, d) % step === 0; });
	    };
	  }

	  return interval;
	}

	var millisecond = newInterval(function() {
	  // noop
	}, function(date, step) {
	  date.setTime(+date + step);
	}, function(start, end) {
	  return end - start;
	});

	// An optimized implementation for this simple case.
	millisecond.every = function(k) {
	  k = Math.floor(k);
	  if (!isFinite(k) || !(k > 0)) return null;
	  if (!(k > 1)) return millisecond;
	  return newInterval(function(date) {
	    date.setTime(Math.floor(date / k) * k);
	  }, function(date, step) {
	    date.setTime(+date + step * k);
	  }, function(start, end) {
	    return (end - start) / k;
	  });
	};

	var durationSecond = 1e3;
	var durationMinute = 6e4;
	var durationHour = 36e5;
	var durationDay = 864e5;
	var durationWeek = 6048e5;

	var second = newInterval(function(date) {
	  date.setTime(Math.floor(date / durationSecond) * durationSecond);
	}, function(date, step) {
	  date.setTime(+date + step * durationSecond);
	}, function(start, end) {
	  return (end - start) / durationSecond;
	}, function(date) {
	  return date.getUTCSeconds();
	});

	var minute = newInterval(function(date) {
	  date.setTime(Math.floor(date / durationMinute) * durationMinute);
	}, function(date, step) {
	  date.setTime(+date + step * durationMinute);
	}, function(start, end) {
	  return (end - start) / durationMinute;
	}, function(date) {
	  return date.getMinutes();
	});

	var hour = newInterval(function(date) {
	  var offset = date.getTimezoneOffset() * durationMinute % durationHour;
	  if (offset < 0) offset += durationHour;
	  date.setTime(Math.floor((+date - offset) / durationHour) * durationHour + offset);
	}, function(date, step) {
	  date.setTime(+date + step * durationHour);
	}, function(start, end) {
	  return (end - start) / durationHour;
	}, function(date) {
	  return date.getHours();
	});

	var day = newInterval(function(date) {
	  date.setHours(0, 0, 0, 0);
	}, function(date, step) {
	  date.setDate(date.getDate() + step);
	}, function(start, end) {
	  return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay;
	}, function(date) {
	  return date.getDate() - 1;
	});

	function weekday(i) {
	  return newInterval(function(date) {
	    date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
	    date.setHours(0, 0, 0, 0);
	  }, function(date, step) {
	    date.setDate(date.getDate() + step * 7);
	  }, function(start, end) {
	    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationWeek;
	  });
	}

	var sunday = weekday(0);
	var monday = weekday(1);
	var tuesday = weekday(2);
	var wednesday = weekday(3);
	var thursday = weekday(4);
	var friday = weekday(5);
	var saturday = weekday(6);

	var month = newInterval(function(date) {
	  date.setDate(1);
	  date.setHours(0, 0, 0, 0);
	}, function(date, step) {
	  date.setMonth(date.getMonth() + step);
	}, function(start, end) {
	  return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
	}, function(date) {
	  return date.getMonth();
	});

	var year = newInterval(function(date) {
	  date.setMonth(0, 1);
	  date.setHours(0, 0, 0, 0);
	}, function(date, step) {
	  date.setFullYear(date.getFullYear() + step);
	}, function(start, end) {
	  return end.getFullYear() - start.getFullYear();
	}, function(date) {
	  return date.getFullYear();
	});

	// An optimized implementation for this simple case.
	year.every = function(k) {
	  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
	    date.setFullYear(Math.floor(date.getFullYear() / k) * k);
	    date.setMonth(0, 1);
	    date.setHours(0, 0, 0, 0);
	  }, function(date, step) {
	    date.setFullYear(date.getFullYear() + step * k);
	  });
	};

	var utcMinute = newInterval(function(date) {
	  date.setUTCSeconds(0, 0);
	}, function(date, step) {
	  date.setTime(+date + step * durationMinute);
	}, function(start, end) {
	  return (end - start) / durationMinute;
	}, function(date) {
	  return date.getUTCMinutes();
	});

	var utcHour = newInterval(function(date) {
	  date.setUTCMinutes(0, 0, 0);
	}, function(date, step) {
	  date.setTime(+date + step * durationHour);
	}, function(start, end) {
	  return (end - start) / durationHour;
	}, function(date) {
	  return date.getUTCHours();
	});

	var utcDay = newInterval(function(date) {
	  date.setUTCHours(0, 0, 0, 0);
	}, function(date, step) {
	  date.setUTCDate(date.getUTCDate() + step);
	}, function(start, end) {
	  return (end - start) / durationDay;
	}, function(date) {
	  return date.getUTCDate() - 1;
	});

	function utcWeekday(i) {
	  return newInterval(function(date) {
	    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
	    date.setUTCHours(0, 0, 0, 0);
	  }, function(date, step) {
	    date.setUTCDate(date.getUTCDate() + step * 7);
	  }, function(start, end) {
	    return (end - start) / durationWeek;
	  });
	}

	var utcSunday = utcWeekday(0);
	var utcMonday = utcWeekday(1);
	var utcTuesday = utcWeekday(2);
	var utcWednesday = utcWeekday(3);
	var utcThursday = utcWeekday(4);
	var utcFriday = utcWeekday(5);
	var utcSaturday = utcWeekday(6);

	var utcMonth = newInterval(function(date) {
	  date.setUTCDate(1);
	  date.setUTCHours(0, 0, 0, 0);
	}, function(date, step) {
	  date.setUTCMonth(date.getUTCMonth() + step);
	}, function(start, end) {
	  return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
	}, function(date) {
	  return date.getUTCMonth();
	});

	var utcYear = newInterval(function(date) {
	  date.setUTCMonth(0, 1);
	  date.setUTCHours(0, 0, 0, 0);
	}, function(date, step) {
	  date.setUTCFullYear(date.getUTCFullYear() + step);
	}, function(start, end) {
	  return end.getUTCFullYear() - start.getUTCFullYear();
	}, function(date) {
	  return date.getUTCFullYear();
	});

	// An optimized implementation for this simple case.
	utcYear.every = function(k) {
	  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
	    date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
	    date.setUTCMonth(0, 1);
	    date.setUTCHours(0, 0, 0, 0);
	  }, function(date, step) {
	    date.setUTCFullYear(date.getUTCFullYear() + step * k);
	  });
	};

	function localDate(d) {
	  if (0 <= d.y && d.y < 100) {
	    var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
	    date.setFullYear(d.y);
	    return date;
	  }
	  return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
	}

	function utcDate(d) {
	  if (0 <= d.y && d.y < 100) {
	    var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
	    date.setUTCFullYear(d.y);
	    return date;
	  }
	  return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
	}

	function newYear(y) {
	  return {y: y, m: 0, d: 1, H: 0, M: 0, S: 0, L: 0};
	}

	function formatLocale$1(locale) {
	  var locale_dateTime = locale.dateTime,
	      locale_date = locale.date,
	      locale_time = locale.time,
	      locale_periods = locale.periods,
	      locale_weekdays = locale.days,
	      locale_shortWeekdays = locale.shortDays,
	      locale_months = locale.months,
	      locale_shortMonths = locale.shortMonths;

	  var periodRe = formatRe(locale_periods),
	      periodLookup = formatLookup(locale_periods),
	      weekdayRe = formatRe(locale_weekdays),
	      weekdayLookup = formatLookup(locale_weekdays),
	      shortWeekdayRe = formatRe(locale_shortWeekdays),
	      shortWeekdayLookup = formatLookup(locale_shortWeekdays),
	      monthRe = formatRe(locale_months),
	      monthLookup = formatLookup(locale_months),
	      shortMonthRe = formatRe(locale_shortMonths),
	      shortMonthLookup = formatLookup(locale_shortMonths);

	  var formats = {
	    "a": formatShortWeekday,
	    "A": formatWeekday,
	    "b": formatShortMonth,
	    "B": formatMonth,
	    "c": null,
	    "d": formatDayOfMonth,
	    "e": formatDayOfMonth,
	    "H": formatHour24,
	    "I": formatHour12,
	    "j": formatDayOfYear,
	    "L": formatMilliseconds,
	    "m": formatMonthNumber,
	    "M": formatMinutes,
	    "p": formatPeriod,
	    "S": formatSeconds,
	    "U": formatWeekNumberSunday,
	    "w": formatWeekdayNumber,
	    "W": formatWeekNumberMonday,
	    "x": null,
	    "X": null,
	    "y": formatYear,
	    "Y": formatFullYear,
	    "Z": formatZone,
	    "%": formatLiteralPercent
	  };

	  var utcFormats = {
	    "a": formatUTCShortWeekday,
	    "A": formatUTCWeekday,
	    "b": formatUTCShortMonth,
	    "B": formatUTCMonth,
	    "c": null,
	    "d": formatUTCDayOfMonth,
	    "e": formatUTCDayOfMonth,
	    "H": formatUTCHour24,
	    "I": formatUTCHour12,
	    "j": formatUTCDayOfYear,
	    "L": formatUTCMilliseconds,
	    "m": formatUTCMonthNumber,
	    "M": formatUTCMinutes,
	    "p": formatUTCPeriod,
	    "S": formatUTCSeconds,
	    "U": formatUTCWeekNumberSunday,
	    "w": formatUTCWeekdayNumber,
	    "W": formatUTCWeekNumberMonday,
	    "x": null,
	    "X": null,
	    "y": formatUTCYear,
	    "Y": formatUTCFullYear,
	    "Z": formatUTCZone,
	    "%": formatLiteralPercent
	  };

	  var parses = {
	    "a": parseShortWeekday,
	    "A": parseWeekday,
	    "b": parseShortMonth,
	    "B": parseMonth,
	    "c": parseLocaleDateTime,
	    "d": parseDayOfMonth,
	    "e": parseDayOfMonth,
	    "H": parseHour24,
	    "I": parseHour24,
	    "j": parseDayOfYear,
	    "L": parseMilliseconds,
	    "m": parseMonthNumber,
	    "M": parseMinutes,
	    "p": parsePeriod,
	    "S": parseSeconds,
	    "U": parseWeekNumberSunday,
	    "w": parseWeekdayNumber,
	    "W": parseWeekNumberMonday,
	    "x": parseLocaleDate,
	    "X": parseLocaleTime,
	    "y": parseYear,
	    "Y": parseFullYear,
	    "Z": parseZone,
	    "%": parseLiteralPercent
	  };

	  // These recursive directive definitions must be deferred.
	  formats.x = newFormat(locale_date, formats);
	  formats.X = newFormat(locale_time, formats);
	  formats.c = newFormat(locale_dateTime, formats);
	  utcFormats.x = newFormat(locale_date, utcFormats);
	  utcFormats.X = newFormat(locale_time, utcFormats);
	  utcFormats.c = newFormat(locale_dateTime, utcFormats);

	  function newFormat(specifier, formats) {
	    return function(date) {
	      var string = [],
	          i = -1,
	          j = 0,
	          n = specifier.length,
	          c,
	          pad,
	          format;

	      if (!(date instanceof Date)) date = new Date(+date);

	      while (++i < n) {
	        if (specifier.charCodeAt(i) === 37) {
	          string.push(specifier.slice(j, i));
	          if ((pad = pads[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);
	          else pad = c === "e" ? " " : "0";
	          if (format = formats[c]) c = format(date, pad);
	          string.push(c);
	          j = i + 1;
	        }
	      }

	      string.push(specifier.slice(j, i));
	      return string.join("");
	    };
	  }

	  function newParse(specifier, newDate) {
	    return function(string) {
	      var d = newYear(1900),
	          i = parseSpecifier(d, specifier, string += "", 0);
	      if (i != string.length) return null;

	      // The am-pm flag is 0 for AM, and 1 for PM.
	      if ("p" in d) d.H = d.H % 12 + d.p * 12;

	      // Convert day-of-week and week-of-year to day-of-year.
	      if ("W" in d || "U" in d) {
	        if (!("w" in d)) d.w = "W" in d ? 1 : 0;
	        var day$$1 = "Z" in d ? utcDate(newYear(d.y)).getUTCDay() : newDate(newYear(d.y)).getDay();
	        d.m = 0;
	        d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day$$1 + 5) % 7 : d.w + d.U * 7 - (day$$1 + 6) % 7;
	      }

	      // If a time zone is specified, all fields are interpreted as UTC and then
	      // offset according to the specified time zone.
	      if ("Z" in d) {
	        d.H += d.Z / 100 | 0;
	        d.M += d.Z % 100;
	        return utcDate(d);
	      }

	      // Otherwise, all fields are in local time.
	      return newDate(d);
	    };
	  }

	  function parseSpecifier(d, specifier, string, j) {
	    var i = 0,
	        n = specifier.length,
	        m = string.length,
	        c,
	        parse;

	    while (i < n) {
	      if (j >= m) return -1;
	      c = specifier.charCodeAt(i++);
	      if (c === 37) {
	        c = specifier.charAt(i++);
	        parse = parses[c in pads ? specifier.charAt(i++) : c];
	        if (!parse || ((j = parse(d, string, j)) < 0)) return -1;
	      } else if (c != string.charCodeAt(j++)) {
	        return -1;
	      }
	    }

	    return j;
	  }

	  function parsePeriod(d, string, i) {
	    var n = periodRe.exec(string.slice(i));
	    return n ? (d.p = periodLookup[n[0].toLowerCase()], i + n[0].length) : -1;
	  }

	  function parseShortWeekday(d, string, i) {
	    var n = shortWeekdayRe.exec(string.slice(i));
	    return n ? (d.w = shortWeekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
	  }

	  function parseWeekday(d, string, i) {
	    var n = weekdayRe.exec(string.slice(i));
	    return n ? (d.w = weekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
	  }

	  function parseShortMonth(d, string, i) {
	    var n = shortMonthRe.exec(string.slice(i));
	    return n ? (d.m = shortMonthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
	  }

	  function parseMonth(d, string, i) {
	    var n = monthRe.exec(string.slice(i));
	    return n ? (d.m = monthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
	  }

	  function parseLocaleDateTime(d, string, i) {
	    return parseSpecifier(d, locale_dateTime, string, i);
	  }

	  function parseLocaleDate(d, string, i) {
	    return parseSpecifier(d, locale_date, string, i);
	  }

	  function parseLocaleTime(d, string, i) {
	    return parseSpecifier(d, locale_time, string, i);
	  }

	  function formatShortWeekday(d) {
	    return locale_shortWeekdays[d.getDay()];
	  }

	  function formatWeekday(d) {
	    return locale_weekdays[d.getDay()];
	  }

	  function formatShortMonth(d) {
	    return locale_shortMonths[d.getMonth()];
	  }

	  function formatMonth(d) {
	    return locale_months[d.getMonth()];
	  }

	  function formatPeriod(d) {
	    return locale_periods[+(d.getHours() >= 12)];
	  }

	  function formatUTCShortWeekday(d) {
	    return locale_shortWeekdays[d.getUTCDay()];
	  }

	  function formatUTCWeekday(d) {
	    return locale_weekdays[d.getUTCDay()];
	  }

	  function formatUTCShortMonth(d) {
	    return locale_shortMonths[d.getUTCMonth()];
	  }

	  function formatUTCMonth(d) {
	    return locale_months[d.getUTCMonth()];
	  }

	  function formatUTCPeriod(d) {
	    return locale_periods[+(d.getUTCHours() >= 12)];
	  }

	  return {
	    format: function(specifier) {
	      var f = newFormat(specifier += "", formats);
	      f.toString = function() { return specifier; };
	      return f;
	    },
	    parse: function(specifier) {
	      var p = newParse(specifier += "", localDate);
	      p.toString = function() { return specifier; };
	      return p;
	    },
	    utcFormat: function(specifier) {
	      var f = newFormat(specifier += "", utcFormats);
	      f.toString = function() { return specifier; };
	      return f;
	    },
	    utcParse: function(specifier) {
	      var p = newParse(specifier, utcDate);
	      p.toString = function() { return specifier; };
	      return p;
	    }
	  };
	}

	var pads = {"-": "", "_": " ", "0": "0"},
	    numberRe = /^\s*\d+/, // note: ignores next directive
	    percentRe = /^%/,
	    requoteRe = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;

	function pad(value, fill, width) {
	  var sign = value < 0 ? "-" : "",
	      string = (sign ? -value : value) + "",
	      length = string.length;
	  return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
	}

	function requote(s) {
	  return s.replace(requoteRe, "\\$&");
	}

	function formatRe(names) {
	  return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
	}

	function formatLookup(names) {
	  var map = {}, i = -1, n = names.length;
	  while (++i < n) map[names[i].toLowerCase()] = i;
	  return map;
	}

	function parseWeekdayNumber(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 1));
	  return n ? (d.w = +n[0], i + n[0].length) : -1;
	}

	function parseWeekNumberSunday(d, string, i) {
	  var n = numberRe.exec(string.slice(i));
	  return n ? (d.U = +n[0], i + n[0].length) : -1;
	}

	function parseWeekNumberMonday(d, string, i) {
	  var n = numberRe.exec(string.slice(i));
	  return n ? (d.W = +n[0], i + n[0].length) : -1;
	}

	function parseFullYear(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 4));
	  return n ? (d.y = +n[0], i + n[0].length) : -1;
	}

	function parseYear(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 2));
	  return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
	}

	function parseZone(d, string, i) {
	  var n = /^(Z)|([+-]\d\d)(?:\:?(\d\d))?/.exec(string.slice(i, i + 6));
	  return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
	}

	function parseMonthNumber(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 2));
	  return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
	}

	function parseDayOfMonth(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 2));
	  return n ? (d.d = +n[0], i + n[0].length) : -1;
	}

	function parseDayOfYear(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 3));
	  return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
	}

	function parseHour24(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 2));
	  return n ? (d.H = +n[0], i + n[0].length) : -1;
	}

	function parseMinutes(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 2));
	  return n ? (d.M = +n[0], i + n[0].length) : -1;
	}

	function parseSeconds(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 2));
	  return n ? (d.S = +n[0], i + n[0].length) : -1;
	}

	function parseMilliseconds(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 3));
	  return n ? (d.L = +n[0], i + n[0].length) : -1;
	}

	function parseLiteralPercent(d, string, i) {
	  var n = percentRe.exec(string.slice(i, i + 1));
	  return n ? i + n[0].length : -1;
	}

	function formatDayOfMonth(d, p) {
	  return pad(d.getDate(), p, 2);
	}

	function formatHour24(d, p) {
	  return pad(d.getHours(), p, 2);
	}

	function formatHour12(d, p) {
	  return pad(d.getHours() % 12 || 12, p, 2);
	}

	function formatDayOfYear(d, p) {
	  return pad(1 + day.count(year(d), d), p, 3);
	}

	function formatMilliseconds(d, p) {
	  return pad(d.getMilliseconds(), p, 3);
	}

	function formatMonthNumber(d, p) {
	  return pad(d.getMonth() + 1, p, 2);
	}

	function formatMinutes(d, p) {
	  return pad(d.getMinutes(), p, 2);
	}

	function formatSeconds(d, p) {
	  return pad(d.getSeconds(), p, 2);
	}

	function formatWeekNumberSunday(d, p) {
	  return pad(sunday.count(year(d), d), p, 2);
	}

	function formatWeekdayNumber(d) {
	  return d.getDay();
	}

	function formatWeekNumberMonday(d, p) {
	  return pad(monday.count(year(d), d), p, 2);
	}

	function formatYear(d, p) {
	  return pad(d.getFullYear() % 100, p, 2);
	}

	function formatFullYear(d, p) {
	  return pad(d.getFullYear() % 10000, p, 4);
	}

	function formatZone(d) {
	  var z = d.getTimezoneOffset();
	  return (z > 0 ? "-" : (z *= -1, "+"))
	      + pad(z / 60 | 0, "0", 2)
	      + pad(z % 60, "0", 2);
	}

	function formatUTCDayOfMonth(d, p) {
	  return pad(d.getUTCDate(), p, 2);
	}

	function formatUTCHour24(d, p) {
	  return pad(d.getUTCHours(), p, 2);
	}

	function formatUTCHour12(d, p) {
	  return pad(d.getUTCHours() % 12 || 12, p, 2);
	}

	function formatUTCDayOfYear(d, p) {
	  return pad(1 + utcDay.count(utcYear(d), d), p, 3);
	}

	function formatUTCMilliseconds(d, p) {
	  return pad(d.getUTCMilliseconds(), p, 3);
	}

	function formatUTCMonthNumber(d, p) {
	  return pad(d.getUTCMonth() + 1, p, 2);
	}

	function formatUTCMinutes(d, p) {
	  return pad(d.getUTCMinutes(), p, 2);
	}

	function formatUTCSeconds(d, p) {
	  return pad(d.getUTCSeconds(), p, 2);
	}

	function formatUTCWeekNumberSunday(d, p) {
	  return pad(utcSunday.count(utcYear(d), d), p, 2);
	}

	function formatUTCWeekdayNumber(d) {
	  return d.getUTCDay();
	}

	function formatUTCWeekNumberMonday(d, p) {
	  return pad(utcMonday.count(utcYear(d), d), p, 2);
	}

	function formatUTCYear(d, p) {
	  return pad(d.getUTCFullYear() % 100, p, 2);
	}

	function formatUTCFullYear(d, p) {
	  return pad(d.getUTCFullYear() % 10000, p, 4);
	}

	function formatUTCZone() {
	  return "+0000";
	}

	function formatLiteralPercent() {
	  return "%";
	}

	var locale$1;
	var timeFormat;
	var timeParse;
	var utcFormat;
	var utcParse;

	defaultLocale$1({
	  dateTime: "%x, %X",
	  date: "%-m/%-d/%Y",
	  time: "%-I:%M:%S %p",
	  periods: ["AM", "PM"],
	  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
	  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
	  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
	  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
	});

	function defaultLocale$1(definition) {
	  locale$1 = formatLocale$1(definition);
	  timeFormat = locale$1.format;
	  timeParse = locale$1.parse;
	  utcFormat = locale$1.utcFormat;
	  utcParse = locale$1.utcParse;
	  return locale$1;
	}

	var isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ";

	function formatIsoNative(date) {
	  return date.toISOString();
	}

	var formatIso = Date.prototype.toISOString
	    ? formatIsoNative
	    : utcFormat(isoSpecifier);

	function parseIsoNative(string) {
	  var date = new Date(string);
	  return isNaN(date) ? null : date;
	}

	var parseIso = +new Date("2000-01-01T00:00:00.000Z")
	    ? parseIsoNative
	    : utcParse(isoSpecifier);

	function colors(s) {
	  return s.match(/.{6}/g).map(function(x) {
	    return "#" + x;
	  });
	}

	var category10 = colors("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf");

	colors("393b795254a36b6ecf9c9ede6379398ca252b5cf6bcedb9c8c6d31bd9e39e7ba52e7cb94843c39ad494ad6616be7969c7b4173a55194ce6dbdde9ed6");

	colors("3182bd6baed69ecae1c6dbefe6550dfd8d3cfdae6bfdd0a231a35474c476a1d99bc7e9c0756bb19e9ac8bcbddcdadaeb636363969696bdbdbdd9d9d9");

	var category20 = colors("1f77b4aec7e8ff7f0effbb782ca02c98df8ad62728ff98969467bdc5b0d58c564bc49c94e377c2f7b6d27f7f7fc7c7c7bcbd22dbdb8d17becf9edae5");

	cubehelixLong(cubehelix(300, 0.5, 0.0), cubehelix(-240, 0.5, 1.0));

	var warm = cubehelixLong(cubehelix(-100, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

	var cool = cubehelixLong(cubehelix(260, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

	var rainbow = cubehelix();

	function ramp(range) {
	  var n = range.length;
	  return function(t) {
	    return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
	  };
	}

	ramp(colors("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));

	var magma = ramp(colors("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"));

	var inferno = ramp(colors("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"));

	var plasma = ramp(colors("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));

	function sequential(interpolator) {
	  var x0 = 0,
	      x1 = 1,
	      clamp = false;

	  function scale(x) {
	    var t = (x - x0) / (x1 - x0);
	    return interpolator(clamp ? Math.max(0, Math.min(1, t)) : t);
	  }

	  scale.domain = function(_) {
	    return arguments.length ? (x0 = +_[0], x1 = +_[1], scale) : [x0, x1];
	  };

	  scale.clamp = function(_) {
	    return arguments.length ? (clamp = !!_, scale) : clamp;
	  };

	  scale.interpolator = function(_) {
	    return arguments.length ? (interpolator = _, scale) : interpolator;
	  };

	  scale.copy = function() {
	    return sequential(interpolator).domain([x0, x1]).clamp(clamp);
	  };

	  return linearish(scale);
	}

	var pi$4 = Math.PI;

	function sign$1(x) {
	  return x < 0 ? -1 : 1;
	}

	// Calculate the slopes of the tangents (Hermite-type interpolation) based on
	// the following paper: Steffen, M. 1990. A Simple Method for Monotonic
	// Interpolation in One Dimension. Astronomy and Astrophysics, Vol. 239, NO.
	// NOV(II), P. 443, 1990.
	function slope3(that, x2, y2) {
	  var h0 = that._x1 - that._x0,
	      h1 = x2 - that._x1,
	      s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0),
	      s1 = (y2 - that._y1) / (h1 || h0 < 0 && -0),
	      p = (s0 * h1 + s1 * h0) / (h0 + h1);
	  return (sign$1(s0) + sign$1(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
	}

	// Calculate a one-sided slope.
	function slope2(that, t) {
	  var h = that._x1 - that._x0;
	  return h ? (3 * (that._y1 - that._y0) / h - t) / 2 : t;
	}

	// According to https://en.wikipedia.org/wiki/Cubic_Hermite_spline#Representations
	// "you can express cubic Hermite interpolation in terms of cubic Bézier curves
	// with respect to the four values p0, p0 + m0 / 3, p1 - m1 / 3, p1".
	function point$5(that, t0, t1) {
	  var x0 = that._x0,
	      y0 = that._y0,
	      x1 = that._x1,
	      y1 = that._y1,
	      dx = (x1 - x0) / 3;
	  that._context.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1);
	}

	function MonotoneX(context) {
	  this._context = context;
	}

	MonotoneX.prototype = {
	  areaStart: function() {
	    this._line = 0;
	  },
	  areaEnd: function() {
	    this._line = NaN;
	  },
	  lineStart: function() {
	    this._x0 = this._x1 =
	    this._y0 = this._y1 =
	    this._t0 = NaN;
	    this._point = 0;
	  },
	  lineEnd: function() {
	    switch (this._point) {
	      case 2: this._context.lineTo(this._x1, this._y1); break;
	      case 3: point$5(this, this._t0, slope2(this, this._t0)); break;
	    }
	    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
	    this._line = 1 - this._line;
	  },
	  point: function(x, y) {
	    var t1 = NaN;

	    x = +x, y = +y;
	    if (x === this._x1 && y === this._y1) return; // Ignore coincident points.
	    switch (this._point) {
	      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
	      case 1: this._point = 2; break;
	      case 2: this._point = 3; point$5(this, slope2(this, t1 = slope3(this, x, y)), t1); break;
	      default: point$5(this, this._t0, t1 = slope3(this, x, y)); break;
	    }

	    this._x0 = this._x1, this._x1 = x;
	    this._y0 = this._y1, this._y1 = y;
	    this._t0 = t1;
	  }
	};

	function MonotoneY(context) {
	  this._context = new ReflectContext(context);
	}

	(MonotoneY.prototype = Object.create(MonotoneX.prototype)).point = function(x, y) {
	  MonotoneX.prototype.point.call(this, y, x);
	};

	function ReflectContext(context) {
	  this._context = context;
	}

	ReflectContext.prototype = {
	  moveTo: function(x, y) { this._context.moveTo(y, x); },
	  closePath: function() { this._context.closePath(); },
	  lineTo: function(x, y) { this._context.lineTo(y, x); },
	  bezierCurveTo: function(x1, y1, x2, y2, x, y) { this._context.bezierCurveTo(y1, x1, y2, x2, y, x); }
	};

	function constant$12(x) {
	  return function() {
	    return x;
	  };
	}

	function ZoomEvent(target, type, transform) {
	  this.target = target;
	  this.type = type;
	  this.transform = transform;
	}

	function Transform(k, x, y) {
	  this.k = k;
	  this.x = x;
	  this.y = y;
	}

	Transform.prototype = {
	  constructor: Transform,
	  scale: function(k) {
	    return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
	  },
	  translate: function(x, y) {
	    return x === 0 & y === 0 ? this : new Transform(this.k, this.x + this.k * x, this.y + this.k * y);
	  },
	  apply: function(point) {
	    return [point[0] * this.k + this.x, point[1] * this.k + this.y];
	  },
	  applyX: function(x) {
	    return x * this.k + this.x;
	  },
	  applyY: function(y) {
	    return y * this.k + this.y;
	  },
	  invert: function(location) {
	    return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
	  },
	  invertX: function(x) {
	    return (x - this.x) / this.k;
	  },
	  invertY: function(y) {
	    return (y - this.y) / this.k;
	  },
	  rescaleX: function(x) {
	    return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
	  },
	  rescaleY: function(y) {
	    return y.copy().domain(y.range().map(this.invertY, this).map(y.invert, y));
	  },
	  toString: function() {
	    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
	  }
	};

	var identity$8 = new Transform(1, 0, 0);

	function nopropagation$2() {
	  event.stopImmediatePropagation();
	}

	function noevent$2() {
	  event.preventDefault();
	  event.stopImmediatePropagation();
	}

	// Ignore right-click, since that should open the context menu.
	function defaultFilter$2() {
	  return !event.button;
	}

	function defaultExtent$1() {
	  var e = this, w, h;
	  if (e instanceof SVGElement) {
	    e = e.ownerSVGElement || e;
	    w = e.width.baseVal.value;
	    h = e.height.baseVal.value;
	  } else {
	    w = e.clientWidth;
	    h = e.clientHeight;
	  }
	  return [[0, 0], [w, h]];
	}

	function defaultTransform() {
	  return this.__zoom || identity$8;
	}

	function zoom() {
	  var filter = defaultFilter$2,
	      extent = defaultExtent$1,
	      k0 = 0,
	      k1 = Infinity,
	      x0 = -k1,
	      x1 = k1,
	      y0 = x0,
	      y1 = x1,
	      duration = 250,
	      interpolate = interpolateZoom,
	      gestures = [],
	      listeners = dispatch("start", "zoom", "end"),
	      touchstarting,
	      touchending,
	      touchDelay = 500,
	      wheelDelay = 150;

	  function zoom(selection$$1) {
	    selection$$1
	        .on("wheel.zoom", wheeled)
	        .on("mousedown.zoom", mousedowned)
	        .on("dblclick.zoom", dblclicked)
	        .on("touchstart.zoom", touchstarted)
	        .on("touchmove.zoom", touchmoved)
	        .on("touchend.zoom touchcancel.zoom", touchended)
	        .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)")
	        .property("__zoom", defaultTransform);
	  }

	  zoom.transform = function(collection, transform) {
	    var selection$$1 = collection.selection ? collection.selection() : collection;
	    selection$$1.property("__zoom", defaultTransform);
	    if (collection !== selection$$1) {
	      schedule(collection, transform);
	    } else {
	      selection$$1.interrupt().each(function() {
	        gesture(this, arguments)
	            .start()
	            .zoom(null, typeof transform === "function" ? transform.apply(this, arguments) : transform)
	            .end();
	      });
	    }
	  };

	  zoom.scaleBy = function(selection$$1, k) {
	    zoom.scaleTo(selection$$1, function() {
	      var k0 = this.__zoom.k,
	          k1 = typeof k === "function" ? k.apply(this, arguments) : k;
	      return k0 * k1;
	    });
	  };

	  zoom.scaleTo = function(selection$$1, k) {
	    zoom.transform(selection$$1, function() {
	      var e = extent.apply(this, arguments),
	          t0 = this.__zoom,
	          p0 = centroid(e),
	          p1 = t0.invert(p0),
	          k1 = typeof k === "function" ? k.apply(this, arguments) : k;
	      return constrain(translate(scale(t0, k1), p0, p1), e);
	    });
	  };

	  zoom.translateBy = function(selection$$1, x, y) {
	    zoom.transform(selection$$1, function() {
	      return constrain(this.__zoom.translate(
	        typeof x === "function" ? x.apply(this, arguments) : x,
	        typeof y === "function" ? y.apply(this, arguments) : y
	      ), extent.apply(this, arguments));
	    });
	  };

	  function scale(transform, k) {
	    k = Math.max(k0, Math.min(k1, k));
	    return k === transform.k ? transform : new Transform(k, transform.x, transform.y);
	  }

	  function translate(transform, p0, p1) {
	    var x = p0[0] - p1[0] * transform.k, y = p0[1] - p1[1] * transform.k;
	    return x === transform.x && y === transform.y ? transform : new Transform(transform.k, x, y);
	  }

	  function constrain(transform, extent) {
	    var dx0 = transform.invertX(extent[0][0]) - x0,
	        dx1 = transform.invertX(extent[1][0]) - x1,
	        dy0 = transform.invertY(extent[0][1]) - y0,
	        dy1 = transform.invertY(extent[1][1]) - y1;
	    return transform.translate(
	      dx1 > dx0 ? (dx0 + dx1) / 2 : Math.min(0, dx0) || Math.max(0, dx1),
	      dy1 > dy0 ? (dy0 + dy1) / 2 : Math.min(0, dy0) || Math.max(0, dy1)
	    );
	  }

	  function centroid(extent) {
	    return [(+extent[0][0] + +extent[1][0]) / 2, (+extent[0][1] + +extent[1][1]) / 2];
	  }

	  function schedule(transition$$1, transform, center) {
	    transition$$1
	        .on("start.zoom", function() { gesture(this, arguments).start(); })
	        .on("interrupt.zoom end.zoom", function() { gesture(this, arguments).end(); })
	        .tween("zoom", function() {
	          var that = this,
	              args = arguments,
	              g = gesture(that, args),
	              e = extent.apply(that, args),
	              p = center || centroid(e),
	              w = Math.max(e[1][0] - e[0][0], e[1][1] - e[0][1]),
	              a = that.__zoom,
	              b = typeof transform === "function" ? transform.apply(that, args) : transform,
	              i = interpolate(a.invert(p).concat(w / a.k), b.invert(p).concat(w / b.k));
	          return function(t) {
	            if (t === 1) t = b; // Avoid rounding error on end.
	            else { var l = i(t), k = w / l[2]; t = new Transform(k, p[0] - l[0] * k, p[1] - l[1] * k); }
	            g.zoom(null, t);
	          };
	        });
	  }

	  function gesture(that, args) {
	    for (var i = 0, n = gestures.length, g; i < n; ++i) {
	      if ((g = gestures[i]).that === that) {
	        return g;
	      }
	    }
	    return new Gesture(that, args);
	  }

	  function Gesture(that, args) {
	    this.that = that;
	    this.args = args;
	    this.index = -1;
	    this.active = 0;
	    this.extent = extent.apply(that, args);
	  }

	  Gesture.prototype = {
	    start: function() {
	      if (++this.active === 1) {
	        this.index = gestures.push(this) - 1;
	        this.emit("start");
	      }
	      return this;
	    },
	    zoom: function(key, transform) {
	      if (this.mouse && key !== "mouse") this.mouse[1] = transform.invert(this.mouse[0]);
	      if (this.touch0 && key !== "touch") this.touch0[1] = transform.invert(this.touch0[0]);
	      if (this.touch1 && key !== "touch") this.touch1[1] = transform.invert(this.touch1[0]);
	      this.that.__zoom = transform;
	      this.emit("zoom");
	      return this;
	    },
	    end: function() {
	      if (--this.active === 0) {
	        gestures.splice(this.index, 1);
	        this.index = -1;
	        this.emit("end");
	      }
	      return this;
	    },
	    emit: function(type) {
	      customEvent(new ZoomEvent(zoom, type, this.that.__zoom), listeners.apply, listeners, [type, this.that, this.args]);
	    }
	  };

	  function wheeled() {
	    if (!filter.apply(this, arguments)) return;
	    var g = gesture(this, arguments),
	        t = this.__zoom,
	        k = Math.max(k0, Math.min(k1, t.k * Math.pow(2, -event.deltaY * (event.deltaMode ? 120 : 1) / 500))),
	        p = mouse(this);

	    // If the mouse is in the same location as before, reuse it.
	    // If there were recent wheel events, reset the wheel idle timeout.
	    if (g.wheel) {
	      if (g.mouse[0][0] !== p[0] || g.mouse[0][1] !== p[1]) {
	        g.mouse[1] = t.invert(g.mouse[0] = p);
	      }
	      clearTimeout(g.wheel);
	    }

	    // If this wheel event won’t trigger a transform change, ignore it.
	    else if (t.k === k) return;

	    // Otherwise, capture the mouse point and location at the start.
	    else {
	      g.mouse = [p, t.invert(p)];
	      interrupt(this);
	      g.start();
	    }

	    noevent$2();
	    g.wheel = setTimeout(wheelidled, wheelDelay);
	    g.zoom("mouse", constrain(translate(scale(t, k), g.mouse[0], g.mouse[1]), g.extent));

	    function wheelidled() {
	      g.wheel = null;
	      g.end();
	    }
	  }

	  function mousedowned() {
	    if (touchending || !filter.apply(this, arguments)) return;
	    var g = gesture(this, arguments),
	        v = select(event.view).on("mousemove.zoom", mousemoved, true).on("mouseup.zoom", mouseupped, true),
	        p = mouse(this);

	    dragDisable(event.view);
	    nopropagation$2();
	    g.mouse = [p, this.__zoom.invert(p)];
	    interrupt(this);
	    g.start();

	    function mousemoved() {
	      noevent$2();
	      g.moved = true;
	      g.zoom("mouse", constrain(translate(g.that.__zoom, g.mouse[0] = mouse(g.that), g.mouse[1]), g.extent));
	    }

	    function mouseupped() {
	      v.on("mousemove.zoom mouseup.zoom", null);
	      yesdrag(event.view, g.moved);
	      noevent$2();
	      g.end();
	    }
	  }

	  function dblclicked() {
	    if (!filter.apply(this, arguments)) return;
	    var t0 = this.__zoom,
	        p0 = mouse(this),
	        p1 = t0.invert(p0),
	        k1 = t0.k * (event.shiftKey ? 0.5 : 2),
	        t1 = constrain(translate(scale(t0, k1), p0, p1), extent.apply(this, arguments));

	    noevent$2();
	    if (duration > 0) select(this).transition().duration(duration).call(schedule, t1, p0);
	    else select(this).call(zoom.transform, t1);
	  }

	  function touchstarted() {
	    if (!filter.apply(this, arguments)) return;
	    var g = gesture(this, arguments),
	        touches$$1 = event.changedTouches,
	        started,
	        n = touches$$1.length, i, t, p;

	    nopropagation$2();
	    for (i = 0; i < n; ++i) {
	      t = touches$$1[i], p = touch(this, touches$$1, t.identifier);
	      p = [p, this.__zoom.invert(p), t.identifier];
	      if (!g.touch0) g.touch0 = p, started = true;
	      else if (!g.touch1) g.touch1 = p;
	    }

	    // If this is a dbltap, reroute to the (optional) dblclick.zoom handler.
	    if (touchstarting) {
	      touchstarting = clearTimeout(touchstarting);
	      if (!g.touch1) {
	        g.end();
	        p = select(this).on("dblclick.zoom");
	        if (p) p.apply(this, arguments);
	        return;
	      }
	    }

	    if (started) {
	      touchstarting = setTimeout(function() { touchstarting = null; }, touchDelay);
	      interrupt(this);
	      g.start();
	    }
	  }

	  function touchmoved() {
	    var g = gesture(this, arguments),
	        touches$$1 = event.changedTouches,
	        n = touches$$1.length, i, t, p, l;

	    noevent$2();
	    if (touchstarting) touchstarting = clearTimeout(touchstarting);
	    for (i = 0; i < n; ++i) {
	      t = touches$$1[i], p = touch(this, touches$$1, t.identifier);
	      if (g.touch0 && g.touch0[2] === t.identifier) g.touch0[0] = p;
	      else if (g.touch1 && g.touch1[2] === t.identifier) g.touch1[0] = p;
	    }
	    t = g.that.__zoom;
	    if (g.touch1) {
	      var p0 = g.touch0[0], l0 = g.touch0[1],
	          p1 = g.touch1[0], l1 = g.touch1[1],
	          dp = (dp = p1[0] - p0[0]) * dp + (dp = p1[1] - p0[1]) * dp,
	          dl = (dl = l1[0] - l0[0]) * dl + (dl = l1[1] - l0[1]) * dl;
	      t = scale(t, Math.sqrt(dp / dl));
	      p = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
	      l = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2];
	    }
	    else if (g.touch0) p = g.touch0[0], l = g.touch0[1];
	    else return;
	    g.zoom("touch", constrain(translate(t, p, l), g.extent));
	  }

	  function touchended() {
	    var g = gesture(this, arguments),
	        touches$$1 = event.changedTouches,
	        n = touches$$1.length, i, t;

	    nopropagation$2();
	    if (touchending) clearTimeout(touchending);
	    touchending = setTimeout(function() { touchending = null; }, touchDelay);
	    for (i = 0; i < n; ++i) {
	      t = touches$$1[i];
	      if (g.touch0 && g.touch0[2] === t.identifier) delete g.touch0;
	      else if (g.touch1 && g.touch1[2] === t.identifier) delete g.touch1;
	    }
	    if (g.touch1 && !g.touch0) g.touch0 = g.touch1, delete g.touch1;
	    if (!g.touch0) g.end();
	  }

	  zoom.filter = function(_) {
	    return arguments.length ? (filter = typeof _ === "function" ? _ : constant$12(!!_), zoom) : filter;
	  };

	  zoom.extent = function(_) {
	    return arguments.length ? (extent = typeof _ === "function" ? _ : constant$12([[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]]), zoom) : extent;
	  };

	  zoom.scaleExtent = function(_) {
	    return arguments.length ? (k0 = +_[0], k1 = +_[1], zoom) : [k0, k1];
	  };

	  zoom.translateExtent = function(_) {
	    return arguments.length ? (x0 = +_[0][0], x1 = +_[1][0], y0 = +_[0][1], y1 = +_[1][1], zoom) : [[x0, y0], [x1, y1]];
	  };

	  zoom.duration = function(_) {
	    return arguments.length ? (duration = +_, zoom) : duration;
	  };

	  zoom.interpolate = function(_) {
	    return arguments.length ? (interpolate = _, zoom) : interpolate;
	  };

	  zoom.on = function() {
	    var value = listeners.on.apply(listeners, arguments);
	    return value === listeners ? zoom : value;
	  };

	  return zoom;
	}

	/**
	 * Finds a minimum range that accommodates both of the ranges a and b
	 * 
	 * @param {*} a range A 
	 * @param {*} b range B 
	 */
	function rangeUnion(a, b) {
	    if (!a) {
	        return b;
	    } else if (!b) {
	        return a;
	    }

	    return [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
	}

	/**
	 * Intersects two ranges. If the ranges do not overlap, returns null.
	 * 
	 * @param {*} a range A
	 * @param {*} b range B
	 */
	function rangeIntersect(a, b) {
	    if (!a || !b) {
	        return null;
	    }

	    var range = [Math.max(a[0], b[0]), Math.min(a[1], b[1])];

	    if (range[0] <= range[1]) {
	        return range;
	    } else {
	        return null;
	    }
	}

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
	  return typeof obj;
	} : function (obj) {
	  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
	};

	var slicedToArray = function () {
	  function sliceIterator(arr, i) {
	    var _arr = [];
	    var _n = true;
	    var _d = false;
	    var _e = undefined;

	    try {
	      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
	        _arr.push(_s.value);

	        if (i && _arr.length === i) break;
	      }
	    } catch (err) {
	      _d = true;
	      _e = err;
	    } finally {
	      try {
	        if (!_n && _i["return"]) _i["return"]();
	      } finally {
	        if (_d) throw _e;
	      }
	    }

	    return _arr;
	  }

	  return function (arr, i) {
	    if (Array.isArray(arr)) {
	      return arr;
	    } else if (Symbol.iterator in Object(arr)) {
	      return sliceIterator(arr, i);
	    } else {
	      throw new TypeError("Invalid attempt to destructure non-iterable instance");
	    }
	  };
	}();

	var instanceCounter = 0;

	var numberFormat = format(",d");

	function explorer(container, cm, tracks, _ref) {
		var _ref$transform = _ref.transform,
		    transform$$1 = _ref$transform === undefined ? null : _ref$transform,
		    _ref$onBrush = _ref.onBrush,
		    onBrush = _ref$onBrush === undefined ? null : _ref$onBrush;


		/**
	  * Returns a UCSC Genome Browser -style string presentation of the domain.
	  * However, the domain may span multiple chromosomes, which is incompatible
	  * with UCSC.
	  */
		function domainToString(domain) {
			var _domain = slicedToArray(domain, 2),
			    from = _domain[0],
			    to = _domain[1];

			var f = numberFormat;

			// Display as 1-indexed closed range
			// See https://genome.ucsc.edu/FAQ/FAQtracks#tracks1
			if (from[0] == to[0]) {
				return from[0] + ":" + f(from[1] + 1) + "-" + f(to[1]);
			} else {
				return from[0] + ":" + f(from[1] + 1) + "-" + to[0] + ":" + f(to[1]);
			}
		}

		var latestTransform = transform$$1;
		var mappedDomain;

		var chart, background, rangeSearch;
		var x, scaledX, zoom$$1;

		var width, height;

		var brushInfo;

		// TODO: Package brushing logic into an object

		/** Range selection start */
		var brushStart, brushEnd;
		var brushElement;
		var brushDomain;

		var instanceId = instanceCounter++;

		/**
	  * Handles mouse clicks.
	  * 
	  * First click creates a brush, second click ends brushing and displays
	  * information about the brushed region.
	  */
		function handleClick() {
			if (brushDomain != null && brushStart == null) {
				clearBrush();
			} else if (brushStart == null) {
				brushStart = scaledX.invert(mouse(background.node())[0]);
				brushEnd = brushStart;

				brushDomain = [brushStart, brushStart];

				translateBrushElement();
			} else {
				if (brushDomain[1] != brushDomain[0]) {
					onBrushEnd(brushDomain);
					if (onBrush) {
						onBrush(brushDomain.map(function (d) {
							return cm.chromLoc(Math.round(d));
						}));
					}
				} else {
					clearBrush();
				}

				brushStart = null;
				brushEnd = null;
			}
		}

		function handleMouseMove() {
			if (brushStart != null) {
				brushEnd = scaledX.invert(mouse(background.node())[0]);
				translateBrushElement();

				brushDomain = [Math.min(brushStart, brushEnd), Math.max(brushStart, brushEnd)];
			}
		}

		function translateBrushElement() {
			if (brushDomain && !brushElement) {
				brushElement = chart.append("rect").attr("class", "range-selector").attr("y", 0.5).attr("height", height - 1);
			}

			if (!brushDomain && brushElement) {
				brushElement.remove();
				brushElement = null;
			}

			if (brushElement != null && brushDomain) {
				var ts = scaledX(brushDomain[0]);
				var te = scaledX(brushDomain[1]);
				var _width = te - ts;

				brushElement.attr("x", ts).attr("width", _width);
			}
		}

		function clearBrush() {
			if (onBrush) {
				onBrush(null);
			}

			brushInfo.html("");
			brushDomain = null;
			translateBrushElement();
		}

		function onBrushEnd(brushDomain) {
			brushInfo.html("");

			//const domainLength = d3.format(",d").apply(brushDomain[1] - brushDomain[0]);
			var domainLength = numberFormat(brushDomain[1] - brushDomain[0]);

			brushInfo.append("h2").text("Selection:");
			var selectionInfo = brushInfo.append("p");

			selectionInfo.append("span").text(domainToString(brushDomain.map(function (d) {
				return cm.chromLoc(d);
			})) + (" (" + domainLength + " bp)"));

			selectionInfo.append("button").text("Zoom to selection").on("click", function () {
				return zoomToDomain(brushDomain, { onEnd: clearBrush });
			});

			selectionInfo.append("button").text("Clear selection").on("click", clearBrush);

			tracks.forEach(function (t) {
				if (t.onBrush) {
					t.onBrush(brushDomain[0], brushDomain[1], brushInfo);
				}
			});
		}

		/**
	  * Build the Explorer. Create the range/search field, legendes, and SVG with all the tracks.
	  */
		function build() {
			var margin = {
				right: 10,
				left: 70
			};

			height = tracks.map(function (t) {
				return t.height();
			}).reduce(function (a, b) {
				return a + b;
			}, 0);

			width = container.node().offsetWidth - margin.left - margin.right;

			var navigatorBar = container.append("div").attr("class", "navigation-bar").style("margin-left", margin.left + "px");

			navigatorBar.append("label").attr("for", "visible-domain-" + instanceId).text("Range / search: ");

			var rangeSearchWrapper = navigatorBar.append("span").attr("class", "range-search-wrapper");

			rangeSearch = rangeSearchWrapper.append("input").attr("id", "visible-domain-" + instanceId).attr("class", "visible-domain");

			rangeSearch.node().addEventListener("keypress", function (event$$1) {
				if (event$$1.keyCode == 13) {
					event$$1.preventDefault();
					rangeSearchHelp.style("display", "none");
					search(this.value);
				}
			});

			var rangeSearchHelp = rangeSearchWrapper.append("div").attr("class", "range-search-help").style("display", "none").html(searchHelp() + tracks.map(function (t) {
				return t.searchHelp ? t.searchHelp() : "";
			}).reduce(function (acc, val) {
				return acc + val;
			}, ""));

			rangeSearch.node().addEventListener("focus", function (event$$1) {
				this.select();

				rangeSearchHelp.style("display", "block");
			});

			rangeSearch.node().addEventListener("mouseup", function (event$$1) {
				// http://stackoverflow.com/questions/1269722/selecting-text-on-focus-using-jquery-not-working-in-safari-and-chrome
				event$$1.preventDefault();
			});

			rangeSearch.node().addEventListener("blur", function (event$$1) {
				rangeSearchHelp.style("display", "none");
			});

			navigatorBar.append("button").attr("class", "reset-zoom").text("Reset zoom").on("click", function () {
				chart.transition().duration(750).call(zoom$$1.transform, identity$8);
			});

			navigatorBar.append("span").attr("class", "zoom-hint").text("Use the mouse wheel to zoom!");

			var _legends = container.append("div").attr("class", "legends").style("margin-left", margin.left + "px");

			x = linear$2().domain(cm.extent()).range([0, width]);

			scaledX = x.copy();

			zoom$$1 = zoom().scaleExtent([1, cm.extent()[1] / width]).translateExtent([[cm.extent()[0], -Infinity], [cm.extent()[1], Infinity]]) // Upper bound not working!?
			.on("zoom", zoomed);

			chart = container.append("svg").attr("class", "chart").attr("width", width + margin.left + margin.right).attr("height", height).append("g").attr("transform", "translate(" + margin.left + " 0)").on("click", handleClick).on("mousemove", handleMouseMove).call(zoom$$1);

			brushInfo = container.append("div").attr("class", "brush-info");

			background = chart.append("rect").attr("class", "background").attr("width", width).attr("height", height).attr("fill", "none");

			{
				(function () {
					var translateY = 0;
					var trackId = 0;

					var callbacks = {
						chromMapper: function chromMapper() {
							return cm;
						},
						legends: function legends() {
							return _legends;
						}
					};

					tracks.forEach(function (t) {
						var clipId = instanceId + "-clip-track-" + trackId;

						chart.append("clipPath").attr("id", clipId).append("rect").attr("x", 0).attr("y", 0).attr("width", width).attr("height", t.height());

						var trackGroup = chart.append("g").attr("class", "ge-track")
						//.style("pointer-events", "all")
						.attr("clip-path", "url(#" + clipId + ")").attr("transform", "translate(0 " + translateY + ")");

						var axisGroup = chart.append("g").attr("transform", "translate(0 " + translateY + ")");

						translateY += t.height();
						trackId++;

						t.onAddTrack(trackGroup, axisGroup, callbacks);
					});
				})();
			}
		}

		function zoomed() {
			var transform$$1 = event ? event.transform : identity$8;

			applyZoom(transform$$1);
		}

		function applyZoom(transform$$1) {
			latestTransform = transform$$1;

			scaledX = transform$$1.rescaleX(x);

			mappedDomain = scaledX.domain().map(function (d) {
				return cm.chromLoc(d);
			});
			rangeSearch.node().value = domainToString(mappedDomain);

			select("#copy-to-clipboard").attr("disabled", mappedDomain[0][0] == mappedDomain[1][0] ? null : "disabled");

			tracks.forEach(function (t) {
				return t.zoomed(transform$$1, scaledX);
			});

			translateBrushElement();
		}

		function zoomByTransform(transform$$1) {
			zoom$$1.transform(chart, transform$$1);
		}

		function zoomToDomain(d, _ref2) {
			var _ref2$onEnd = _ref2.onEnd,
			    onEnd = _ref2$onEnd === undefined ? null : _ref2$onEnd,
			    _ref2$duration = _ref2.duration,
			    duration = _ref2$duration === undefined ? 750 : _ref2$duration;

			d = rangeIntersect(d, cm.extent());

			var transform$$1 = identity$8.scale(width / (x(d[1]) - x(d[0]))).translate(-x(d[0]), 0);

			chart.transition().duration(duration)
			// Assume that the transition was triggered by search when the duration is defined
			.on("end", onEnd ? onEnd : function () {
				return true;
			}).call(zoom$$1.transform, transform$$1);
		}

		function searchHelp() {
			return "<p>Focus to a specific range. Examples:</p>\n\t\t<ul>\n\t\t\t<li>chr8:21,445,873-24,623,697</li>\n\t\t\t<li>chr4:166,014,727-chr15:23,731,397</li>\n\t\t</ul>";
		}

		/**
	  * Search tracks for matches and zoom to match
	  */
		function search(string) {
			// Try to match a range
			var matches = string.match(/^(chr[0-9XY]+):([0-9,]+)-(?:(chr[0-9XY]+):)?([0-9,]+)$/);
			var afterZoom = function afterZoom() {
				return rangeSearch.node().select();
			};

			if (matches) {
				var startChr = matches[1];
				var endChr = matches[3] ? matches[3] : startChr;

				var startIndex = parseInt(matches[2].replace(/,/g, ""));
				var endIndex = parseInt(matches[4].replace(/,/g, ""));

				zoomToDomain([cm.linLoc([startChr, startIndex]), cm.linLoc([endChr, endIndex])], { onEnd: afterZoom });

				return;
			}

			// Match by a single chromosome
			if (string.startsWith("chr") && Number.isInteger(cm.chromStart(string))) {
				zoomToDomain([cm.chromStart(string), cm.chromEnd(string)], { onEnd: afterZoom });
				return;
			}

			// Search tracks
			var result = tracks.filter(function (t) {
				return t.search;
			}).map(function (t) {
				return t.search(string);
			}).reduce(rangeUnion, null);

			if (result) {
				zoomToDomain(result, { onEnd: afterZoom });
				return;
			}

			alert("No matches found for \"" + string + "\"");
		}

		build();
		zoomByTransform(transform$$1 != null ? transform$$1 : identity$8);

		return {
			currentTransform: function currentTransform() {
				return identity$8.translate(latestTransform.x, 0).scale(latestTransform.k);
			},

			//applyZoom: transform => zoom.transform(chart, transform),

			rebuild: function rebuild() {
				var origDomain = scaledX.domain();
				container.html("");
				build();
				zoomToDomain(origDomain, { duration: 0 });
			},

			getChart: function getChart() {
				return chart;
			},

			search: search
		};
	}

	function chromMapper (chromSizes) {
		var chroms = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, "X", "Y"].map(function (v) {
			return "chr" + v;
		});

		var cumReduction = chroms.reduce(function (r, v) {
			r.a.push(r.soFar);
			r.m[v] = r.soFar;
			r.soFar += chromSizes[v];
			return r;
		}, { soFar: 0, m: {}, a: [] });

		var cumulativeChromMap = cumReduction.m;
		var cumulativeChromArray = cumReduction.a;
		var totalSize = cumReduction.soFar;

		/**
	  * Prepend a "chr" prefix if it is missing.
	  */
		function prefix(chrom) {
			if (typeof chrom == "string") {
				return chrom.startsWith("chr") ? chrom : "chr" + chrom;
			} else if (typeof chrom == "number") {
				return "chr" + chrom;
			}
		}

		return {
			linLoc: function linLoc(chromLoc) {
				return this.chromStart(chromLoc[0]) + chromLoc[1];
			},

			chromLoc: function chromLoc(linLoc) {
				if (linLoc >= 0) {
					var i = bisectRight(cumulativeChromArray, linLoc) - 1;
					return [chroms[i], linLoc - cumulativeChromArray[i]];
				} else {
					return [chroms[0], 0];
				}
			},

			chromStart: function chromStart(chrom) {
				return cumulativeChromMap[prefix(chrom)];
			},

			chromEnd: function chromEnd(chrom) {
				return this.chromStart(chrom) + chromSizes[prefix(chrom)];
			},

			linearChromPositions: function linearChromPositions() {
				return cumulativeChromArray;
			},

			extent: function extent$$1() {
				return [0, totalSize];
			}

		};
	}

	function cytobandTrack (cm, cytobands, peeker) {

		var giemsaScale = ordinal().domain(["gneg", "gpos25", "gpos50", "gpos75", "gpos100", "acen", "stalk", "gvar"]).range(["#f0f0f0", "#e0e0e0", "#d0d0d0", "#c0c0c0", "#a0a0a0", "#cc4444", "#338833", "#000000"]);

		// SVG in Chrome can not handle coordinates and transformations with arbitrarily large numbers
		var downscaleFactor = 1000000;

		var cytobandGroup, cytobandLabelGroup;

		return {
			height: function height() {
				return 20;
			},

			onAddTrack: function onAddTrack(trackGroup) {
				cytobands.sort(function (a, b) {
					return cm.linLoc([a.chrom, a.start]) - cm.linLoc([b.chrom, b.start]);
				});

				cytobands.forEach(function (row) {
					return row.linearCenter = cm.linLoc([row.chrom, (row.start + row.end) / 2]);
				});

				cytobandGroup = trackGroup.append("g").attr("class", "cytoband-bands");

				var newRects = cytobandGroup.selectAll("rect").data(cytobands, function (row) {
					return row.chrom + ":" + row.start;
				}).enter().append("rect").attr("height", this.height()).attr("x", function (d) {
					return cm.linLoc([d.chrom, d.start]) / downscaleFactor;
				}).attr("width", function (d) {
					return (cm.linLoc([d.chrom, d.end]) - cm.linLoc([d.chrom, d.start])) / downscaleFactor;
				}).attr("fill", function (d) {
					return giemsaScale(d.gieStain);
				});

				if (peeker) {
					newRects.on("mouseover", function (d) {
						return peeker.mouseOver(d);
					});
					newRects.on("mouseout", function (d) {
						return peeker.mouseOut();
					});
				}

				cytobandLabelGroup = trackGroup.append("g").attr("class", "cytoband-labels").attr("pointer-events", "none"); // TODO: To css
			},

			zoomed: function zoomed(transform$$1, scaledX) {

				var visibleDomain = scaledX.domain();
				var visibleDomainWidth = visibleDomain[1] - visibleDomain[0];
				var rangeWidth = scaledX.range()[1] - scaledX.range()[0];
				var k = rangeWidth / visibleDomainWidth * downscaleFactor;

				cytobandGroup.attr("transform", "translate(" + transform$$1.x + " 0) scale(" + k + " 1)");

				// Display labels when the visible domain is smaller than an arbitrarily selected threshold
				if (visibleDomainWidth < 150 * 1000000) {
					var labels = cytobandLabelGroup.selectAll("text").data(cytobands.filter(
					// TODO: Binary search & slice
					function (d) {
						return d.linearCenter > visibleDomain[0] && d.linearCenter < visibleDomain[1];
					}), function (d) {
						return d.linearCenter;
					});

					labels.exit().remove();

					labels.enter().append("text").text(function (d) {
						return d.chrom.substring(3) + d.name;
					}).attr("text-anchor", "middle").attr("y", this.height() / 2).merge(labels).attr("transform", function (d) {
						return "translate(" + scaledX(d.linearCenter) + " 0)";
					});

					labels.each(function (d) {
						var t = select(this);

						if (!t.attr("bb_width")) {
							// Calculating BBox is expensive. Store it in an attribute.
							t.attr("bb_width", this.getBBox().width);
						}

						t.attr("visibility", function (x) {
							return t.attr("bb_width") < scaledX(cm.linLoc([d.chrom, d.end])) - scaledX(cm.linLoc([d.chrom, d.start])) ? null : "hidden";
						});
					});

					cytobandLabelGroup.attr("visibility", "visible");
				} else {
					cytobandLabelGroup.attr("visibility", "hidden");
				}
			},

			/**
	   * Find a range of cytobands using the search string as a prefix
	   */
			search: function search(string) {
				var f = /^[0-9]+$/.test(string) ? function (d) {
					return d.chrom.substring(3) == string;
				} : function (d) {
					return (d.chrom.substring(3) + d.name).startsWith(string);
				};

				var bands = cytobands.filter(f);

				if (bands.length > 0) {
					return [Math.min.apply(null, bands.map(function (b) {
						return b.linearCenter - (b.end - b.start) / 2;
					})), Math.max.apply(null, bands.map(function (b) {
						return b.linearCenter + (b.end - b.start) / 2;
					}))];
				}
			},

			searchHelp: function searchHelp() {
				return "<p>Zoom in to a cytoband, arm or chromosome. Examples:</p>\n\t\t\t<ul>\n\t\t\t\t<li>8p11.23</li>\n\t\t\t\t<li>8p11</li>\n\t\t\t\t<li>8p</li>\n\t\t\t\t<li>8</li>\n\t\t\t</ul>";
			}
		};
	}

	function extractChromSizes(cytobands) {
		var chromSizes = {};

		cytobands.forEach(function (row) {
			var chrom = row.chrom;
			chromSizes[chrom] = Math.max(chromSizes.hasOwnProperty(chrom) ? chromSizes[chrom] : 0, row.end);
		});

		return chromSizes;
	}

	function axisTrack (cm) {
		var gXAxis;

		var xAxis = axisBottom().tickValues(cm.linearChromPositions()).tickFormat(function (v) {
			return cm.chromLoc(v + 1)[0];
		}); // TODO: Fix +1 kludge

		return {
			height: function height() {
				return 30;
			},

			onAddTrack: function onAddTrack(trackGroup) {
				gXAxis = trackGroup.append("g").attr("class", "x axis");
			},

			zoomed: function zoomed(transform$$1, scaledX) {
				xAxis.scale(scaledX);
				gXAxis.call(xAxis);
			}
		};
	}

	// When something becomes visible. The values are the width of the visible domain in base pairs
	var overviewBreakpoint = 250 * 1000000;
	var transcriptBreakpoint = 10 * 1000000;

	/**
	 * Builds a gene annotation track.
	 * See utils/compressRefGene.py
	 */
	function geneTrack(geneData, _ref) {
		var _ref$title = _ref.title,
		    title = _ref$title === undefined ? null : _ref$title,
		    _ref$peeker = _ref.peeker,
		    peeker = _ref$peeker === undefined ? null : _ref$peeker;


		var transcriptOpacityScale = linear$2().domain([1.2, 0.8].map(function (d) {
			return d * transcriptBreakpoint;
		})).range([0, 1]).clamp(true);

		var overviewOpacityScale = linear$2().domain([1.2, 0.8].map(function (d) {
			return d * overviewBreakpoint;
		}).concat([1.2, 0.8].map(function (d) {
			return d * transcriptBreakpoint;
		}))).range([0, 1, 1, 0]).clamp(true);

		var opacityGamma = function opacityGamma(o) {
			return Math.pow(o, 1.8);
		};

		var geneGroup;
		var overviewGroup;
		var placeholder;

		return {
			height: function height() {
				return 100;
			},

			onAddTrack: function onAddTrack(trackGroup, axisGroup) {

				// Required for pointer events (zoom & pan)
				trackGroup.append("rect").attr("fill", "none").attr("height", this.height()).attr("width", 2000); // TODO: Get exact width from range

				placeholder = trackGroup.append("text").attr("text-anchor", "middle").attr("fill", "black").attr("y", this.height() / 2).text("Zoom in to see some transcripts!");

				overviewGroup = trackGroup.append("g").attr("class", "gene-overview-group");

				geneGroup = trackGroup.append("g").attr("class", "gene-group");

				if (title != null) {
					axisGroup.append("g").attr("transform", "translate(-40, " + this.height() / 2 + ")").append("text").attr("text-anchor", "middle").attr("transform", "rotate(-90)").attr("fill", "black").text(title);
				}
			},

			zoomed: function zoomed(transform$$1, scaledX) {
				var visibleDomain = scaledX.domain();
				var visibleDomainWidth = visibleDomain[1] - visibleDomain[0];

				placeholder.attr("x", (scaledX.range()[1] - scaledX.range()[0]) / 2).attr("opacity", 1 - transcriptOpacityScale(visibleDomainWidth));

				if (overviewOpacityScale(visibleDomainWidth) > 0) {
					overviewGroup.attr("opacity", opacityGamma(overviewOpacityScale(visibleDomainWidth)));
					var visibleUnions = geneData.union.filter(function (g) {
						return g.end >= visibleDomain[0] && g.start <= visibleDomain[1];
					});

					var unions = overviewGroup.selectAll("rect").data(visibleUnions, function (g) {
						return g.id;
					});

					unions.exit().remove();

					var enteringUnions = unions.enter().append("rect").attr("x", 0).attr("width", 1).attr("y", 0).attr("height", 11).attr("fill", "#c0c0c0");

					enteringUnions.merge(unions).attr("transform", function (d) {
						return "translate(" + scaledX(d.start) + " 0)" + " scale(" + (scaledX(d.end) - scaledX(d.start)) + " 1)";
					});

					overviewGroup.attr("visibility", "visible");
				} else {
					overviewGroup.attr("visibility", "hidden");
					overviewGroup.selectAll("rect").remove();
				}

				if (transcriptOpacityScale(visibleDomainWidth) > 0) {
					geneGroup.attr("opacity", opacityGamma(transcriptOpacityScale(visibleDomainWidth)));

					// TODO: Should use Intervel Tree here. Let's use a naive binary search kludge for now.
					var bs = bisector(function (d) {
						return d.linearStart;
					}).left;

					var visibleGenes = geneData.slice(bs(geneData, visibleDomain[0] - 3 * 1000000), // Assume that genes are shorter than x
					bs(geneData, visibleDomain[1])).filter(function (g) {
						return g.linearEnd >= visibleDomain[0] && g.linearStart <= visibleDomain[1];
					});

					var genes = geneGroup.selectAll("g[data-id]").data(visibleGenes, function (g) {
						return g.id;
					});

					genes.exit().remove();

					var enteringGenes = genes.enter().append("g").attr("data-id", function (d) {
						return d.id;
					});

					/*
	    enteringGenes.append("title")
	    	.text(d => (d.strand == "-" ? ">" : "<") + " " + d.symbol + " " + d.id);
	    */

					if (peeker) {
						enteringGenes.on("mouseover", function (d) {
							return peeker.mouseOver({
								id: d.id,
								symbol: d.symbol,
								direction: d.strand == "-" ? "5' ---> 3' (- strand)" : "3' <--- 5' (+ strand)",
								length: d.linearEnd - d.linearStart
							});
						});
						enteringGenes.on("mouseout", function (d) {
							return peeker.mouseOut();
						});
					}

					enteringGenes.append("rect").attr("x", 0).attr("width", function (d) {
						return d.end - d.start;
					}).attr("y", 5).attr("height", 1).attr("fill", "#000000");

					// Needed for mouse events
					enteringGenes.append("rect").attr("height", 12).attr("x", 0).attr("width", function (d) {
						return d.end - d.start;
					}).attr("y", 0).attr("fill", "none");

					enteringGenes.append("g").selectAll("rect").data(function (d) {
						var cumulativeExons = d.exons.split(",").map(function (x) {
							return parseInt(x, 10);
						}).reduce(function (r, c, i) {
							r.push((r[i - 1] || 0) + c);return r;
						}, []);

						var exons = [];

						// TODO: Use Javascript generators
						for (var i = 0; i < cumulativeExons.length / 2; i++) {
							exons.push([cumulativeExons[i * 2], cumulativeExons[i * 2 + 1]]);
						}

						return exons;
					}).enter().append("rect").attr("x", function (e) {
						return e[0];
					}).attr("width", function (e) {
						return e[1] - e[0];
					}).attr("y", 0).attr("height", 11);

					enteringGenes.merge(genes).attr("transform", function (d) {
						return "translate(" + scaledX(d.linearStart) + " " + d.lane * 12 + ")" + " scale(" + (scaledX(d.end) - scaledX(d.start)) / (d.end - d.start) + " 1)";
					});

					geneGroup.attr("visibility", "visible");
				} else {
					geneGroup.attr("visibility", "hidden");
					geneGroup.selectAll("g").remove();
				}
			},

			onBrush: function onBrush(start, end, outputElement) {
				//const genes = geneData.filter(g => g.linearEnd >= start && g.linearStart <= end);
				var genes = map$1(geneData.filter(function (g) {
					return g.linearEnd >= start && g.linearStart <= end;
				}), function (d) {
					return d.symbol;
				}).keys().sort();

				var div = outputElement.append("div");
				div.append("h2").text("Genes and transcripts:");

				if (genes.length < 300) {
					var geneList = div.append("ul").selectAll("li").data(genes);

					geneList.enter().append("li").text(function (d) {
						return d;
					}).style("cursor", "pointer").on("click", function (d) {
						return window.open("https://www.ncbi.nlm.nih.gov/gene/?term=" + d, "refseq");
					});
				} else {
					div.append("p").text("Selection contains " + genes.length + " genes or transcripts. Please select a smaller range to get a list.");
				}
			},

			search: function search(string) {
				string = string.toUpperCase();

				// TODO: Use array.find (not supported in older browsers)
				var results = geneData.filter(function (d) {
					return d.symbol == string;
				});
				if (results.length > 0) {
					// Find the longest matching transcript
					results.sort(function (a, b) {
						return b.linearEnd - b.linearStart - (a.linearEnd - a.linearStart);
					});
					var r = results[0];

					// Add some padding around the gene
					var regionWidth = r.linearEnd - r.linearStart;
					var padding = regionWidth * 0.25;
					return [r.linearStart - padding, r.linearEnd + padding];
				}
			},

			searchHelp: function searchHelp() {
				return "<p>Find a gene or transcript. Examples:</p>\n\t\t\t<ul>\n\t\t\t\t<li>BRCA1</li>\n\t\t\t\t<li>TP53</li>\n\t\t\t</ul>";
			}
		};
	}

	function parseCompressedRefseqGeneTsv(cm, geneTsv) {
		var genes = tsvParseRows(geneTsv).map(function (row) {

			var start = parseInt(row[3], 10);
			var end = start + parseInt(row[4], 10);

			return {
				id: row[0],
				symbol: row[1],
				chrom: row[2],
				start: start,
				end: end,
				strand: row[5],
				exons: row[6],
				// Precalc for optimization
				linearStart: cm.chromStart(row[2]) + start,
				linearEnd: cm.chromStart(row[2]) + end
			};
		}).filter(function (g) {
			return typeof cm.chromStart(g.chrom) == "number";
		});

		genes.sort(function (a, b) {
			return a.linearStart - b.linearStart;
		});

		var lanes = [];

		genes.forEach(function (g) {
			var laneNumber = lanes.findIndex(function (end) {
				return end < g.linearEnd;
			});
			if (laneNumber < 0) {
				laneNumber = lanes.push(0) - 1;
			}
			lanes[laneNumber] = g.linearEnd;
			g.lane = laneNumber;
		});

		// For overview purposes we create a union of overlapping transcripts
		// and merge adjacent segments that are close enough to each other

		var mergeDistance = 75000;

		var concurrentCount = 0;
		genes.union = [];
		var leftEdge = null;
		var previousEnd = 0;
		var index = 0;

		genes.map(function (g) {
			return { pos: g.linearStart, start: true };
		}).concat(genes.map(function (g) {
			return { pos: g.linearEnd, start: false };
		})).sort(function (a, b) {
			return a.pos - b.pos;
		}).forEach(function (edge) {
			if (edge.start) {
				if (concurrentCount == 0) {
					if (leftEdge == null) {
						leftEdge = edge.pos;
					}

					if (edge.pos - previousEnd > mergeDistance) {
						genes.union.push({ id: index, start: leftEdge, end: previousEnd });
						leftEdge = edge.pos;
						index++;
					}
				}
				concurrentCount++;
			}

			if (!edge.start) {
				concurrentCount--;
				previousEnd = edge.pos;
			}
		});

		if (leftEdge) {
			genes.union.push({ id: index, start: leftEdge, end: previousEnd });
		}

		return genes;
	}

	function segmentTrack (cm, data, vis, _ref) {
		var _ref$title = _ref.title,
		    title = _ref$title === undefined ? "" : _ref$title,
		    _ref$peeker = _ref.peeker,
		    peeker = _ref$peeker === undefined ? "" : _ref$peeker,
		    _ref$samples = _ref.samples,
		    samples = _ref$samples === undefined ? null : _ref$samples,
		    _ref$sampleLabels = _ref.sampleLabels,
		    sampleLabels = _ref$sampleLabels === undefined ? null : _ref$sampleLabels,
		    _ref$barSize = _ref.barSize,
		    barSize = _ref$barSize === undefined ? 35 : _ref$barSize,
		    _ref$barPadding = _ref.barPadding,
		    barPadding = _ref$barPadding === undefined ? 0.3 : _ref$barPadding;

		var bars = null;

		var compact = barSize * (1 + barPadding) < 15; // Don't show labels

		// Figure out samples from the data if they were not explicitly defined
		var sampleDomain = samples != null ? samples : map$1(data, function (d) {
			return d.category;
		}).keys().sort();

		var y = band().domain(sampleDomain).padding(barPadding);

		y.range([0, sampleDomain.length * barSize]);

		var yAxis = axisLeft().scale(y).tickFormat(sampleLabels != null ? lookupFormat(samples, sampleLabels) : identityFormat());

		var xGrid = axisBottom().tickValues(cm.linearChromPositions()).tickFormat("");

		var gridYGroup, gridXGroup;
		var _trackGroup;
		var _axisGroup;

		var barGroup;

		var groupScaledPrevious = false;

		var pristine = true;

		return {
			height: function height() {
				return sampleDomain.length * barSize;
			},

			onAddTrack: function onAddTrack(trackGroup, axisGroup, callbacks) {
				gridYGroup = null;
				gridXGroup = null;
				bars = null;
				pristine = true;
				groupScaledPrevious = false;

				_trackGroup = trackGroup;
				_axisGroup = axisGroup;

				if (!compact) {
					_axisGroup.attr("class", "y axis").call(yAxis);
				}

				axisGroup.append("g").attr("transform", "translate(-60, " + this.height() / 2 + ")").append("text").attr("text-anchor", "middle").attr("transform", "rotate(-90)").attr("fill", "black").text(title);

				barGroup = trackGroup.append("g").attr("class", "bars");

				if (vis.evaluateData) vis.evaluateData(data);

				if (vis.produceLegend) vis.produceLegend(callbacks.legends(), title);
			},

			zoomed: function zoomed(transform$$1, scaledX) {
				if (pristine) {
					// add the Y gridlines
					gridYGroup = _trackGroup.insert("g", ":first-child").attr("class", "grid y").attr("transform", "translate(1 0)").call(axisLeft().scale(y).tickSize(scaledX.range()[0] - scaledX.range()[1] - 1).tickFormat(""));

					gridXGroup = _trackGroup.insert("g", ":first-child").attr("class", "grid x").attr("transform", "translate(0 " + this.height() + ")");

					pristine = false;
				}

				// ---

				var visibleDomain = scaledX.domain();
				var visibleDomainWidth = visibleDomain[1] - visibleDomain[0];

				var k = transform$$1.k;

				var useGroupScaling = k < 4;

				// TODO: Fix the duplicated code below

				// Assume that initially k is zero.
				if (useGroupScaling) {
					// Ensure that all data is bound when scaling is used
					if (pristine || bars == null || bars.size() != data.length) {
						// Bind all data
						bars = barGroup.selectAll("g.bar").data(data, function (d) {
							return d.category + "_" + d.linearStart;
						});

						var exit = bars.exit();
						exit.remove();

						var newBars = bars.enter().append("g").attr("class", "bar");

						vis(newBars);

						bars = newBars.merge(bars);

						if (peeker) {
							newBars.on("mouseover", function (d) {
								return peeker.mouseOver(d.data);
							});
							newBars.on("mouseout", function (d) {
								return peeker.mouseOut();
							});
						}
					}

					if (!groupScaledPrevious) {
						(function () {
							var x = linear$2().range(scaledX.range()).domain(cm.extent());

							var minWidth = Math.min(1, ((1 - 1) * 0.5 + 1) * 0.2);
							bars.attr("transform", function (d) {
								return "translate(" + x(d.linearStart) + " " + y(d.category) + ")" + " scale(" + Math.max(minWidth, x(d.linearEnd) - x(d.linearStart)) + " " + y.bandwidth() + ")";
							});
						})();
					}

					barGroup.attr("transform", "translate(" + transform$$1.x + " 0) scale(" + k + " 1)");
				} else {
					(function () {
						// Consider using an interval tree
						var visibleData = data.filter(function (g) {
							return g.linearEnd > visibleDomain[0] && g.linearStart < visibleDomain[1];
						});

						// D3.js is slow in selection and key binding
						bars = barGroup.selectAll("g.bar").data(visibleData, function (d) {
							return d.category + "_" + d.linearStart;
						});

						var exit = bars.exit();
						exit.remove();

						var newBars = bars.enter().append("g").attr("class", "bar");

						if (peeker) {
							newBars.on("mouseover", function (d) {
								return peeker.mouseOver(d.data);
							});
							newBars.on("mouseout", function (d) {
								return peeker.mouseOut();
							});
						}

						vis(newBars);
						bars = newBars.merge(bars);

						var minWidth = Math.min(1, ((k - 1) * 0.5 + 1) * 0.2);
						//const rangeWidth= scaledX.range()[1];

						// Safari (WebKit) breaks on overly large scale factors.
						// So, let's truncate coordinates to range boundaries.
						scaledX.clamp(true);

						bars.attr("transform", function (d) {
							var x1 = scaledX(d.linearStart);
							var x2 = scaledX(d.linearEnd);
							var scale = Math.max(minWidth, x2 - x1);

							return "translate(" + x1 + " " + y(d.category) + ")" + " scale(" + scale + " " + y.bandwidth() + ")";
						});

						scaledX.clamp(false);

						barGroup.attr("transform", "translate(0 0) scale(1 1)");
					})();
				}

				groupScaledPrevious = useGroupScaling;

				xGrid.scale(scaledX);
				xGrid.tickSize(-this.height());

				gridXGroup.call(xGrid);
			},

			search: function search(string) {
				if (string == "data") {
					// A special keyword!
					// Find a range that accommodates all segmenst
					var result = data.map(function (d) {
						return [d.linearStart, d.linearEnd];
					}).reduce(rangeUnion, null);

					if (result) {
						var rangeWidth = result[1] - result[0];
						var padding = rangeWidth * 0.25;
						return [result[0] - padding, result[1] + padding];
					} else {
						return null;
					}
				}
			}
		};
	}

	function identityFormat() {
		return function (value) {
			return value;
		};
	}

	function lookupFormat(values$$1, replacements) {
		if (values$$1.length != replacements.length) {
			throw "lookupFormat: length of values and replacements do not match!";
		}

		var lookupTable = {};
		for (var i = 0; i < values$$1.length; i++) {
			lookupTable[values$$1[i]] = replacements[i];
		}

		return function (value) {
			return lookupTable[value];
		};
	}

	/** Legacy */
	function absoluteAndChange(config) {
		return function decorate(newBars) {
			var absoluteScale = sequential(plasma).domain([0.2, 0.8]); // Emphasize

			var deltaScale = function deltaScale(x) {
				return x * 2;
			};

			newBars.append("rect").attr("height", function (d) {
				return deltaScale(Math.abs(d.data.R_met - d.data.D_met)) / 2;
			}).attr("y", function (d) {
				return d.data.R_met - d.data.D_met > 0 ? (1 - deltaScale(Math.abs(d.data.R_met - d.data.D_met))) / 2 : 1 / 2;
			}).attr("width", 1).attr("fill", function (d) {
				return absoluteScale(d.data.D_met);
			});
		};
	}

	/** Legacy */
	function islands(config) {
		return function decorate(newBars) {
			var color$$1 = linear$2().domain([0.1, 0.3, 1, 3, 10]).range(["#0000e0", "#0090ff", "#ffffff", "#ff9000", "#e00000"]);

			var cgiScale = band().domain(["island", "shore", "sea"]);

			newBars.append("rect").attr("height", 1).attr("width", 1).attr("fill", function (d) {
				var c = color(color$$1(d.data.R_met / d.data.D_met));c.opacity = 0.3;return c;
			});

			newBars.append("rect").attr("height", cgiScale.bandwidth()).attr("width", 1).attr("y", function (d) {
				return cgiScale(d.data.cgi);
			}).attr("fill", function (d) {
				return color(color$$1(d.data.R_met / d.data.D_met)).darker(0.3);
			});
		};
	}

	/**
	 * A visualization that fills a fraction of either the upper or lower part of the segment
	 * depending on the sign of the data.
	 * 
	 * TODO: Adapt to min/max values, produce a legend
	 */
	function upOrDown(segmentTrack, config) {
		if (!config.height) {
			// TODO: An exception or something
			alert("upOrDown visualization requires the 'height' config option!");
		}

		function clamp(x) {
			return Math.max(Math.min(x, 1), -1);
		}

		return function decorate(newBars) {
			newBars.append("rect").attr("height", function (d) {
				return Math.abs(clamp(d.data[config.height]));
			}).attr("y", function (d) {
				return clamp(d.data[config.height]) > 0 ? 0.5 - clamp(d.data[config.height]) : 0.5;
			}).attr("width", 1).attr("fill", function (d) {
				return d.data[config.height] > 0 ? "#cc3333" : "#3333cc";
			});
		};
	}

	/** Legacy */
	function expression(config) {
		return function decorate(newBars) {
			var relativeDifference = function relativeDifference(a, b) {
				return (Math.pow(2, a) - Math.pow(2, b)) / Math.pow(2, Math.max(a, b));
			};
			var diff = function diff(d) {
				return relativeDifference(d.data.R_expr, d.data.D_expr);
			};

			newBars.append("rect").attr("height", function (d) {
				return Math.abs(diff(d));
			}).attr("y", function (d) {
				return diff(d) > 0 ? 0.5 - diff(d) : 0.5;
			}).attr("width", 1).attr("fill", function (d) {
				return diff(d) > 0 ? "#cc3333" : "#3333cc";
			});
		};
	}

	/** Legacy */
	function simpleContinuous(config) {
		var cnvScale = linear$2().domain([-3, 0, 1.5]).range(["blue", "white", "red"]);

		var decorate = function decorate(newBars) {
			var rects = newBars.append("rect").attr("height", 1).attr("y", 0).attr("width", 1);

			if (config && config.color) {
				rects.attr("fill", function (d) {
					return colorScale(d.data[config.color]);
				});
			} else {
				rects.attr("fill", colorScale(0));
			}
		};

		return decorate;
	}

	function cnv(config) {
		var colorScale = linear$2().domain([-3, 0, 1.5]).range(["blue", "white", "red"]);

		var decorate = function decorate(newBars) {
			var bafDefaultColor = hsl(0, 0, 180);

			if (config) {
				if (config.seg) {
					var rects = newBars.append("rect").attr("height", 1).attr("y", 0).attr("width", 1);

					rects.attr("fill", function (d) {
						return colorScale(d.data[config.seg]);
					});
				}

				if (config.baf) {
					(function () {
						var h = function h(b) {
							var freq = b.data[config.baf];
							return Number.isNaN(freq) ? 0 : Math.abs(freq - 0.5) * 2;
						};

						var rects = newBars.append("rect").attr("height", h).attr("y", function (d) {
							return 1 - h(d);
						}).attr("width", 1).attr("fill", "rgba(0, 0, 0, 0.3)");
					})();
				}
			}
		};

		return decorate;
	}

	/**
	 * A simple visualization that fills the segment with a color based on a the data.
	 * 
	 * @param config config
	 */
	function simple(config) {
		var colorScale;

		// For categorial variable 
		var factors;

		// For continuous variable
		var domain;

		var decorate = function decorate(newBars) {
			var rects = newBars.append("rect").attr("height", 1).attr("y", 0).attr("width", 1);

			if (colorScale) {
				rects.attr("fill", function (d) {
					return colorScale(d.data[config.color]);
				});
			} else {
				rects.attr("fill", "#5E81C5");
			}
		};

		/**
	  * Figure out the type of the data being visualized and create a colorScale
	  */
		decorate.evaluateData = function evaluateData(data) {
			if (config && config.color) {
				var first = data.map(function (d) {
					return d.data[config.color];
				}).find(function (d) {
					return d;
				});

				var colorPalette = Array.isArray(config.colorPalette) ? config.colorPalette : null;

				if (typeof first == "number") {
					if (Array.isArray(config.domain) && config.domain.length == 2) {
						domain = config.domain;
					} else {
						// Assume a continuous variable
						domain = data.map(function (d) {
							return d.data[config.color];
						}).reduce(function (acc, val) {
							return [Math.min(acc[0], val), Math.max(acc[1], val)];
						}, [Infinity, -Infinity]);
					}

					if (colorPalette) {
						colorScale = sequential(rgbBasis(colorPalette)).domain(domain);
					} else if (domain[0] < 0 && 0 < domain[1]) {
						colorScale = linear$2().domain([domain[0], 0, domain[1]]).range(["#128be8", "#F0F0F0", "#db1e18"]);
					} else {
						colorScale = sequential(rgbBasis(["#128be8", "#c071e8", "#db1e18"])).domain(domain);
					}
				} else {
					// Assume a nominal categorial variable
					if (Array.isArray(config.domain)) {
						factors = config.domain;
					} else {
						factors = map$1(data, function (d) {
							return d.data[config.color];
						}).keys();
					}

					colorScale = colorPalette ? ordinal(colorPalette) : ordinal(factors.length <= 10 ? category10 : category20);
				}
			}
		};

		decorate.produceLegend = function produceLegend(container, trackTitle) {
			if (factors || domain) {
				var legend = container.append("div").attr("class", "legend").append("div");

				/*
	   			legend.append("div")
	   				.attr("class", "legend-title")
	   				.text("");
	   				*/

				if (trackTitle && trackTitle != "") {
					legend.append("span").text(trackTitle + " - ");
				}

				legend.append("span").text(config.color + ": ");

				var size = 12;

				if (domain) {
					(function () {
						var min$$1 = domain[0];
						var max$$1 = domain[1];

						var item = legend.append("span").attr("class", "legend-item");

						item.append("span").attr("class", "legend-label").text(min$$1);

						var svg = item.append("svg").attr("class", "legend-color").attr("width", size * 8).attr("height", size);

						var gradientId = Math.random().toString(36).substr(2, 5);

						svg.append("defs").append("linearGradient").attr("id", gradientId).selectAll("stop").data([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (x) {
							return x / 10;
						})).enter().append("stop").attr("offset", function (x) {
							return x * 100 + "%";
						}).attr("stop-color", function (x) {
							return colorScale(min$$1 + x * (max$$1 - min$$1));
						});

						svg.append("rect").attr("width", size * 8).attr("height", size).attr("fill", "url(#" + gradientId + ")");

						item.append("span").attr("class", "legend-label").text(max$$1);
					})();
				} else if (factors) {

					var items = legend.selectAll("div.legend-item").data(factors || domain).enter().append("div").attr("class", "legend-item");

					// Background color of html elements is not visible in prints by default,
					// let's use svg rectangles instead
					items.append("svg").attr("class", "legend-color").attr("width", size).attr("height", size).append("rect").attr("width", size).attr("height", size).attr("fill", function (d) {
						return colorScale(d);
					});

					items.append("span").attr("class", "legend-label").text(function (d) {
						return d;
					});
				} else {
					// ???
				}
			}
		};

		return decorate;
	}

	var visualizations = /*#__PURE__*/Object.freeze({
		absoluteAndChange: absoluteAndChange,
		islands: islands,
		upOrDown: upOrDown,
		expression: expression,
		simpleContinuous: simpleContinuous,
		cnv: cnv,
		simple: simple
	});

	function tablePeeker (container) {

		//table.style("position", "relative");
		//d3table.style("top", "-110px");


		var tBody = container.attr("class", "peeker-wrapper").append("table").attr("class", "peeker").append("tbody");

		container.style("visibility", "hidden");

		return {
			mouseOver: function mouseOver(object$$1) {
				var tableRows = tBody.selectAll("tr").data(Object.keys(object$$1).map(function (k) {
					return [k, object$$1[k]];
				}), function (d) {
					return d[0];
				});

				tableRows.enter().append("tr").selectAll("td").data(function (d) {
					return d;
				}).enter().append("td").merge(tableRows).text(function (d) {
					return d;
				});

				tableRows.exit().remove();

				container.style("visibility", Object.keys(object$$1).length ? "visible" : "hidden");
			},

			mouseOut: function mouseOut() {
				this.mouseOver({});
			}

			// TODO: Click
		};
	}

	/**
	 * genome-spy
	 *
	 * Copyright © 2016-2018 Kari Lavikka.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE.txt file in the root directory of this source tree.
	 */

	// Cache parsed annotations.
	var annotationCache = {};

	/**
	 * Fetches, parses and caches gene annotations.
	 * 
	 * @param {string} url url to fetch
	 * @param {object} cm ChromMapper
	 * @param {function} callback What to do when ready
	 */
	function getOrFetchAnnotation(url, cm, callback) {
		if (annotationCache[url]) {
			callback(annotationCache[url]);
		} else {
			Promise.all([url].map(function (url) {
				return get(url);
			})).then(function (results) {
				var geneTsv = results[0];
				var genes = parseCompressedRefseqGeneTsv(cm, geneTsv);
				annotationCache[url] = genes;
				callback(genes);
			}, function (error) {
				alert("Can't load annotations: " + error + ", url: " + url);
				callback(null);
			});
		}
	}

	/**
	 * Wraps the given object in an array if it isn't already.
	 * HTMLWidgets converts R vectors to arrays ... unless it has only one element.
	 */
	function ensureArray(a) {
		return a != null ? Array.isArray(a) ? a : [a] : null;
	}

	HTMLWidgets.widget({

		name: 'GenomeSpy',
		type: 'output',

		factory: function factory(el, width, height) {

			// TODO: define shared variables for this instance

			var container = select(el);

			var explorerDiv = container.append("div").attr("class", "genome-explorer");

			var expl;

			// Handle peeker positioning
			var peekerTable = explorerDiv.append("div");

			var tp = tablePeeker(peekerTable);
			explorerDiv.on("mousemove", function (e) {
				var table = peekerTable.node();
				var explorerNode = explorerDiv.node();
				if (mouse(explorerNode)[0] < explorerNode.offsetWidth / 2) {
					table.classList.add("right");
				} else {
					table.classList.remove("right");
				}
			});

			var innerExplorerDiv = explorerDiv.append("div").attr("class", "inner-explorer-div");

			return {
				renderValue: function renderValue(x) {
					var cytobands = HTMLWidgets.dataframeToD3(x.cytobands).filter(function (b) {
						return (/^chr[0-9XY]{1,2}$/.test(b.chrom)
						);
					});

					var cm = chromMapper(extractChromSizes(cytobands));

					var tracks = [cytobandTrack(cm, cytobands, tp)];

					x.tracks.forEach(function (t, i) {
						var colChrom = t.chrom ? t.chrom : "chrom";
						var colStart = t.start ? t.start : "start";
						var colEnd = t.end ? t.end : "end";

						var d3data;

						try {
							if (_typeof(t.data) != "object" || t.data == null) {
								throw "Data is missing";
							}

							[colChrom, colStart, colEnd].forEach(function (colName) {
								if (!t.data[colName]) {
									throw "Required coordinate column \"" + colName + "\" is missing from the data";
								}
							});

							if (t.discriminator && !t.data[t.discriminator]) {
								throw "Discriminator column \"" + t.discriminator + "\" is missing from the data";
							}
						} catch (msg) {
							alert(msg + " on track " + (i + 1) + "!");
							d3data = [];
						}

						if (d3data == null) {
							d3data = HTMLWidgets.dataframeToD3(t.data).map(function (d) {
								var chromStart = cm.chromStart(d[colChrom]);

								return {
									data: d,
									category: t.discriminator ? d[t.discriminator] : "",
									// Precalc for optimization
									linearStart: chromStart + d[colStart],
									linearEnd: chromStart + d[colEnd]
								};
							});
						}

						// Assume just segmentTracks.
						// TODO: Add support for other kinds of data tracks later
						tracks.push(segmentTrack(cm, d3data, visualizations[t.vis.type](t.vis.config), {
							title: t.title,
							peeker: tp,
							samples: ensureArray(t.samples),
							sampleLabels: ensureArray(t.sample_labels),
							barSize: t.subtrack_size ? t.subtrack_size : 30,
							barPadding: t.subtrack_padding ? t.subtrack_padding : 0.25,
							compact: t.compact ? true : false
						}));
					});

					tracks.push(axisTrack(cm));

					function buildExplorer() {
						// Clear previous
						innerExplorerDiv.html("");

						expl = explorer(innerExplorerDiv, cm, tracks, {
							transform: expl != null ? expl.currentTransform() : null,
							onBrush: function onBrush(domain) {
								if (HTMLWidgets.shinyMode) {
									Shiny.onInputChange(el.id + "_brushed:GenomeExplorerRange", domain ? { start: {
											chrom: domain[0][0],
											pos: domain[0][1]
										},
										end: {
											chrom: domain[1][0],
											pos: domain[1][1]
										} } : null);
								}
							}
						});

						if (x.zoom && x.zoom.search) {
							expl.search(x.zoom.search);
						}
					}

					if (x.annotations && x.annotations.refseq_genes_compressed) {
						getOrFetchAnnotation(x.annotations.refseq_genes_compressed, cm, function (genes) {
							if (genes != null) {
								tracks.push(geneTrack(genes, { peeker: tp }));
							}
							buildExplorer();
						});
					} else {
						buildExplorer();
					}
				},

				resize: function resize(width, height) {
					// TODO: Some optimizations. It is unnecessary to rebuild the whole dom subtree.
					if (expl != null) {
						expl.rebuild();
					} else {
						console.log("expl is null or something...");
					}
				}
			};
		}
	});

}());
//# sourceMappingURL=GenomeSpy.js.map
