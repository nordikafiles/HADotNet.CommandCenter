"use strict";

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } it = o[Symbol.iterator](); return it.next.bind(it); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var HAMessageType, HAErrorType, HAEventType, HAResponseType, HAConnectionState, PageMode, __app, WeatherTileEntities;

(function (n) {
  n.Auth = "auth";
  n.AuthRequired = "auth_required";
  n.AuthOK = "auth_ok";
  n.AuthInvalid = "auth_invalid";
  n.GetStates = "get_states";
  n.StateChanged = "state_changed";
  n.SubscribeToEvents = "subscribe_events";
  n.CameraThumbnail = "camera_thumbnail";
  n.MediaThumbnail = "media_player_thumbnail";
  n.Result = "result";
  n.Event = "event";
  n.Ping = "ping";
  n.Pong = "pong";
})(HAMessageType || (HAMessageType = {})), function (n) {
  n.IDReuse = "id_reuse";
}(HAErrorType || (HAErrorType = {})), function (n) {
  n.StateChanged = "state_changed";
}(HAEventType || (HAEventType = {})), function (n) {
  n[n.StateList = 0] = "StateList";
}(HAResponseType || (HAResponseType = {})), function (n) {
  n[n.Closed = 0] = "Closed";
  n[n.Opening = 1] = "Opening";
  n[n.Auth = 2] = "Auth";
  n[n.Open = 3] = "Open";
}(HAConnectionState || (HAConnectionState = {}));

var ConnectionEvent = /*#__PURE__*/function () {
  function ConnectionEvent() {
    this.handlers = [];
  }

  var _proto = ConnectionEvent.prototype;

  _proto.on = function on(n) {
    this.handlers.push(n);
  };

  _proto.off = function off(n) {
    this.handlers = this.handlers.filter(function (t) {
      return t !== n;
    });
  };

  _proto.invoke = function invoke(n) {
    this.handlers.slice(0).forEach(function (t) {
      return t(n);
    });
  };

  _proto.event = function event() {
    return this;
  };

  return ConnectionEvent;
}();

