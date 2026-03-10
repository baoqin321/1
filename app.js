const dom = {
  tabButtons: Array.from(document.querySelectorAll(".tab-button")),
  fileInput: document.getElementById("fileInput"),
  uploadHint: document.getElementById("uploadHint"),
  modeSelect: document.getElementById("modeSelect"),
  intensityInput: document.getElementById("intensityInput"),
  intensityValue: document.getElementById("intensityValue"),
  imageActions: document.getElementById("imageActions"),
  videoActions: document.getElementById("videoActions"),
  applyImageButton: document.getElementById("applyImageButton"),
  resetImageButton: document.getElementById("resetImageButton"),
  downloadImageButton: document.getElementById("downloadImageButton"),
  playPauseButton: document.getElementById("playPauseButton"),
  restartVideoButton: document.getElementById("restartVideoButton"),
  exportVideoButton: document.getElementById("exportVideoButton"),
  clearSelectionButton: document.getElementById("clearSelectionButton"),
  timelineField: document.getElementById("timelineField"),
  timelineInput: document.getElementById("timelineInput"),
  timeLabel: document.getElementById("timeLabel"),
  statusPill: document.getElementById("statusPill"),
  emptyState: document.getElementById("emptyState"),
  stage: document.getElementById("previewStage"),
  canvasStack: document.getElementById("canvasStack"),
  mediaCanvas: document.getElementById("mediaCanvas"),
  overlayCanvas: document.getElementById("overlayCanvas"),
  sourceVideo: document.getElementById("sourceVideo"),
  selectModeButton: document.getElementById("selectModeButton"),
  brushModeButton: document.getElementById("brushModeButton"),
  panModeButton: document.getElementById("panModeButton"),
  zoomOutButton: document.getElementById("zoomOutButton"),
  zoomInButton: document.getElementById("zoomInButton"),
  fitViewButton: document.getElementById("fitViewButton"),
  zoomLabel: document.getElementById("zoomLabel"),
  brushField: document.getElementById("brushField"),
  brushSizeInput: document.getElementById("brushSizeInput"),
  brushSizeValue: document.getElementById("brushSizeValue"),
};

const mediaCtx = dom.mediaCanvas.getContext("2d");
const overlayCtx = dom.overlayCanvas.getContext("2d");

const imageOriginalCanvas = document.createElement("canvas");
const imageOriginalCtx = imageOriginalCanvas.getContext("2d");
const imageWorkingCanvas = document.createElement("canvas");
const imageWorkingCtx = imageWorkingCanvas.getContext("2d");
const videoFrameCanvas = document.createElement("canvas");
const videoFrameCtx = videoFrameCanvas.getContext("2d");

const state = {
  activeTab: "image",
  mode: dom.modeSelect.value,
  intensity: Number(dom.intensityInput.value),
  interactionMode: "select",
  selection: null,
  dragStart: null,
  isDragging: false,
  isPanning: false,
  isBrushing: false,
  image: {
    loaded: false,
    objectUrl: "",
  },
  video: {
    loaded: false,
    objectUrl: "",
    animationFrameId: 0,
    isExporting: false,
    frameReady: false,
  },
  viewport: {
    mediaWidth: 0,
    mediaHeight: 0,
    canvasWidth: 0,
    canvasHeight: 0,
    stageWidth: 0,
    stageHeight: 0,
    baseScale: 1,
    zoom: 1,
    minZoom: 0.35,
    maxZoom: 8,
    offsetX: 0,
    offsetY: 0,
    panOrigin: null,
  },
  brush: {
    size: Number(dom.brushSizeInput.value),
    pointer: null,
    lastPoint: null,
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatTime(seconds) {
  const total = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const whole = Math.floor(total);
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getSourceSize(source) {
  if ("videoWidth" in source && source.videoWidth) {
    return { width: source.videoWidth, height: source.videoHeight };
  }

  if ("naturalWidth" in source && source.naturalWidth) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }

  return { width: source.width, height: source.height };
}

function normalizeRect(start, end, maxWidth, maxHeight) {
  const x1 = clamp(Math.round(start.x), 0, maxWidth);
  const y1 = clamp(Math.round(start.y), 0, maxHeight);
  const x2 = clamp(Math.round(end.x), 0, maxWidth);
  const y2 = clamp(Math.round(end.y), 0, maxHeight);

  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    w: Math.abs(x2 - x1),
    h: Math.abs(y2 - y1),
  };
}

function hasActiveMedia() {
  return state.activeTab === "image" ? state.image.loaded : state.video.loaded;
}

function getActiveMediaSize() {
  if (state.activeTab === "image" && state.image.loaded) {
    return { width: imageWorkingCanvas.width, height: imageWorkingCanvas.height };
  }

  if (state.activeTab === "video" && state.video.loaded && dom.sourceVideo.videoWidth) {
    return { width: dom.sourceVideo.videoWidth, height: dom.sourceVideo.videoHeight };
  }

  return null;
}

function setStatus(text) {
  dom.statusPill.textContent = text;
}

function toggleEmptyState(hasMedia) {
  dom.emptyState.classList.toggle("is-hidden", hasMedia);
  dom.canvasStack.classList.toggle("is-hidden", !hasMedia);
}

function stopVideoLoop() {
  if (state.video.animationFrameId) {
    cancelAnimationFrame(state.video.animationFrameId);
    state.video.animationFrameId = 0;
  }
}

function revokeObjectUrl(url) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

function cloneCanvas(sourceCanvas) {
  const clone = document.createElement("canvas");
  clone.width = sourceCanvas.width;
  clone.height = sourceCanvas.height;
  clone.getContext("2d").drawImage(sourceCanvas, 0, 0);
  return clone;
}

function updateCursor() {
  if (state.interactionMode === "pan") {
    dom.overlayCanvas.style.cursor = state.isPanning ? "grabbing" : "grab";
    return;
  }

  if (state.interactionMode === "brush" && state.activeTab === "image") {
    dom.overlayCanvas.style.cursor = "none";
    return;
  }

  dom.overlayCanvas.style.cursor = "crosshair";
}

function setInteractionMode(mode) {
  if (mode === "brush" && state.activeTab !== "image") {
    mode = "select";
  }

  state.interactionMode = mode;
  if (mode === "brush") {
    state.selection = null;
  }
  updateCursor();
  drawOverlay();
  updateUiState();
}

function getStageAvailableSize() {
  const stageWidth = Math.max(260, Math.floor(dom.stage.clientWidth - 36));
  const stageHeight = Math.max(260, Math.floor(dom.stage.clientHeight - 36));
  return { width: stageWidth, height: stageHeight };
}

function getViewportScale() {
  return state.viewport.baseScale * state.viewport.zoom;
}

function updateZoomLabel() {
  dom.zoomLabel.textContent = `${Math.round(state.viewport.zoom * 100)}%`;
}

function clampViewportOffset() {
  const { mediaWidth, mediaHeight, canvasWidth, canvasHeight } = state.viewport;
  if (!mediaWidth || !mediaHeight || !canvasWidth || !canvasHeight) {
    return;
  }

  const scaledWidth = mediaWidth * getViewportScale();
  const scaledHeight = mediaHeight * getViewportScale();

  if (scaledWidth <= canvasWidth) {
    state.viewport.offsetX = (canvasWidth - scaledWidth) / 2;
  } else {
    state.viewport.offsetX = clamp(state.viewport.offsetX, canvasWidth - scaledWidth, 0);
  }

  if (scaledHeight <= canvasHeight) {
    state.viewport.offsetY = (canvasHeight - scaledHeight) / 2;
  } else {
    state.viewport.offsetY = clamp(state.viewport.offsetY, canvasHeight - scaledHeight, 0);
  }
}

function fitViewport() {
  state.viewport.zoom = 1;
  state.viewport.offsetX = 0;
  state.viewport.offsetY = 0;
  clampViewportOffset();
  updateZoomLabel();
}

function syncViewportToMedia(resetZoom = false) {
  const mediaSize = getActiveMediaSize();
  if (!mediaSize) {
    return;
  }

  const available = getStageAvailableSize();
  const needsResize =
    state.viewport.mediaWidth !== mediaSize.width ||
    state.viewport.mediaHeight !== mediaSize.height ||
    state.viewport.stageWidth !== available.width ||
    state.viewport.stageHeight !== available.height;

  if (!needsResize && !resetZoom) {
    return;
  }

  const baseScale = Math.min(available.width / mediaSize.width, available.height / mediaSize.height);
  const canvasWidth = Math.max(1, Math.round(mediaSize.width * baseScale));
  const canvasHeight = Math.max(1, Math.round(mediaSize.height * baseScale));

  state.viewport.mediaWidth = mediaSize.width;
  state.viewport.mediaHeight = mediaSize.height;
  state.viewport.canvasWidth = canvasWidth;
  state.viewport.canvasHeight = canvasHeight;
  state.viewport.stageWidth = available.width;
  state.viewport.stageHeight = available.height;
  state.viewport.baseScale = baseScale;

  dom.mediaCanvas.width = canvasWidth;
  dom.mediaCanvas.height = canvasHeight;
  dom.overlayCanvas.width = canvasWidth;
  dom.overlayCanvas.height = canvasHeight;
  dom.canvasStack.style.width = `${canvasWidth}px`;
  dom.canvasStack.style.height = `${canvasHeight}px`;
  dom.canvasStack.style.aspectRatio = `${canvasWidth} / ${canvasHeight}`;

  fitViewport();
  updateCursor();
}

function mediaPointFromScreen(point) {
  const scale = getViewportScale();
  if (!scale) {
    return { x: 0, y: 0 };
  }

  return {
    x: clamp((point.x - state.viewport.offsetX) / scale, 0, state.viewport.mediaWidth),
    y: clamp((point.y - state.viewport.offsetY) / scale, 0, state.viewport.mediaHeight),
  };
}

function mediaRectToScreenRect(rect) {
  const scale = getViewportScale();
  return {
    x: rect.x * scale + state.viewport.offsetX,
    y: rect.y * scale + state.viewport.offsetY,
    w: rect.w * scale,
    h: rect.h * scale,
  };
}

function mediaPointToScreenPoint(point) {
  const scale = getViewportScale();
  return {
    x: point.x * scale + state.viewport.offsetX,
    y: point.y * scale + state.viewport.offsetY,
  };
}

function getPointerPosition(event) {
  const rect = dom.overlayCanvas.getBoundingClientRect();
  const scaleX = dom.overlayCanvas.width / rect.width;
  const scaleY = dom.overlayCanvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function setZoom(nextZoom, anchorPoint = null) {
  if (!hasActiveMedia()) {
    return;
  }

  const targetZoom = clamp(nextZoom, state.viewport.minZoom, state.viewport.maxZoom);
  const anchor = anchorPoint || {
    x: state.viewport.canvasWidth / 2,
    y: state.viewport.canvasHeight / 2,
  };
  const mediaPoint = mediaPointFromScreen(anchor);

  state.viewport.zoom = targetZoom;
  const nextScale = getViewportScale();
  state.viewport.offsetX = anchor.x - mediaPoint.x * nextScale;
  state.viewport.offsetY = anchor.y - mediaPoint.y * nextScale;
  clampViewportOffset();
  updateZoomLabel();
  redrawPreview();
  updateUiState();
}

function drawPreviewSource(source, mediaWidth, mediaHeight) {
  mediaCtx.save();
  mediaCtx.setTransform(1, 0, 0, 1, 0, 0);
  mediaCtx.clearRect(0, 0, dom.mediaCanvas.width, dom.mediaCanvas.height);
  mediaCtx.fillStyle = "#050b12";
  mediaCtx.fillRect(0, 0, dom.mediaCanvas.width, dom.mediaCanvas.height);
  mediaCtx.imageSmoothingEnabled = true;
  mediaCtx.drawImage(
    source,
    state.viewport.offsetX,
    state.viewport.offsetY,
    mediaWidth * getViewportScale(),
    mediaHeight * getViewportScale(),
  );
  mediaCtx.restore();
}

function drawOverlay() {
  overlayCtx.clearRect(0, 0, dom.overlayCanvas.width, dom.overlayCanvas.height);

  if (state.selection && state.selection.w >= 2 && state.selection.h >= 2) {
    const screenRect = mediaRectToScreenRect(state.selection);
    overlayCtx.fillStyle = "rgba(5, 11, 18, 0.42)";
    overlayCtx.fillRect(0, 0, dom.overlayCanvas.width, dom.overlayCanvas.height);
    overlayCtx.clearRect(screenRect.x, screenRect.y, screenRect.w, screenRect.h);

    overlayCtx.save();
    overlayCtx.lineWidth = 2;
    overlayCtx.setLineDash([12, 8]);
    overlayCtx.strokeStyle = "#ffba4a";
    overlayCtx.strokeRect(screenRect.x, screenRect.y, screenRect.w, screenRect.h);
    overlayCtx.restore();
  }

  if (state.interactionMode !== "brush" || state.activeTab !== "image" || !state.image.loaded || !state.brush.pointer) {
    return;
  }

  const screenPoint = mediaPointToScreenPoint(state.brush.pointer);
  const radius = (state.brush.size / 2) * getViewportScale();
  overlayCtx.save();
  overlayCtx.setLineDash([]);
  overlayCtx.beginPath();
  overlayCtx.arc(screenPoint.x, screenPoint.y, radius, 0, Math.PI * 2);
  overlayCtx.fillStyle = "rgba(255, 186, 74, 0.12)";
  overlayCtx.fill();
  overlayCtx.lineWidth = 2;
  overlayCtx.strokeStyle = "#ffba4a";
  overlayCtx.stroke();

  overlayCtx.beginPath();
  overlayCtx.arc(screenPoint.x, screenPoint.y, Math.max(2, radius * 0.12), 0, Math.PI * 2);
  overlayCtx.fillStyle = "#fff7ea";
  overlayCtx.fill();
  overlayCtx.restore();
}

function redrawPreview() {
  if (!hasActiveMedia()) {
    return;
  }

  syncViewportToMedia(false);

  if (state.activeTab === "image") {
    drawPreviewSource(imageWorkingCanvas, imageWorkingCanvas.width, imageWorkingCanvas.height);
    drawOverlay();
    return;
  }

  if (!state.video.frameReady && dom.sourceVideo.readyState >= 2) {
    renderVideoOutputFrame();
  }

  if (state.video.frameReady) {
    drawPreviewSource(videoFrameCanvas, videoFrameCanvas.width, videoFrameCanvas.height);
    drawOverlay();
  }
}

function averageColorFromRegions(source, regions) {
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let count = 0;

  regions.forEach((region) => {
    if (region.w <= 0 || region.h <= 0) {
      return;
    }

    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = region.w;
    sampleCanvas.height = region.h;
    const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
    sampleCtx.drawImage(source, region.x, region.y, region.w, region.h, 0, 0, region.w, region.h);
    const { data } = sampleCtx.getImageData(0, 0, region.w, region.h);

    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3] / 255;
      totalR += data[index] * alpha;
      totalG += data[index + 1] * alpha;
      totalB += data[index + 2] * alpha;
      count += alpha;
    }
  });

  if (!count) {
    return { r: 24, g: 30, b: 38 };
  }

  return {
    r: Math.round(totalR / count),
    g: Math.round(totalG / count),
    b: Math.round(totalB / count),
  };
}

