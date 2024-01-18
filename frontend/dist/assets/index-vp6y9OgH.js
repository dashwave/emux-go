(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity)
      fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy)
      fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous")
      fetchOpts.credentials = "omit";
    else
      fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
let urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
let nanoid = (size2 = 21) => {
  let id = "";
  let i = size2;
  while (i--) {
    id += urlAlphabet[Math.random() * 64 | 0];
  }
  return id;
};
const runtimeURL = window.location.origin + "/wails/runtime";
const objectNames = {
  Call: 0,
  Clipboard: 1,
  Application: 2,
  Events: 3,
  ContextMenu: 4,
  Dialog: 5,
  Window: 6,
  Screens: 7,
  System: 8,
  Browser: 9
};
let clientId = nanoid();
function newRuntimeCallerWithID(object, windowName) {
  return function(method, args = null) {
    return runtimeCallWithID(object, method, windowName, args);
  };
}
function runtimeCallWithID(objectID, method, windowName, args) {
  let url = new URL(runtimeURL);
  url.searchParams.append("object", objectID);
  url.searchParams.append("method", method);
  let fetchOptions = {
    headers: {}
  };
  if (windowName) {
    fetchOptions.headers["x-wails-window-name"] = windowName;
  }
  if (args) {
    url.searchParams.append("args", JSON.stringify(args));
  }
  fetchOptions.headers["x-wails-client-id"] = clientId;
  return new Promise((resolve, reject) => {
    fetch(url, fetchOptions).then((response) => {
      if (response.ok) {
        if (response.headers.get("Content-Type") && response.headers.get("Content-Type").indexOf("application/json") !== -1) {
          return response.json();
        } else {
          return response.text();
        }
      }
      reject(Error(response.statusText));
    }).then((data) => resolve(data)).catch((error) => reject(error));
  });
}
let call$4 = newRuntimeCallerWithID(objectNames.System, "");
const environment = 1;
function Environment() {
  return call$4(environment);
}
let invoke = null;
let environmentCache = null;
Environment().then((result) => {
  environmentCache = result;
  invoke = IsWindows() ? window.chrome.webview.postMessage : window.webkit.messageHandlers.external.postMessage;
}).catch((error) => {
  console.error(`Error getting Environment: ${error}`);
});
function IsWindows() {
  return environmentCache.OS === "windows";
}
function IsDebug() {
  return environmentCache.Debug === true;
}
const call$3 = newRuntimeCallerWithID(objectNames.ContextMenu, "");
const ContextMenuOpen = 0;
function openContextMenu(id, x, y, data) {
  void call$3(ContextMenuOpen, { id, x, y, data });
}
function setupContextMenus() {
  window.addEventListener("contextmenu", contextMenuHandler);
}
function contextMenuHandler(event) {
  let element = event.target;
  let customContextMenu = window.getComputedStyle(element).getPropertyValue("--custom-contextmenu");
  customContextMenu = customContextMenu ? customContextMenu.trim() : "";
  if (customContextMenu) {
    event.preventDefault();
    let customContextMenuData = window.getComputedStyle(element).getPropertyValue("--custom-contextmenu-data");
    openContextMenu(customContextMenu, event.clientX, event.clientY, customContextMenuData);
    return;
  }
  processDefaultContextMenu(event);
}
function processDefaultContextMenu(event) {
  if (IsDebug()) {
    return;
  }
  const element = event.target;
  const computedStyle = window.getComputedStyle(element);
  const defaultContextMenuAction = computedStyle.getPropertyValue("--default-contextmenu").trim();
  switch (defaultContextMenuAction) {
    case "show":
      return;
    case "hide":
      event.preventDefault();
      return;
    default:
      if (element.isContentEditable) {
        return;
      }
      const selection = window.getSelection();
      const hasSelection = selection.toString().length > 0;
      if (hasSelection) {
        for (let i = 0; i < selection.rangeCount; i++) {
          const range = selection.getRangeAt(i);
          const rects = range.getClientRects();
          for (let j = 0; j < rects.length; j++) {
            const rect = rects[j];
            if (document.elementFromPoint(rect.left, rect.top) === element) {
              return;
            }
          }
        }
      }
      if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
        if (hasSelection || !element.readOnly && !element.disabled) {
          return;
        }
      }
      event.preventDefault();
  }
}
let flags = /* @__PURE__ */ new Map();
function convertToMap(obj) {
  const map = /* @__PURE__ */ new Map();
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null) {
      map.set(key, convertToMap(value));
    } else {
      map.set(key, value);
    }
  }
  return map;
}
fetch("/wails/flags").then((response) => {
  response.json().then((data) => {
    flags = convertToMap(data);
  });
});
function getValueFromMap(keyString) {
  const keys = keyString.split(".");
  let value = flags;
  for (const key of keys) {
    if (value instanceof Map) {
      value = value.get(key);
    } else {
      value = value[key];
    }
    if (value === void 0) {
      break;
    }
  }
  return value;
}
function GetFlag(keyString) {
  return getValueFromMap(keyString);
}
let shouldDrag = false;
let resizeEdge = null;
let resizable = false;
let defaultCursor = "auto";
window._wails = window._wails || {};
window._wails.setResizable = setResizable$1;
window._wails.endDrag = endDrag;
function dragTest(e) {
  let val = window.getComputedStyle(e.target).getPropertyValue("--webkit-app-region");
  if (!val || val === "" || val.trim() !== "drag" || e.buttons !== 1) {
    return false;
  }
  return e.detail === 1;
}
function setupDrag() {
  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
}
function setResizable$1(value) {
  resizable = value;
}
function endDrag() {
  document.body.style.cursor = "default";
  shouldDrag = false;
}
function testResize() {
  if (resizeEdge) {
    invoke(`resize:${resizeEdge}`);
    return true;
  }
  return false;
}
function onMouseDown(e) {
  if (IsWindows() && testResize() || dragTest(e)) {
    shouldDrag = !!isValidDrag(e);
  }
}
function isValidDrag(e) {
  return !(e.offsetX > e.target.clientWidth || e.offsetY > e.target.clientHeight);
}
function onMouseUp(e) {
  let mousePressed = e.buttons !== void 0 ? e.buttons : e.which;
  if (mousePressed > 0) {
    endDrag();
  }
}
function setResize(cursor = defaultCursor) {
  document.documentElement.style.cursor = cursor;
  resizeEdge = cursor;
}
function onMouseMove(e) {
  shouldDrag = checkDrag(e);
  if (IsWindows() && resizable) {
    handleResize(e);
  }
}
function checkDrag(e) {
  let mousePressed = e.buttons !== void 0 ? e.buttons : e.which;
  if (shouldDrag && mousePressed > 0) {
    invoke("drag");
    return false;
  }
  return shouldDrag;
}
function handleResize(e) {
  let resizeHandleHeight = GetFlag("system.resizeHandleHeight") || 5;
  let resizeHandleWidth = GetFlag("system.resizeHandleWidth") || 5;
  let cornerExtra = GetFlag("resizeCornerExtra") || 10;
  let rightBorder = window.outerWidth - e.clientX < resizeHandleWidth;
  let leftBorder = e.clientX < resizeHandleWidth;
  let topBorder = e.clientY < resizeHandleHeight;
  let bottomBorder = window.outerHeight - e.clientY < resizeHandleHeight;
  let rightCorner = window.outerWidth - e.clientX < resizeHandleWidth + cornerExtra;
  let leftCorner = e.clientX < resizeHandleWidth + cornerExtra;
  let topCorner = e.clientY < resizeHandleHeight + cornerExtra;
  let bottomCorner = window.outerHeight - e.clientY < resizeHandleHeight + cornerExtra;
  if (!leftBorder && !rightBorder && !topBorder && !bottomBorder && resizeEdge !== void 0) {
    setResize();
  } else if (rightCorner && bottomCorner)
    setResize("se-resize");
  else if (leftCorner && bottomCorner)
    setResize("sw-resize");
  else if (leftCorner && topCorner)
    setResize("nw-resize");
  else if (topCorner && rightCorner)
    setResize("ne-resize");
  else if (leftBorder)
    setResize("w-resize");
  else if (topBorder)
    setResize("n-resize");
  else if (bottomBorder)
    setResize("s-resize");
  else if (rightBorder)
    setResize("e-resize");
}
let callResponses = /* @__PURE__ */ new Map();
window._wails = window._wails || {};
window._wails.callResultHandler = resultHandler;
window._wails.callErrorHandler = errorHandler;
function resultHandler(id, data, isJSON) {
  const promiseHandler = getAndDeleteResponse(id);
  if (promiseHandler) {
    promiseHandler.resolve(isJSON ? JSON.parse(data) : data);
  }
}
function errorHandler(id, message) {
  const promiseHandler = getAndDeleteResponse(id);
  if (promiseHandler) {
    promiseHandler.reject(message);
  }
}
function getAndDeleteResponse(id) {
  const response = callResponses.get(id);
  callResponses.delete(id);
  return response;
}
const call$2 = newRuntimeCallerWithID(objectNames.Browser, "");
const BrowserOpenURL = 0;
function OpenURL(url) {
  return call$2(BrowserOpenURL, { url });
}
const center = 0;
const setTitle = 1;
const fullscreen = 2;
const unFullscreen = 3;
const setSize = 4;
const size = 5;
const setMaxSize = 6;
const setMinSize = 7;
const setAlwaysOnTop = 8;
const setRelativePosition = 9;
const relativePosition = 10;
const screen = 11;
const hide = 12;
const maximise = 13;
const unMaximise = 14;
const toggleMaximise = 15;
const minimise = 16;
const unMinimise = 17;
const restore = 18;
const show = 19;
const close = 20;
const setBackgroundColour = 21;
const setResizable = 22;
const width = 23;
const height = 24;
const zoomIn = 25;
const zoomOut = 26;
const zoomReset = 27;
const getZoomLevel = 28;
const setZoomLevel = 29;
function createWindow(call2) {
  return {
    Get: (windowName) => createWindow(newRuntimeCallerWithID(objectNames.Window, windowName)),
    Center: () => call2(center),
    SetTitle: (title) => call2(setTitle, { title }),
    Fullscreen: () => call2(fullscreen),
    UnFullscreen: () => call2(unFullscreen),
    SetSize: (width2, height2) => call2(setSize, { width: width2, height: height2 }),
    Size: () => call2(size),
    SetMaxSize: (width2, height2) => call2(setMaxSize, { width: width2, height: height2 }),
    SetMinSize: (width2, height2) => call2(setMinSize, { width: width2, height: height2 }),
    SetAlwaysOnTop: (onTop) => call2(setAlwaysOnTop, { alwaysOnTop: onTop }),
    SetRelativePosition: (x, y) => call2(setRelativePosition, { x, y }),
    RelativePosition: () => call2(relativePosition),
    Screen: () => call2(screen),
    Hide: () => call2(hide),
    Maximise: () => call2(maximise),
    UnMaximise: () => call2(unMaximise),
    ToggleMaximise: () => call2(toggleMaximise),
    Minimise: () => call2(minimise),
    UnMinimise: () => call2(unMinimise),
    Restore: () => call2(restore),
    Show: () => call2(show),
    Close: () => call2(close),
    SetBackgroundColour: (r, g, b, a) => call2(setBackgroundColour, { r, g, b, a }),
    SetResizable: (resizable2) => call2(setResizable, { resizable: resizable2 }),
    Width: () => call2(width),
    Height: () => call2(height),
    ZoomIn: () => call2(zoomIn),
    ZoomOut: () => call2(zoomOut),
    ZoomReset: () => call2(zoomReset),
    GetZoomLevel: () => call2(getZoomLevel),
    SetZoomLevel: (zoomLevel) => call2(setZoomLevel, { zoomLevel })
  };
}
function Get(windowName) {
  return createWindow(newRuntimeCallerWithID(objectNames.Window, windowName));
}
const call$1 = newRuntimeCallerWithID(objectNames.Events, "");
const EmitMethod = 0;
const eventListeners = /* @__PURE__ */ new Map();
class Listener {
  constructor(eventName, callback, maxCallbacks) {
    this.eventName = eventName;
    this.maxCallbacks = maxCallbacks || -1;
    this.Callback = (data) => {
      callback(data);
      if (this.maxCallbacks === -1)
        return false;
      this.maxCallbacks -= 1;
      return this.maxCallbacks === 0;
    };
  }
}
class WailsEvent {
  constructor(name, data = null) {
    this.name = name;
    this.data = data;
  }
}
window._wails = window._wails || {};
window._wails.dispatchWailsEvent = dispatchWailsEvent;
function dispatchWailsEvent(event) {
  let listeners = eventListeners.get(event.name);
  if (listeners) {
    let toRemove = listeners.filter((listener) => {
      let remove = listener.Callback(event);
      if (remove)
        return true;
    });
    if (toRemove.length > 0) {
      listeners = listeners.filter((l) => !toRemove.includes(l));
      if (listeners.length === 0)
        eventListeners.delete(event.name);
      else
        eventListeners.set(event.name, listeners);
    }
  }
}
function OnMultiple(eventName, callback, maxCallbacks) {
  let listeners = eventListeners.get(eventName) || [];
  const thisListener = new Listener(eventName, callback, maxCallbacks);
  listeners.push(thisListener);
  eventListeners.set(eventName, listeners);
  return () => listenerOff(thisListener);
}
function On(eventName, callback) {
  return OnMultiple(eventName, callback, -1);
}
function listenerOff(listener) {
  const eventName = listener.eventName;
  let listeners = eventListeners.get(eventName).filter((l) => l !== listener);
  if (listeners.length === 0)
    eventListeners.delete(eventName);
  else
    eventListeners.set(eventName, listeners);
}
function Emit(event) {
  return call$1(EmitMethod, event);
}
const DialogQuestion = 3;
const call = newRuntimeCallerWithID(objectNames.Dialog, "");
const dialogResponses = /* @__PURE__ */ new Map();
function generateID() {
  let result;
  do {
    result = nanoid();
  } while (dialogResponses.has(result));
  return result;
}
function dialog(type, options = {}) {
  const id = generateID();
  options["dialog-id"] = id;
  return new Promise((resolve, reject) => {
    dialogResponses.set(id, { resolve, reject });
    call(type, options).catch((error) => {
      reject(error);
      dialogResponses.delete(id);
    });
  });
}
window._wails = window._wails || {};
window._wails.dialogErrorCallback = dialogErrorCallback;
window._wails.dialogResultCallback = dialogResultCallback;
function dialogResultCallback(id, data, isJSON) {
  let p = dialogResponses.get(id);
  if (p) {
    if (isJSON) {
      p.resolve(JSON.parse(data));
    } else {
      p.resolve(data);
    }
    dialogResponses.delete(id);
  }
}
function dialogErrorCallback(id, message) {
  let p = dialogResponses.get(id);
  if (p) {
    p.reject(message);
    dialogResponses.delete(id);
  }
}
const Question = (options) => dialog(DialogQuestion, options);
function sendEvent(eventName, data = null) {
  let event = new WailsEvent(eventName, data);
  Emit(event);
}
function addWMLEventListeners() {
  const elements = document.querySelectorAll("[wml-event]");
  elements.forEach(function(element) {
    const eventType = element.getAttribute("wml-event");
    const confirm = element.getAttribute("wml-confirm");
    const trigger = element.getAttribute("wml-trigger") || "click";
    let callback = function() {
      if (confirm) {
        Question({ Title: "Confirm", Message: confirm, Detached: false, Buttons: [{ Label: "Yes" }, { Label: "No", IsDefault: true }] }).then(function(result) {
          if (result !== "No") {
            sendEvent(eventType);
          }
        });
        return;
      }
      sendEvent(eventType);
    };
    element.removeEventListener(trigger, callback);
    element.addEventListener(trigger, callback);
  });
}
function callWindowMethod(windowName, method) {
  let targetWindow = Get(windowName);
  let methodMap = WindowMethods(targetWindow);
  if (!methodMap.has(method)) {
    console.log("Window method " + method + " not found");
  }
  try {
    methodMap.get(method)();
  } catch (e) {
    console.error("Error calling window method '" + method + "': " + e);
  }
}
function addWMLWindowListeners() {
  const elements = document.querySelectorAll("[wml-window]");
  elements.forEach(function(element) {
    const windowMethod = element.getAttribute("wml-window");
    const confirm = element.getAttribute("wml-confirm");
    const trigger = element.getAttribute("wml-trigger") || "click";
    const targetWindow = element.getAttribute("wml-target-window") || "";
    let callback = function() {
      if (confirm) {
        Question({ Title: "Confirm", Message: confirm, Buttons: [{ Label: "Yes" }, { Label: "No", IsDefault: true }] }).then(function(result) {
          if (result !== "No") {
            callWindowMethod(targetWindow, windowMethod);
          }
        });
        return;
      }
      callWindowMethod(targetWindow, windowMethod);
    };
    element.removeEventListener(trigger, callback);
    element.addEventListener(trigger, callback);
  });
}
function addWMLOpenBrowserListener() {
  const elements = document.querySelectorAll("[wml-openurl]");
  elements.forEach(function(element) {
    const url = element.getAttribute("wml-openurl");
    const confirm = element.getAttribute("wml-confirm");
    const trigger = element.getAttribute("wml-trigger") || "click";
    let callback = function() {
      if (confirm) {
        Question({ Title: "Confirm", Message: confirm, Buttons: [{ Label: "Yes" }, { Label: "No", IsDefault: true }] }).then(function(result) {
          if (result !== "No") {
            void OpenURL(url);
          }
        });
        return;
      }
      void OpenURL(url);
    };
    element.removeEventListener(trigger, callback);
    element.addEventListener(trigger, callback);
  });
}
function Reload() {
  console.log("Reloading WML");
  addWMLEventListeners();
  addWMLWindowListeners();
  addWMLOpenBrowserListener();
}
function WindowMethods(targetWindow) {
  let result = /* @__PURE__ */ new Map();
  for (let method in targetWindow) {
    if (typeof targetWindow[method] === "function") {
      result.set(method, targetWindow[method]);
    }
  }
  return result;
}
let isReady = false;
document.addEventListener("DOMContentLoaded", function() {
  isReady = true;
});
function whenReady(fn) {
  if (isReady || document.readyState === "complete") {
    fn();
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}
whenReady(() => {
  setupContextMenus();
  setupDrag();
  Reload();
});
document.getElementById("result");
const timeElement = document.getElementById("time");
On("time", (time) => {
  timeElement.innerText = time.data;
});
