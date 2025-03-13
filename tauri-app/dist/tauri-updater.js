function t(e, s, n, i) {
  if (typeof s == "function" ? e !== s || !0 : !s.has(e)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return n === "m" ? i : n === "a" ? i.call(e) : i ? i.value : s.get(e);
}
function d(e, s, n, i, c) {
  if (typeof s == "function" ? e !== s || !0 : !s.has(e)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return s.set(e, n), n;
}
var o, a, r, h;
const u = "__TAURI_TO_IPC_KEY__";
function f(e, s = !1) {
  return window.__TAURI_INTERNALS__.transformCallback(e, s);
}
class w {
  constructor() {
    this.__TAURI_CHANNEL_MARKER__ = !0, o.set(
      this,
      () => {
      }
      // the id is used as a mechanism to preserve message order
    ), a.set(this, 0), r.set(this, []), this.id = f(({ message: s, id: n }) => {
      if (n == t(this, a, "f"))
        for (t(this, o, "f").call(this, s), d(this, a, t(this, a, "f") + 1); t(this, a, "f") in t(this, r, "f"); ) {
          const i = t(this, r, "f")[t(this, a, "f")];
          t(this, o, "f").call(this, i), delete t(this, r, "f")[t(this, a, "f")], d(this, a, t(this, a, "f") + 1);
        }
      else
        t(this, r, "f")[n] = s;
    });
  }
  set onmessage(s) {
    d(this, o, s);
  }
  get onmessage() {
    return t(this, o, "f");
  }
  [(o = /* @__PURE__ */ new WeakMap(), a = /* @__PURE__ */ new WeakMap(), r = /* @__PURE__ */ new WeakMap(), u)]() {
    return `__CHANNEL__:${this.id}`;
  }
  toJSON() {
    return this[u]();
  }
}
async function l(e, s = {}, n) {
  return window.__TAURI_INTERNALS__.invoke(e, s, n);
}
class _ {
  get rid() {
    return t(this, h, "f");
  }
  constructor(s) {
    h.set(this, void 0), d(this, h, s);
  }
  /**
   * Destroys and cleans up this resource from memory.
   * **You should not call any method on this object anymore and should drop any reference to it.**
   */
  async close() {
    return l("plugin:resources|close", {
      rid: this.rid
    });
  }
}
h = /* @__PURE__ */ new WeakMap();
class p extends _ {
  constructor(s) {
    super(s.rid), this.available = s.available, this.currentVersion = s.currentVersion, this.version = s.version, this.date = s.date, this.body = s.body, this.rawJson = s.rawJson;
  }
  /** Download the updater package */
  async download(s, n) {
    const i = new w();
    s && (i.onmessage = s);
    const c = await l("plugin:updater|download", {
      onEvent: i,
      rid: this.rid,
      ...n
    });
    this.downloadedBytes = new _(c);
  }
  /** Install downloaded updater package */
  async install() {
    if (!this.downloadedBytes)
      throw new Error("Update.install called before Update.download");
    await l("plugin:updater|install", {
      updateRid: this.rid,
      bytesRid: this.downloadedBytes.rid
    }), this.downloadedBytes = void 0;
  }
  /** Downloads the updater package and installs it */
  async downloadAndInstall(s, n) {
    const i = new w();
    s && (i.onmessage = s), await l("plugin:updater|download_and_install", {
      onEvent: i,
      rid: this.rid,
      ...n
    });
  }
  async close() {
    var s;
    await ((s = this.downloadedBytes) == null ? void 0 : s.close()), await super.close();
  }
}
async function g(e) {
  return await l("plugin:updater|check", {
    ...e
  }).then((s) => s.available ? new p(s) : null);
}
async function y() {
  await l("plugin:process|restart");
}
(async () => {
  const e = await g();
  e && (globalThis.showStatus && globalThis.showStatus("Update Available. Downloading..."), await e.downloadAndInstall(), globalThis.showStatus && globalThis.showStatus("Restarting..."), await y());
})();