function buildSamplingRegions(sourceWidth, sourceHeight, rect, sampleSize) {
  return [
    { x: rect.x, y: Math.max(0, rect.y - sampleSize), w: rect.w, h: Math.min(sampleSize, rect.y) },
    {
      x: rect.x,
      y: rect.y + rect.h,
      w: rect.w,
      h: Math.max(0, Math.min(sampleSize, sourceHeight - rect.y - rect.h)),
    },
    { x: Math.max(0, rect.x - sampleSize), y: rect.y, w: Math.min(sampleSize, rect.x), h: rect.h },
    {
      x: rect.x + rect.w,
      y: rect.y,
      w: Math.max(0, Math.min(sampleSize, sourceWidth - rect.x - rect.w)),
      h: rect.h,
    },
  ];
}

function pickRepairRegion(sourceWidth, sourceHeight, rect) {
  const candidates = [
    { x: rect.x, y: rect.y - rect.h, w: rect.w, h: rect.h, weight: 4 },
    { x: rect.x, y: rect.y + rect.h, w: rect.w, h: rect.h, weight: 3 },
    { x: rect.x - rect.w, y: rect.y, w: rect.w, h: rect.h, weight: 2 },
    { x: rect.x + rect.w, y: rect.y, w: rect.w, h: rect.h, weight: 1 },
    { x: rect.x - rect.w, y: rect.y - rect.h, w: rect.w, h: rect.h, weight: 1 },
    { x: rect.x + rect.w, y: rect.y - rect.h, w: rect.w, h: rect.h, weight: 1 },
    { x: rect.x - rect.w, y: rect.y + rect.h, w: rect.w, h: rect.h, weight: 1 },
    { x: rect.x + rect.w, y: rect.y + rect.h, w: rect.w, h: rect.h, weight: 1 },
  ].filter((candidate) => {
    return (
      candidate.x >= 0 &&
      candidate.y >= 0 &&
      candidate.x + candidate.w <= sourceWidth &&
      candidate.y + candidate.h <= sourceHeight
    );
  });

  if (candidates.length) {
    candidates.sort((left, right) => right.weight - left.weight);
    return candidates[0];
  }

  return {
    x: clamp(rect.x, 0, Math.max(0, sourceWidth - rect.w)),
    y: clamp(rect.y - rect.h, 0, Math.max(0, sourceHeight - rect.h)),
    w: rect.w,
    h: rect.h,
  };
}

function rectanglesOverlap(left, right, padding = 0) {
  return !(
    left.x + left.w + padding <= right.x ||
    right.x + right.w + padding <= left.x ||
    left.y + left.h + padding <= right.y ||
    right.y + right.h + padding <= left.y
  );
}

function getStripDifference(sourceCtx, first, second) {
  const width = Math.max(1, Math.min(first.w, second.w));
  const height = Math.max(1, Math.min(first.h, second.h));
  const firstData = sourceCtx.getImageData(first.x, first.y, width, height).data;
  const secondData = sourceCtx.getImageData(second.x, second.y, width, height).data;

  let diff = 0;
  let count = 0;

  for (let index = 0; index < firstData.length; index += 16) {
    diff += Math.abs(firstData[index] - secondData[index]);
    diff += Math.abs(firstData[index + 1] - secondData[index + 1]);
    diff += Math.abs(firstData[index + 2] - secondData[index + 2]);
    count += 3;
  }

  return count ? diff / count : Number.POSITIVE_INFINITY;
}