var HAConnection = /*#__PURE__*/function () {
  function HAConnection(n) {
    this.targetInstance = n;
    this.PING_INTERVAL = 3e4;
    this.evStateChanged = new ConnectionEvent();
    this.evConnectionStateChanged = new ConnectionEvent();
    this.expectedResults = {};
    this.expectedPromises = {};
    this.state = HAConnectionState.Closed;
  }

  var _proto2 = HAConnection.prototype;

  _proto2.initialize = function initialize() {
    var _this = this;

    this.state = HAConnectionState.Opening;
    this.evConnectionStateChanged.invoke(this.state);
    this.msgId = 1;
    this.ws && this.ws.readyState === this.ws.OPEN || (this.ws = new ReconnectingWebSocket(this.targetInstance, null, {
      automaticOpen: !1
    }));
    this.ws.addEventListener("open", function () {
      return _this.handleOpen();
    });
    this.ws.addEventListener("close", function () {
      return _this.handleClose();
    });
    this.ws.addEventListener("message", function (n) {
      return _this.handleMessage(n);
    });
    this.ws.open();
  };

  _proto2.refreshAllStates = function refreshAllStates() {
    this.sendStateRequest();
  };

  _proto2.getCameraImage = function getCameraImage(n) {
    var _this2 = this;

    return new Promise(function (t) {
      _this2.sendCameraThumbnailRequest(n, t);
    });
  };

  _proto2.getMediaImage = function getMediaImage(n) {
    var _this3 = this;

    return new Promise(function (t) {
      _this3.sendMediaThumbnailRequest(n, t);
    });
  };

  _proto2.handleMessage = function handleMessage(n) {
    var t = JSON.parse(n.data);

    if (this.isHAMessage(t)) {
      console.debug("-> RCV:" + t.type, t);

      switch (t.type) {
        case HAMessageType.AuthRequired:
          this.sendAuth();
          return;

        case HAMessageType.AuthOK:
          this.isReady();
          return;

        case HAMessageType.Result:
          var _n = t;
          _n.success ? this.handleHaExpectedResult(_n) ? delete this.expectedResults[_n.id] : console.info("HA result OK", _n) : this.handleHaError(_n.error);
          return;

        case HAMessageType.Event:
          this.handleHaEvent(t);
          return;

        case HAMessageType.AuthInvalid:
          console.error("Unable to authenticate with Home Assistant API. Check settings.");
          this.ws.maxReconnectAttempts = 1;
          this.ws.close();
          return;
      }
    } else console.warn("-> RCV", n.data);
  };

  _proto2.isReady = function isReady() {
    var _this4 = this;

    this.state = HAConnectionState.Open;
    this.evConnectionStateChanged.invoke(this.state);
    this.pingInterval = window.setInterval(function () {
      return _this4.sendPing();
    }, this.PING_INTERVAL);
    this.sendEventSubscriptionRequest(HAEventType.StateChanged);
  };

  _proto2.handleHaEvent = function handleHaEvent(n) {
    this.isHAEventStateChanged(n.event) && this.eventStateChanged(n.event);
  };

  _proto2.handleHaExpectedResult = function handleHaExpectedResult(n) {
    var t = this.expectedResults[n.id];

    if (typeof t != "undefined") {
      switch (t) {
        case HAResponseType.StateList:
          this.resultStateList(n.result);
          break;

        default:
          console.warn("Unhandled response type for this message.", n);
      }

      return !0;
    }

    var i = this.expectedPromises[n.id];
    return typeof i != "undefined" ? (i(n), !0) : !1;
  };

  _proto2.resultStateList = function resultStateList(n) {
    for (var _iterator = _createForOfIteratorHelperLoose(n), _step; !(_step = _iterator()).done;) {
      var t = _step.value;
      this.evStateChanged.invoke({
        data: {
          entity_id: t.entity_id,
          new_state: t,
          old_state: null
        },
        event_type: HAEventType.StateChanged,
        origin: null,
        time_fired: null
      });
    }
  };

  _proto2.eventStateChanged = function eventStateChanged(n) {
    var i, t;
    console.info("HA State Changed [" + n.data.entity_id + "] " + (t = (i = n.data.old_state) === null || i === void 0 ? void 0 : i.state, t !== null && t !== void 0 ? t : "<NULL>") + " -> " + n.data.new_state.state);
    this.evStateChanged.invoke(n);
  };

  _proto2.sendAuth = function sendAuth() {
    this.send({
      type: HAMessageType.Auth,
      access_token: window.ccOptions.token
    });
  };

  _proto2.sendStateRequest = function sendStateRequest() {
    var n = this.send({
      type: HAMessageType.GetStates
    });
    this.expectedResults[n] = HAResponseType.StateList;
  };

  _proto2.sendCameraThumbnailRequest = function sendCameraThumbnailRequest(n, t) {
    var i = this.send({
      type: HAMessageType.CameraThumbnail,
      entity_id: n
    });
    this.expectedPromises[i] = t;
  };

  _proto2.sendMediaThumbnailRequest = function sendMediaThumbnailRequest(n, t) {
    var i = this.send({
      type: HAMessageType.MediaThumbnail,
      entity_id: n
    });
    this.expectedPromises[i] = t;
  };

  _proto2.sendEventSubscriptionRequest = function sendEventSubscriptionRequest(n) {
    this.send({
      type: HAMessageType.SubscribeToEvents,
      event_type: n
    });
  };

  _proto2.handleHaError = function handleHaError(n) {
    console.error("HA API Error [" + n.code + "] " + n.message);
  };

  _proto2.sendPing = function sendPing() {
    this.send({
      type: HAMessageType.Ping
    });
  };

  _proto2.send = function send(n) {
    return console.debug("<- SND:" + n.type, n), this.state !== HAConnectionState.Closed && this.state !== HAConnectionState.Opening ? (this.state === HAConnectionState.Open && (n.id = this.msgId++), this.ws.send(JSON.stringify(n)), n.id) : (console.warn("Tried to send socket message, but connection isn't ready.", n), -1);
  };

  _proto2.handleOpen = function handleOpen() {
    this.state = HAConnectionState.Auth;
    this.evConnectionStateChanged.invoke(this.state);
  };

  _proto2.handleClose = function handleClose() {
    this.state = HAConnectionState.Closed;
    this.evConnectionStateChanged.invoke(this.state);
    this.pingInterval && (window.clearInterval(this.pingInterval), this.pingInterval = 0);
  };

  _proto2.isHAMessage = function isHAMessage(n) {
    return n && typeof n.type == "string";
  };

  _proto2.isHAEventStateChanged = function isHAEventStateChanged(n) {
    return n && typeof n.event_type == "string" && n.event_type === HAEventType.StateChanged;
  };

  _createClass(HAConnection, [{
    key: "OnStateChanged",
    get: function get() {
      return this.evStateChanged.event();
    }
  }, {
    key: "OnConnectionStateChanged",
    get: function get() {
      return this.evConnectionStateChanged.event();
    }
  }, {
    key: "ConnectionState",
    get: function get() {
      return this.state;
    }
  }]);

  return HAConnection;
}();

var PageUtils = /*#__PURE__*/function () {
  function PageUtils() {}

  PageUtils.ConfirmDelete = function ConfirmDelete(n) {
    return confirm("This item will be permanently deleted. This action cannot be undone.\n\nAre you sure?") ? !0 : (n.preventDefault(), !1);
  };

  return PageUtils;
}();

(function (n) {
  n[n.User = 0] = "User";
  n[n.Admin = 1] = "Admin";
})(PageMode || (PageMode = {}));

var Utils = /*#__PURE__*/function () {
  function Utils() {}

  Utils.delayPromise = function delayPromise(n) {
    for (var _len = arguments.length, t = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      t[_key - 1] = arguments[_key];
    }

    return new Promise(function (i) {
      return setTimeout(function () {
        return i(t);
      }, n);
    });
  };

  Utils.sleep = function sleep(n) {
    var i = Date.now();
    var t = null;

    do {
      t = Date.now();
    } while (t - i < n);
  };

  Utils.resolveAssetUrl = function resolveAssetUrl(n, t, i) {
    return n = n.endsWith("/") ? n.substr(0, n.length - 1) : n, t = t && !t.endsWith("/") ? t : t.substr(0, t.length - 1), i = i.startsWith("/") ? i.substr(1, i.length - 1) : i, (t && t.length ? t : n) + "/" + i;
  };

  Utils.resolveIcon = function resolveIcon(n, t) {
    return t && t.length ? t : n && n.length && /^mdi:/i.test(n) ? n.replace("mdi:", "") : "";
  };

  Utils.preloadImage = function preloadImage(n) {
    return new Promise(function (t, i) {
      var r = new Image();

      r.onload = function () {
        return t(n);
      };

      r.onerror = function (n) {
        return i(n);
      };

      r.src = n;
    });
  };

  Utils.convertDegreesToCardinal = function convertDegreesToCardinal(n) {
    return ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"][Math.floor(n / 22.5 + .5) % 16];
  };

  Utils.convertCardinalToIcon = function convertCardinalToIcon(n) {
    return {
      N: "arrow-up-thick",
      NNE: "arrow-up-thick",
      NE: "arrow-top-right-thick",
      ENE: "arrow-right-thick",
      E: "arrow-right-thick",
      ESE: "arrow-right-thick",
      SE: "arrow-bottom-right-thick",
      SSE: "arrow-down-thick",
      S: "arrow-down-thick",
      SSW: "arrow-down-thick",
      SW: "arrow-bottom-left-thick",
      WSW: "arrow-left-thick",
      W: "arrow-left-thick",
      WNW: "arrow-left-thick",
      NW: "arrow-top-left-thick",
      NNW: "arrow-up-thick"
    }[n];
  };

  return Utils;
}();

