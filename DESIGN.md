# DESIGN.md

> 像一本油印手作小志：暖纸、黑墨、三色 spot ink，错版与网点，把"拼豆"做成可以收藏的印刷品。

## 1. Visual Theme & Atmosphere

**Style**: Risograph Craft Zine（理光油印 / 手作志）
**Keywords**: 油印感、半调网点、spot ink、错版偏移、黑墨描边、贴纸标签、暖纸、手作温度
**Tone**: 年轻、手作、有印刷工艺感、克制中带玩心 — NOT 冷硬 SaaS、NOT 紫色渐变、NOT 通用 Material、NOT 廉价卡通
**Feel**: 像翻开一本小红书博主自印的拼豆手作 zine——纸是暖的，墨是实的，颜色是一版一版叠印上去的。

**Interaction Tier**: 首页 L2（克制流畅：入场 stagger、宣言横滚带、hover 按压、网点氛围层）；/convert 与 /editor L1（精致静态：工具优先，绝不喧宾夺主）
**Dependencies**: CSS only（无 GSAP / 无 Lenis；动效全部 CSS transform/keyframes + IntersectionObserver 入场）

## 2. Color Palette & Roles

```css
:root {
  /* Backgrounds —— 暖纸张 */
  --bg: #FBF7EF;             /* 页面底，米白纸 */
  --surface: #FFFDF7;        /* 卡片/容器 */
  --surface-alt: #F2ECDD;    /* 交替 section / 凹槽 */
  --surface-hover: #F6F0E2;  /* 悬停表面 */

  /* Borders —— 油印黑线是签名 */
  --border: #E6DEC9;         /* 默认细边框（暖褐） */
  --border-hover: #CBBfa3;
  --ink-line: #1A1A1A;       /* 贴纸/按钮的黑墨描边 */

  /* Text —— 黑墨 */
  --text: #1A1A1A;           /* 标题、重要文字 */
  --text-secondary: #5C5648; /* 正文、描述 */
  --text-tertiary: #8C8472;  /* 标签、辅助信息 */

  /* Accent —— 三色 spot ink */
  --accent: #FF4D6D;         /* 主：荧光桃粉（CTA/活跃态） */
  --accent-hover: #E83A59;
  --ink-blue: #2B5FE3;       /* 次：riso 蓝（链接/次强调） */
  --ink-yellow: #FFC53D;     /* 点：riso 黄（高亮/marker） */

  /* 编辑器中性 chrome（让真实豆色读数准确，刻意低饱和） */
  --chrome: #FCFBF8;
  --chrome-alt: #F3F1EC;
  --chrome-line: #E2DFD7;
  --chrome-text: #3E3B36;

  /* RGB variants for rgba() */
  --bg-rgb: 251, 247, 239;
  --accent-rgb: 255, 77, 109;
  --ink-blue-rgb: 43, 95, 227;
  --ink-rgb: 26, 26, 26;

  /* Semantic */
  --success: #2B8A6A;
  --error: #E23B3B;
  --warning: #FFC53D;
}
```

**Color Rules:**
- 所有 chrome 颜色通过 token（Tailwind theme / CSS 变量）引用，markup 内禁止硬编码 hex；唯一例外是 Canvas/PDF 里"豆子本身"的真实颜色（必须按 Artkal hex 原样绘制）。
- 三色 spot ink 同屏最多同时用 2 个，第 3 个仅作小点缀（网点/marker），避免花。
- **编辑器画布周边只用中性 chrome + 黑线 + 极少量粉点缀**；spot 大色块不得进入画布视野，以免干扰用户对真实豆色的判断（色彩准确是产品命脉）。

## 3. Typography Rules

**Font Stack:**
```css
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Noto+Sans+SC:wght@400;500;700;900&family=Space+Mono:wght@400;700&display=swap');
```

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|------|------|------|--------|-------------|----------------|
| Hero H1（中文） | Noto Sans SC | 48–56px | 900 | 1.06 | -0.02em |
| Wordmark / 数字（拉丁） | Bricolage Grotesque | 18–28px | 800 | 1.0 | -0.01em |
| Section H2 | Noto Sans SC | 28–32px | 900 | 1.15 | -0.01em |
| H3 | Noto Sans SC | 18–20px | 700 | 1.3 | — |
| Body | Noto Sans SC | 15–16px | 400 | 1.75 | 0.01em |
| Label / Eyebrow | Space Mono | 12px | 700 | 1.2 | 0.14em（UPPERCASE）|
| Mono / 色号 / 数量 | Space Mono | 12–13px | 400/700 | 1.3 | — |