function scoreRepairRegion(sourceCtx, sourceWidth, sourceHeight, rect, candidate, edgeSize) {
  const comparisons = [];

  if (rect.y >= edgeSize) {
    comparisons.push([
      { x: rect.x, y: rect.y - edgeSize, w: rect.w, h: edgeSize },
      { x: candidate.x, y: candidate.y, w: rect.w, h: edgeSize },
    ]);
  }

  if (rect.y + rect.h + edgeSize <= sourceHeight) {
    comparisons.push([
      { x: rect.x, y: rect.y + rect.h, w: rect.w, h: edgeSize },
      { x: candidate.x, y: candidate.y + candidate.h - edgeSize, w: rect.w, h: edgeSize },
    ]);
  }

  if (rect.x >= edgeSize) {
    comparisons.push([
      { x: rect.x - edgeSize, y: rect.y, w: edgeSize, h: rect.h },
      { x: candidate.x, y: candidate.y, w: edgeSize, h: rect.h },
    ]);
  }

  if (rect.x + rect.w + edgeSize <= sourceWidth) {
    comparisons.push([
      { x: rect.x + rect.w, y: rect.y, w: edgeSize, h: rect.h },
      { x: candidate.x + candidate.w - edgeSize, y: candidate.y, w: edgeSize, h: rect.h },
    ]);
  }

  if (!comparisons.length) {
    return Number.POSITIVE_INFINITY;
  }

  let score = 0;
  comparisons.forEach(([first, second]) => {
    score += getStripDifference(sourceCtx, first, second);
  });

  const distance = Math.hypot(candidate.x - rect.x, candidate.y - rect.y);
  return score / comparisons.length + distance * 0.08;
}

function findBestRepairRegion(source, rect) {
  if (!(source instanceof HTMLCanvasElement)) {
    return pickRepairRegion(getSourceSize(source).width, getSourceSize(source).height, rect);
  }

  const sourceWidth = source.width;
  const sourceHeight = source.height;
  const sourceCtx = source.getContext("2d", { willReadFrequently: true });
  const edgeSize = clamp(Math.round(Math.min(rect.w, rect.h) * 0.18), 4, 16);
  const step = Math.max(edgeSize, Math.round(Math.min(rect.w, rect.h) / 3));
  const searchRadiusX = Math.max(rect.w * 2, 48);
  const searchRadiusY = Math.max(rect.h * 2, 48);
  const fallback = pickRepairRegion(sourceWidth, sourceHeight, rect);

  let bestRegion = fallback;
  let bestScore = scoreRepairRegion(sourceCtx, sourceWidth, sourceHeight, rect, fallback, edgeSize);

  for (let offsetY = -searchRadiusY; offsetY <= searchRadiusY; offsetY += step) {
    for (let offsetX = -searchRadiusX; offsetX <= searchRadiusX; offsetX += step) {
      if (offsetX === 0 && offsetY === 0) {
        continue;
      }

      const candidate = {
        x: Math.round(rect.x + offsetX),
        y: Math.round(rect.y + offsetY),
        w: rect.w,
        h: rect.h,
      };

      if (
        candidate.x < 0 ||
        candidate.y < 0 ||
        candidate.x + candidate.w > sourceWidth ||
        candidate.y + candidate.h > sourceHeight ||
        rectanglesOverlap(rect, candidate, edgeSize)
      ) {
        continue;
      }

      const score = scoreRepairRegion(sourceCtx, sourceWidth, sourceHeight, rect, candidate, edgeSize);
      if (score < bestScore) {
        bestScore = score;
        bestRegion = candidate;
      }
    }
  }

  return bestRegion;
}

function smoothstep(edgeStart, edgeEnd, value) {
  const span = edgeEnd - edgeStart || 1;
  const t = clamp((value - edgeStart) / span, 0, 1);
  return t * t * (3 - 2 * t);
}

function hashNoise(x, y) {
  let seed = (Math.imul(x + 1, 374761393) + Math.imul(y + 1, 668265263)) >>> 0;
  seed = (seed ^ (seed >>> 13)) >>> 0;
  seed = Math.imul(seed, 1274126177) >>> 0;
  return ((seed ^ (seed >>> 16)) >>> 0) / 4294967295;
}

function createFeatherMaskCanvas(width, height, feather, options = {}) {
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext("2d");
  const safeFeather = Math.max(1, Math.min(feather, Math.floor(Math.min(width, height) / 2) - 1));

  if (safeFeather <= 1) {
    maskCtx.fillStyle = "#fff";
    maskCtx.fillRect(0, 0, width, height);
    return maskCanvas;
  }

  if (options.irregular) {
    const variation = options.variation ?? safeFeather * 0.6;
    const imageData = maskCtx.createImageData(width, height);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const edgeDistance = Math.min(x, y, width - 1 - x, height - 1 - y);
        const noise = (hashNoise(x, y) - 0.5) * 2 * variation;
        const alpha = smoothstep(0, safeFeather, edgeDistance + noise);
        const index = (y * width + x) * 4;
        const channel = Math.round(alpha * 255);
        imageData.data[index] = 255;
        imageData.data[index + 1] = 255;
        imageData.data[index + 2] = 255;
        imageData.data[index + 3] = channel;
      }
    }

    maskCtx.putImageData(imageData, 0, 0);
    return maskCanvas;
  }

  const innerWidth = Math.max(0, width - safeFeather * 2);
  const innerHeight = Math.max(0, height - safeFeather * 2);

  maskCtx.fillStyle = "#fff";
  maskCtx.fillRect(safeFeather, safeFeather, innerWidth, innerHeight);
  maskCtx.fillRect(safeFeather, 0, innerWidth, safeFeather);
  maskCtx.fillRect(safeFeather, safeFeather + innerHeight, innerWidth, safeFeather);
  maskCtx.fillRect(0, safeFeather, safeFeather, innerHeight);
  maskCtx.fillRect(safeFeather + innerWidth, safeFeather, safeFeather, innerHeight);

  const topGradient = maskCtx.createLinearGradient(0, 0, 0, safeFeather);
  topGradient.addColorStop(0, "rgba(255,255,255,0)");
  topGradient.addColorStop(1, "rgba(255,255,255,1)");
  maskCtx.fillStyle = topGradient;
  maskCtx.fillRect(safeFeather, 0, innerWidth, safeFeather);

  const bottomGradient = maskCtx.createLinearGradient(0, height - safeFeather, 0, height);
  bottomGradient.addColorStop(0, "rgba(255,255,255,1)");
  bottomGradient.addColorStop(1, "rgba(255,255,255,0)");
  maskCtx.fillStyle = bottomGradient;
  maskCtx.fillRect(safeFeather, height - safeFeather, innerWidth, safeFeather);

  const leftGradient = maskCtx.createLinearGradient(0, 0, safeFeather, 0);
  leftGradient.addColorStop(0, "rgba(255,255,255,0)");
  leftGradient.addColorStop(1, "rgba(255,255,255,1)");
  maskCtx.fillStyle = leftGradient;
  maskCtx.fillRect(0, safeFeather, safeFeather, innerHeight);

  const rightGradient = maskCtx.createLinearGradient(width - safeFeather, 0, width, 0);
  rightGradient.addColorStop(0, "rgba(255,255,255,1)");
  rightGradient.addColorStop(1, "rgba(255,255,255,0)");
  maskCtx.fillStyle = rightGradient;
  maskCtx.fillRect(width - safeFeather, safeFeather, safeFeather, innerHeight);

  const corners = [
    { x: safeFeather, y: safeFeather, startX: safeFeather, startY: safeFeather },
    { x: width - safeFeather, y: safeFeather, startX: width - safeFeather, startY: safeFeather },
    { x: safeFeather, y: height - safeFeather, startX: safeFeather, startY: height - safeFeather },
    { x: width - safeFeather, y: height - safeFeather, startX: width - safeFeather, startY: height - safeFeather },
  ];

  corners.forEach((corner, index) => {
    const gradient = maskCtx.createRadialGradient(corner.x, corner.y, 0, corner.x, corner.y, safeFeather);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    maskCtx.fillStyle = gradient;

    const drawX = index % 2 === 0 ? 0 : width - safeFeather;
    const drawY = index < 2 ? 0 : height - safeFeather;
    maskCtx.fillRect(drawX, drawY, safeFeather, safeFeather);
  });

  return maskCanvas;
}

function blendPatchIntoContext(ctx, patchCanvas, rect, feather, options = {}) {
  if (feather <= 1) {
    ctx.drawImage(patchCanvas, rect.x, rect.y, rect.w, rect.h);
    return;
  }

  const compositeCanvas = document.createElement("canvas");
  compositeCanvas.width = rect.w;
  compositeCanvas.height = rect.h;
  const compositeCtx = compositeCanvas.getContext("2d");
  compositeCtx.drawImage(patchCanvas, 0, 0, rect.w, rect.h);
  compositeCtx.globalCompositeOperation = "destination-in";
  compositeCtx.drawImage(createFeatherMaskCanvas(rect.w, rect.h, feather, options), 0, 0);
  ctx.drawImage(compositeCanvas, rect.x, rect.y, rect.w, rect.h);
}

