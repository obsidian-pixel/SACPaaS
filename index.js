const body = document.body;
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file-input");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const colorsDiv = document.getElementById("colors");
const gradientPreview = document.getElementById("gradient-preview");
const gradientType = document.getElementById("gradient-type");
const gradientAngle = document.getElementById("gradient-angle");
const angleValue = document.getElementById("angle-value");
const hexExport = document.getElementById("hex-export");
const rgbExport = document.getElementById("rgb-export");
const hslExport = document.getElementById("hsl-export");
const cssExport = document.getElementById("css-export");
const tailwindExport = document.getElementById("tailwind-export");
const scssExport = document.getElementById("scss-export");
const copyAll = document.getElementById("copy-all");
const toggleTheme = document.getElementById("toggle-theme");
const clearPalette = document.getElementById("clear-palette");
const hexInput = document.getElementById("hex-input");
const addHex = document.getElementById("add-hex");
const colorCount = document.getElementById("color-count");
const contrastFg = document.getElementById("contrast-fg");
const contrastBg = document.getElementById("contrast-bg");
const contrastResult = document.getElementById("contrast-result");
let dominantColors = [];

// Theme
if (
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches
) {
  body.dataset.theme = "dark";
}

function updateToggleText() {
  toggleTheme.textContent =
    body.dataset.theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
}
updateToggleText();

toggleTheme.addEventListener("click", () => {
  body.dataset.theme = body.dataset.theme === "dark" ? "light" : "dark";
  updateToggleText();
});

clearPalette.addEventListener("click", () => {
  if (confirm("Clear all colors from palette?")) {
    dominantColors = [];
    renderColors();
  }
});

// File Input
dropzone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

// Drag & Drop
dropzone.ondragover = (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
};
dropzone.ondragleave = () => dropzone.classList.remove("dragover");
dropzone.ondrop = (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
};

function handleFile(file) {
  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => processImage(img);
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }
}

// Manual Hex Input
addHex.addEventListener("click", () => addColorFromHex());
hexInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addColorFromHex();
});

function addColorFromHex() {
  let hex = hexInput.value.trim();
  if (!hex.startsWith("#")) hex = "#" + hex;
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    const rgb = hexToRgb(hex);
    dominantColors.push(rgb);
    if (dominantColors.length > 10) dominantColors.shift();
    hexInput.value = "";
    renderColors();
  } else {
    alert("Invalid hex color. Use format: #ff5733");
  }
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

// Image Processing
function processImage(img) {
  const w = (canvas.width = 100),
    h = (canvas.height = 100);
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const count = {};
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    const key = [
      Math.round(r / 32) * 32,
      Math.round(g / 32) * 32,
      Math.round(b / 32) * 32,
    ].join(",");
    count[key] = (count[key] || 0) + 1;
  }
  dominantColors = Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map((e) => e[0].split(",").map(Number));
  renderColors();
}

// Render Colors
function renderColors() {
  colorsDiv.innerHTML = "";
  colorCount.textContent = `(${dominantColors.length} colors)`;

  dominantColors.forEach((c, idx) => {
    const div = document.createElement("div");
    div.className = "color-item";

    const swatch = document.createElement("div");
    swatch.className = "color-swatch";
    swatch.style.background = `rgb(${c.join(",")})`;
    swatch.onclick = () => copyColor(rgbToHex(c));

    const hex = rgbToHex(c);

    div.appendChild(swatch);
    div.innerHTML += `
          <div class="color-info">${hex}</div>
          <div class="color-info" style="font-size: 0.75rem;">rgb(${c.join(
            ", "
          )})</div>
          <div class="color-actions">
            <button onclick="copyColor('${hex}')">Copy</button>
            <button class="remove-btn" onclick="removeColor(${idx})">Remove</button>
          </div>
        `;
    colorsDiv.appendChild(div);
  });

  updateExports();
  updateGradient();
  updateContrastOptions();
}

