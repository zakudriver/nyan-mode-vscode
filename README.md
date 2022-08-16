# [nyan-mode](https://github.com/zakudriver/nyan-mode-vscode)

<a href="https://github.com/zakudriver/nyan-mode-vscode">
  <img alt="version" src="https://vsmarketplacebadge.apphb.com/version-short/zakudriver.nyan-mode.svg" />
</a>

>For some friends who like nyan but don't use emacs.

Emacs [nyan-mode](https://github.com/TeMPOraL/nyan-mode) for vscode.

## Features

Like emacs nyan-mode. It's an analog indicator of your position in the tab. The cat will go gradually from the left to the right on the statusbar in accordance with the progress from 0% to 100%.

Since vscode statusbar supports string only, so i only remake terminal edition.

## Extension Settings

This extension contributes the following settings:

* `nyanMode.nyanDisable`: enable or disable nyan-mode.
* `nyanMode.nyanAlign`: nyan-mode show at statusbar of 'left' or 'right'.
* `nyanMode.nyanPriority`: higher values mean nyan-mode should be shown more to the left.
* `nyanMode.nyanColor`: nyan-mode's color.
* `nyanMode.nyanLength`: nyan-mode's length.
* `nyanMode.nyanDisplayPercent`: if it's true, display position percent to the right of nyan.
* `nyanMode.nyanDisplayBorder`: if it's true, display a border on either side of nyan. Like this [xxx].
* `nyanMode.nyanAction`: nyan-mode's move mode. The "line" mode is based on the line where the cursor resides, and the "range" is based on the view range.

Default value:
```typescript
export interface NyanModeOptions {
  nyanDisable?: boolean;                  // default: false
  nyanAlign?: "left" | "right";           // default: "left"
  nyanPriority?: number;                  // default: 0
  nyanColor?: string;                     // default: "#fff"
  nyanLength?: number;                    // default: 20
  nyanDisplayPercent?: boolean;           // default: false
  nyanAction?: "line" | "range";          // default: "line"
}
```

## Known Issues

>Because I usually use emacs, so maybe have some bugs what i don't know ;(. Please submit issues if you find any problems, thx.

Now nothings.

## Release Notes

### 1.3.0

Now nyan can animate!! And modify some config.

### 1.2.0

Now nyan is replaced by font icon! And add menu at the settings and whether display border.

### 1.1.2

After a lot of thought, i think should be allowed to modify nyan's face and change curve.

### 1.1.1

When modify settings.json, nyan-mode it will change accordingly.
And fix default configs bugs.

### 1.0.0

Initial release ...

---

**Enjoy!**
