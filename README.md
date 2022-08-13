# nyan-mode README

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
* `nyanMode.nyanDisplayPercent`: if it's true, show position percent nyan-mode of right.
* `nyanMode.nyanHeader`: string of nyan-mode's header.
* `nyanMode.nyanFooter`: string of nyan-mode's footer.
* `nyanMode.nyanAction`: nyan-mode's move mode. The "line" mode is based on the line where the cursor resides, and the "range" is based on the view range. 

Default value:
```typescript
export interface NyanModeOptions {
  nyanDisable?: boolean;        // default: false
  nyanAlign?: "left" | "right"; // default: "left"
  nyanPriority?: number;        // default: 0
  nyanColor?: string;           // default: "#fff"
  nyanLength?: number;          // default: 20
  nyanDisplayPercent?: boolean; // default: false
  nyanHeader?: string;          // default: " -"
  nyanFooter?: string;          // default: "| "
  nyanAction?: "line" | "range";// default: "line"
}
```

## Known Issues

>Because I usually use emacs, so maybe have some bugs what i don't know ;(.

Now nothings.

## Release Notes

### 1.0.0

Initial release ...

---

**Enjoy!**