**Typography Rules:**
- 中文一律 Noto Sans SC 在前、Bricolage/Space Mono 作 fallback；正文行高 ≥ 1.7、字距 0.01–0.02em、字号 ≥ 15px。
- Eyebrow/标签用 Space Mono 大写 + 宽字距，强化"印刷标签"气质。
- **NEVER use**: Inter / Roboto / Arial / 系统默认 sans 直出、Space Grotesk、任何纯英文字体让中文系统回退。

**Text Decoration**（按 text-decoration-rules.md，风格=活泼创意）:
- Hero H1：**layered 错版投影**（riso 招式 B）`text-shadow: 3px 3px 0 var(--ink-blue), 5px 5px 0 rgba(var(--ink-rgb),.1)`；不加渐变（违背 flat spot ink）。
- 关键词"真的"：粉色 **marker 高亮**（::after 斜切色条），不是变色文字。
- Section H2：可选轻投影；正文 p **任何装饰都不加**。

## 4. Component Stylings

### Buttons
```css
/* Primary —— 可按压的油印贴纸按钮 */
.btn-cta {
  display: inline-flex; align-items: center; gap: .5rem;
  font-weight: 700; color: #fff;
  background: var(--accent);
  border: 2px solid var(--ink-line);
  border-radius: 14px;
  padding: .7rem 1.4rem;
  box-shadow: 4px 4px 0 var(--ink-line);
  transition: transform .12s cubic-bezier(.22,1,.36,1), box-shadow .12s, background .15s;
}
.btn-cta:hover { background: var(--accent-hover); transform: translate(2px,2px); box-shadow: 2px 2px 0 var(--ink-line); }
.btn-cta:active { transform: translate(4px,4px); box-shadow: 0 0 0 var(--ink-line); }
.btn-cta:focus-visible { outline: 3px solid var(--ink-blue); outline-offset: 2px; }
.btn-cta:disabled { background: var(--surface-alt); color: var(--text-tertiary); border-color: var(--border); box-shadow: 3px 3px 0 var(--border); cursor: not-allowed; transform: none; }

/* Ghost —— 纸面次级 */
.btn-ghost {
  display: inline-flex; align-items: center; gap: .5rem;
  font-weight: 700; color: var(--text);
  background: var(--surface); border: 2px solid var(--ink-line);
  border-radius: 14px; padding: .55rem 1.1rem;
  box-shadow: 3px 3px 0 var(--ink-line);
  transition: transform .12s, box-shadow .12s;
}
.btn-ghost:hover { transform: translate(2px,2px); box-shadow: 1px 1px 0 var(--ink-line); }
.btn-ghost:active { transform: translate(3px,3px); box-shadow: 0 0 0 var(--ink-line); }
.btn-ghost:focus-visible { outline: 3px solid var(--ink-blue); outline-offset: 2px; }
```

### Cards
```css
.card-riso {
  background: var(--surface);
  border: 2px solid var(--ink-line);
  border-radius: 20px;
  box-shadow: 6px 6px 0 rgba(var(--ink-rgb), .9);
  transition: transform .16s cubic-bezier(.22,1,.36,1), box-shadow .16s;
}
.card-riso:hover { transform: translate(-2px,-2px); box-shadow: 9px 9px 0 rgba(var(--ink-rgb), .9); }
.card-riso:focus-within { outline: 3px solid var(--ink-blue); outline-offset: 3px; }
/* 轻量卡（面板/工具页，去黑边只留暖边+软影） */
.card-soft { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 10px 30px -18px rgba(var(--ink-rgb),.4); }
```

### Navigation
```css
/* 首页仅 Logo，无导航条；工具页为固定顶栏，不随滚动变化（无 scrolled 态） */
.topbar { background: color-mix(in srgb, var(--chrome) 92%, transparent); border-bottom: 1px solid var(--chrome-line); backdrop-filter: blur(8px); }
```

