use tauri::Manager;
use tauri_plugin_log::{Target, TargetKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let mut builder = tauri::Builder::default();

  #[cfg(desktop)]
  {
    builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
      if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
      }
    }));
  }

  builder = builder
    .plugin(
      tauri_plugin_log::Builder::new()
        .targets([
          Target::new(TargetKind::Stdout),
          Target::new(TargetKind::LogDir { file_name: Some("wedding-os".into()) }),
        ])
        .max_file_size(5_000_000)
        .build(),
    )
    .plugin(tauri_plugin_fs::init());

  #[cfg(feature = "updater")]
  {
    builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
  }

  builder
    .setup(|_app| {
      log::info!("Wedding OS 婚礼总指挥启动");
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("启动婚礼总指挥失败");
}
