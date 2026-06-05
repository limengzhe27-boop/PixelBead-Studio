import type { ColorEntry, PixelGrid } from '../types'

/**
 * 图片转换 + 颜色匹配（PRD §F2 算法，严格实现）
 *
 * 质量红线：颜色匹配必须使用感知加权距离公式，禁止使用简单欧氏距离。
 *
 *   ΔR = R1-R2, ΔG = G1-G2, ΔB = B1-B2
 *   Rm = (R1+R2)/2
 *   distance = √[(2 + Rm/256)·ΔR² + 4·ΔG² + (2 + (255-Rm)/256)·ΔB²]
 *
 * 比较「最近色」时直接比较被开方的量（radicand）即可，等价且省去 sqrt。
 */

const ALPHA_THRESHOLD = 64 // alpha < 64 判定为空白格（null）
const COLS_MIN = 8
const COLS_MAX = 256 // 主转换/空白/编辑器上限（成品转图纸单独传 maxDim=128）

type RGB = { r: number; g: number; b: number }
type PaletteRGB = { hex: string; r: number; g: number; b: number }

// ---------- 基础颜色工具 ----------

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase()
}

/** 感知加权颜色距离的平方（用于比较最近色） */
export function perceptualDistSq(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
): number {
  const rmean = (r1 + r2) / 2
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  return (2 + rmean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rmean) / 256) * db * db
}

// 缓存调色板的 RGB 解析结果，避免逐像素重复解析 hex
const paletteCache = new WeakMap<ColorEntry[], PaletteRGB[]>()

function getPaletteRGB(palette: ColorEntry[]): PaletteRGB[] {
  let cached = paletteCache.get(palette)
  if (!cached) {
    cached = palette.map((c) => ({ hex: c.hex.toUpperCase(), ...hexToRgb(c.hex) }))
    paletteCache.set(palette, cached)
  }
  return cached
}

function nearestEntry(r: number, g: number, b: number, pal: PaletteRGB[]): PaletteRGB {
  let best = pal[0]
  let bestD = Infinity
  for (let i = 0; i < pal.length; i++) {
    const p = pal[i]
    const d = perceptualDistSq(r, g, b, p.r, p.g, p.b)
    if (d < bestD) {
      bestD = d
      best = p
    }
  }
  return best
}

function nearestInPalette(r: number, g: number, b: number, pal: PaletteRGB[]): string {
  return nearestEntry(r, g, b, pal).hex
}

/** 将任意 RGB snap 到最近的 Artkal 标准色，返回其 hex（PRD §8.3 接口） */
export function snapToArtkal(r: number, g: number, b: number, palette: ColorEntry[]): string {
  return nearestInPalette(r, g, b, getPaletteRGB(palette))
}

// ---------- 推荐格数 ----------

/** 根据图片比例推荐格数：较短边默认 32 格，宽高保持比例并夹在 [8, maxDim]（成品转图纸传 maxDim=128） */
export function recommendDimensions(
  imgW: number,
  imgH: number,
  shortSide = 32,
  maxDim = COLS_MAX,
): { cols: number; rows: number } {
  if (imgW <= 0 || imgH <= 0) return { cols: shortSide, rows: shortSide }
  let cols: number
  let rows: number
  if (imgW <= imgH) {
    cols = shortSide
    rows = Math.round(shortSide * (imgH / imgW))
  } else {
    rows = shortSide
    cols = Math.round(shortSide * (imgW / imgH))
  }
  // 极端比例下若长边超出上限，按比例整体缩小，保持原图宽高比不被拉伸
  const longest = Math.max(cols, rows)
  if (longest > maxDim) {
    const f = maxDim / longest
    cols = Math.round(cols * f)
    rows = Math.round(rows * f)
  }
  const clamp = (n: number) => Math.max(COLS_MIN, Math.min(maxDim, Math.round(n)))
  return { cols: clamp(cols), rows: clamp(rows) }
}

export function clampGrid(n: number): number {
  return Math.max(COLS_MIN, Math.min(COLS_MAX, Math.round(n)))
}

// ---------- 加载图片 ----------

/** 将 base64 / dataURL 加载为 HTMLImageElement */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

// ---------- 色彩增强（让结果更鲜艳，对抗照片偏灰/偏暗导致 snap 后发闷） ----------

