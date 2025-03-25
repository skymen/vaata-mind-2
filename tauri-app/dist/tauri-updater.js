function s(e, t, a, o) {
  if (typeof t == "function" ? e !== t || !0 : !t.has(e)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return a === "m" ? o : a === "a" ? o.call(e) : o ? o.value : t.get(e);
}
function p(e, t, a, o, r) {
  if (typeof t == "function" ? e !== t || !0 : !t.has(e)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return t.set(e, a), a;
}
var l, n, c, h;
const g = "__TAURI_TO_IPC_KEY__";
function m(e, t = !1) {
  return window.__TAURI_INTERNALS__.transformCallback(e, t);
}
class C {
  constructor() {
    this.__TAURI_CHANNEL_MARKER__ = !0, l.set(
      this,
      () => {
      }
      // the id is used as a mechanism to preserve message order
    ), n.set(this, 0), c.set(this, []), this.id = m(({ message: t, id: a }) => {
      if (a == s(this, n, "f"))
        for (s(this, l, "f").call(this, t), p(this, n, s(this, n, "f") + 1); s(this, n, "f") in s(this, c, "f"); ) {
          const o = s(this, c, "f")[s(this, n, "f")];
          s(this, l, "f").call(this, o), delete s(this, c, "f")[s(this, n, "f")], p(this, n, s(this, n, "f") + 1);
        }
      else
        s(this, c, "f")[a] = t;
    });
  }
  set onmessage(t) {
    p(this, l, t);
  }
  get onmessage() {
    return s(this, l, "f");
  }
  [(l = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new WeakMap(), c = /* @__PURE__ */ new WeakMap(), g)]() {
    return `__CHANNEL__:${this.id}`;
  }
  toJSON() {
    return this[g]();
  }
}
async function i(e, t = {}, a) {
  return window.__TAURI_INTERNALS__.invoke(e, t, a);
}
class f {
  get rid() {
    return s(this, h, "f");
  }
  constructor(t) {
    h.set(this, void 0), p(this, h, t);
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
h = /* @__PURE__ */ new WeakMap();
class _ extends f {
  constructor(t) {
    super(t.rid), this.available = t.available, this.currentVersion = t.currentVersion, this.version = t.version, this.date = t.date, this.body = t.body, this.rawJson = t.rawJson;
  }
  /** Download the updater package */
  async download(t, a) {
    const o = new C();
    t && (o.onmessage = t);
    const r = await i("plugin:updater|download", {
      onEvent: o,
      rid: this.rid,
      ...a
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
  async downloadAndInstall(t, a) {
    const o = new C();
    t && (o.onmessage = t), await i("plugin:updater|download_and_install", {
      onEvent: o,
      rid: this.rid,
      ...a
    });
  }
  async close() {
    var t;
    await ((t = this.downloadedBytes) == null ? void 0 : t.close()), await super.close();
  }
}
async function k(e) {
  return await i("plugin:updater|check", {
    ...e
  }).then((t) => t.available ? new _(t) : null);
}
async function v() {
  await i("plugin:process|restart");
}
var w;
(function(e) {
  e.WINDOW_RESIZED = "tauri://resize", e.WINDOW_MOVED = "tauri://move", e.WINDOW_CLOSE_REQUESTED = "tauri://close-requested", e.WINDOW_DESTROYED = "tauri://destroyed", e.WINDOW_FOCUS = "tauri://focus", e.WINDOW_BLUR = "tauri://blur", e.WINDOW_SCALE_FACTOR_CHANGED = "tauri://scale-change", e.WINDOW_THEME_CHANGED = "tauri://theme-changed", e.WINDOW_CREATED = "tauri://window-created", e.WEBVIEW_CREATED = "tauri://webview-created", e.DRAG_ENTER = "tauri://drag-enter", e.DRAG_OVER = "tauri://drag-over", e.DRAG_DROP = "tauri://drag-drop", e.DRAG_LEAVE = "tauri://drag-leave";
})(w || (w = {}));
async function E(e, t) {
  await i("plugin:event|unlisten", {
    event: e,
    eventId: t
  });
}
async function y(e, t, a) {
  var o;
  const r = (o = void 0) !== null && o !== void 0 ? o : { kind: "Any" };
  return i("plugin:event|listen", {
    event: e,
    target: r,
    handler: m(t)
  }).then((d) => async () => E(e, d));
}
async function R(e, t) {
  await i("plugin:opener|open_url", {
    url: e,
    with: t
  });
}
const I = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <title>My Notes</title>
    <style>
        :root {
            --primary: #6C63FF;
            --primary-light: #EEEEFF;
            --success: #4CAF50;
            --text-dark: #333;
            --text-light: #666;
            --rotation-angle: 0deg;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Open Sans', sans-serif;
            margin: 0;
            padding: 0;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background-color: #f9f9fc;
            color: var(--text-dark);
            position: relative;
            overflow: hidden;
        }
        
        .background-shape {
            position: absolute;
            border-radius: 50%;
            background-color: var(--primary-light);
            opacity: 0.6;
            z-index: -1;
        }
        
        .shape-1 {
            width: 300px;
            height: 300px;
            top: -100px;
            left: -100px;
        }
        
        .shape-2 {
            width: 400px;
            height: 400px;
            bottom: -200px;
            right: -150px;
        }
        
        .container {
            width: 100%;
            max-width: 480px;
            padding: 40px 30px;
            text-align: center;
            border-radius: 20px;
            background-color: white;
            box-shadow: 0 15px 50px rgba(108, 99, 255, 0.08);
            transition: all 0.3s ease;
            position: relative;
            z-index: 1;
        }
        
        .logo-container {
            position: relative;
            margin-bottom: 40px;
        }
        
        .logo-container {
            position: relative;
            margin-bottom: 40px;
            z-index: 2;
        }

        .logo {
            max-width: 160px;
            opacity: 0;
            transform: rotate(0deg);
            animation: logoFadeInRotate 1.2s forwards;
        }
        
        .logo:hover {
            transform: scale(1.05);
        }
        
        .logo-circle {
            position: absolute;
            width: 20px;
            height: 20px;
            background-color: var(--primary-light);
            border: 2px solid var(--primary);
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.8;
            z-index: -1;
            animation: logoCircleGrow 1.2s forwards;
        }
        
        @keyframes logoFadeInRotate {
            0% {
                opacity: 0;
                transform: rotate(0deg);
            }
            20% {
                opacity: 1;
            }
            100% {
                opacity: 1;
                transform: rotate(360deg); /* Just 1 full rotation */
            }
        }
        
        @keyframes logoCircleGrow {
            0% {
                transform: translate(-50%, -50%) scale(0);
                opacity: 0.8;
            }
            100% {
                transform: translate(-50%, -50%) scale(15);
                opacity: 0;
            }
        }
        
        .logo-glow {
            position: absolute;
            width: 160px;
            height: 30px;
            background: radial-gradient(ellipse at center, rgba(108, 99, 255, 0.2) 0%, rgba(108, 99, 255, 0) 70%);
            bottom: -20px;
            left: 50%;
            transform: translateX(-50%);
            border-radius: 50%;
            filter: blur(5px);
        }
        
        h2 {
            font-weight: 600;
            font-size: 28px;
            margin-bottom: 20px;
            color: var(--text-dark);
        }
        
        .success-message {
            margin-top: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            opacity: 0;
            transform: translateY(20px);
            animation: fadeIn 1s forwards 0.5s;
        }
        
        .checkmark-circle {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: var(--success);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            position: relative;
            box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);
        }
        
        .checkmark-circle::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background-color: var(--success);
            opacity: 0.3;
            animation: pulse 2s infinite;
        }
        
        .checkmark {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
            animation: drawCheck 1s forwards 0.8s;
        }
        
        .welcome-text {
            font-size: 18px;
            color: var(--text-light);
            opacity: 0;
            animation: fadeIn 1s forwards 1.2s;
            margin-bottom: 10px;
        }
        
        .app-button {
            display: inline-block;
            margin-top: 25px;
            padding: 12px 28px;
            background-color: var(--primary);
            color: white;
            border: none;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.3s ease;
            box-shadow: 0 8px 20px rgba(108, 99, 255, 0.2);
            opacity: 0;
            transform: translateY(10px);
            animation: fadeIn 0.5s forwards 1.8s;
        }
        
        .app-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 25px rgba(108, 99, 255, 0.3);
            color: white;
        }
        
        .app-button:active {
            transform: translateY(0);
        }
        
        @keyframes fadeIn {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes drawCheck {
            to {
                stroke-dashoffset: 0;
            }
        }
        
        @keyframes pulse {
            0% {
                transform: scale(1);
                opacity: 0.3;
            }
            50% {
                transform: scale(1.2);
                opacity: 0;
            }
            100% {
                transform: scale(1);
                opacity: 0;
            }
        }
    </style>
</head>
<body>
    <!-- Background decorative shapes -->
    <div class="background-shape shape-1"></div>
    <div class="background-shape shape-2"></div>
    
    <div class="container">
        <div class="logo-container">
            <div class="logo-circle"></div>
            <svg class="logo" viewBox="0 0 601 609" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="147" y="159" width="309" height="306" fill="#EEEEFF"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M456.523 1.27418C469 -1.98753 481.758 5.3777 485.172 17.8142C496.18 58.0213 518.07 140.955 519.453 168.694C519.641 172.617 519.859 176.492 520.078 180.33C521.445 204.494 522.727 227.167 516.367 251.224C530.203 267.249 539.234 285.169 548.758 304.113L548.969 304.518C550.617 307.798 552.281 311.109 553.992 314.447C566.664 339.213 589.047 422.148 599.578 462.532C602.828 475.032 595.438 487.828 582.984 491.266C542.734 502.359 459.711 524.407 431.945 525.829C428.023 526.025 424.148 526.249 420.313 526.471C399.453 527.679 379.703 528.824 359.227 525.049C343.359 538.584 325.648 547.485 306.953 556.886L302.445 559.155L296.617 562.112C271.852 574.783 188.914 597.167 148.531 607.699C136.031 610.947 123.234 603.559 119.797 591.109C108.703 550.857 86.6563 467.832 85.2344 440.07C85.0391 436.143 84.8125 432.265 84.5938 428.425C83.2813 405.825 82.0547 384.531 87.0703 362.199C71.5469 345.358 61.9532 326.289 51.7735 306.048L51.5625 305.643C49.9141 302.363 48.25 299.052 46.5391 295.715C33.8672 270.948 11.4844 188.013 0.953159 147.63C-2.29684 135.129 5.09378 122.333 17.5469 118.895C57.7969 107.802 140.82 85.7547 168.586 84.3323L170.742 84.2215L176.688 83.8933L180.219 83.6897L180.477 83.6751C202.289 82.4114 222.906 81.2175 244.414 85.7C260.719 71.2664 279.016 62.0354 298.391 52.2605L299.094 51.9104C302.266 50.3054 305.477 48.6839 308.711 47.0208C333.438 34.3264 416.211 11.8508 456.523 1.27418ZM432.453 304.106C432.609 305.873 432.734 307.665 432.828 309.472C430.68 404.306 352.719 432 278.281 432L278.156 431.922C283.203 431.752 288.203 431.308 292.852 430.594C303.102 429.018 314.633 425.662 324.109 421.463C333.336 417.375 343.328 411.283 351.164 404.926C358.789 398.739 366.617 390.477 372.352 382.511C377.93 374.766 383.172 365.022 386.531 356.087C389.789 347.407 392.227 336.94 393.102 327.708C393.945 318.75 393.563 308.325 392.031 299.458C390.547 290.861 387.539 281.203 383.844 273.297C380.273 265.637 375 257.375 369.539 250.925C364.258 244.683 357.234 238.308 350.492 233.676C343.977 229.198 335.805 225.037 328.344 222.433C321.133 219.918 312.469 218.12 304.852 217.595C297.508 217.088 288.984 217.62 281.766 219.07C274.813 220.466 267.039 223.126 260.703 226.311C254.609 229.373 248.07 233.819 243.008 238.386C238.148 242.77 233.227 248.55 229.703 254.066C226.32 259.355 223.242 265.949 221.398 271.946C219.625 277.683 218.461 284.549 218.289 290.552C218.117 296.282 218.797 302.897 220.172 308.465C221.477 313.771 223.789 319.671 226.469 324.433C229.016 328.959 232.641 333.773 236.313 337.447C238.109 339.245 240.188 341.039 242.367 342.687C244.414 344.231 246.547 345.646 248.625 346.813C252.68 349.094 257.703 351.091 262.227 352.183C266.5 353.213 271.563 353.736 275.945 353.56C280.07 353.396 284.781 352.564 288.695 351.272C292.359 350.064 296.383 348.097 299.57 345.921C302.531 343.892 305.625 341.088 307.898 338.309C310.016 335.733 312.031 332.431 313.328 329.362C314.516 326.532 315.43 323.08 315.758 320.026C316.055 317.228 315.945 313.956 315.406 311.195C314.914 308.681 313.93 305.865 312.711 303.615C311.609 301.584 309.984 299.43 308.305 297.843C306.797 296.421 304.805 295.045 302.922 294.186C301.25 293.424 299.172 292.851 297.344 292.704C295.727 292.573 293.836 292.741 292.281 293.206C291.719 293.375 291.125 293.607 290.547 293.885C289.742 294.276 288.969 294.758 288.336 295.289C287.375 296.09 286.445 297.254 285.922 298.391C285.453 299.412 285.18 300.733 285.25 301.854C285.313 302.905 285.695 304.118 286.273 305.001C286.844 305.885 287.234 307.097 287.297 308.149C287.359 309.27 287.086 310.591 286.617 311.612C286.094 312.748 285.164 313.911 284.203 314.713C283.117 315.623 281.617 316.389 280.258 316.797C278.711 317.261 276.813 317.429 275.195 317.299C273.367 317.151 271.289 316.579 269.617 315.816C267.734 314.957 265.742 313.582 264.234 312.16C262.555 310.573 260.938 308.418 259.828 306.387C258.609 304.137 257.625 301.321 257.133 298.808C256.602 296.046 256.484 292.774 256.781 289.975C257.109 286.923 258.023 283.471 259.219 280.641C260.508 277.572 262.531 274.269 264.641 271.693C266.922 268.914 270.008 266.111 272.977 264.082C276.156 261.905 280.18 259.938 283.844 258.73C287.758 257.439 292.477 256.606 296.594 256.443C298.805 256.354 301.188 256.443 303.555 256.684C305.883 256.922 308.195 257.308 310.313 257.819C314.836 258.912 319.859 260.908 323.922 263.19C328.211 265.602 332.75 269.073 336.234 272.556C339.906 276.23 343.531 281.043 346.078 285.57C348.758 290.331 351.07 296.232 352.375 301.537C353.742 307.105 354.422 313.72 354.25 319.451C354.078 325.453 352.914 332.319 351.148 338.056C349.297 344.053 346.219 350.648 342.836 355.935C339.313 361.453 334.391 367.233 329.531 371.617C324.469 376.183 317.93 380.629 311.836 383.692C305.508 386.876 297.727 389.537 290.773 390.933C283.555 392.383 275.039 392.914 267.695 392.408C260.078 391.883 251.406 390.085 244.203 387.57C236.734 384.965 228.563 380.805 222.047 376.326C215.305 371.695 208.289 365.32 203 359.077C197.539 352.627 192.273 344.365 188.695 336.706C185 328.799 181.992 319.142 180.508 310.544C178.977 301.677 178.594 291.252 179.438 282.294C180.313 273.063 182.75 262.595 186.008 253.915C189.367 244.98 194.609 235.236 200.188 227.491C205.93 219.525 213.758 211.264 221.383 205.077C229.219 198.719 239.203 192.628 248.43 188.54C257.906 184.341 269.445 180.984 279.688 179.408C290.203 177.792 302.531 177.56 313.109 178.747C323.953 179.965 336.219 183.038 346.375 187.046C356.773 191.155 368.094 197.479 377.07 204.161C386.258 211.007 395.766 220.288 402.852 229.295C410.102 238.517 417.016 250.229 421.617 261.025C426.328 272.072 430.031 285.487 431.695 297.38C432 299.563 432.25 301.813 432.453 304.106Z" fill="#6C63FF"/>
            </svg>
            <div class="logo-glow"></div>
        </div>
        
        <h2>You can now open the app</h2>
        
        <div class="success-message">
            <div class="checkmark-circle">
                <svg width="40" height="40" viewBox="0 0 40 40">
                    <path class="checkmark" d="M10,20 L17,27 L30,13" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </div>
            <p class="welcome-text">Login successful!</p>
            <a href="vaata-mind://focus" class="app-button">Open App</a>
        </div>
    </div>
</body>
</html>`;
async function A(e) {
  return await y("deep-link://new-url", (t) => {
    e(t.payload);
  });
}
(async () => {
  const e = await k();
  e && (StatusMessage && StatusMessage.show && StatusMessage.show("Update Available"), await DialogBox.confirm(
    `Update ${e.version} is available! Would you like to update now?`,
    "Update Available"
  ) && (await e.downloadAndInstall(), StatusMessage && StatusMessage.show && StatusMessage.show("Restarting..."), await v()));
})();
(async () => await A((e) => {
  console.log("Received URL:", e), window.__TAURI__.window.appWindow.setFocus();
}))();
const W = (e) => R(
  `https://accounts.google.com/o/oauth2/auth?response_type=token&client_id=557148045075-52gu7aug421s9ju6hhqitpggmsgri5hh.apps.googleusercontent.com&redirect_uri=http%3A//localhost:${e}&scope=email%20profile%20openid&prompt=consent`
), L = (e) => new Promise((t, a) => {
  W(e).then(t).catch(a);
});
window.signInWithOAuth = function(e, t) {
  return new Promise((a, o) => {
    y("oauth://url", (r) => {
      try {
        const d = new URL(r.payload), u = new URLSearchParams(d.hash.substring(1)).get("access_token");
        if (!u)
          return o(new Error("No access token found in callback URL."));
        const x = t.credential(null, u);
        window.firebaseAuthFunctions.signInWithCredential(e, x).then((b) => {
          a({
            success: !0,
            user: b.user
          });
        }).catch(o);
      } catch (d) {
        o(d);
      }
    }).catch(o), i("plugin:oauth|start", {
      config: {
        // Use a custom callback page/template for a friendlier experience.
        response: I
      }
    }).then((r) => {
      L(r).catch(o);
    }).catch(o);
  });
};