### Links
```css
.link { color: var(--ink-blue); text-decoration: none; background-image: linear-gradient(var(--ink-blue),var(--ink-blue)); background-size: 0% 2px; background-position: 0 100%; background-repeat: no-repeat; transition: background-size .25s; }
.link:hover { background-size: 100% 2px; }
.link:focus-visible { outline: 2px solid var(--ink-blue); outline-offset: 2px; }
```

### Tags / Badges（贴纸标签）
```css
.tag { display: inline-flex; align-items: center; gap: .35rem; font-family: "Space Mono", monospace; font-weight: 700; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; padding: .25rem .6rem; border: 1.5px solid var(--ink-line); border-radius: 999px; background: var(--surface); }
.tag--pink { background: var(--accent); color:#fff; }
.tag--blue { background: var(--ink-blue); color:#fff; }
.tag--yellow { background: var(--ink-yellow); color: var(--ink-line); }
```

### Inputs
```css
.input-riso { background: var(--surface); border: 2px solid var(--ink-line); border-radius: 12px; padding: .6rem .8rem; color: var(--text); }
.input-riso:focus { outline: none; box-shadow: 3px 3px 0 var(--accent); }
.input-riso::placeholder { color: var(--text-tertiary); }
```

### Marker 高亮 & 错版
```css
.hl { position: relative; white-space: nowrap; }
.hl::after { content:''; position:absolute; inset: 58% -.1em 6% -.1em; background: var(--accent); opacity:.55; z-index:-1; transform: rotate(-1.2deg); border-radius: 2px; }
.offset-ink { text-shadow: 3px 3px 0 var(--ink-blue), 5px 5px 0 rgba(var(--ink-rgb),.1); }
```

## 5. Layout Principles

**Container:**
- Marketing/首页内容区 max-width: 600px（居中），整页 max 1120px
- Padding: 20px(mobile) / 40px(desktop)
- 工具页：全宽，无居中容器（/editor 固定面板 + 滚动画布）

**Spacing Scale:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96（Tailwind 默认梯度）
- Section padding: 64–96px（首页纵向）
- Component gap: 16–24px
- Card internal padding: 20–28px

**Grid:**
```css
/* /convert 双栏 */
.convert-grid { display:grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 860px){ .convert-grid{ grid-template-columns: 1fr; } }
/* 色盘 6 列 */
.palette-grid { display:grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
```

## 6. Depth & Elevation

油印没有柔和高斯阴影——签名是**硬实色块投影（无 blur）**。柔影仅用于工具页面板（保持安静）。

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | 无影，仅 1px 暖边 | 工具页内嵌区块、列表行 |
| Sticker | `box-shadow: 3–4px 3–4px 0 var(--ink-line)` | 按钮、标签、小卡 |
| Pop | `box-shadow: 6–9px 6–9px 0 ink` + 黑描边 | 首页主卡片、弹窗 |
| Soft（仅工具页）| `0 10px 30px -18px rgba(ink,.4)` | /editor 面板、/convert 面板 |

## 7. Animation & Interaction

**Motion Philosophy**: 克制的"印刷台"动效——只用 transform/opacity；按压像真的盖章；首页一条横滚宣言带提供"钩子"，工具页零干扰。
**Tier**: 首页 L2 / 工具页 L1

### Dependencies
```html
<!-- 无外部动效库；纯 CSS + IntersectionObserver -->
```

### Entrance Animation
```css
@keyframes fade-up { from { opacity:0; transform: translateY(14px) } to { opacity:1; transform:none } }
@keyframes pop-in { from { opacity:0; transform: scale(.96) } to { opacity:1; transform:none } }
.animate-fade-up { animation: fade-up .55s cubic-bezier(.22,1,.36,1) both; }
.animate-pop-in { animation: pop-in .28s cubic-bezier(.22,1,.36,1) both; }
/* stagger: 用 [animation-delay] 工具类 80/160/240ms */
```

### Scroll Behavior
```js
// L2：首页 section 入场用 IntersectionObserver 加 .in（reveal: fadeInUp）
const io = new IntersectionObserver((es)=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('in')),{threshold:.15})
document.querySelectorAll('[data-reveal]').forEach(el=>io.observe(el))
```