/**
 * 就地增强像素的对比度 + 饱和度（snap 到 Artkal 前做）。
 * 照片（尤其成品拼豆俯拍）常偏灰偏暗，直接 snap 会落到发闷的色号；
 * 适度提对比 + 提饱和后，能映射到更鲜亮的 Artkal 色，成品更好看。
 * 默认强度温和，避免把本就鲜艳的图过曝。
 */
export function enhancePixels(data: Uint8ClampedArray, saturation = 1.32, contrast = 1.12): void {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < ALPHA_THRESHOLD) continue // 跳过透明像素
    let r = (data[i] - 128) * contrast + 128
    let g = (data[i + 1] - 128) * contrast + 128
    let b = (data[i + 2] - 128) * contrast + 128
    const luma = 0.299 * r + 0.587 * g + 0.114 * b // 向亮度灰拉伸 = 调饱和
    r = luma + (r - luma) * saturation
    g = luma + (g - luma) * saturation
    b = luma + (b - luma) * saturation
    data[i] = r < 0 ? 0 : r > 255 ? 255 : r
    data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g
    data[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b
  }
}

// ---------- 中值滤波（降噪：去噪同时保留边缘，不会误删眼睛等小细节） ----------

// 缓存「源图 → 中值滤波结果」（按 img 对象，WeakMap 自动回收）。源图变化即换新 img → 自动失效；
// 拖动格数滑块时 img 不变 → 复用缓存，不重复对数十万像素排序，避免卡顿。
const medianCache = new WeakMap<HTMLImageElement, ImageData>()

/**
 * 3×3 中值滤波，作用于源图 ImageData（在缩放为目标格数之前调用）。
 * 只处理 R/G/B、不动 alpha；保留边缘（眼睛/细线不会被当噪点删掉）。
 */
export function medianFilter(imageData: ImageData): ImageData {
  const { width, height, data } = imageData
  const out = new Uint8ClampedArray(data)
  const vals = new Array<number>(9)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let ch = 0; ch < 3; ch++) {
        let k = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            vals[k++] = data[((y + dy) * width + (x + dx)) * 4 + ch]
          }
        }
        vals.sort((a, b) => a - b)
        out[(y * width + x) * 4 + ch] = vals[4] // 中位数
      }
    }
  }
  return new ImageData(out, width, height)
}

// ---------- Step 1–3：缩放 + 提取 + snap ----------

/**
 * Step 1–2：把源图缩放到目标格数，返回 RGBA 像素数据。
 * - denoise：先绘到「封顶中间分辨率」画布 → 3×3 中值滤波（去噪保边）→ 再缩放到目标格数。
 * - enhance：snap 前就地提升对比 + 饱和，成品更鲜艳。
 * convertImage（全保真 snap）与 processImageToGrid（含抖动）共用，避免重复光栅化。
 */
function rasterize(
  img: HTMLImageElement,
  cols: number,
  rows: number,
  denoise: boolean,
  enhance: boolean,
): Uint8ClampedArray {
  const canvas = document.createElement('canvas')
  canvas.width = cols
  canvas.height = rows
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('无法创建 Canvas 上下文')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.clearRect(0, 0, cols, rows)

  // Step 1：缩放到目标格数。
  // - 降噪开启：先把源图绘到「封顶中间分辨率」画布 A → 3×3 中值滤波（去噪保边）→ 再缩放到目标格数。
  // - 降噪关闭：源图直接缩放到目标格数（最清晰）。
  if (denoise && img.naturalWidth > 0) {
    const maxInter = 600
    const sa = Math.min(1, maxInter / Math.max(img.naturalWidth, img.naturalHeight))
    const aw = Math.max(cols, Math.round(img.naturalWidth * sa))
    const ah = Math.max(rows, Math.round(img.naturalHeight * sa))
    const ca = document.createElement('canvas')
    ca.width = aw
    ca.height = ah
    const cta = ca.getContext('2d', { willReadFrequently: true })
    if (cta) {
      cta.imageSmoothingEnabled = true
      cta.imageSmoothingQuality = 'high'
      cta.drawImage(img, 0, 0, aw, ah)
      let filtered = medianCache.get(img)
      if (!filtered || filtered.width !== aw || filtered.height !== ah) {
        filtered = medianFilter(cta.getImageData(0, 0, aw, ah))
        medianCache.set(img, filtered)
      }
      cta.putImageData(filtered, 0, 0) // 必须写回画布，否则滤波白做
      ctx.drawImage(ca, 0, 0, cols, rows)
    } else {
      ctx.drawImage(img, 0, 0, cols, rows)
    }
  } else {
    ctx.drawImage(img, 0, 0, cols, rows)
  }

  // Step 2：提取每像素 RGBA（可选：snap 前做色彩增强，让成品更鲜艳）
  const { data } = ctx.getImageData(0, 0, cols, rows)
  if (enhance) enhancePixels(data)
  return data
}

