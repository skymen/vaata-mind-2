function a(t, e, n, s) {
  if (typeof e == "function" ? t !== e || !0 : !e.has(t)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return n === "m" ? s : n === "a" ? s.call(t) : s ? s.value : e.get(t);
}
function h(t, e, n, s, r) {
  if (typeof e == "function" ? t !== e || !0 : !e.has(t)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return e.set(t, n), n;
}
var l, o, c, u;
const w = "__TAURI_TO_IPC_KEY__";
function y(t, e = !1) {
  return window.__TAURI_INTERNALS__.transformCallback(t, e);
}
class _ {
  constructor() {
    this.__TAURI_CHANNEL_MARKER__ = !0, l.set(
      this,
      () => {
      }
      // the id is used as a mechanism to preserve message order
    ), o.set(this, 0), c.set(this, []), this.id = y(({ message: e, id: n }) => {
      if (n == a(this, o, "f"))
        for (a(this, l, "f").call(this, e), h(this, o, a(this, o, "f") + 1); a(this, o, "f") in a(this, c, "f"); ) {
          const s = a(this, c, "f")[a(this, o, "f")];
          a(this, l, "f").call(this, s), delete a(this, c, "f")[a(this, o, "f")], h(this, o, a(this, o, "f") + 1);
        }
      else
        a(this, c, "f")[n] = e;
    });
  }
  set onmessage(e) {
    h(this, l, e);
  }
  get onmessage() {
    return a(this, l, "f");
  }
  [(l = /* @__PURE__ */ new WeakMap(), o = /* @__PURE__ */ new WeakMap(), c = /* @__PURE__ */ new WeakMap(), w)]() {
    return `__CHANNEL__:${this.id}`;
  }
  toJSON() {
    return this[w]();
  }
}
async function i(t, e = {}, n) {
  return window.__TAURI_INTERNALS__.invoke(t, e, n);
}
class f {
  get rid() {
    return a(this, u, "f");
  }
  constructor(e) {
    u.set(this, void 0), h(this, u, e);
  }
  /**
   * Destroys and cleans up this resource from memory.
   * **You should not call any method on this object anymore and should drop any reference to it.**
   */
  async close() {
    return i("plugin:resources|close", {
      rid: this.rid
    });
  }
}
u = /* @__PURE__ */ new WeakMap();
class E extends f {
  constructor(e) {
    super(e.rid), this.available = e.available, this.currentVersion = e.currentVersion, this.version = e.version, this.date = e.date, this.body = e.body, this.rawJson = e.rawJson;
  }
  /** Download the updater package */
  async download(e, n) {
    const s = new _();
    e && (s.onmessage = e);
    const r = await i("plugin:updater|download", {
      onEvent: s,
      rid: this.rid,
      ...n
    });
    this.downloadedBytes = new f(r);
  }
  /** Install downloaded updater package */
  async install() {
    if (!this.downloadedBytes)
      throw new Error("Update.install called before Update.download");
    await i("plugin:updater|install", {
      updateRid: this.rid,
      bytesRid: this.downloadedBytes.rid
    }), this.downloadedBytes = void 0;
  }
  /** Downloads the updater package and installs it */
  async downloadAndInstall(e, n) {
    const s = new _();
    e && (s.onmessage = e), await i("plugin:updater|download_and_install", {
      onEvent: s,
      rid: this.rid,
      ...n
    });
  }
  async close() {
    var e;
    await ((e = this.downloadedBytes) == null ? void 0 : e.close()), await super.close();
  }
}
async function A(t) {
  return await i("plugin:updater|check", {
    ...t
  }).then((e) => e.available ? new E(e) : null);
}
async function I() {
  await i("plugin:process|restart");
}
var g;
(function(t) {
  t.WINDOW_RESIZED = "tauri://resize", t.WINDOW_MOVED = "tauri://move", t.WINDOW_CLOSE_REQUESTED = "tauri://close-requested", t.WINDOW_DESTROYED = "tauri://destroyed", t.WINDOW_FOCUS = "tauri://focus", t.WINDOW_BLUR = "tauri://blur", t.WINDOW_SCALE_FACTOR_CHANGED = "tauri://scale-change", t.WINDOW_THEME_CHANGED = "tauri://theme-changed", t.WINDOW_CREATED = "tauri://window-created", t.WEBVIEW_CREATED = "tauri://webview-created", t.DRAG_ENTER = "tauri://drag-enter", t.DRAG_OVER = "tauri://drag-over", t.DRAG_DROP = "tauri://drag-drop", t.DRAG_LEAVE = "tauri://drag-leave";
})(g || (g = {}));
async function b(t, e) {
  await i("plugin:event|unlisten", {
    event: t,
    eventId: e
  });
}
async function W(t, e, n) {
  var s;
  const r = (s = void 0) !== null && s !== void 0 ? s : { kind: "Any" };
  return i("plugin:event|listen", {
    event: t,
    target: r,
    handler: y(e)
  }).then((d) => async () => b(t, d));
}
(async () => {
  const t = await A();
  t && (StatusMessage && StatusMessage.show && StatusMessage.show("Update Available"), await DialogBox.confirm(
    `Update ${t.version} is available! Would you like to update now?`,
    "Update Available"
  ) && (await t.downloadAndInstall(), StatusMessage && StatusMessage.show && StatusMessage.show("Restarting..."), await I()));
})();
let D = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap" rel="stylesheet">
  <title>My Notes</title>
  <style>
    body {
      font-family: 'Open Sans', sans-serif;
      margin: auto;
      max-width: 640px;
      text-align: center;
    }
  </style>
</head>
<body>
  <h2>You can now open the app</h2>
</body>
</html>
`;
const C = (t) => open(
  `https://accounts.google.com/o/oauth2/auth?response_type=token&client_id=557148045075-52gu7aug421s9ju6hhqitpggmsgri5hh.apps.googleusercontent.com&redirect_uri=http%3A//localhost:${t}&scope=email%20profile%20openid&prompt=consent`
), N = (t) => new Promise((e, n) => {
  C(t).then(e).catch(n);
});
window.signInWithOAuth = function(t, e) {
  return new Promise((n, s) => {
    W("oauth://url", (r) => {
      try {
        const d = new URL(r.payload), p = new URLSearchParams(d.hash.substring(1)).get("access_token");
        if (!p)
          return s(new Error("No access token found in callback URL."));
        const m = e.credential(null, p);
        window.firebaseAuthFunctions.signInWithCredential(t, m).then((R) => {
          n({
            success: !0,
            user: R.user
          });
        }).catch(s);
      } catch (d) {
        s(d);
      }
    }).catch(s), i("plugin:oauth|start", {
      config: {
        // Use a custom callback page/template for a friendlier experience.
        response: D
      }
    }).then((r) => {
      N(r).catch(s);
    }).catch(s);
  });
};
