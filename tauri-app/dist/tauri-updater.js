function i(n, e, t, s) {
  if (typeof e == "function" ? n !== e || !0 : !e.has(n)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return t === "m" ? s : t === "a" ? s.call(n) : s ? s.value : e.get(n);
}
function c(n, e, t, s, d) {
  if (typeof e == "function" ? n !== e || !0 : !e.has(n)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return e.set(n, t), t;
}
var r, a, l, h;
const w = "__TAURI_TO_IPC_KEY__";
function p(n, e = !1) {
  return window.__TAURI_INTERNALS__.transformCallback(n, e);
}
class f {
  constructor() {
    this.__TAURI_CHANNEL_MARKER__ = !0, r.set(
      this,
      () => {
      }
      // the id is used as a mechanism to preserve message order
    ), a.set(this, 0), l.set(this, []), this.id = p(({ message: e, id: t }) => {
      if (t == i(this, a, "f"))
        for (i(this, r, "f").call(this, e), c(this, a, i(this, a, "f") + 1); i(this, a, "f") in i(this, l, "f"); ) {
          const s = i(this, l, "f")[i(this, a, "f")];
          i(this, r, "f").call(this, s), delete i(this, l, "f")[i(this, a, "f")], c(this, a, i(this, a, "f") + 1);
        }
      else
        i(this, l, "f")[t] = e;
    });
  }
  set onmessage(e) {
    c(this, r, e);
  }
  get onmessage() {
    return i(this, r, "f");
  }
  [(r = /* @__PURE__ */ new WeakMap(), a = /* @__PURE__ */ new WeakMap(), l = /* @__PURE__ */ new WeakMap(), w)]() {
    return `__CHANNEL__:${this.id}`;
  }
  toJSON() {
    return this[w]();
  }
}
async function o(n, e = {}, t) {
  return window.__TAURI_INTERNALS__.invoke(n, e, t);
}
class _ {
  get rid() {
    return i(this, h, "f");
  }
  constructor(e) {
    h.set(this, void 0), c(this, h, e);
  }
  /**
   * Destroys and cleans up this resource from memory.
   * **You should not call any method on this object anymore and should drop any reference to it.**
   */
  async close() {
    return o("plugin:resources|close", {
      rid: this.rid
    });
  }
}
h = /* @__PURE__ */ new WeakMap();
class g extends _ {
  constructor(e) {
    super(e.rid), this.available = e.available, this.currentVersion = e.currentVersion, this.version = e.version, this.date = e.date, this.body = e.body, this.rawJson = e.rawJson;
  }
  /** Download the updater package */
  async download(e, t) {
    const s = new f();
    e && (s.onmessage = e);
    const d = await o("plugin:updater|download", {
      onEvent: s,
      rid: this.rid,
      ...t
    });
    this.downloadedBytes = new _(d);
  }
  /** Install downloaded updater package */
  async install() {
    if (!this.downloadedBytes)
      throw new Error("Update.install called before Update.download");
    await o("plugin:updater|install", {
      updateRid: this.rid,
      bytesRid: this.downloadedBytes.rid
    }), this.downloadedBytes = void 0;
  }
  /** Downloads the updater package and installs it */
  async downloadAndInstall(e, t) {
    const s = new f();
    e && (s.onmessage = e), await o("plugin:updater|download_and_install", {
      onEvent: s,
      rid: this.rid,
      ...t
    });
  }
  async close() {
    var e;
    await ((e = this.downloadedBytes) == null ? void 0 : e.close()), await super.close();
  }
}
async function y(n) {
  return await o("plugin:updater|check", {
    ...n
  }).then((e) => e.available ? new g(e) : null);
}
async function b() {
  await o("plugin:process|restart");
}
async function k(n, e) {
  var s, d, u;
  const t = typeof e == "string" ? { title: e } : e;
  return await o("plugin:dialog|ask", {
    message: n.toString(),
    title: (s = t == null ? void 0 : t.title) == null ? void 0 : s.toString(),
    kind: t == null ? void 0 : t.kind,
    yesButtonLabel: (d = t == null ? void 0 : t.okLabel) == null ? void 0 : d.toString(),
    noButtonLabel: (u = t == null ? void 0 : t.cancelLabel) == null ? void 0 : u.toString()
  });
}
(async () => {
  const n = await y();
  n && (globalThis.showStatus && globalThis.showStatus("Update Available"), await k(`Update ${n.version} is available!`, {
    title: "Update Available",
    kind: "info",
    okLabel: "Update now",
    cancelLabel: "Cancel"
  }) && (await n.downloadAndInstall(), globalThis.showStatus && globalThis.showStatus("Restarting..."), await b()));
})();