/**
 * 图片 → 全保真 Artkal 像素网格（PRD §F2 Step 1–3）
 * 此处不做颜色种数控制，种数控制交给 quantizeColors（Step 4）。
 */
export function convertImage(
  img: HTMLImageElement,
  cols: number,
  rows: number,
  palette: ColorEntry[],
  denoise = false,
  enhance = false,
): PixelGrid {
  const data = rasterize(img, cols, rows, denoise, enhance)
  const pal = getPaletteRGB(palette)
  const grid: PixelGrid = []

  for (let y = 0; y < rows; y++) {
    const row: (string | null)[] = []
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      if (data[i + 3] < ALPHA_THRESHOLD) {
        row.push(null) // 空白格
      } else {
        // Step 3：感知加权距离匹配最近 Artkal 色
        row.push(nearestInPalette(data[i], data[i + 1], data[i + 2], pal))
      }
    }
    grid.push(row)
  }
  return grid
}

// ---------- Step 4：K-means 颜色种数控制 ----------

/**
 * 将已 snap 到 Artkal 的网格的颜色种数压缩到 targetCount（PRD §F2 Step 4）
 * 使用「感知加权距离」的加权 K-means 对出现的颜色聚类，每个聚类中心再 snap 回最近 Artkal 标准色。
 *
 * 异常兜底：聚类失败 / 颜色本就不超标 → 直接返回原网格（PRD §11）。
 */
export function quantizeColors(
  grid: PixelGrid,
  targetCount: number,
  palette: ColorEntry[],
): PixelGrid {
  try {
    // 统计不同颜色及其频次
    const freq = new Map<string, number>()
    for (const row of grid) {
      for (const cell of row) {
        if (cell) freq.set(cell, (freq.get(cell) ?? 0) + 1)
      }
    }
    const distinct = [...freq.keys()]
    if (distinct.length <= targetCount) return grid // 未超标，无需聚类

    const pal = getPaletteRGB(palette)
    const points = distinct.map((hex) => ({ hex, ...hexToRgb(hex), w: freq.get(hex)! }))

    // 确定性 k-means++ 初始化：先取最高频色，再迭代选「加权距离最远」的点
    const k = Math.max(1, Math.min(targetCount, points.length))
    const centroids: RGB[] = []
    const seedSorted = [...points].sort((a, b) => b.w - a.w)
    centroids.push({ r: seedSorted[0].r, g: seedSorted[0].g, b: seedSorted[0].b })
    while (centroids.length < k) {
      let far = points[0]
      let farD = -1
      for (const p of points) {
        let nearest = Infinity
        for (const c of centroids) {
          const d = perceptualDistSq(p.r, p.g, p.b, c.r, c.g, c.b)
          if (d < nearest) nearest = d
        }
        const score = nearest * p.w // 频次加权，倾向于覆盖高频颜色
        if (score > farD) {
          farD = score
          far = p
        }
      }
      centroids.push({ r: far.r, g: far.g, b: far.b })
    }

    // 迭代聚类（最多 16 轮，提前收敛则停止）
    const assign = new Array<number>(points.length).fill(0)
    for (let iter = 0; iter < 16; iter++) {
      let changed = false
      // 分配
      for (let i = 0; i < points.length; i++) {
        const p = points[i]
        let best = 0
        let bestD = Infinity
        for (let c = 0; c < centroids.length; c++) {
          const d = perceptualDistSq(p.r, p.g, p.b, centroids[c].r, centroids[c].g, centroids[c].b)
          if (d < bestD) {
            bestD = d
            best = c
          }
        }
        if (assign[i] !== best) {
          assign[i] = best
          changed = true
        }
      }
      // 更新中心（频次加权平均）
      const sum = centroids.map(() => ({ r: 0, g: 0, b: 0, w: 0 }))
      for (let i = 0; i < points.length; i++) {
        const p = points[i]
        const s = sum[assign[i]]
        s.r += p.r * p.w
        s.g += p.g * p.w
        s.b += p.b * p.w
        s.w += p.w
      }
      for (let c = 0; c < centroids.length; c++) {
        if (sum[c].w > 0) {
          centroids[c] = { r: sum[c].r / sum[c].w, g: sum[c].g / sum[c].w, b: sum[c].b / sum[c].w }
        }
      }
      if (!changed && iter > 0) break
    }

    // 每个原始颜色 → 其聚类中心 → snap 回最近 Artkal 标准色
    const remap = new Map<string, string>()
    for (let i = 0; i < points.length; i++) {
      const c = centroids[assign[i]]
      remap.set(points[i].hex, nearestInPalette(c.r, c.g, c.b, pal))
    }

    return grid.map((row) => row.map((cell) => (cell ? remap.get(cell) ?? cell : null)))
  } catch {
    // PRD §11：颜色数量聚类失败 → 回退到直接 snap 匹配，不报错
    return grid
  }
}