function buildInpaintPatch(sourceCanvas, rect, intensity) {
  const padding = clamp(Math.round(Math.max(12, intensity * 2, Math.min(rect.w, rect.h) * 0.4)), 8, 72);
  const localX = Math.max(0, rect.x - padding);
  const localY = Math.max(0, rect.y - padding);
  const localRight = Math.min(sourceCanvas.width, rect.x + rect.w + padding);
  const localBottom = Math.min(sourceCanvas.height, rect.y + rect.h + padding);
  const localWidth = localRight - localX;
  const localHeight = localBottom - localY;
  const relativeRect = {
    x: rect.x - localX,
    y: rect.y - localY,
    w: rect.w,
    h: rect.h,
  };

  const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  const sourceImage = sourceCtx.getImageData(localX, localY, localWidth, localHeight);
  const working = new Float32Array(sourceImage.data.length);
  const output = new Uint8ClampedArray(sourceImage.data.length);
  const mask = new Uint8Array(localWidth * localHeight);

  for (let index = 0; index < sourceImage.data.length; index += 1) {
    const value = sourceImage.data[index];
    working[index] = value;
    output[index] = value;
  }

  let remaining = 0;
  for (let y = relativeRect.y; y < relativeRect.y + relativeRect.h; y += 1) {
    for (let x = relativeRect.x; x < relativeRect.x + relativeRect.w; x += 1) {
      const maskIndex = y * localWidth + x;
      mask[maskIndex] = 1;
      remaining += 1;
    }
  }

  function getPixelOffset(x, y) {
    return (y * localWidth + x) * 4;
  }

  function sampleFromFilledNeighbors(x, y, radius) {
    let totalWeight = 0;
    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let samples = 0;

    for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
      for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
        if (offsetX === 0 && offsetY === 0) {
          continue;
        }

        const sampleX = x + offsetX;
        const sampleY = y + offsetY;
        if (sampleX < 0 || sampleY < 0 || sampleX >= localWidth || sampleY >= localHeight) {
          continue;
        }

        const sampleMaskIndex = sampleY * localWidth + sampleX;
        if (mask[sampleMaskIndex]) {
          continue;
        }

        const distance = Math.hypot(offsetX, offsetY);
        const weight = 1 / (distance * distance);
        const pixelOffset = getPixelOffset(sampleX, sampleY);
        totalR += working[pixelOffset] * weight;
        totalG += working[pixelOffset + 1] * weight;
        totalB += working[pixelOffset + 2] * weight;
        totalWeight += weight;
        samples += 1;
      }
    }

    if (samples < 3 || !totalWeight) {
      return null;
    }

    return {
      r: totalR / totalWeight,
      g: totalG / totalWeight,
      b: totalB / totalWeight,
    };
  }

  let radius = 1;
  let pass = 0;
  while (remaining > 0 && pass < 160) {
    const updates = [];

    for (let y = relativeRect.y; y < relativeRect.y + relativeRect.h; y += 1) {
      for (let x = relativeRect.x; x < relativeRect.x + relativeRect.w; x += 1) {
        const maskIndex = y * localWidth + x;
        if (!mask[maskIndex]) {
          continue;
        }

        const sample = sampleFromFilledNeighbors(x, y, radius);
        if (sample) {
          updates.push({ x, y, sample });
        }
      }
    }

    if (!updates.length) {
      radius = Math.min(radius + 1, 6);
      pass += 1;
      continue;
    }

    updates.forEach(({ x, y, sample }) => {
      const maskIndex = y * localWidth + x;
      const pixelOffset = getPixelOffset(x, y);
      working[pixelOffset] = sample.r;
      working[pixelOffset + 1] = sample.g;
      working[pixelOffset + 2] = sample.b;
      working[pixelOffset + 3] = 255;
      output[pixelOffset] = Math.round(sample.r);
      output[pixelOffset + 1] = Math.round(sample.g);
      output[pixelOffset + 2] = Math.round(sample.b);
      output[pixelOffset + 3] = 255;
      mask[maskIndex] = 0;
    });

    remaining -= updates.length;
    pass += 1;
  }

  if (remaining > 0) {
    const color = averageColorFromRegions(sourceCanvas, buildSamplingRegions(sourceCanvas.width, sourceCanvas.height, rect, padding));
    for (let y = relativeRect.y; y < relativeRect.y + relativeRect.h; y += 1) {
      for (let x = relativeRect.x; x < relativeRect.x + relativeRect.w; x += 1) {
        const maskIndex = y * localWidth + x;
        if (!mask[maskIndex]) {
          continue;
        }

        const pixelOffset = getPixelOffset(x, y);
        output[pixelOffset] = color.r;
        output[pixelOffset + 1] = color.g;
        output[pixelOffset + 2] = color.b;
        output[pixelOffset + 3] = 255;
      }
    }
  }

  const localCanvas = document.createElement("canvas");
  localCanvas.width = localWidth;
  localCanvas.height = localHeight;
  localCanvas.getContext("2d").putImageData(new ImageData(output, localWidth, localHeight), 0, 0);

  const patchCanvas = document.createElement("canvas");
  patchCanvas.width = rect.w;
  patchCanvas.height = rect.h;
  patchCanvas.getContext("2d").drawImage(
    localCanvas,
    relativeRect.x,
    relativeRect.y,
    rect.w,
    rect.h,
    0,
    0,
    rect.w,
    rect.h,
  );
  return patchCanvas;
}

function adjustPatchTone(patchCanvas, sourceCanvas, targetRect, repairRegion, intensity) {
  if (!(sourceCanvas instanceof HTMLCanvasElement)) {
    return;
  }

  const sampleSize = clamp(Math.round(Math.max(6, intensity, Math.min(targetRect.w, targetRect.h) * 0.2)), 6, 20);
  const targetColor = averageColorFromRegions(
    sourceCanvas,
    buildSamplingRegions(sourceCanvas.width, sourceCanvas.height, targetRect, sampleSize),
  );
  const repairColor = averageColorFromRegions(
    sourceCanvas,
    buildSamplingRegions(sourceCanvas.width, sourceCanvas.height, repairRegion, sampleSize),
  );

  const deltaR = clamp((targetColor.r - repairColor.r) * 0.9, -28, 28);
  const deltaG = clamp((targetColor.g - repairColor.g) * 0.9, -28, 28);
  const deltaB = clamp((targetColor.b - repairColor.b) * 0.9, -28, 28);

  if (!deltaR && !deltaG && !deltaB) {
    return;
  }

  const patchCtx = patchCanvas.getContext("2d", { willReadFrequently: true });
  const patchImage = patchCtx.getImageData(0, 0, patchCanvas.width, patchCanvas.height);

  for (let index = 0; index < patchImage.data.length; index += 4) {
    patchImage.data[index] = clamp(Math.round(patchImage.data[index] + deltaR), 0, 255);
    patchImage.data[index + 1] = clamp(Math.round(patchImage.data[index + 1] + deltaG), 0, 255);
    patchImage.data[index + 2] = clamp(Math.round(patchImage.data[index + 2] + deltaB), 0, 255);
  }

  patchCtx.putImageData(patchImage, 0, 0);
}