window.removeColor = (idx) => {
  dominantColors.splice(idx, 1);
  renderColors();
};

window.copyColor = (color) => {
  navigator.clipboard.writeText(color);
  showToast("Copied: " + color);
};

function showToast(msg) {
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: var(--accent);
        color: white; padding: 1rem 1.5rem; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 1000;
        animation: slideIn 0.3s ease;
      `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

function rgbToHex(c) {
  return "#" + c.map((x) => x.toString(16).padStart(2, "0")).join("");
}

// Gradient Preview
function updateGradient() {
  if (!dominantColors.length) return;
  const type = gradientType.value;
  const angle = gradientAngle.value;
  angleValue.textContent = angle + "°";

  const colors = dominantColors.map((c) => `rgb(${c.join(",")})`).join(", ");
  const grad =
    type === "linear"
      ? `linear-gradient(${angle}deg, ${colors})`
      : `radial-gradient(circle, ${colors})`;
  gradientPreview.style.background = grad;
}

gradientType.onchange = updateGradient;
gradientAngle.oninput = updateGradient;

// Exports
function updateExports() {
  const hex = dominantColors.map((c) => rgbToHex(c)).join(", ");
  const rgb = dominantColors.map((c) => `rgb(${c.join(", ")})`).join(", ");
  const hsl = dominantColors
    .map((c) => {
      const h = rgbToHsl(...c);
      return `hsl(${Math.round(h[0])}, ${Math.round(h[1] * 100)}%, ${Math.round(
        h[2] * 100
      )}%)`;
    })
    .join(", ");

  const css = `background: linear-gradient(${
    gradientAngle.value
  }deg, ${dominantColors.map((c) => `rgb(${c.join(",")})`).join(", ")});`;

  const tailwind = dominantColors.map((c) => `bg-[${rgbToHex(c)}]`).join(" ");

  const scss = dominantColors
    .map((c, i) => `$color-${i + 1}: ${rgbToHex(c)};`)
    .join("\n");

  hexExport.value = hex;
  rgbExport.value = rgb;
  hslExport.value = hsl;
  cssExport.value = css;
  tailwindExport.value = tailwind;
  scssExport.value = scss;
}

hexExport.onclick = () => copyColor(hexExport.value);
rgbExport.onclick = () => copyColor(rgbExport.value);
hslExport.onclick = () => copyColor(hslExport.value);
cssExport.onclick = () => copyColor(cssExport.value);
tailwindExport.onclick = () => copyColor(tailwindExport.value);
scssExport.onclick = () => copyColor(scssExport.value);

copyAll.onclick = () => {
  const all = `HEX: ${hexExport.value}\n\nRGB: ${rgbExport.value}\n\nHSL: ${hslExport.value}\n\nCSS: ${cssExport.value}\n\nTailwind: ${tailwindExport.value}\n\nSCSS:\n${scssExport.value}`;
  navigator.clipboard.writeText(all);
  showToast("Copied all formats!");
};

// Color Wheel
const wheelCanvas = document.getElementById("color-wheel");
const selectedHex = document.getElementById("selected-hex");
const addToDominant = document.getElementById("add-to-dominant");
const lightnessSlider = document.getElementById("lightness");
let currentColor = [255, 255, 255];
let pickerPos = { x: 90, y: 90 };
const radius = wheelCanvas.width / 2;

if (wheelCanvas) {
  const ctxWheel = wheelCanvas.getContext("2d");

  function drawWheel() {
    const lightness = lightnessSlider.value / 100;
    const image = ctxWheel.createImageData(
      wheelCanvas.width,
      wheelCanvas.height
    );

    for (let x = 0; x < wheelCanvas.width; x++) {
      for (let y = 0; y < wheelCanvas.height; y++) {
        const dx = x - radius,
          dy = y - radius,
          d = Math.sqrt(dx * dx + dy * dy);
        if (d <= radius) {
          let angle = Math.atan2(dy, dx);
          if (angle < 0) angle += 2 * Math.PI;
          let hue = (angle / (2 * Math.PI)) * 360;
          let sat = d / radius;
          const rgb = hslToRgb(hue, sat, lightness);
          const index = (y * wheelCanvas.width + x) * 4;
          image.data[index] = rgb[0];
          image.data[index + 1] = rgb[1];
          image.data[index + 2] = rgb[2];
          image.data[index + 3] = 255;
        }
      }
    }
    ctxWheel.putImageData(image, 0, 0);

    // Draw picker
    ctxWheel.strokeStyle = "white";
    ctxWheel.lineWidth = 3;
    ctxWheel.shadowColor = "rgba(0,0,0,0.5)";
    ctxWheel.shadowBlur = 4;
    ctxWheel.beginPath();
    ctxWheel.arc(pickerPos.x, pickerPos.y, 8, 0, 2 * Math.PI);
    ctxWheel.stroke();
    ctxWheel.shadowBlur = 0;
  }

  function hslToRgb(h, s, l) {
    s = Math.min(Math.max(s, 0), 1);
    l = Math.min(Math.max(l, 0), 1);
    let c = (1 - Math.abs(2 * l - 1)) * s;
    let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    let m = l - c / 2;
    let r = 0,
      g = 0,
      b = 0;
    if (h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h < 300) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }
    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255),
    ];
  }

  function getColorFromPos(x, y) {
    const dx = x - radius,
      dy = y - radius,
      d = Math.sqrt(dx * dx + dy * dy);
    if (d > radius) return null;
    const pixel = ctxWheel.getImageData(x, y, 1, 1).data;
    pickerPos = { x, y };
    currentColor = [pixel[0], pixel[1], pixel[2]];
    selectedHex.textContent = rgbToHex(currentColor);
    return currentColor;
  }

  let dragging = false;
  wheelCanvas.addEventListener("mousedown", (e) => {
    dragging = true;
    getColorFromPos(e.offsetX, e.offsetY);
    drawWheel();
    updateSchemeColors();
  });
  wheelCanvas.addEventListener("mousemove", (e) => {
    if (dragging) {
      getColorFromPos(e.offsetX, e.offsetY);
      drawWheel();
      updateSchemeColors();
    }
  });
  wheelCanvas.addEventListener("mouseup", () => {
    dragging = false;
  });
  wheelCanvas.addEventListener("mouseleave", () => {
    dragging = false;
  });

  lightnessSlider.oninput = () => {
    drawWheel();
    if (pickerPos.x && pickerPos.y) {
      getColorFromPos(pickerPos.x, pickerPos.y);
      updateSchemeColors();
    }
  };

  addToDominant.addEventListener("click", () => {
    if (currentColor) {
      dominantColors.push(currentColor);
      if (dominantColors.length > 10) dominantColors.shift();
      renderColors();
    }
  });

  drawWheel();
}

// Color Scheme
const schemeSelect = document.getElementById("scheme-select");
const schemeColorsDiv = document.getElementById("scheme-colors");

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return [h, s, l];
}

function generateColorScheme(baseRgb, schemeType) {
  const [r, g, b] = baseRgb;
  const hsl = rgbToHsl(r, g, b);
  const schemes = [];

  switch (schemeType) {
    case "monochrome":
      schemes.push(baseRgb);
      schemes.push(hslToRgb(hsl[0], hsl[1], Math.min(hsl[2] + 0.15, 0.95)));
      schemes.push(hslToRgb(hsl[0], hsl[1], Math.max(hsl[2] - 0.15, 0.05)));
      schemes.push(hslToRgb(hsl[0], Math.min(hsl[1] + 0.2, 1), hsl[2]));
      break;
    case "complementary":
      schemes.push(baseRgb);
      schemes.push(hslToRgb((hsl[0] + 180) % 360, hsl[1], hsl[2]));
      break;
    case "analogous":
      schemes.push(baseRgb);
      schemes.push(hslToRgb((hsl[0] + 30) % 360, hsl[1], hsl[2]));
      schemes.push(hslToRgb((hsl[0] - 30 + 360) % 360, hsl[1], hsl[2]));
      break;
    case "triadic":
      schemes.push(baseRgb);
      schemes.push(hslToRgb((hsl[0] + 120) % 360, hsl[1], hsl[2]));
      schemes.push(hslToRgb((hsl[0] + 240) % 360, hsl[1], hsl[2]));
      break;
    case "tetradic":
      schemes.push(baseRgb);
      schemes.push(hslToRgb((hsl[0] + 90) % 360, hsl[1], hsl[2]));
      schemes.push(hslToRgb((hsl[0] + 180) % 360, hsl[1], hsl[2]));
      schemes.push(hslToRgb((hsl[0] + 270) % 360, hsl[1], hsl[2]));
      break;
    case "split-complementary":
      schemes.push(baseRgb);
      schemes.push(hslToRgb((hsl[0] + 150) % 360, hsl[1], hsl[2]));
      schemes.push(hslToRgb((hsl[0] + 210) % 360, hsl[1], hsl[2]));
      break;
  }
  return schemes;
}

function hslToRgb(h, s, l) {
  s = Math.min(Math.max(s, 0), 1);
  l = Math.min(Math.max(l, 0), 1);
  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function updateSchemeColors() {
  if (!currentColor) return;
  const colors = generateColorScheme(currentColor, schemeSelect.value);
  schemeColorsDiv.innerHTML = "";
  colors.forEach((c) => {
    const div = document.createElement("div");
    div.className = "color-swatch";
    div.style.background = `rgb(${c.join(",")})`;
    div.title = rgbToHex(c);
    div.onclick = () => {
      dominantColors.push(c);
      if (dominantColors.length > 10) dominantColors.shift();
      renderColors();
    };
    schemeColorsDiv.appendChild(div);
  });
}

schemeSelect.addEventListener("change", updateSchemeColors);

// Contrast Checker
function updateContrastOptions() {
  contrastFg.innerHTML = '<option value="">Select foreground</option>';
  contrastBg.innerHTML = '<option value="">Select background</option>';

  dominantColors.forEach((c, i) => {
    const hex = rgbToHex(c);
    contrastFg.innerHTML += `<option value="${i}">${hex}</option>`;
    contrastBg.innerHTML += `<option value="${i}">${hex}</option>`;
  });
}

function calculateContrast(rgb1, rgb2) {
  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getLuminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

contrastFg.onchange = checkContrast;
contrastBg.onchange = checkContrast;

function checkContrast() {
  const fgIdx = contrastFg.value;
  const bgIdx = contrastBg.value;

  if (fgIdx === "" || bgIdx === "") {
    contrastResult.innerHTML = "Select both colors";
    contrastResult.style.background = "";
    contrastResult.style.borderColor = "var(--border)";
    contrastResult.style.borderWidth = "1px";
    return;
  }

  const fg = dominantColors[fgIdx];
  const bg = dominantColors[bgIdx];
  const ratio = calculateContrast(fg, bg).toFixed(2);

  const passAA = ratio >= 4.5;
  const passAAA = ratio >= 7;

  contrastResult.style.background = `linear-gradient(to right, rgb(${bg.join(
    ","
  )}), rgb(${fg.join(",")}))`;
  contrastResult.style.color = ratio >= 4.5 ? `rgb(${fg.join(",")})` : "#000";
  contrastResult.style.borderColor = passAAA
    ? "var(--success)"
    : passAA
    ? "var(--warning)"
    : "var(--danger)";
  contrastResult.style.borderWidth = "3px";

  contrastResult.innerHTML = `
        <strong>Contrast Ratio: ${ratio}:1</strong><br>
        <small>AA (4.5:1): ${passAA ? "✓ Pass" : "✗ Fail"} | AAA (7:1): ${
    passAAA ? "✓ Pass" : "✗ Fail"
  }</small>
      `;
}
