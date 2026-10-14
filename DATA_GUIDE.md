# 数据维护说明

所有内容都由三个文件驱动，改完保存即可 —— 场次档案、歌曲反查、排行榜、矩阵、稀有歌曲、首页最近场次、票根全部自动更新。

- `src/data/shows.json` — 巡演信息与场次
- `src/data/songs.json` — 歌曲表
- `src/data/sources.json` — 来源表

改完后运行 `npm run validate-data` 检查（`npm run build` 也会自动检查）。

---

## 1. 一场演出结束后：修改它的 Surprise Songs

找到该场（按 `showId` 搜索，例如 `arirang-2026-10-14-santiago`），修改 4 处：

```jsonc
{
  "showId": "arirang-2026-10-14-santiago",
  "status": "VERIFIED",                       // ① UPCOMING → VERIFIED（只核实了一个来源时用 PENDING）
  "surpriseSongs": [                          // ② 按实际演唱顺序填写
    { "songId": "spring-day", "slot": 1, "form": "unspecified" },
    { "songId": "dope",       "slot": 2, "form": "unspecified" }
  ],
  "sources": ["wiki", "kpopgo", "某个新来源key"], // ③ 至少两个独立来源
  "lastVerifiedAt": "2026-10-15"              // ④ 你核实的日期
}
```

- `songId` 必须是 `songs.json` 中已有的 id。不确定 id 时，在 `songs.json` 中搜索歌名。
- `form` 可选：`full`（完整）、`medley`（串烧）、`snippet`（片段）、`unspecified`（来源未说明，界面不显示标签）。
- 一场唱了三首（如釜山 DAY 02）就写三条，`slot` 为 1/2/3。
- 曲目顺序不确定时，在 `notes` 里写一句说明。
- `notes` 是字符串数组，会显示在场次档案底部。
- `moments` 是现场特别时刻（如 `"现场为 Jimin 庆生 · Happy Jimin's Birthday"`），以红色标签显示在场次档案，`·` 前的中文部分会印在票根上。
- 城市名以 `cityZh` 为主显示，`city` 为英文副标题；矩阵列头太长时可在 `src/lib/data.ts` 的 `ZH_SHORT` 中加简称。

修改已核实的场次（例如发现写错）也是同样操作：改 `surpriseSongs`，更新 `lastVerifiedAt`，必要时在 `notes` 里说明更正原因。

## 2. 添加一首新歌（第一次作为随机曲目出现）

在 `songs.json` 末尾追加：

```json
{
  "songId": "war-of-hormone",
  "title": "War of Hormone",
  "titleKo": "호르몬 전쟁",
  "aliases": ["荷尔蒙战争"],
  "album": "DARK&WILD",
  "year": 2014,
  "kind": "catalog"
}
```

- `songId`：小写字母、数字、连字符；**一旦使用就不要修改**（统计靠它去重，中英韩不同名称都指向同一个 id）。
- `aliases`：任何你希望能搜到它的写法（中文译名、简称、去标点写法）。
- `kind`：随机曲目用 `catalog`；本巡演固定曲目用 `setlist`。
- 不确定的字段写 `null`，不要猜。

## 3. 添加一个来源

在 `sources.json` 中加一个 key：

```json
"latercera-santiago": {
  "label": "La Tercera · BTS en el Estadio Nacional",
  "url": "https://…",
  "type": "media",
  "accessedAt": "2026-10-15"
}
```

然后在场次的 `sources` 数组里引用 `"latercera-santiago"`。

## 4. 添加一场新的演唱会（例如新公布的 2027 场次）

在 `shows.json` 的 `shows` 数组中追加一条（顺序不重要，网站会按日期排序）：

```json
{
  "showId": "arirang-2027-04-10-riyadh",
  "tour": "arirang",
  "seq": 89,
  "date": "2027-04-10",
  "dayIndex": 1,
  "cityKey": "riyadh",
  "city": "Riyadh",
  "cityZh": "利雅得",
  "country": "Saudi Arabia",
  "countryZh": "沙特阿拉伯",
  "countryCode": "SA",
  "region": "middle-east",
  "venue": "（官方公布的场馆名）",
  "status": "UPCOMING",
  "surpriseSongs": [],
  "fullSetlist": null,
  "setlistChanges": [],
  "notes": [],
  "sources": ["官方公告的来源key"],
  "lastVerifiedAt": "2026-10-15"
}
```

- `showId` 建议格式：`arirang-日期-cityKey`，必须唯一。
- `date` 填**当地演出日期**。
- `seq`：场次编号（票根上的 №）。插入到中间时，界面上的编号以 `seq` 为准，请保持按日期递增。
- `dayIndex`：该城市的第几晚（DAY 01、DAY 02…）。
- `cityKey`：同一城市多场必须相同；`region` 为新地区时，在 `src/lib/data.ts` 的 `REGION_LABEL` 中补一个中文名。
- 矩阵列头使用中文城市名；名称较长时在 `src/lib/data.ts` 的 `ZH_SHORT` 中加一个简称。

## 5. 某场的完整 Setlist

- 有逐首可靠来源时，填写 `fullSetlist`（格式参考高阳 DAY 01）：`{"basis":"verified","sources":[...],"items":[{"act":"ACT 1","songId":"hooligan","type":"fixed"}, … {"act":"ENCORE","songId":"…","type":"surprise"}]}`
- 没有时保持 `null`，界面显示参考框架（`tour.setlistTemplate`）并明确标注“非逐场核实”。
- 该场只有个别已报道的改动时，用 `setlistChanges`：
  - `{"type":"replace","target":"please","with":"one-more-night","note":"…"}`
  - `{"type":"annotate","target":"normal","note":"演唱韩语版本"}`
  - `{"type":"remove","target":"…"}`、`{"type":"insertAfter","target":"…","with":"…"}`

## 核实原则

- VERIFIED：至少两个相互独立的来源一致（官方、可信媒体、逐场数据库）。粉丝账号可作参考，但不单独作为核实依据。
- 来源冲突时，采用多数一致的版本，并在 `notes` 里写明冲突。
- 不确定就用 PENDING，并保持 `surpriseSongs` 为空 —— PENDING 场次不计入任何统计。
