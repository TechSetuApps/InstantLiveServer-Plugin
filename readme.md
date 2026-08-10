# InstantLiveServer LivePreviewer

Live preview your HTML, CSS, and JavaScript files directly inside ACode — powered by the InstantLiveServer local server app. No Termux, no Node.js, no PC required.

[<img src="https://img.shields.io/badge/Open%20Source-GitHub-181717?logo=github&style=for-the-badge" />](https://github.com/TechSetuApps/InstantLiveServer-Plugin)

---

## Requirement

This plugin requires the **InstantLiveServer** app (v1.4.0 or above) to function. InstantLiveServer runs a local HTTP server on your Android device that serves your HTML, CSS, and JS files.

Download InstantLiveServer:
[GitHub — InstantLiveServer](https://github.com/TechSetuApps/InstantLiveServer/releases/tag/v1.4.0)

---

## Video Tutorial

Watch the short setup guide on YouTube:
[youtube.com/shorts/fgUvjvr78O4](https://youtube.com/shorts/fgUvjvr78O4)

---

## Installation Steps

**Step 1 — Set Up InstantLiveServer**

1. Download and install InstantLiveServer from the link above.
2. Open InstantLiveServer.
3. Tap **Select .html File** and choose your HTML file.
4. Optionally tap **Add More Files** to add CSS, JS, or JSON files.
5. Tap **Start Hosting** — a short ad plays, then server starts on `http://127.0.0.1:7090`.

**Step 2 — Install This Plugin**

1. Open ACode → menu icon → **Plugins**.
2. Search for **InstantLiveServer LivePreviewer** → Install.

---

## How to Use

1. Open ACode and open any `.html` file.
2. Make sure InstantLiveServer is running and hosting your file.
3. Tap the floating **W** button, or press **Ctrl + Shift + W**.
4. The live preview panel opens showing your page in real time.
5. Save your file — preview auto-reloads within 500ms.

---

## Address Bar

- **Normal mode** — shows your page title from the `<title>` tag
- **Edit mode** — tap to change port and path (e.g. `7090/data.json`)
- **Path support** — navigate to any hosted file like `/data.json` or `/style.css`
- `localhost:` prefix is fixed and cannot be removed

---

## Features

- Live preview with 500ms auto-reload
- Address bar shows page title from `<title>` tag
- Navigate to any hosted path (e.g. `/data.json`, `/config.json`)
- Portrait and landscape layout support
- Resizable preview panel
- Fullscreen preview mode
- Draggable floating W button
- Built-in Eruda JS console (fullscreen mode)
- Keyboard shortcut: Ctrl + Shift + W
- No Termux, no Node.js, no PC required

---

## Troubleshooting

**Preview not loading?**
- Make sure InstantLiveServer is open and hosting
- Check the port matches in both apps (default: `7090`)
- Tap the reload button in the plugin panel

**CSS/JS not loading?**
- In InstantLiveServer, use **Add More Files** to select CSS/JS files alongside your HTML

---

## Open Source & Transparency

This plugin is fully open source and publicly available at
[github.com/TechSetuApps/InstantLiveServer-Plugin](https://github.com/TechSetuApps/InstantLiveServer-Plugin)

It is maintained independently to promote transparency and user freedom.
You are welcome to inspect, modify, or improve the code as needed.

---

## Disclaimer

This plugin is developed and maintained independently by **TechSetuApps** and is not officially affiliated with or endorsed by the ACode team or its parent company.

Use this plugin at your own risk. The developer is not responsible for any data loss, app malfunction, or system issues arising from its use.

For feedback or bug reports, contact: **techsetuapps@gmail.com**

---

## Developer

**TechSetuApps**
Darbhanga, Bihar, India
techsetuapps@gmail.com
[github.com/TechSetuApps](https://github.com/TechSetuApps)

---

## Credits

**Eruda** — MIT License — Copyright © 2017 liriliri
[github.com/liriliri/eruda](https://github.com/liriliri/eruda)