var Tile = /*#__PURE__*/function () {
  function Tile(n, t, i, r, u) {
    var _this5 = this;

    var e, f;
    this.page = n;
    this.name = t;
    this.conn = i;
    this.canLoad = u.canLoad;
    this.canClick = u.canClick;
    this.entityIds = [];
    this.loaded = !this.canLoad;
    this.el = $(".tiles .tile[data-tile-name=\"" + t + "\"]");
    this.canClick && this.el.click(function () {
      _this5.onClick();
    });
    f = this.el.data("tile-entityid");
    _typeof(f) == "object" && Array.isArray(f) ? this.entityIds = f : this.entityIds.push((e = f) === null || e === void 0 ? void 0 : e.toString());
    i.on("SendSystemConfig", function (n, i) {
      t == n && (console.debug("Received \"SendSystemConfig\" for tile: " + n), _this5.config = i, _this5.canLoad);
    });
    i.on("SendTile", function (n) {
      t == n.name && (console.debug("Received \"SendTile\" for tile: " + n.name), _this5.updateTile(n));
    });
    i.on("SendCalendarInfo", function (n, i, r) {
      t == n.name && _this5.updateCalendar(i, r);
    });
    i.on("SendWarning", function (n) {
      return console.warn(n);
    });
    i.on("SendDateTime", function (n, i, r) {
      t == n.name && _this5.updateDateTime(n, i, r);
    });
    this.requestConfig(n);
    this.canLoad && this.requestState();
  }

  var _proto3 = Tile.prototype;

  _proto3.onClick = function onClick() {
    return this.conn.invoke("OnTileClicked", this.page, this.name);
  };

  _proto3.updateTile = function updateTile() {
    this.loaded = !0;
    this.disableLoading();
  };

  _proto3.updateState = function updateState() {};

  _proto3.updateCalendar = function updateCalendar() {};

  _proto3.updateDateTime = function updateDateTime() {};

  _proto3.requestState = function requestState() {
    this.conn.invoke("RequestTileState", this.page, this.name);
  };

  _proto3.requestConfig = function requestConfig(n) {
    this.conn.invoke("RequestConfig", n, this.name);
  };

  _proto3.disableLoading = function disableLoading() {
    this.loadingDebouncer && window.clearTimeout(this.loadingDebouncer);
    this.loadingDebouncer = null;
    this.el.removeClass("tile-loading");
  };

  _proto3.getEntityIds = function getEntityIds() {
    return this.entityIds;
  };

  return Tile;
}();

var BlankTile = /*#__PURE__*/function (_Tile) {
  _inheritsLoose(BlankTile, _Tile);

  function BlankTile(n, t, i, r) {
    return _Tile.call(this, n, t, i, r, {
      canClick: !1,
      canLoad: !1
    }) || this;
  }

  return BlankTile;
}(Tile);

var LabelTile = /*#__PURE__*/function (_Tile2) {
  _inheritsLoose(LabelTile, _Tile2);

  function LabelTile(n, t, i, r) {
    return _Tile2.call(this, n, t, i, r, {
      canClick: !1,
      canLoad: !1
    }) || this;
  }

  return LabelTile;
}(Tile);

var DateTile = /*#__PURE__*/function (_Tile3) {
  _inheritsLoose(DateTile, _Tile3);

  function DateTile(n, t, i, r) {
    var _this6;

    _this6 = _Tile3.call(this, n, t, i, r, {
      canClick: !1,
      canLoad: !0
    }) || this;
    _this6.refreshTimer = null;
    return _this6;
  }

  var _proto4 = DateTile.prototype;

  _proto4.updateDateTime = function updateDateTime(n, t, i) {
    var _this7 = this;

    $("#tile-" + n.name).find("span[value-date]").text(t);
    $("#tile-" + n.name).find("span[value-time]").text(i);

    _Tile3.prototype.updateDateTime.call(this);

    this.refreshTimer || (this.refreshTimer = window.setTimeout(function (n) {
      n.refreshTimer = null, _this7.requestState();
    }, 3e4, this));
  };

  return DateTile;
}(Tile);

var StateTile = /*#__PURE__*/function (_Tile4) {
  _inheritsLoose(StateTile, _Tile4);

  function StateTile(n, t, i, r) {
    return _Tile4.call(this, n, t, i, r, {
      canClick: !1,
      canLoad: !0
    }) || this;
  }

  var _proto5 = StateTile.prototype;

  _proto5.updateTile = function updateTile(n) {
    this.tile = n;

    _Tile4.prototype.updateTile.call(this, n);
  };

  _proto5.updateState = function updateState(n) {
    var i = n.new_state.attributes.friendly_name.toString();
    this.tile.overrideLabel && (i = this.tile.overrideLabel);
    $("#tile-" + this.tile.name).find("span[value-name]").text(i);
    var t = this.tile.roundDecimals ? parseInt(n.new_state.state).toString() : n.new_state.state;
    this.tile.displayTextOff && t.toLowerCase() === "off" ? t = this.tile.displayTextOff : this.tile.displayTextOn && t.toLowerCase() === "on" && (t = this.tile.displayTextOn);
    n.new_state.attributes.unit_of_measurement && (t += n.new_state.attributes.unit_of_measurement.toString());
    $("#tile-" + this.tile.name).find("span[value-state]").text(t);
  };

  return StateTile;
}(Tile);