function buildDifferenceMask(targetCanvas, patchCanvas, rect, intensity, options = {}) {
  const width = rect.w;
  const height = rect.h;
  const aggressiveness = clamp(options.aggressiveness ?? 0, 0, 1);
  const targetCtx = targetCanvas.getContext("2d", { willReadFrequently: true });
  const patchCtx = patchCanvas.getContext("2d", { willReadFrequently: true });
  const targetData = targetCtx.getImageData(rect.x, rect.y, width, height).data;
  const patchData = patchCtx.getImageData(0, 0, width, height).data;
  const baseDiffValues = new Float32Array(width * height);
  const highlightValues = new Float32Array(width * height);
  const coreConfidence = new Float32Array(width * height);

  let baseSum = 0;
  let baseSumSquares = 0;
  let highlightSum = 0;
  let highlightSumSquares = 0;

  for (let index = 0, pixel = 0; index < targetData.length; index += 4, pixel += 1) {
    const targetR = targetData[index];
    const targetG = targetData[index + 1];
    const targetB = targetData[index + 2];
    const patchR = patchData[index];
    const patchG = patchData[index + 1];
    const patchB = patchData[index + 2];

    const dr = Math.abs(targetR - patchR);
    const dg = Math.abs(targetG - patchG);
    const db = Math.abs(targetB - patchB);
    const baseDiff = dr * 0.299 + dg * 0.587 + db * 0.114;
    baseDiffValues[pixel] = baseDiff;
    baseSum += baseDiff;
    baseSumSquares += baseDiff * baseDiff;

    const targetLuma = targetR * 0.299 + targetG * 0.587 + targetB * 0.114;
    const patchLuma = patchR * 0.299 + patchG * 0.587 + patchB * 0.114;
    const targetChroma = Math.max(targetR, targetG, targetB) - Math.min(targetR, targetG, targetB);
    const patchChroma = Math.max(patchR, patchG, patchB) - Math.min(patchR, patchG, patchB);
    const positiveLift = Math.max(0, targetLuma - patchLuma);
    const desaturation = Math.max(0, patchChroma - targetChroma);
    const whiteness = 1 - clamp(targetChroma / 96, 0, 1);
    const highlight = positiveLift * (0.75 + whiteness * 0.55) + desaturation * 0.3;
    highlightValues[pixel] = highlight;
    highlightSum += highlight;
    highlightSumSquares += highlight * highlight;
    coreConfidence[pixel] = highlight * (0.72 + whiteness * 0.35) + baseDiff * 0.22;
  }

  const count = Math.max(1, baseDiffValues.length);
  const baseMean = baseSum / count;
  const baseVariance = Math.max(0, baseSumSquares / count - baseMean * baseMean);
  const baseDeviation = Math.sqrt(baseVariance);
  const highlightMean = highlightSum / count;
  const highlightVariance = Math.max(0, highlightSumSquares / count - highlightMean * highlightMean);
  const highlightDeviation = Math.sqrt(highlightVariance);
  const coreMean = coreConfidence.reduce((total, value) => total + value, 0) / count;
  let coreVariance = 0;
  for (let index = 0; index < coreConfidence.length; index += 1) {
    const distance = coreConfidence[index] - coreMean;
    coreVariance += distance * distance;
  }
  const coreDeviation = Math.sqrt(coreVariance / count);
  const baseLow = Math.max(4, baseMean * (0.55 - aggressiveness * 0.22) + baseDeviation * (0.08 - aggressiveness * 0.03));
  const baseHigh = Math.max(baseLow + 4, baseMean * (0.9 - aggressiveness * 0.18) + baseDeviation * (0.55 + intensity * 0.008));
  const highlightLow = Math.max(2, highlightMean * (0.55 - aggressiveness * 0.2) + highlightDeviation * (0.08 - aggressiveness * 0.03));
  const highlightHigh = Math.max(highlightLow + 3, highlightMean * (0.95 - aggressiveness * 0.18) + highlightDeviation * (0.7 + intensity * 0.01));
  const coreLow = Math.max(2, coreMean * (0.5 - aggressiveness * 0.18) + coreDeviation * (0.08 - aggressiveness * 0.03));
  const coreHigh = Math.max(coreLow + 3, coreMean * (0.9 - aggressiveness * 0.18) + coreDeviation * (0.75 + intensity * 0.01));

  const alpha = new Float32Array(width * height);
  const borderSoftness = Math.max(3, Math.round(Math.min(width, height) * 0.16));
  for (let index = 0; index < alpha.length; index += 1) {
    const x = index % width;
    const y = Math.floor(index / width);
    const edgeDistance = Math.min(x, y, width - 1 - x, height - 1 - y);
    const centerBias = smoothstep(0, borderSoftness, edgeDistance);
    const baseAlpha = smoothstep(baseLow, baseHigh, baseDiffValues[index]) * (0.6 + aggressiveness * 0.14);
    const highlightAlpha = smoothstep(highlightLow, highlightHigh, highlightValues[index]) * (0.68 + centerBias * 0.32 + aggressiveness * 0.16);
    const coreAlpha = smoothstep(coreLow, coreHigh, coreConfidence[index]) * (0.72 + centerBias * 0.28 + aggressiveness * 0.22);
    alpha[index] = Math.max(baseAlpha, highlightAlpha, coreAlpha);
  }

  const spreadRadius = clamp(Math.round(Math.max(2, Math.min(width, height) * (0.04 + aggressiveness * 0.02))), 2, 8);
  const spread = new Float32Array(alpha.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let strongest = 0;
      for (let offsetY = -spreadRadius; offsetY <= spreadRadius; offsetY += 1) {
        const sampleY = clamp(y + offsetY, 0, height - 1);
        for (let offsetX = -spreadRadius; offsetX <= spreadRadius; offsetX += 1) {
          const sampleX = clamp(x + offsetX, 0, width - 1);
          strongest = Math.max(strongest, smoothstep(coreLow, coreHigh, coreConfidence[sampleY * width + sampleX]));
        }
      }
      spread[y * width + x] = strongest;
    }
  }

  const blurRadius = clamp(Math.round(Math.max(2, Math.min(width, height) * 0.06)), 2, 10);
  const temp = new Float32Array(alpha.length);

  for (let pass = 0; pass < 2; pass += 1) {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let total = 0;
        let weight = 0;

        for (let offset = -blurRadius; offset <= blurRadius; offset += 1) {
          const sampleX = clamp(x + offset, 0, width - 1);
          total += alpha[y * width + sampleX];
          weight += 1;
        }

        temp[y * width + x] = total / weight;
      }
    }

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let total = 0;
        let weight = 0;

        for (let offset = -blurRadius; offset <= blurRadius; offset += 1) {
          const sampleY = clamp(y + offset, 0, height - 1);
          total += temp[sampleY * width + x];
          weight += 1;
        }

        alpha[y * width + x] = total / weight;
      }
    }
  }

  let maxAlpha = 0;
  for (let index = 0; index < alpha.length; index += 1) {
    maxAlpha = Math.max(maxAlpha, alpha[index]);
  }

  if (maxAlpha < 0.08) {
    alpha.fill(1);
  } else {
    const boost = 1 / maxAlpha;
    for (let index = 0; index < alpha.length; index += 1) {
      const x = index % width;
      const y = Math.floor(index / width);
      const edgeDistance = Math.min(x, y, width - 1 - x, height - 1 - y);
      const centerBias = smoothstep(0, borderSoftness, edgeDistance);
      alpha[index] = clamp(alpha[index] * boost, 0, 1);
      alpha[index] = Math.max(alpha[index], spread[index] * (0.45 + centerBias * 0.38 + aggressiveness * 0.12));

      if (highlightValues[index] > highlightLow || coreConfidence[index] > coreLow) {
        alpha[index] = Math.max(alpha[index], 0.46 + centerBias * 0.4 + aggressiveness * 0.12);
      }
    }
  }

  return alpha;
}

function combineAlphaMasks(...masks) {
  const length = masks[0]?.length || 0;
  const combined = new Float32Array(length);

  for (let index = 0; index < length; index += 1) {
    let strongest = 0;
    masks.forEach((mask) => {
      if (mask) {
        strongest = Math.max(strongest, mask[index]);
      }
    });
    combined[index] = strongest;
  }

  return combined;
}

function buildBrushMask(width, height, centerX, centerY, radius) {
  const mask = new Float32Array(width * height);
  const innerRadius = radius * 0.42;
  const outerRadius = Math.max(innerRadius + 1, radius);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = x + 0.5 - centerX;
      const dy = y + 0.5 - centerY;
      const distance = Math.hypot(dx, dy);
      mask[y * width + x] = 1 - smoothstep(innerRadius, outerRadius, distance);
    }
  }

  return mask;
}

function mergePatchWithMask(targetCanvas, patchCanvas, rect, alphaMask) {
  const width = rect.w;
  const height = rect.h;
  const targetCtx = targetCanvas.getContext("2d", { willReadFrequently: true });
  const patchCtx = patchCanvas.getContext("2d", { willReadFrequently: true });
  const targetImage = targetCtx.getImageData(rect.x, rect.y, width, height);
  const patchImage = patchCtx.getImageData(0, 0, width, height);
  const mergedCanvas = document.createElement("canvas");
  mergedCanvas.width = width;
  mergedCanvas.height = height;
  const mergedCtx = mergedCanvas.getContext("2d");
  const mergedImage = mergedCtx.createImageData(width, height);

  for (let index = 0, pixel = 0; index < targetImage.data.length; index += 4, pixel += 1) {
    const alpha = alphaMask[pixel];
    const inverse = 1 - alpha;
    mergedImage.data[index] = Math.round(targetImage.data[index] * inverse + patchImage.data[index] * alpha);
    mergedImage.data[index + 1] = Math.round(targetImage.data[index + 1] * inverse + patchImage.data[index + 1] * alpha);
    mergedImage.data[index + 2] = Math.round(targetImage.data[index + 2] * inverse + patchImage.data[index + 2] * alpha);
    mergedImage.data[index + 3] = 255;
  }

  mergedCtx.putImageData(mergedImage, 0, 0);
  return mergedCanvas;
}

function buildSeamlessPatch(targetCanvas, patchCanvas, rect, iterations) {
  const width = rect.w;
  const height = rect.h;
  const patchData = patchCanvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, width, height).data;
  const result = new Float32Array(width * height * 3);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const patchOffset = (y * width + x) * 4;
      const resultOffset = (y * width + x) * 3;
      result[resultOffset] = patchData[patchOffset];
      result[resultOffset + 1] = patchData[patchOffset + 1];
      result[resultOffset + 2] = patchData[patchOffset + 2];
    }
  }

  const targetCtx = targetCanvas.getContext("2d", { willReadFrequently: true });
  const sampleX = Math.max(0, rect.x - 1);
  const sampleY = Math.max(0, rect.y - 1);
  const sampleRight = Math.min(targetCanvas.width, rect.x + width + 1);
  const sampleBottom = Math.min(targetCanvas.height, rect.y + height + 1);
  const sampleWidth = sampleRight - sampleX;
  const sampleHeight = sampleBottom - sampleY;
  const targetSample = targetCtx.getImageData(sampleX, sampleY, sampleWidth, sampleHeight).data;

  function getTargetChannel(globalX, globalY, channel) {
    const safeX = clamp(globalX, sampleX, sampleRight - 1);
    const safeY = clamp(globalY, sampleY, sampleBottom - 1);
    const offset = ((safeY - sampleY) * sampleWidth + (safeX - sampleX)) * 4 + channel;
    return targetSample[offset];
  }

  const neighbors = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const resultOffset = (y * width + x) * 3;
        const patchOffset = (y * width + x) * 4;

        for (let channel = 0; channel < 3; channel += 1) {
          let neighborSum = 0;
          let guidance = 0;

          neighbors.forEach(([offsetX, offsetY]) => {
            const neighborX = x + offsetX;
            const neighborY = y + offsetY;
            const inside = neighborX >= 0 && neighborY >= 0 && neighborX < width && neighborY < height;

            if (inside) {
              const neighborResultOffset = (neighborY * width + neighborX) * 3 + channel;
              neighborSum += result[neighborResultOffset];
              guidance += patchData[patchOffset + channel] - patchData[(neighborY * width + neighborX) * 4 + channel];
            } else {
              neighborSum += getTargetChannel(rect.x + neighborX, rect.y + neighborY, channel);
            }
          });

          result[resultOffset + channel] = (neighborSum + guidance) / 4;
        }
      }
    }
  }

  const blendedCanvas = document.createElement("canvas");
  blendedCanvas.width = width;
  blendedCanvas.height = height;
  const blendedCtx = blendedCanvas.getContext("2d");
  const blendedImage = blendedCtx.createImageData(width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const resultOffset = (y * width + x) * 3;
      const imageOffset = (y * width + x) * 4;
      blendedImage.data[imageOffset] = clamp(Math.round(result[resultOffset]), 0, 255);
      blendedImage.data[imageOffset + 1] = clamp(Math.round(result[resultOffset + 1]), 0, 255);
      blendedImage.data[imageOffset + 2] = clamp(Math.round(result[resultOffset + 2]), 0, 255);
      blendedImage.data[imageOffset + 3] = 255;
    }
  }

  blendedCtx.putImageData(blendedImage, 0, 0);
  return blendedCanvas;
}

