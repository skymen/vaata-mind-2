function n(e, s, t, a) {
  if (typeof s == "function" ? e !== s || !0 : !s.has(e)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return t === "m" ? a : t === "a" ? a.call(e) : a ? a.value : s.get(e);
}
function d(e, s, t, a, c) {
  if (typeof s == "function" ? e !== s || !0 : !s.has(e)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return s.set(e, t), t;
}
var o, i, r, h;
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
    ), i.set(this, 0), r.set(this, []), this.id = f(({ message: s, id: t }) => {
      if (t == n(this, i, "f"))
        for (n(this, o, "f").call(this, s), d(this, i, n(this, i, "f") + 1); n(this, i, "f") in n(this, r, "f"); ) {
          const a = n(this, r, "f")[n(this, i, "f")];
          n(this, o, "f").call(this, a), delete n(this, r, "f")[n(this, i, "f")], d(this, i, n(this, i, "f") + 1);
        }
      else
        n(this, r, "f")[t] = s;
    });
  }
  set onmessage(s) {
    d(this, o, s);
  }
  get onmessage() {
    return n(this, o, "f");
  }
  [(o = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new WeakMap(), r = /* @__PURE__ */ new WeakMap(), u)]() {
    return `__CHANNEL__:${this.id}`;
  }
  toJSON() {
    return this[u]();
  }
}
async function l(e, s = {}, t) {
  return window.__TAURI_INTERNALS__.invoke(e, s, t);
}
class _ {
  get rid() {
    return n(this, h, "f");
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
  async download(s, t) {
    const a = new w();
    s && (a.onmessage = s);
    const c = await l("plugin:updater|download", {
      onEvent: a,
      rid: this.rid,
      ...t
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
  async downloadAndInstall(s, t) {
    const a = new w();
    s && (a.onmessage = s), await l("plugin:updater|download_and_install", {
      onEvent: a,
      rid: this.rid,
      ...t
    });
  }
  async close() {
    var s;
    await ((s = this.downloadedBytes) == null ? void 0 : s.close()), await super.close();
  }
}
async function y(e) {
  return await l("plugin:updater|check", {
    ...e
  }).then((s) => s.available ? new p(s) : null);
}
async function g() {
  await l("plugin:process|restart");
}
(async () => {
  const e = await y();
  e && (StatusMessage && StatusMessage.show && StatusMessage.show("Update Available"), await DialogBox.confirm(
    `Update ${e.version} is available! Would you like to update now?`,
    "Update Available"
  ) && (await e.downloadAndInstall(), StatusMessage && StatusMessage.show && StatusMessage.show("Restarting..."), await g()));
})();