var LightTile = /*#__PURE__*/function (_Tile5) {
  _inheritsLoose(LightTile, _Tile5);

  function LightTile(n, t, i, r) {
    return _Tile5.call(this, n, t, i, r, {
      canClick: !0,
      canLoad: !0
    }) || this;
  }

  var _proto6 = LightTile.prototype;

  _proto6.updateTile = function updateTile(n) {
    this.tile = n;

    _Tile5.prototype.updateTile.call(this, n);
  };

  _proto6.updateState = function updateState(n) {
    var t = n.new_state.attributes.friendly_name.toString();
    this.tile.overrideLabel && (t = this.tile.overrideLabel);
    $("#tile-" + this.tile.name).find("span[value-name]").text(t);
    $("#tile-" + this.tile.name).find("span[value-icon]").removeClass("mdi-" + this.tile.displayIcon + " mdi-" + this.tile.displayOffIcon).addClass("mdi mdi-" + (n.new_state.state.toLowerCase() === "on" ? Utils.resolveIcon(n.new_state.attributes.icon, this.tile.displayIcon) : Utils.resolveIcon(n.new_state.attributes.icon, this.tile.displayOffIcon || this.tile.displayIcon)));
    $("#tile-" + this.tile.name).find("span[value-icon]").removeClass("state-off state-on").addClass(n.new_state.state.toLowerCase() === "on" ? "state-on" : "state-off");
    this.tile.onColor && n.new_state.state.toLowerCase() === "on" && $("#tile-" + this.tile.name + " .value").css("color", this.tile.onColor);
    this.tile.offColor && n.new_state.state.toLowerCase() !== "on" && $("#tile-" + this.tile.name + " .value").css("color", this.tile.offColor);
  };

  return LightTile;
}(Tile);

var SwitchTile = /*#__PURE__*/function (_Tile6) {
  _inheritsLoose(SwitchTile, _Tile6);

  function SwitchTile(n, t, i, r) {
    return _Tile6.call(this, n, t, i, r, {
      canClick: !0,
      canLoad: !0
    }) || this;
  }

  var _proto7 = SwitchTile.prototype;

  _proto7.updateTile = function updateTile(n) {
    this.tile = n;

    _Tile6.prototype.updateTile.call(this, n);
  };

  _proto7.updateState = function updateState(n) {
    var t;

    if (this.tile != null) {
      var i = n.new_state.attributes.friendly_name.toString();
      ((t = this.tile) === null || t === void 0 ? void 0 : t.overrideLabel) && (i = this.tile.overrideLabel);
      $("#tile-" + this.tile.name).find("span[value-name]").text(i);
      $("#tile-" + this.tile.name).find("span[value-icon]").removeClass("mdi-" + this.tile.displayIcon + " mdi-" + this.tile.displayOffIcon).addClass("mdi mdi-" + (this.isOnState(n.new_state.state) ? Utils.resolveIcon(n.new_state.attributes.icon, this.tile.displayIcon) : Utils.resolveIcon(n.new_state.attributes.icon, this.tile.displayOffIcon || this.tile.displayIcon)));
      $("#tile-" + this.tile.name).find("span[value-icon]").removeClass("state-off state-on").addClass(this.isOnState(n.new_state.state) ? "state-on" : "state-off");
      this.tile.onColor && this.isOnState(n.new_state.state) && $("#tile-" + this.tile.name + " .value").css("color", this.tile.onColor);
      this.tile.offColor && !this.isOnState(n.new_state.state) && $("#tile-" + this.tile.name + " .value").css("color", this.tile.offColor);

      _Tile6.prototype.updateState.call(this, n);
    }
  };

  _proto7.isOnState = function isOnState(n) {
    return n.toLowerCase() === "on" || n.toLowerCase() === "open" || n.toLowerCase() === "detected" || n.toLowerCase() === "playing" || n.toLowerCase() === "idle";
  };

  return SwitchTile;
}(Tile);

var PersonTile = /*#__PURE__*/function (_Tile7) {
  _inheritsLoose(PersonTile, _Tile7);

  function PersonTile(n, t, i, r) {
    return _Tile7.call(this, n, t, i, r, {
      canClick: !1,
      canLoad: !0
    }) || this;
  }

  var _proto8 = PersonTile.prototype;

  _proto8.updateTile = function updateTile(n) {
    this.tile = n;

    _Tile7.prototype.updateTile.call(this, n);
  };

  _proto8.updateState = function updateState(n) {
    var t = n.new_state.attributes.entity_picture ? n.new_state.attributes.entity_picture.toString() : "",
        i = n.new_state.state.replace("_", " "),
        r = n.new_state.attributes.friendly_name.toString();
    this.tile.overrideLabel && (r = this.tile.overrideLabel);
    var u = i.toLowerCase() === "home";
    t.toLowerCase().startsWith("http") || (t = Utils.resolveAssetUrl(window.ccOptions.baseUrl, window.ccOptions.overrideAssetUrl, t));
    $("#tile-" + this.tile.name).find("span[value-name]").text(r);
    $("#tile-" + this.tile.name).find("span[value-location]").text(i);
    $("#tile-" + this.tile.name).find("span[value-picture]").css("background-image", "url(" + t + ")").removeClass("bw");
    u || $("#tile-" + this.tile.name).find("span[value-picture]").addClass("bw");
  };

  return PersonTile;
}(Tile);

