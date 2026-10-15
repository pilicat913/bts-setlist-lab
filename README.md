# BTS SETLIST LAB

**ARIRANG TOUR — SURPRISE SONG ARCHIVE**

面向 ARMY 的 BTS WORLD TOUR 'ARIRANG' 随机歌曲（Surprise Songs）档案网站：逐场查询、数据统计、歌曲反查、纪念票根导出。非官方粉丝项目。

技术栈：React 18 · TypeScript · Vite 5 · 原生 CSS · Canvas 2D（票根导出）· 本地 JSON 数据。
无后端、无登录、无外部 CDN —— 字体（Anton、IBM Plex Mono）随构建打包，中文/韩文使用系统字体，国内网络可直接访问。

---

## 中 / EN 双语

右上角「中 / EN」切换语言，选择会记住。第一次打开时按浏览器语言自动选择（中文系统显示中文，其他显示英文）。
分享英文版链接：`https://btssetlist.netlify.app/#/home?lang=en`（任何页面的链接后加 `lang=en` 都可以）。
界面文案在各场景文件里以 `t('中文', 'English')` 形式成对书写；城市、地区、专辑名和已有备注的英文版在 `src/lib/i18n.ts`。

## 运行

需要 Node.js 18+（推荐 20）。

```bash
npm install
npm run dev        # 本地开发 http://localhost:5173
npm run build      # 校验数据 → 类型检查 → 打包到 dist/
npm run preview    # 预览打包结果
npm run validate-data   # 只校验数据
```

`npm run build` 会先运行数据校验；数据有错（例如引用了不存在的 songId）时构建会失败并指出具体位置。

## 部署到 Netlify

**方式 A：拖拽（最快）**
1. 本地运行 `npm run build`
2. 打开 <https://app.netlify.com/drop>，把 `dist` 文件夹拖进去

**方式 B：连接 Git 仓库（推荐，之后改数据会自动重新部署）**
1. 把项目推到 GitHub / GitLab
2. Netlify → Add new site → Import an existing project → 选择仓库
3. 构建设置已写在 `netlify.toml`（Build command `npm run build`，Publish directory `dist`，Node 20），直接 Deploy

网站使用 hash 路由（`#/archive?show=…`），不需要配置重定向规则。Vercel 同理：Framework 选 Vite，输出目录 `dist`。

## 目录结构

```
src/
  data/
    shows.json      ← 场次数据库（巡演信息 + 88 场）
    songs.json      ← 歌曲表（稳定 songId、韩文名、中文译名/别名）
    sources.json    ← 来源表（每场通过 key 引用）
  lib/
    data.ts         ← 类型定义 + 所有统计的自动计算
    search.ts       ← 歌曲搜索（归一化 + 多语言别名）
    ticket.ts       ← 票根 Canvas 绘制与导出
    state.tsx       ← 全局状态（场次/歌曲选择、URL hash、localStorage）
  scenes/           ← HOME / ARCHIVE / DATA LAB / FINDER / TICKET
  styles/           ← 设计系统（base.css）与场景样式（scenes.css）
scripts/validate-data.mjs
DATA_GUIDE.md       ← 数据维护说明（如何加场次、改随机歌曲）
```

所有统计（首页最近场次、排行榜、矩阵、稀有歌曲、反查结果、票根内容）都在 `src/lib/data.ts` 中从 JSON 实时计算，没有任何写死的数字。

---

## 数据核实状态（截至 2026-10-15）

| 范围 | 状态 | 说明 |
|---|---|---|
| 2026-04-09 高阳 → 2026-10-10 利马，共 **53 场** | **VERIFIED** | 每场至少 2 个独立来源一致（Wikipedia 逐场列表 + KPopGo 逐场追踪，多数场次另有 The Honey Pop / F Zine / Billboard / 当地媒体交叉印证），并与站长校对版逐场比对 |
| 2026-10-14 圣地亚哥起，共 **35 场** | **UPCOMING** | 日期与场馆来自 Wikipedia 巡演页与 Live Nation；无曲目数据 |

当前数据库合计：随机曲目 **107 次**，不重复 **61 首**，最常出现 **Mikrokosmos、Outro: Wings（各 4 次）**，仅出现一次的 **30 首**。

### 已知的不确定点（已在对应场次的 notes 中注明）

- **釜山 DAY 02（06-13）**：Wikipedia、F Zine、粉丝统计账号均记为 **Dimple / Ddaeng / Magic Shop 三首**；KPopGo 记为 IDOL / Ddaeng，与其他来源冲突，未采用。
- **曲目顺序**：TRACK 01 / 02 的先后以站长校对版（逐场备忘录）为准；据此修正了巴黎 D1、巴尔的摩 D2、多伦多 D2 三场的顺序。
- **现场时刻**：洛杉矶 D1、洛杉矶 D4、利马 D3 记录了庆生（`moments` 字段），显示在场次档案和票根上。
- **演出形式（完整/串烧/片段）**：数据结构已支持，但目前没有来源逐场说明，全部记为 `unspecified`（界面不显示标签），不做推测。
- **完整 Setlist**：只有 **高阳 DAY 01** 有逐首报道的完整歌单（Consequence），标记为已核实。其他场次显示的是“参考框架”，界面上明确标注“非本场逐场核实歌单”，只把该场已核实的随机曲目填入；釜山两场叠加了已报道的改动（One More Night 替代 Please、NORMAL 韩语版）。
- **专辑归属**：ARIRANG 新歌中只有来源明确提及的曲目（Hooligan、Aliens、SWIM、2.0、NORMAL、Body to Body）标注了专辑，其余显示为空，不猜测。
- **自动状态**：数据里标为 UPCOMING 但日期已过的场次，界面会自动显示为 **PENDING（待核实）**，提醒你补录 —— 例如 10-14 圣地亚哥 DAY 01 结束后就会变成 PENDING。

## 功能完成情况

**已完成（第一版）**
- 五个场景 + 桌面顶部索引导航 / 手机底部导航，场景切换 340ms 遮罩过渡，选择状态跨场景保留（并写入 URL 与 localStorage）
- SHOW ARCHIVE：地区筛选、城市索引（红色索引线跟随）、DAY 场次、状态三分、随机曲目大字排版与纵向替换动效、本巡演第几次 / “巡演首唱”标记、完整 Setlist 抽屉、来源链接与最后核实日期、← → 键切换场次
- DATA LAB：自动计算的数据概览、出现次数排行（展开看所有场次）、稀有歌曲、未出现曲目（按专辑发行顺序或 A–Z）、交互矩阵（排序 / 地区 / 最少次数 / 三档密度，悬停或点击显示详情，可跳转）
- SONG FINDER：英文 / 韩文 / 中文译名 / 别名、大小写与标点不敏感、部分匹配、输入即查；固定曲目单独说明；无结果时不武断下结论
- MY TICKET：仅可选 VERIFIED 场次，“我想收藏这场 / 我亲自去过”（默认收藏，不假设到场），可选署名，2160×3840 PNG 导出（透明齿孔），导出后“PRINTED”印章效果；手机端优先调用系统分享（可存到相册），不支持时弹出图片供长按保存
- `prefers-reduced-motion` 支持、手机 / 平板 / 桌面适配

**留待第二版**
- 更丰富的统计（按专辑/年代分布、城市间重复率、连续场次间隔）
- 多种票根主题
- 历史巡演扩展（数据结构已有 `tour` 字段）
- 与巡演地图联动
- 随机歌曲趣味预测
- 演出形式（串烧/片段）的逐场核实与标注