### Signature Moment（首页钩子）—— 宣言横滚带
```css
@keyframes marquee { from{ transform: translateX(0) } to{ transform: translateX(-50%) } }
.marquee { overflow:hidden; }
.marquee__track { display:inline-flex; gap:2.5rem; white-space:nowrap; animation: marquee 22s linear infinite; }
.marquee:hover .marquee__track { animation-play-state: paused; }
```
内容："照着拼 · 一颗一颗 · ARTKAL 72 色 · 导出图纸 · 序号图例 · 小红书同款 ·"（黑墨大字 + 粉色圆点分隔，错版叠印）。

### Hover & Focus States
```css
/* 按钮/卡片见 §4；色盘 swatch */
.swatch { transition: transform .12s; }
.swatch:hover { transform: scale(1.14); }
.swatch[aria-pressed="true"] { outline: 2px solid var(--ink-line); outline-offset: 2px; }
/* 所有可聚焦元素 */
:focus-visible { outline: 3px solid var(--ink-blue); outline-offset: 2px; }
```

### Special Effects
- **半调网点氛围层**：`bg-halftone`（radial-gradient 网点）铺首页与预览底；编辑器画布用更淡的 `bg-halftone-fine`。
- **纸张颗粒**：极淡 SVG 噪声 overlay（opacity ≤ .04），仅首页。
- 不使用：自定义光标、视差、WebGL、scroll-jacking。

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
  .marquee__track { animation: none; transform: none; }
}
```

## 8. Do's and Don'ts

### Do
- 用黑墨描边 + 硬实色块投影做"贴纸/油印"质感，这是本设计的签名。
- spot ink 大胆但克制：粉做主 CTA、蓝做链接/次强调、黄只做小高亮/marker。
- 中文标题用 Noto Sans SC 900 + 错版投影；标签用 Space Mono 大写宽字距。
- 首页给足"手作温度"（网点、颗粒、宣言带、贴纸标签），工具页反向克制。
- 编辑器 chrome 一律中性暖灰 + 黑线，spot 仅做极小点缀。
- 每个可交互元素都有 hover + focus-visible 态；按钮按压有位移反馈。

### Don't
- ❌ 不用紫色渐变 / 玻璃拟态 / 通用 Material 卡片。
- ❌ 不在标题上叠加渐变文字（违背 flat spot ink；只用错版投影 + marker）。
- ❌ 不在编辑器画布视野里放 spot 大色块或花哨纹理（干扰豆色判断）。
- ❌ 不用柔和高斯阴影冒充油印影（首页要硬投影）；柔影只准出现在工具页面板。
- ❌ 不让三色 spot 同屏全开（最多 2 主 + 1 点缀）。
- ❌ 不用 Inter/Roboto/系统字体直出，不让中文回退到英文字体。
- ❌ 不给正文 p 加任何投影/渐变/高亮。
- ❌ 不引入 GSAP/Lenis/WebGL；动效一律 CSS，移动端不得卡顿。
- ❌ 触摸目标不得小于 44×44px；移动端不得横向溢出。

## 9. Responsive Behavior

**Breakpoints:**
| Name | Width | Key Changes |
|------|-------|-------------|
| Desktop | > 860px | /convert 双栏；/editor 三栏固定（左54 / 画布 / 右248）|
| Tablet | 600–860px | /convert 单栏堆叠；首页卡片满宽 |
| Mobile | < 600px | 单栏；/editor 右面板可折叠为底部抽屉，工具栏图标化；marquee 字号缩小 |

**Touch Targets:** 最小 44×44px（工具按钮、色盘 swatch 在移动端放大到 ≥ 36px 并增大间距）
**Collapsing Strategy:** 首页 hero 字号 clamp(34px,9vw,56px)；/editor 在窄屏把右侧色盘/图例折叠进底部抽屉，画布优先。

```css
.hero-h1 { font-size: clamp(34px, 9vw, 56px); }
@media (max-width: 600px){
  .topbar-cell-sizes { display:none; }        /* 工具栏格子档位在窄屏隐藏 */
  .editor-right { position: static; width: 100%; } /* 右面板下沉 */
}
```