var WeatherTile = /*#__PURE__*/function (_Tile8) {
  _inheritsLoose(WeatherTile, _Tile8);

  function WeatherTile(n, t, i, r) {
    var _this8;

    _this8 = _Tile8.call(this, n, t, i, r, {
      canLoad: !0,
      canClick: !0
    }) || this;
    _this8.page = n;
    _this8.name = t;
    _this8.conn = i;
    _this8.windSpeed = "";
    _this8.windDir = "";
    _this8.hi = "";
    _this8.lo = "";
    _this8.iconEl = _this8.el.find(".condition-icon")[0];
    var u = document.defaultView.getComputedStyle(_this8.el[0]).color;
    _this8.skycons = new Skycons({
      color: u,
      resizeClear: !0
    });

    _this8.skycons.add(_this8.iconEl, Skycons.CLEAR_DAY);

    return _this8;
  }

  var _proto9 = WeatherTile.prototype;

  _proto9.updateTile = function updateTile(n) {
    this.tile = n;

    _Tile8.prototype.updateTile.call(this, n);
  };

  _proto9.updateState = function updateState(n) {
    var t = n.new_state == null ? null : n.new_state.state;

    switch (n.entity_id) {
      case this.tile.entityId:
        n.new_state.attributes.unit_of_measurement && (t += n.new_state.attributes.unit_of_measurement.toString());
        $("#tile-" + this.tile.name).find("span[value-temp]").text(t);
        break;

      case this.tile.highTempEntity:
        n.new_state.attributes.unit_of_measurement && (t += n.new_state.attributes.unit_of_measurement.toString());
        this.hi = "<i class=\"mdi mdi-arrow-up-thick\"></i> " + t;
        break;

      case this.tile.lowTempEntity:
        n.new_state.attributes.unit_of_measurement && (t += n.new_state.attributes.unit_of_measurement.toString());
        this.lo = "<i class=\"mdi mdi-arrow-down-thick\"></i> " + t;
        break;

      case this.tile.summaryEntity:
        $("#tile-" + this.tile.name).find("span[value-summary]").text(t);
        break;

      case this.tile.precipChanceEntity:
        n.new_state.attributes.unit_of_measurement && (t += n.new_state.attributes.unit_of_measurement.toString());
        $("#tile-" + this.tile.name).find("span[value-rain]").text("Rain: " + t);
        break;

      case this.tile.windSpeedEntity:
        this.windSpeed = this.tile.roundWindSpeed ? parseInt(t).toString() : t;
        n.new_state.attributes.unit_of_measurement && (this.windSpeed += n.new_state.attributes.unit_of_measurement.toString());
        break;

      case this.tile.windDirectionEntity:
        this.windDir = Utils.convertDegreesToCardinal(parseInt(t));
        this.windDir = "<i class=\"mdi mdi-" + Utils.convertCardinalToIcon(this.windDir) + "\"></i> " + this.windDir;
        break;

      case this.tile.iconEntity:
        t ? (this.skycons.set(this.iconEl, t), this.skycons.play()) : (this.skycons.remove(this.iconEl), $(this.iconEl).hide());
    }

    $("#tile-" + this.tile.name).find("span[value-hi-lo]").html("" + (this.hi && this.lo ? this.hi + " / " + this.lo : this.hi + this.lo));
    $("#tile-" + this.tile.name).find("span[value-wind]").html("Wind: " + (this.windSpeed + " " + this.windDir).trim());
  };

  return WeatherTile;
}(Tile);

var CameraTile = /*#__PURE__*/function (_Tile9) {
  _inheritsLoose(CameraTile, _Tile9);

  function CameraTile(n, t, i, r) {
    var _this9;

    _this9 = _Tile9.call(this, n, t, i, r, {
      canClick: !1,
      canLoad: !1
    }) || this;
    _this9.haConn = r;
    return _this9;
  }

  var _proto10 = CameraTile.prototype;

  _proto10.updateTile = function updateTile(n) {
    var _this10 = this;

    this.tile = n;

    _Tile9.prototype.updateTile.call(this, n);

    this.updateCameraFeed();
    window.setInterval(function () {
      return _this10.updateCameraFeed();
    }, (this.tile.refreshRate > 0 ? this.tile.refreshRate : 1) * 1e3);
  };

  _proto10.updateCameraFeed = function updateCameraFeed() {
    var _this11 = this;

    this.haConn.getCameraImage(this.tile.entityId).then(function (n) {
      var t = _this11.tile.imageCropMode.toLowerCase() === "cover" || _this11.tile.imageCropMode.toLowerCase() === "contain" ? _this11.tile.imageCropMode.toLowerCase() : "100% 100%",
          i = _this11.tile.imageCropMode.toLowerCase() === "cover" || _this11.tile.imageCropMode.toLowerCase() === "contain" ? "50% 50%" : "0 0";
      $("#tile-" + _this11.tile.name).css({
        backgroundImage: "url('data:" + n.result.content_type + ";base64," + n.result.content + "')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: i,
        backgroundSize: t
      });
    });
  };

  return CameraTile;
}(Tile);