function applySeamlessRepair(ctx, sourceCanvas, rect, intensity, options = {}) {
  const repairRegion = findBestRepairRegion(sourceCanvas, rect);
  const patchCanvas = document.createElement("canvas");
  patchCanvas.width = rect.w;
  patchCanvas.height = rect.h;
  patchCanvas.getContext("2d").drawImage(
    sourceCanvas,
    repairRegion.x,
    repairRegion.y,
    repairRegion.w,
    repairRegion.h,
    0,
    0,
    rect.w,
    rect.h,
  );

  adjustPatchTone(patchCanvas, sourceCanvas, rect, repairRegion, intensity);
  const iterations = clamp(Math.round(60 + Math.sqrt(rect.w * rect.h) * 1.5), 70, 180);
  const blendedPatch = buildSeamlessPatch(sourceCanvas, patchCanvas, rect, iterations);
  const rawMask = buildDifferenceMask(sourceCanvas, patchCanvas, rect, intensity, {
    aggressiveness: options.aggressiveness?.raw ?? 0.2,
  });
  const blendedMask = buildDifferenceMask(sourceCanvas, blendedPatch, rect, intensity + 4, {
    aggressiveness: options.aggressiveness?.blended ?? 0.5,
  });
  const alphaMask = combineAlphaMasks(rawMask, blendedMask, options.manualMask);
  const mergedPatch = mergePatchWithMask(sourceCanvas, blendedPatch, rect, alphaMask);
  ctx.drawImage(mergedPatch, rect.x, rect.y, rect.w, rect.h);
}

function buildEffectPatch(source, rect, mode, intensity, useSmartRepair) {
  const patchCanvas = document.createElement("canvas");
  patchCanvas.width = rect.w;
  patchCanvas.height = rect.h;
  const patchCtx = patchCanvas.getContext("2d");
  const sourceSize = getSourceSize(source);

  if (mode === "repair" && useSmartRepair && source instanceof HTMLCanvasElement) {
    const repairRegion = findBestRepairRegion(source, rect);
    patchCtx.drawImage(source, repairRegion.x, repairRegion.y, repairRegion.w, repairRegion.h, 0, 0, rect.w, rect.h);
    adjustPatchTone(patchCanvas, source, rect, repairRegion, intensity);
    return patchCanvas;
  }

  if (mode === "blur") {
    patchCtx.filter = `blur(${Math.max(2, intensity)}px)`;
    patchCtx.drawImage(source, 0, 0, sourceSize.width, sourceSize.height, -rect.x, -rect.y, sourceSize.width, sourceSize.height);
    return patchCanvas;
  }

  if (mode === "pixelate") {
    const blockSize = Math.max(4, Math.round(intensity * 1.2));
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = Math.max(1, Math.round(rect.w / blockSize));
    tempCanvas.height = Math.max(1, Math.round(rect.h / blockSize));
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.imageSmoothingEnabled = false;
    tempCtx.drawImage(source, rect.x, rect.y, rect.w, rect.h, 0, 0, tempCanvas.width, tempCanvas.height);

    patchCtx.imageSmoothingEnabled = false;
    patchCtx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, rect.w, rect.h);
    return patchCanvas;
  }

  if (mode === "fill") {
    const sampleSize = Math.max(8, intensity * 2);
    const color = averageColorFromRegions(
      source,
      buildSamplingRegions(sourceSize.width, sourceSize.height, rect, sampleSize),
    );
    patchCtx.fillStyle = `rgb(${color.r} ${color.g} ${color.b})`;
    patchCtx.fillRect(0, 0, rect.w, rect.h);
    return patchCanvas;
  }

  const repairRegion = useSmartRepair ? findBestRepairRegion(source, rect) : pickRepairRegion(sourceSize.width, sourceSize.height, rect);
  patchCtx.drawImage(source, repairRegion.x, repairRegion.y, repairRegion.w, repairRegion.h, 0, 0, rect.w, rect.h);
  return patchCanvas;
}

function applyEffect(ctx, source, rect, mode, intensity, options = {}) {
  const sourceSize = getSourceSize(source);
  const safeRect = {
    x: clamp(rect.x, 0, sourceSize.width),
    y: clamp(rect.y, 0, sourceSize.height),
    w: clamp(rect.w, 1, sourceSize.width - rect.x),
    h: clamp(rect.h, 1, sourceSize.height - rect.y),
  };

  if (mode === "repair" && options.smartRepair && source instanceof HTMLCanvasElement) {
    applySeamlessRepair(ctx, source, safeRect, intensity);
    return;
  }

  const featherRatio = mode === "repair" && options.smartRepair ? 0.12 : 0.16;
  const feather = clamp(Math.round(Math.min(safeRect.w, safeRect.h) * featherRatio), 4, 20);
  const patchCanvas = buildEffectPatch(source, safeRect, mode, intensity, Boolean(options.smartRepair));
  blendPatchIntoContext(ctx, patchCanvas, safeRect, feather, {
    irregular: mode === "repair" && Boolean(options.smartRepair),
    variation: feather * 0.7,
  });
}

function renderVideoOutputFrame() {
  if (!state.video.loaded || dom.sourceVideo.readyState < 2) {
    return;
  }

  if (
    videoFrameCanvas.width !== dom.sourceVideo.videoWidth ||
    videoFrameCanvas.height !== dom.sourceVideo.videoHeight
  ) {
    videoFrameCanvas.width = dom.sourceVideo.videoWidth;
    videoFrameCanvas.height = dom.sourceVideo.videoHeight;
  }

  videoFrameCtx.clearRect(0, 0, videoFrameCanvas.width, videoFrameCanvas.height);
  videoFrameCtx.drawImage(dom.sourceVideo, 0, 0, videoFrameCanvas.width, videoFrameCanvas.height);

  if (state.selection && state.selection.w > 1 && state.selection.h > 1) {
    applyEffect(videoFrameCtx, dom.sourceVideo, state.selection, state.mode, state.intensity);
  }

  state.video.frameReady = true;
}

function renderImagePreview(resetViewport = false) {
  if (!state.image.loaded) {
    return;
  }

  syncViewportToMedia(resetViewport);
  drawPreviewSource(imageWorkingCanvas, imageWorkingCanvas.width, imageWorkingCanvas.height);
  drawOverlay();
}

function renderVideoFrame(resetViewport = false) {
  if (!state.video.loaded || dom.sourceVideo.readyState < 2) {
    return;
  }

  renderVideoOutputFrame();
  syncViewportToMedia(resetViewport);
  drawPreviewSource(videoFrameCanvas, videoFrameCanvas.width, videoFrameCanvas.height);
  drawOverlay();
}

function renderActiveMedia(resetViewport = false) {
  if (state.activeTab === "image") {
    renderImagePreview(resetViewport);
    return;
  }

  renderVideoFrame(resetViewport);
}

function clearSelection() {
  state.selection = null;
  drawOverlay();
  updateUiState();
}

function syncTimeline() {
  if (!state.video.loaded) {
    return;
  }

  const duration = dom.sourceVideo.duration || 0;
  const currentTime = dom.sourceVideo.currentTime || 0;
  dom.timelineInput.value = duration ? String(currentTime / duration) : "0";
  dom.timeLabel.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
}

function animateVideo() {
  renderVideoFrame(false);
  syncTimeline();

  if (!dom.sourceVideo.paused && !dom.sourceVideo.ended) {
    state.video.animationFrameId = requestAnimationFrame(animateVideo);
  } else {
    state.video.animationFrameId = 0;
    updateUiState();
  }
}

