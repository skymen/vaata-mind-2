// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| {
            // This will run once when the app is set up
            #[cfg(target_os = "macos")]
            {
                // Listen for window creation
                app.listen_global("tauri://created", |event| {
                    if let Some(webview) = event.window().and_then(|w| w.get_webview()) {
                        unsafe {
                            use cocoa::base::id;
                            use objc::{msg_send, sel, sel_impl};
                            
                            // Get the WKWebView instance
                            let wk_webview: id = webview.ns_webview() as _;
                            
                            // Get the configuration and preferences
                            let configuration: id = msg_send![wk_webview, configuration];
                            let preferences: id = msg_send![configuration, preferences];
                            
                            // Set javaScriptCanOpenWindowsAutomatically to true
                            let _: () = msg_send![preferences, setJavaScriptCanOpenWindowsAutomatically:true];
                        }
                    }
                });
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