var SceneTile = /*#__PURE__*/function (_Tile10) {
  _inheritsLoose(SceneTile, _Tile10);

  function SceneTile(n, t, i, r) {
    return _Tile10.call(this, n, t, i, r, {
      canClick: !0,
      canLoad: !0
    }) || this;
  }

  var _proto11 = SceneTile.prototype;

  _proto11.updateTile = function updateTile(n) {
    this.tile = n;

    _Tile10.prototype.updateTile.call(this, n);
  };

  _proto11.updateState = function updateState(n) {
    var t = n.new_state.attributes.friendly_name.toString();
    this.tile.overrideLabel && (t = this.tile.overrideLabel);
    $("#tile-" + this.tile.name).find("span[value-name]").text(t);
    $("#tile-" + this.tile.name).find("span[value-icon]").addClass("mdi mdi-" + (this.tile.displayIcon || "filmstrip"));
    $("#tile-" + this.tile.name + " .value").css("color", this.tile.iconColor);
  };

  return SceneTile;
}(Tile);

var MediaTile = /*#__PURE__*/function (_Tile11) {
  _inheritsLoose(MediaTile, _Tile11);

  function MediaTile(n, t, i, r) {
    var _this12;

    _this12 = _Tile11.call(this, n, t, i, r, {
      canClick: !0,
      canLoad: !0
    }) || this;
    _this12.haConn = r;
    return _this12;
  }

  var _proto12 = MediaTile.prototype;

  _proto12.updateTile = function updateTile(n) {
    var _this13 = this;

    this.tile = n;

    _Tile11.prototype.updateTile.call(this, n);

    this.updateMediaImage();
    window.setInterval(function () {
      return _this13.updateMediaImage();
    }, (this.tile.refreshRate > 0 ? this.tile.refreshRate : 1) * 1e3);
  };

  _proto12.updateMediaImage = function updateMediaImage() {
    var _this14 = this;

    var n;

    if ((n = this.state) === null || n === void 0 ? void 0 : n.new_state) {
      var t = this.state.new_state.attributes.friendly_name.toString();
      (this.tile.overrideLabel && (t = this.tile.overrideLabel), this.state.new_state.attributes.entity_picture || (t += " (" + this.state.new_state.state + ")"), $("#tile-" + this.tile.name).toggleClass("media-idle", this.state.new_state.attributes.media_title === "Nothing playing" || (this.state.new_state.state == "paused" || this.state.new_state.state == "idle") && !this.state.new_state.attributes.entity_picture), $("#tile-" + this.tile.name).find("span[value-name]").text(this.tile.showLabel ? t : ""), $("#tile-" + this.tile.name).find("span[value-title]").text(this.tile.showTitle && this.state.new_state.attributes.media_title && this.state.new_state.attributes.media_title !== "Nothing playing" ? this.state.new_state.attributes.media_title.toString() : ""), this.state.new_state.attributes.entity_picture) && this.haConn.getMediaImage(this.tile.entityId).then(function (n) {
        var t = _this14.tile.imageCropMode.toLowerCase() === "cover" || _this14.tile.imageCropMode.toLowerCase() === "contain" ? _this14.tile.imageCropMode.toLowerCase() : "100% 100%",
            i = _this14.tile.imageCropMode.toLowerCase() === "cover" || _this14.tile.imageCropMode.toLowerCase() === "contain" ? "50% 50%" : "0 0";
        $("#tile-" + _this14.tile.name).css({
          backgroundImage: "url('data:" + n.result.content_type + ";base64," + n.result.content + "')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: i,
          backgroundSize: t
        });
      });
    }
  };

  _proto12.updateState = function updateState(n) {
    this.state = n;
  };

  return MediaTile;
}(Tile);

var NavigationTile = /*#__PURE__*/function (_Tile12) {
  _inheritsLoose(NavigationTile, _Tile12);

  function NavigationTile(n, t, i, r) {
    return _Tile12.call(this, n, t, i, r, {
      canClick: !0,
      canLoad: !1
    }) || this;
  }

  var _proto13 = NavigationTile.prototype;

  _proto13.updateTile = function updateTile(n) {
    this.navTile = n;
    $("#tile-" + n.name).find("span[value-name]").text(this.navTile.label);
    $("#tile-" + n.name).find("span[value-icon]").addClass("mdi mdi-" + this.navTile.displayIcon);

    _Tile12.prototype.updateTile.call(this);
  };

  _proto13.onClick = function onClick() {
    switch (this.navTile.mode.toLowerCase().trim()) {
      case "home":
        window.location.href = "/d/";
        return;

      case "refresh":
        window.location.reload();
        return;

      case "nav":
        window.location.href = "/d/" + this.navTile.target;
        return;
    }
  };

  return NavigationTile;
}(Tile);