function updateUiState() {
  const hasImage = state.image.loaded;
  const hasVideo = state.video.loaded;
  const hasSelection = Boolean(state.selection && state.selection.w > 1 && state.selection.h > 1);
  const hasVisibleMedia = hasActiveMedia();
  const showImageUi = state.activeTab === "image";

  dom.intensityValue.textContent = String(state.intensity);
  dom.brushSizeValue.textContent = String(state.brush.size);
  dom.imageActions.classList.toggle("is-hidden", !showImageUi);
  dom.videoActions.classList.toggle("is-hidden", showImageUi);
  dom.timelineField.classList.toggle("is-hidden", showImageUi);
  dom.brushField.classList.toggle("is-hidden", !showImageUi);

  dom.applyImageButton.disabled = !(showImageUi && hasImage && hasSelection);
  dom.resetImageButton.disabled = !(showImageUi && hasImage);
  dom.downloadImageButton.disabled = !(showImageUi && hasImage);
  dom.playPauseButton.disabled = !(state.activeTab === "video" && hasVideo && !state.video.isExporting);
  dom.restartVideoButton.disabled = !(state.activeTab === "video" && hasVideo && !state.video.isExporting);
  dom.exportVideoButton.disabled = !(state.activeTab === "video" && hasVideo && hasSelection && !state.video.isExporting);
  dom.timelineInput.disabled = !(state.activeTab === "video" && hasVideo && !state.video.isExporting);
  dom.clearSelectionButton.disabled = !hasSelection;

  dom.selectModeButton.disabled = !hasVisibleMedia;
  dom.brushModeButton.disabled = !(showImageUi && hasImage);
  dom.panModeButton.disabled = !hasVisibleMedia;
  dom.zoomOutButton.disabled = !hasVisibleMedia;
  dom.zoomInButton.disabled = !hasVisibleMedia;
  dom.fitViewButton.disabled = !hasVisibleMedia;

  dom.selectModeButton.classList.toggle("is-active", state.interactionMode === "select");
  dom.brushModeButton.classList.toggle("is-active", state.interactionMode === "brush");
  dom.panModeButton.classList.toggle("is-active", state.interactionMode === "pan");
  dom.playPauseButton.textContent = dom.sourceVideo.paused ? "播放" : "暂停";
  updateZoomLabel();
  updateCursor();
}

function setActiveTab(tab) {
  state.activeTab = tab;
  dom.sourceVideo.pause();
  stopVideoLoop();
  clearSelection();
  state.brush.pointer = null;
  state.isBrushing = false;
  state.brush.lastPoint = null;

  if (tab !== "image" && state.interactionMode === "brush") {
    state.interactionMode = "select";
  }

  dom.tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === tab);
  });

  dom.fileInput.accept = tab === "image" ? "image/*" : "video/*";
  dom.uploadHint.textContent =
    tab === "image" ? "支持 JPG、PNG、WebP。" : "支持常见浏览器可解码视频格式，导出为 WebM。";

  if (tab === "video") {
    syncTimeline();
  }

  setStatus(
    tab === "image"
      ? state.image.loaded
        ? "图片已载入，可缩放拖动后再框选"
        : "等待上传图片"
      : state.video.loaded
        ? "视频已载入，可缩放拖动后再框选"
        : "等待上传视频",
  );
  toggleEmptyState(tab === "image" ? state.image.loaded : state.video.loaded);
  renderActiveMedia(true);
  updateUiState();
}

function resetImageToOriginal() {
  if (!state.image.loaded) {
    return;
  }

  imageWorkingCanvas.width = imageOriginalCanvas.width;
  imageWorkingCanvas.height = imageOriginalCanvas.height;
  imageWorkingCtx.clearRect(0, 0, imageWorkingCanvas.width, imageWorkingCanvas.height);
  imageWorkingCtx.drawImage(imageOriginalCanvas, 0, 0);
  renderImagePreview(true);
  setStatus("图片已重置");
  updateUiState();
}

async function loadImageFile(file) {
  const objectUrl = URL.createObjectURL(file);
  const img = new Image();
  img.decoding = "async";

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = objectUrl;
  });

  revokeObjectUrl(state.image.objectUrl);
  state.image.objectUrl = objectUrl;
  state.image.loaded = true;

  imageOriginalCanvas.width = img.naturalWidth;
  imageOriginalCanvas.height = img.naturalHeight;
  imageOriginalCtx.clearRect(0, 0, imageOriginalCanvas.width, imageOriginalCanvas.height);
  imageOriginalCtx.drawImage(img, 0, 0);

  imageWorkingCanvas.width = img.naturalWidth;
  imageWorkingCanvas.height = img.naturalHeight;
  imageWorkingCtx.clearRect(0, 0, imageWorkingCanvas.width, imageWorkingCanvas.height);
  imageWorkingCtx.drawImage(img, 0, 0);

  clearSelection();
  toggleEmptyState(true);
  renderImagePreview(true);
  setInteractionMode("select");
  setStatus("图片已载入，可滚轮缩放，切到拖动模式后平移");
  updateUiState();
}

function loadVideoFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);

    const handleLoaded = () => {
      dom.sourceVideo.removeEventListener("loadedmetadata", handleLoaded);
      dom.sourceVideo.removeEventListener("error", handleError);

      revokeObjectUrl(state.video.objectUrl);
      state.video.objectUrl = objectUrl;
      state.video.loaded = true;
      state.video.frameReady = false;
      dom.sourceVideo.currentTime = 0;
      clearSelection();
      syncTimeline();
      toggleEmptyState(true);
      renderVideoFrame(true);
      setInteractionMode("select");
      setStatus("视频已载入，可缩放拖动后框选");
      updateUiState();
      resolve();
    };

    const handleError = () => {
      dom.sourceVideo.removeEventListener("loadedmetadata", handleLoaded);
      dom.sourceVideo.removeEventListener("error", handleError);
      revokeObjectUrl(objectUrl);
      reject(new Error("无法载入该视频文件"));
    };

    dom.sourceVideo.pause();
    stopVideoLoop();
    state.video.frameReady = false;
    dom.sourceVideo.src = objectUrl;
    dom.sourceVideo.load();
    dom.sourceVideo.addEventListener("loadedmetadata", handleLoaded, { once: true });
    dom.sourceVideo.addEventListener("error", handleError, { once: true });
  });
}

async function handleFileSelection(event) {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  try {
    if (state.activeTab === "image") {
      await loadImageFile(file);
    } else {
      await loadVideoFile(file);
    }
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "文件处理失败");
  } finally {
    dom.fileInput.value = "";
  }
}

function applySelectionToImage() {
  if (!state.image.loaded || !state.selection) {
    return;
  }

  const snapshot = cloneCanvas(imageWorkingCanvas);
  applyEffect(imageWorkingCtx, snapshot, state.selection, state.mode, state.intensity, {
    smartRepair: state.mode === "repair",
  });
  renderImagePreview(false);
  setStatus("图片处理完成，可继续缩放查看细节");
  updateUiState();
}

function getBrushRect(point) {
  const mediaSize = getActiveMediaSize();
  if (!mediaSize) {
    return null;
  }

  const radius = state.brush.size / 2;
  const x = clamp(Math.floor(point.x - radius), 0, Math.max(0, mediaSize.width - 1));
  const y = clamp(Math.floor(point.y - radius), 0, Math.max(0, mediaSize.height - 1));
  const right = clamp(Math.ceil(point.x + radius), x + 1, mediaSize.width);
  const bottom = clamp(Math.ceil(point.y + radius), y + 1, mediaSize.height);

  return {
    x,
    y,
    w: right - x,
    h: bottom - y,
    centerX: point.x - x,
    centerY: point.y - y,
    radius,
  };
}

function applyBrushStrokeSegment(fromPoint, toPoint) {
  if (!state.image.loaded) {
    return;
  }

  const spacing = Math.max(4, state.brush.size * 0.24);
  const distance = Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y);
  const steps = Math.max(1, Math.ceil(distance / spacing));

  for (let step = 0; step <= steps; step += 1) {
    const progress = steps === 0 ? 1 : step / steps;
    const point = {
      x: fromPoint.x + (toPoint.x - fromPoint.x) * progress,
      y: fromPoint.y + (toPoint.y - fromPoint.y) * progress,
    };
    const rect = getBrushRect(point);
    if (!rect || rect.w < 2 || rect.h < 2) {
      continue;
    }

    const manualMask = buildBrushMask(rect.w, rect.h, rect.centerX, rect.centerY, rect.radius);
    applySeamlessRepair(imageWorkingCtx, imageWorkingCanvas, rect, state.intensity + 6, {
      manualMask,
      aggressiveness: {
        raw: 0.38,
        blended: 0.78,
      },
    });
  }

  renderImagePreview(false);
}

function downloadImage() {
  if (!state.image.loaded) {
    return;
  }

  const link = document.createElement("a");
  link.href = imageWorkingCanvas.toDataURL("image/png");
  link.download = "dewatermarked-image.png";
  link.click();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getSupportedRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  const mimeTypes = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  return mimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || "";
}

function once(target, eventName) {
  return new Promise((resolve) => {
    target.addEventListener(eventName, resolve, { once: true });
  });
}