// ---------- 抖动：Floyd–Steinberg 误差扩散 ----------

/**
 * 将「缩放后的 RGBA 像素」用 Floyd–Steinberg 误差扩散，量化到给定的颜色集合 active。
 * active = 经颜色数上限筛选后的调色板子集（与不抖动版本最终用色一致）。
 * 误差只在不透明像素间扩散；透明像素输出 null 且不参与扩散。
 * 用浮点缓冲累积误差，避免 8bit 截断；逐像素串行，O(cols·rows·|active|)。
 */
function ditherToActive(
  data: Uint8ClampedArray,
  cols: number,
  rows: number,
  active: PaletteRGB[],
): PixelGrid {
  const n = cols * rows
  const fr = new Float32Array(n)
  const fg = new Float32Array(n)
  const fb = new Float32Array(n)
  const opaque = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    if (data[i * 4 + 3] < ALPHA_THRESHOLD) continue
    opaque[i] = 1
    fr[i] = data[i * 4]
    fg[i] = data[i * 4 + 1]
    fb[i] = data[i * 4 + 2]
  }

  const grid: PixelGrid = []
  for (let y = 0; y < rows; y++) {
    const row: (string | null)[] = []
    for (let x = 0; x < cols; x++) {
      const idx = y * cols + x
      if (!opaque[idx]) {
        row.push(null)
        continue
      }
      const r = fr[idx]
      const g = fg[idx]
      const b = fb[idx]
      const near = nearestEntry(r, g, b, active)
      row.push(near.hex)
      const er = r - near.r
      const eg = g - near.g
      const eb = b - near.b
      // 误差扩散：右 7/16、左下 3/16、下 5/16、右下 1/16
      const spread = (dx: number, dy: number, f: number) => {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return
        const j = ny * cols + nx
        if (!opaque[j]) return
        fr[j] += er * f
        fg[j] += eg * f
        fb[j] += eb * f
      }
      spread(1, 0, 7 / 16)
      spread(-1, 1, 3 / 16)
      spread(0, 1, 5 / 16)
      spread(1, 1, 1 / 16)
    }
    grid.push(row)
  }
  return grid
}

// ---------- 中值切割（median-cut）量化：让「颜色数量 N」真正决定最终用色丰富度 ----------

/**
 * 中值切割：把一堆 RGB 像素切成 n 个颜色盒，每盒取平均 → n 个代表色。
 * 确定性算法（同图同 n 结果一致，拖滑块不闪烁）。比 K-means 快、稳。
 * 颜色已单一（无法再切）时提前结束，返回数可能 <n。
 */