var CalendarTile = /*#__PURE__*/function (_Tile13) {
  _inheritsLoose(CalendarTile, _Tile13);

  function CalendarTile(n, t, i, r) {
    var _this15;

    _this15 = _Tile13.call(this, n, t, i, r, {
      canLoad: !0,
      canClick: !1
    }) || this;
    _this15.eventContainer = $("#tile-" + t + " div.calendar-events");
    return _this15;
  }

  var _proto14 = CalendarTile.prototype;

  _proto14.updateTile = function updateTile(n) {
    this.tile = n;

    _Tile13.prototype.updateTile.call(this, n);
  };

  _proto14.updateCalendar = function updateCalendar(n, t) {
    var _this16 = this;

    var i = n.attributes.friendly_name.toString();
    this.tile.overrideLabel && (i = this.tile.overrideLabel);
    $("#tile-" + this.tile.name).find("span[value-name]").text(i);
    this.refreshEvents(t);

    _Tile13.prototype.updateCalendar.call(this);

    this.tile.refreshRate > 0 && (this.refreshTimer || (this.refreshTimer = window.setTimeout(function (n) {
      n.refreshTimer = null, _this16.requestState();
    }, 3e4, this)));
  };

  _proto14.refreshEvents = function refreshEvents(n) {
    var t;

    if (this.eventContainer.empty(), n.length) {
      var i = "";

      for (var r = 0; r < n.length; r++) {
        var u = n[r],
            f = this.getEventHeader(u);
        i != f && (this.eventContainer.append("<h3>" + f + "</h3>"), i = f);
        this.eventContainer.append("<p><span class=\"summary\">" + u.summary + "</span><span class=\"time\">" + (u.start.dateTime ? moment((t = u.start.dateTime, t !== null && t !== void 0 ? t : u.start.date)).format("LT") : "All Day") + "</span></p>");
      }
    } else this.eventContainer.append('<span class="no-events">No events!<\/span>');
  };

  _proto14.getEventHeader = function getEventHeader(n) {
    var i;
    var r = moment(),
        u = moment().add(1, "day");
    var f = this.formatHeader(r),
        e = this.formatHeader(u);
    var o = moment((i = n.start.dateTime, i !== null && i !== void 0 ? i : n.start.date));
    var t = this.formatHeader(o);
    return t === f ? t += " (Today)" : t === e && (t += " (Tomorrow)"), t;
  };

  _proto14.formatHeader = function formatHeader(n) {
    return n.format("ddd") + ", " + n.format("ll");
  };

  return CalendarTile;
}(Tile);

var TileMap = function TileMap() {};

TileMap.ClassMap = {
  Blank: BlankTile,
  Label: LabelTile,
  Date: DateTile,
  State: StateTile,
  Light: LightTile,
  Switch: SwitchTile,
  Person: PersonTile,
  Weather: WeatherTile,
  Camera: CameraTile,
  Scene: SceneTile,
  Media: MediaTile,
  Navigation: NavigationTile,
  Calendar: CalendarTile
};