async function exportVideo() {
  if (!state.video.loaded || !state.selection || state.video.isExporting) {
    return;
  }

  const mimeType = getSupportedRecorderMimeType();
  if (!mimeType) {
    setStatus("当前浏览器不支持 WebM 录制");
    return;
  }

  state.video.isExporting = true;
  stopVideoLoop();
  dom.sourceVideo.pause();
  dom.sourceVideo.currentTime = 0;
  renderVideoFrame(false);
  updateUiState();
  setStatus("正在导出视频，请等待播放结束");

  const captureStream = videoFrameCanvas.captureStream(30);
  let sourceStream = null;
  let audioAdded = false;

  if (typeof dom.sourceVideo.captureStream === "function") {
    sourceStream = dom.sourceVideo.captureStream();
    sourceStream.getAudioTracks().forEach((track) => {
      captureStream.addTrack(track);
      audioAdded = true;
    });
  }

  const chunks = [];
  const recorder = new MediaRecorder(captureStream, {
    mimeType,
    videoBitsPerSecond: 8_000_000,
  });

  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size) {
      chunks.push(event.data);
    }
  });

  const recorderStopped = once(recorder, "stop");
  recorder.start(250);

  try {
    const playbackEnded = once(dom.sourceVideo, "ended");
    await dom.sourceVideo.play();
    animateVideo();
    await playbackEnded;
    stopVideoLoop();

    if (recorder.state !== "inactive") {
      recorder.stop();
    }

    await recorderStopped;
  } finally {
    captureStream.getTracks().forEach((track) => track.stop());
    if (sourceStream) {
      sourceStream.getTracks().forEach((track) => track.stop());
    }
  }

  const extension = mimeType.includes("webm") ? "webm" : "video";
  downloadBlob(new Blob(chunks, { type: mimeType }), `dewatermarked-video.${extension}`);

  dom.sourceVideo.currentTime = 0;
  renderVideoFrame(false);
  syncTimeline();
  state.video.isExporting = false;
  updateUiState();
  setStatus(audioAdded ? "视频导出完成" : "视频导出完成（未检测到可复用音轨）");
}

function handleTimelineInput() {
  if (!state.video.loaded) {
    return;
  }

  const duration = dom.sourceVideo.duration || 0;
  dom.sourceVideo.currentTime = duration * Number(dom.timelineInput.value);
}

function toggleVideoPlayback() {
  if (!state.video.loaded || state.video.isExporting) {
    return;
  }

  if (dom.sourceVideo.paused) {
    dom.sourceVideo.play();
  } else {
    dom.sourceVideo.pause();
    stopVideoLoop();
    renderVideoFrame(false);
  }

  updateUiState();
}

function restartVideo() {
  if (!state.video.loaded) {
    return;
  }

  dom.sourceVideo.pause();
  stopVideoLoop();
  dom.sourceVideo.currentTime = 0;
  renderVideoFrame(false);
  syncTimeline();
  updateUiState();
}

function handlePointerDown(event) {
  if (!hasActiveMedia() || event.button !== 0) {
    return;
  }

  event.preventDefault();
  const point = getPointerPosition(event);
  dom.overlayCanvas.setPointerCapture(event.pointerId);
  const mediaPoint = mediaPointFromScreen(point);
  state.brush.pointer = mediaPoint;

  if (state.interactionMode === "pan") {
    state.isPanning = true;
    state.viewport.panOrigin = {
      x: point.x,
      y: point.y,
      offsetX: state.viewport.offsetX,
      offsetY: state.viewport.offsetY,
    };
    updateCursor();
    return;
  }

  if (state.interactionMode === "brush" && state.activeTab === "image" && state.image.loaded) {
    state.isBrushing = true;
    state.brush.lastPoint = mediaPoint;
    applyBrushStrokeSegment(mediaPoint, mediaPoint);
    setStatus("修复画笔已启用，拖动可局部刷掉残痕");
    drawOverlay();
    updateUiState();
    return;
  }

  state.dragStart = mediaPoint;
  state.isDragging = true;
  state.selection = { x: mediaPoint.x, y: mediaPoint.y, w: 0, h: 0 };
  drawOverlay();
  updateUiState();
}

function handlePointerMove(event) {
  if (!hasActiveMedia()) {
    return;
  }

  const point = getPointerPosition(event);
  const mediaPoint = mediaPointFromScreen(point);
  state.brush.pointer = mediaPoint;

  if (state.isPanning && state.viewport.panOrigin) {
    state.viewport.offsetX = state.viewport.panOrigin.offsetX + (point.x - state.viewport.panOrigin.x);
    state.viewport.offsetY = state.viewport.panOrigin.offsetY + (point.y - state.viewport.panOrigin.y);
    clampViewportOffset();
    redrawPreview();
    return;
  }

  if (state.isBrushing && state.interactionMode === "brush" && state.brush.lastPoint) {
    applyBrushStrokeSegment(state.brush.lastPoint, mediaPoint);
    state.brush.lastPoint = mediaPoint;
    drawOverlay();
    return;
  }

  if (state.interactionMode === "brush") {
    drawOverlay();
    return;
  }

  if (!state.isDragging || !state.dragStart) {
    drawOverlay();
    return;
  }

  const mediaSize = getActiveMediaSize();
  if (!mediaSize) {
    return;
  }

  state.selection = normalizeRect(state.dragStart, mediaPoint, mediaSize.width, mediaSize.height);
  drawOverlay();
  updateUiState();
}

function handlePointerUp(event) {
  if (dom.overlayCanvas.hasPointerCapture(event.pointerId)) {
    dom.overlayCanvas.releasePointerCapture(event.pointerId);
  }

  if (state.isBrushing) {
    state.isBrushing = false;
    state.brush.lastPoint = null;
    drawOverlay();
    updateUiState();
    return;
  }

  if (state.isPanning) {
    state.isPanning = false;
    state.viewport.panOrigin = null;
    updateCursor();
    return;
  }

  if (!state.isDragging) {
    return;
  }

  state.isDragging = false;

  if (!state.selection || state.selection.w < 6 || state.selection.h < 6) {
    state.selection = null;
  }

  drawOverlay();
  updateUiState();
}

function handlePointerLeave() {
  if (state.isBrushing) {
    return;
  }

  state.brush.pointer = null;
  drawOverlay();
}

function handleWheel(event) {
  if (!hasActiveMedia()) {
    return;
  }

  event.preventDefault();
  const point = getPointerPosition(event);
  const factor = event.deltaY < 0 ? 1.12 : 0.89;
  setZoom(state.viewport.zoom * factor, point);
}

dom.tabButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.tab));
});

dom.fileInput.addEventListener("change", handleFileSelection);

dom.modeSelect.addEventListener("change", () => {
  state.mode = dom.modeSelect.value;
  if (state.activeTab === "video" && state.video.loaded) {
    renderVideoFrame(false);
  }
});

dom.intensityInput.addEventListener("input", () => {
  state.intensity = Number(dom.intensityInput.value);
  dom.intensityValue.textContent = String(state.intensity);
  if (state.activeTab === "video" && state.video.loaded) {
    renderVideoFrame(false);
  }
});

dom.brushSizeInput.addEventListener("input", () => {
  state.brush.size = Number(dom.brushSizeInput.value);
  dom.brushSizeValue.textContent = String(state.brush.size);
  drawOverlay();
});

dom.applyImageButton.addEventListener("click", applySelectionToImage);
dom.resetImageButton.addEventListener("click", resetImageToOriginal);
dom.downloadImageButton.addEventListener("click", downloadImage);
dom.clearSelectionButton.addEventListener("click", clearSelection);
dom.playPauseButton.addEventListener("click", toggleVideoPlayback);
dom.restartVideoButton.addEventListener("click", restartVideo);
dom.exportVideoButton.addEventListener("click", () => {
  exportVideo().catch((error) => {
    state.video.isExporting = false;
    updateUiState();
    setStatus(error instanceof Error ? error.message : "视频导出失败");
  });
});
dom.timelineInput.addEventListener("input", handleTimelineInput);

dom.selectModeButton.addEventListener("click", () => setInteractionMode("select"));
dom.brushModeButton.addEventListener("click", () => setInteractionMode("brush"));
dom.panModeButton.addEventListener("click", () => setInteractionMode("pan"));
dom.zoomOutButton.addEventListener("click", () => setZoom(state.viewport.zoom * 0.85));
dom.zoomInButton.addEventListener("click", () => setZoom(state.viewport.zoom * 1.18));
dom.fitViewButton.addEventListener("click", () => {
  fitViewport();
  redrawPreview();
  updateUiState();
});

dom.sourceVideo.addEventListener("seeked", () => {
  if (state.activeTab === "video") {
    state.video.frameReady = false;
    renderVideoFrame(false);
    syncTimeline();
  }
});

dom.sourceVideo.addEventListener("pause", () => {
  stopVideoLoop();
  updateUiState();
});

dom.sourceVideo.addEventListener("play", () => {
  if (!state.video.isExporting) {
    animateVideo();
  }
  updateUiState();
});

dom.sourceVideo.addEventListener("ended", () => {
  stopVideoLoop();
  syncTimeline();
  updateUiState();
});

dom.overlayCanvas.addEventListener("pointerdown", handlePointerDown);
dom.overlayCanvas.addEventListener("pointermove", handlePointerMove);
dom.overlayCanvas.addEventListener("pointerup", handlePointerUp);
dom.overlayCanvas.addEventListener("pointercancel", handlePointerUp);
dom.overlayCanvas.addEventListener("pointerleave", handlePointerLeave);
dom.overlayCanvas.addEventListener("wheel", handleWheel, { passive: false });
dom.overlayCanvas.addEventListener("contextmenu", (event) => event.preventDefault());

window.addEventListener("resize", () => {
  if (!hasActiveMedia()) {
    return;
  }

  renderActiveMedia(true);
});

window.addEventListener("beforeunload", () => {
  revokeObjectUrl(state.image.objectUrl);
  revokeObjectUrl(state.video.objectUrl);
});

updateUiState();
setActiveTab("image");