function medianCut(pixels: RGB[], n: number): RGB[] {
  if (pixels.length === 0 || n < 1) return []
  let boxes: RGB[][] = [pixels]
  while (boxes.length < n) {
    // 找「颜色跨度最大」的盒子及其最长通道
    let bi = -1
    let bestRange = -1
    let bestCh: 'r' | 'g' | 'b' = 'r'
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i]
      if (box.length < 2) continue
      for (const ch of ['r', 'g', 'b'] as const) {
        let mn = 255
        let mx = 0
        for (const px of box) {
          const v = px[ch]
          if (v < mn) mn = v
          if (v > mx) mx = v
        }
        const range = mx - mn
        if (range > bestRange) {
          bestRange = range
          bi = i
          bestCh = ch
        }
      }
    }
    if (bi < 0) break // 所有盒子颜色已单一，无法再切
    const box = boxes[bi]
    box.sort((a, b) => a[bestCh] - b[bestCh])
    const mid = box.length >> 1
    boxes.splice(bi, 1, box.slice(0, mid), box.slice(mid))
  }
  return boxes.map((box) => {
    let sr = 0
    let sg = 0
    let sb = 0
    for (const px of box) {
      sr += px.r
      sg += px.g
      sb += px.b
    }
    const k = box.length || 1
    return { r: Math.round(sr / k), g: Math.round(sg / k), b: Math.round(sb / k) }
  })
}

// ---------- 编排：图片 → 最终图纸 ----------
// （原 cleanupIsolated「孤立像素清除」已删除：它把眼睛/细线等重要小细节当噪点误删，得不偿失。）

const SAMPLE_MAX = 20000 // median-cut 取代表色时的最大采样像素数（确定性等距抽样，控制开销）

function emptyGrid(cols: number, rows: number): PixelGrid {
  return Array.from({ length: rows }, () => new Array<string | null>(cols).fill(null))
}

/**
 * 便捷编排：rasterize → median-cut 量化到 N 代表色 → snap 到品牌色得 activeColors（≤N）
 *   → 给每个非透明格上色（最近色 / 抖动均只在 activeColors 内）。转换设置页 / AI 复用。
 *
 * 关键：颜色数量 N 直接决定最终用色丰富度——先按 N 对「原始像素」量化，再 snap 到品牌色，
 * 而不是先把每个像素 snap 到全 221 色（那样 N 只能往下砍、调大无效）。透明格全程保持 null。
 */
export function processImageToGrid(
  img: HTMLImageElement,
  cols: number,
  rows: number,
  colorCount: number,
  palette: ColorEntry[],
  denoise = false,
  enhance = false,
  dither = false,
): PixelGrid {
  const data = rasterize(img, cols, rows, denoise, enhance)
  const total = cols * rows

  // 1) 收集非透明像素 RGB（确定性等距抽样，避免大图全量排序卡顿）
  let opaque = 0
  for (let i = 0; i < total; i++) if (data[i * 4 + 3] >= ALPHA_THRESHOLD) opaque++
  if (opaque === 0) return emptyGrid(cols, rows)
  const stride = Math.max(1, Math.floor(opaque / SAMPLE_MAX))
  const sample: RGB[] = []
  let seen = 0
  for (let i = 0; i < total; i++) {
    if (data[i * 4 + 3] < ALPHA_THRESHOLD) continue
    if (seen % stride === 0) sample.push({ r: data[i * 4], g: data[i * 4 + 1], b: data[i * 4 + 2] })
    seen++
  }

  // 2) median-cut → N 个代表色；3) 每个代表色 snap 到品牌最近色 → activeColors（去重 ≤N）
  const reps = medianCut(sample, Math.max(1, colorCount))
  const pal = getPaletteRGB(palette)
  const activeMap = new Map<string, PaletteRGB>()
  for (const rep of reps) {
    const e = nearestEntry(rep.r, rep.g, rep.b, pal)
    if (!activeMap.has(e.hex)) activeMap.set(e.hex, e)
  }
  const active = [...activeMap.values()]
  if (active.length === 0) return emptyGrid(cols, rows)

  // 4) 上色：抖动（Floyd–Steinberg，仅在 activeColors 内扩散）或直接最近色；透明格保持 null
  if (dither) return ditherToActive(data, cols, rows, active)
  const grid: PixelGrid = []
  for (let y = 0; y < rows; y++) {
    const row: (string | null)[] = []
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      row.push(data[i + 3] < ALPHA_THRESHOLD ? null : nearestEntry(data[i], data[i + 1], data[i + 2], active).hex)
    }
    grid.push(row)
  }
  return grid
}

/** 判断网格是否全空（用于异常处理：图片全透明 / 转换后全空） */
export function isGridEmpty(grid: PixelGrid): boolean {
  return grid.every((row) => row.every((cell) => cell === null))
}