var CommandCenter = /*#__PURE__*/function () {
  function CommandCenter() {
    var _this17 = this;

    this.tiles = [];
    $(function () {
      return _this17.init();
    });
  }

  var _proto15 = CommandCenter.prototype;

  _proto15.init = function init() {
    window.ccOptions.mode == PageMode.Admin ? this.initAdmin() : this.initUser();
    this.initializeMdiPreview();
    this.initializeColorPreview();
    this.initializeNightlyRefresh();
  };

  _proto15.initAdmin = function initAdmin() {
    var _this18 = this;

    $(window).on("beforeunload", function (n) {
      if (_this18.pageIsDirty && $(n.target.activeElement).prop("type") !== "submit") return "You have unsaved changes. Are you sure you want to leave?";
    });

    if ($("#importTheme, #importConfig").click(function () {
      confirm("WARNING: This will OVERWRITE your current settings. Export first if you want to save what you have now! Continue?") && $("#importBrowser").click();
    }), $("#importBrowser").change(function () {
      $("#importForm").submit();
    }), $("#resetConfig").click(function (n) {
      return confirm("WARNING: This will COMPLETELY RESET your HACC installation and PERMANENTLY DELETE all of your tiles, themes, and settings. Are you sure you want to reset your config?") ? !0 : (n.preventDefault(), !1);
    }), $(".ui.accordion").accordion(), $(".ui.checkbox").checkbox(), $(".ui.dropdown").not(".no-placeholder").dropdown({
      fullTextSearch: !0
    }), $(".ui.no-placeholder.dropdown").dropdown({
      placeholder: !1
    }), $("#Page_PageFontFace option").each(function (n, t) {
      $(t).parent().siblings(".menu").find('.item[data-value="' + $(t).text() + '"]').css("font-family", $(t).text());
    }), $(".preview-layout-grid").length) {
      $("#auto-layout").click(function () {
        confirm("This will reset the layout for this page and attempt to automatically arrange all tiles evenly.\n\nYour tiles will all probably change locations. You have been warned. :)\n\nAre you sure you want to reset the layout?") && _this18.pk.layout();
      });
      $(".preview-layout-grid").prepend("<div class=\"preview-layout-item\" style=\"opacity: 0; position: absolute; top: " + window.ccOptions.tilePreviewPadding + "px; left: " + window.ccOptions.tilePreviewPadding + "px; width: " + window.ccOptions.tilePreviewSize + "px; height: " + window.ccOptions.tilePreviewSize + "px;\" id=\"grid__tmp\"></div>");
      this.pk = window.ccOptions ? new Packery(".preview-layout-grid", {
        itemSelector: ".preview-layout-item",
        columnWidth: window.ccOptions.tilePreviewSize,
        rowHeight: window.ccOptions.tilePreviewSize,
        gutter: window.ccOptions.tilePreviewPadding,
        initLayout: !1
      }) : new Packery(".preview-layout-grid", {
        itemSelector: ".preview-layout-item",
        columnWidth: ".preview-layout-item",
        rowHeight: ".preview-layout-item",
        gutter: window.ccOptions.tilePreviewPadding,
        initLayout: !1
      });
      this.pk.on("layoutComplete", function () {
        return _this18.writeItemLayout();
      });
      this.pk.on("dragItemPositioned", function () {
        setTimeout(function () {
          _this18.writeItemLayout(), _this18.pageIsDirty = !0;
        }, 25);
      });
      this.writeItemLayout();
      typeof Draggabilly == "function" ? $(".preview-layout-item").each(function (n, t) {
        return _this18.pk.bindDraggabillyEvents(new Draggabilly(t, {
          containment: ".preview-layout-grid"
        }));
      }) : console.warn("Draggabilly is not available - drag and drop interface will not work.");
      $("#grid__tmp").remove();
      this.pk.initShiftLayout(Array.from(document.querySelectorAll(".preview-layout-grid > .preview-layout-item")));
    }
  };

  _proto15.initUser = function initUser() {
    var _this19 = this;

    window.ccOptions.socketUrl ? this.conn = new HAConnection(window.ccOptions.socketUrl) : $("#alerts").show().find(".alert-message").text("[E] HA connection not defined...");
    this.conn.OnConnectionStateChanged.on(function (n) {
      n == HAConnectionState.Closed ? $("#alerts").show().find(".alert-message").text("[H] Connection lost, reconnecting...") : n == HAConnectionState.Open && ($("#alerts").hide(), _this19.conn.refreshAllStates());
    });
    this.conn.OnStateChanged.on(function (n) {
      var t = _this19.findTilesByEntityId(n.data.entity_id);

      for (var _iterator2 = _createForOfIteratorHelperLoose(t), _step2; !(_step2 = _iterator2()).done;) {
        var i = _step2.value;
        i.updateState(n.data), console.info("Updating tile for entity \"" + n.data.entity_id + "\" to state \"" + n.data.new_state.state + "\".");
      }
    });
    this.tileConn = new signalR.HubConnectionBuilder().withUrl("/hubs/tile").build();
    this.tileConn.onclose(function () {
      $("#alerts").show().find(".alert-message").text("[S] Connection lost, reconnecting..."), window.setTimeout(function () {
        window.location.reload();
      }, 1e4);
    });
    this.tileConn.start().then(function () {
      $(".tiles .tile").each(function (n, t) {
        try {
          var _n2 = new TileMap.ClassMap[$(t).data("tile-type").toString()](window.ccOptions.pageId, $(t).data("tile-name"), _this19.tileConn, _this19.conn);

          _this19.tiles.push(_n2);
        } catch (i) {
          console.error('Error instantiating class "' + ($(t).data("tile-type") || "__MISSING__") + 'Tile". Was it added to the tile type map?', i, t);
        }
      }), _this19.initHandle || (_this19.initHandle = window.setInterval(function () {
        return _this19.waitAndPerformInit();
      }, 25)), window.ccOptions.autoReturn > 0 && window.setTimeout(function () {
        return window.location.href = "/d/";
      }, window.ccOptions.autoReturn * 1e3);
    });
  };

  _proto15.waitAndPerformInit = function waitAndPerformInit() {
    this.tiles.filter(function (n) {
      return n.loaded;
    }).length === this.tiles.length && (this.conn.initialize(), window.clearInterval(this.initHandle));
  };

  _proto15.findTilesByEntityId = function findTilesByEntityId(n) {
    return this.tiles.filter(function (t) {
      var i = t.getEntityIds();
      return i.some(function (t) {
        return t.toLowerCase() === n.toLowerCase();
      });
    });
  };

  _proto15.initializeNightlyRefresh = function initializeNightlyRefresh() {
    window.setInterval(function () {
      new Date().getHours() == 2 && window.setTimeout(function () {
        window.location.reload();
      }, 36e5);
    }, 35e5);
  };

  _proto15.initializeMdiPreview = function initializeMdiPreview() {
    var _this20 = this;

    $(".mdi-icon-placeholder + input").each(function (n, t) {
      $(t).keyup(function (n) {
        _this20.refreshDynamicIcon(n.currentTarget);
      }), _this20.refreshDynamicIcon(t);
    });
  };

  _proto15.refreshDynamicIcon = function refreshDynamicIcon(n) {
    $(n).parent().children(".mdi-icon-placeholder").attr("class", "large icon mdi-icon-placeholder").addClass("mdi mdi-" + $(n).val());
  };

  _proto15.initializeColorPreview = function initializeColorPreview() {
    var _this21 = this;

    $(".color-preview + input").each(function (n, t) {
      $(t).keyup(function (n) {
        _this21.refreshDynamicColor(n.currentTarget);
      }), _this21.refreshDynamicColor(t);
    });
  };

  _proto15.refreshDynamicColor = function refreshDynamicColor(n) {
    $(n).parent().children(".color-preview").css("color", "" + $(n).val());
  };

  _proto15.writeItemLayout = function writeItemLayout() {
    var n = [],
        t = this.pk.getItemElements();

    for (var i = 0; i < t.length; i++) {
      var r = $(t[i]);
      n.push({
        index: i,
        x: parseInt(r.css("left").replace("px", "")),
        y: parseInt(r.css("top").replace("px", "")),
        name: r.data("tile-name")
      });
    }

    $("#layout-serialized").val(JSON.stringify(n));
  };

  return CommandCenter;
}();

__app = new CommandCenter();
Packery.prototype.initShiftLayout = function (n) {
  this._resetLayout();

  this.items = n.map(function (n) {
    var t = this.getItem(n);
    var i = parseInt(n.style.left.replace("px", "")),
        r = parseInt(n.style.top.replace("px", "")),
        u = n.clientWidth,
        f = n.clientHeight;
    return t.rect.x = i - this.gutter, t.rect.y = r, t.rect.height = f, t.rect.width = u, t.position.x = i - this.gutter, t.position.y = r, t;
  }, this);
  this.shiftLayout();
}, function (n) {
  n.entityId = "entityId";
  n.iconEntity = "iconEntity";
  n.summaryEntity = "summaryEntity";
  n.precipChanceEntity = "precipChanceEntity";
  n.highTempEntity = "highTempEntity";
  n.lowTempEntity = "lowTempEntity";
  n.windSpeedEntity = "windSpeedEntity";
  n.windDirectionEntity = "windDirectionEntity";
}(WeatherTileEntities || (WeatherTileEntities = {}));