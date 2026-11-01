/**
 * 大六壬核心：月将加时、四课、三传（九宗门）、十二天将
 * 口径：《大六壬指南》《六壬大全》通行简化版
 * 涉害用"取孟仲季"简法；别责八专昴星按通行口径，差异流派见页面说明。
 */
(function (root) {
  "use strict";
  const ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
  const GAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  const JI_GONG = { "甲":"寅","乙":"辰","丙":"巳","丁":"未","戊":"巳","己":"未","庚":"申","辛":"戌","壬":"亥","癸":"丑" };
  const ZHONGQI_JIANG = {
    "雨水":"亥","春分":"戌","谷雨":"酉","小满":"申","夏至":"未","大暑":"午",
    "处暑":"巳","秋分":"辰","霜降":"卯","小雪":"寅","冬至":"丑","大寒":"子",
  };
  const JIANG_NAME = { "亥":"登明","戌":"河魁","酉":"从魁","申":"传送","未":"小吉","午":"胜光",
    "巳":"太乙","辰":"天罡","卯":"太冲","寅":"功曹","丑":"大吉","子":"神后" };
  const TIANJIANG = ["贵人","螣蛇","朱雀","六合","勾陈","青龙","天空","白虎","太常","玄武","太阴","天后"];
  const GUIREN = { "甲":["丑","未"],"戊":["丑","未"],"庚":["丑","未"],"乙":["子","申"],"己":["子","申"],
    "丙":["亥","酉"],"丁":["亥","酉"],"辛":["午","寅"],"壬":["卯","巳"],"癸":["卯","巳"] };
  const XING = { "子":"卯","卯":"子","寅":"巳","巳":"申","申":"寅","丑":"戌","戌":"未","未":"丑",
    "辰":"辰","午":"午","酉":"酉","亥":"亥" };
  const WX = { "子":"水","丑":"土","寅":"木","卯":"木","辰":"土","巳":"火","午":"火","未":"土","申":"金","酉":"金","戌":"土","亥":"水" };
  const KE = { "木":"土","土":"水","水":"火","火":"金","金":"木" }; // 值所克
  const idx = z => ZHI.indexOf(z);
  const keZhi = (a, b) => KE[WX[a]] === WX[b];   // a 克 b？
  const chongOf = z => ZHI[(idx(z) + 6) % 12];

  /** 月将：节气表中不晚于今日的最近一个中气（合并今明两年表，避免跨年边界） */
  function yueJiang(lunar) {
    const today = lunar.getSolar().toYmd();
    const tables = [lunar.getJieQiTable()];
    try { tables.push(lunar.getSolar().nextDay(40).getLunar().getJieQiTable()); } catch (e) { /* 忽略 */ }
    let bestName = null, bestDate = "";
    for (const table of tables) {
      for (const name of Object.keys(ZHONGQI_JIANG)) {
        const jq = table[name];
        if (!jq) continue;
        const d = jq.toYmd();
        if (d <= today && d > bestDate) { bestName = name; bestDate = d; }
      }
    }
    return { jiang: ZHONGQI_JIANG[bestName], qi: bestName, date: bestDate };
  }

  /** 天盘：天盘(地盘位g) = 月将 + (g - 时支) */
  function tianPan(jiang, hourZhi) {
    const shift = idx(jiang) - idx(hourZhi);
    const t = {};
    ZHI.forEach((z, i) => t[z] = ZHI[((i + shift) % 12 + 12) % 12]);
    return t;
  }

  /** 四课：[{xia 下, shang 上}] */
  function siKe(dayGz, tian) {
    const jg = JI_GONG[dayGz[0]];
    const c1 = { xia: jg, shang: tian[jg] };
    const c2 = { xia: c1.shang, shang: tian[c1.shang] };
    const c3 = { xia: dayGz[1], shang: tian[dayGz[1]] };
    const c4 = { xia: c3.shang, shang: tian[c3.shang] };
    return [c1, c2, c3, c4];
  }

  /** 三传（九宗门） */
  function sanChuan(dayGz, ke, tian) {
    const dayGan = dayGz[0], dayZhi = dayGz[1];
    const yangDay = "甲丙戊庚壬".includes(dayGan);
    const fuYin = ZHI.every(z => tian[z] === z);
    const fanYin = ZHI.every(z => tian[z] === chongOf(z));
    const zei = [...new Set(ke.map(c => keZhi(c.xia, c.shang) ? c.shang : null).filter(Boolean))];
    const yangZhi = z => idx(z) % 2 === 0;

    // ⑧ 伏吟（天地盘相同）
    if (fuYin) {
      const ch0 = zei.length === 1 ? zei[0] : (yangDay ? ke[0].shang : ke[2].shang);
      return { men: "伏吟", chuan: [ch0, XING[ch0], XING[XING[ch0]]] };
    }
    // ⑨ 返吟（天地盘相冲）
    if (fanYin) {
      if (zei.length) {
        const c0 = zei[0];
        return { men: "返吟（有克）", chuan: [c0, tian[c0], tian[tian[c0]]] };
      }
      return { men: "返吟（无克）", chuan: [chongOf(ke[0].shang), chongOf(ke[2].shang), ke[0].shang] };
    }
    // ① 贼克
    if (zei.length === 1) {
      const c0 = zei[0];
      return { men: "贼克", chuan: [c0, tian[c0], tian[tian[c0]]] };
    }
    // ② 比用
    if (zei.length >= 2) {
      const bi = zei.filter(z => yangZhi(z) === yangDay);
      if (bi.length === 1) {
        const c0 = bi[0];
        return { men: "比用", chuan: [c0, tian[c0], tian[tian[c0]]] };
      }
      // ③ 涉害（取孟仲季简法）：贼神所临之位，孟先仲次季后
      const suozai = z => ke.filter(c => c.shang === z).map(c => c.xia)[0];
      const zhiType = z => "寅申巳亥".includes(z) ? 0 : ("子午卯酉".includes(z) ? 1 : 2);
      const cands = zei.map(z => ({ z, wei: suozai(z) })).filter(o => o.wei)
        .sort((a, b) => zhiType(a.wei) - zhiType(b.wei));
      const c0 = (cands[0] || { z: zei[0] }).z;
      return { men: "涉害", chuan: [c0, tian[c0], tian[tian[c0]]] };
    }
    // ④ 遥克：四课上神克日干（蒿矢），或日干克上神（弹射）
    const dayGong = JI_GONG[dayGan];
    const shangKeDay = ke.map(c => keZhi(c.shang, dayGong) ? c.shang : null).filter(Boolean);
    const dayKeShang = ke.map(c => keZhi(dayGong, c.shang) ? c.shang : null).filter(Boolean);
    if (shangKeDay.length) {
      const c0 = shangKeDay[0];
      return { men: "遥克（蒿矢）", chuan: [c0, tian[c0], tian[tian[c0]]] };
    }
    if (dayKeShang.length) {
      const c0 = dayKeShang[0];
      return { men: "遥克（弹射）", chuan: [c0, tian[c0], tian[tian[c0]]] };
    }
    // ⑥ 别责：四课不全（三课备）且无遥无克
    const distinct = new Set(ke.map(c => c.xia + c.shang)).size;
    if (distinct < 4) {
      const sameDay = "甲寅庚申丁未己未".includes(dayGz);
      if (sameDay) {
        // ⑦ 八专
        const g0 = yangDay ? ZHI[(idx(ke[0].shang) + 2) % 12]
                           : ZHI[(idx(ke[3].shang) - 2 + 12) % 12];
        return { men: "八专", chuan: [g0, ke[0].shang, ke[0].shang] };
      }
      const HE = { "甲":"己","己":"甲","乙":"庚","庚":"乙","丙":"辛","辛":"丙","丁":"壬","壬":"丁","戊":"癸","癸":"戊" };
      const ch0 = yangDay ? tian[JI_GONG[HE[dayGan]]] : ZHI[(idx(dayZhi) + 4) % 12];
      return { men: "别责", chuan: [ch0, ke[0].shang, ke[0].shang] };
    }
    // ⑤ 昴星：无遥无克四课全
    if (yangDay) {
      const c0 = tian["酉"];
      return { men: "昴星（虎视）", chuan: [c0, tian[dayZhi], tian[dayGong]] };
    }
    const g = ZHI.find(z => tian[z] === "酉");
    return { men: "昴星（冬蛇掩目）", chuan: [g, tian[dayZhi], tian[dayGong]] };
  }

  /** 十二天将 */
  function tianJiang(dayGz, tian, night) {
    const [day, nightG] = GUIREN[dayGz[0]];
    const ren = night ? nightG : day;
    const renGong = ZHI.find(z => tian[z] === ren);
    // 贵人临亥~辰顺行，巳~戌逆行
    const forward = ["亥","子","丑","寅","卯","辰"].includes(renGong);
    const start = idx(renGong);
    const map = {};
    TIANJIANG.forEach((j, i) => {
      const p = ((forward ? start + i : start - i) % 12 + 12) % 12;
      map[ZHI[p]] = j;
    });
    return { map, ren, renGong, forward, dayGui: day, nightGui: nightG };
  }

  /** 六亲（以日干寄宫五行论我） */
  function liuQin(dayGan, zhi) {
    const self = WX[JI_GONG[dayGan]];
    const w = WX[zhi];
    if (w === self) return "兄弟";
    const SHENG = { "木":"水","火":"木","土":"火","金":"土","水":"金" };
    if (SHENG[self] === w) return "父母";
    if (SHENG[w] === self) return "子孙";
    if (KE[w] === self) return "官鬼";
    return "妻财";
  }

  /** 总入口 */
  function paipan(solar, hourZhiOverride) {
    const lunar = solar.getLunar();
    const dayGz = lunar.getDayInGanZhi();
    const h = solar.getHour();
    const hourZhi = hourZhiOverride || ZHI[Math.floor(((h + 1) % 24) / 2)];
    const { jiang, qi } = yueJiang(lunar);
    const tian = tianPan(jiang, hourZhi);
    const ke = siKe(dayGz, tian);
    const { men, chuan } = sanChuan(dayGz, ke, tian);
    const night = !"卯辰巳午未申".includes(hourZhi);
    const tj = tianJiang(dayGz, tian, night);
    // 遁干：时旬旬首甲落地盘旬首支位，顺布十天干；天盘支取其所临地盘位之遁干
    const tGz = lunar.getTimeInGanZhi ? lunar.getTimeInGanZhi() : null;
    const hourGz = tGz || (dayGz[0] + hourZhi);
    const xunIdxLR = Math.floor((function(gz){const g=GAN.indexOf(gz[0]),zh=ZHI.indexOf(gz[1]);for(let i=0;i<60;i++)if(i%10===g&&i%12===zh)return i;return 0;})(hourGz)/10);
    const xunZhi = ZHI[(xunIdxLR*10)%12]; // 旬首支：甲子→子 甲戌→戌…
    const shiftLR = idx(jiang) - idx(hourZhi);
    const dunOf = (zhi) => {
      const g = ((idx(zhi) - shiftLR) % 12 + 12) % 12;   // 天盘支所临地盘位
      const off = ((g - idx(xunZhi)) % 12 + 12) % 12;
      return off < 10 ? GAN[off] : null;                  // 落空亡两位无遁干
    };
    const chuanDetail = chuan.map(z => ({
      zhi: z, jiang: tj.map[z] || "—", wx: WX[z], liuQin: liuQin(dayGz[0], z), dun: dunOf(z),
    }));
    return { dayGz, hourGz, hourZhi, jiang, jiangName: JIANG_NAME[jiang], qi, tian, ke, men, chuan, chuanDetail, tj, night, dunOf };
  }

  root.LiuRen = { paipan, yueJiang, tianPan, siKe, sanChuan, tianJiang, liuQin, JI_GONG, ZHONGQI_JIANG, TIANJIANG, XING, WX };
})(typeof window !== "undefined" ? window : globalThis);
