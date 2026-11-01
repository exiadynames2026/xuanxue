/**
 * 六爻纳甲装卦核心（京房八宫体系）
 * 依赖：lunar.js（干支/旬空）、tieban-tiaowen.js 的 TRIGRAM（先天卦画）
 * 八宫六十四卦由变爻规则程序化生成，世应随宫位推导。
 */
(function (root) {
  "use strict";
  const TRIG = root.TRIGRAM;
  let LX = root.LunarUtil || null; // lunar.js 的 LunarUtil（Node 下用 init 注入）
  const WU_XING_GAN = () => LX.WU_XING_GAN;

  /** Node 环境注入 LunarUtil */
  root.LiuYaoInit = function (util) { LX = (util && util.LunarUtil) ? util.LunarUtil : util; };

  // 京房八宫：宫名、先天数、宫五行
  const PALACES = [
    { name: "乾", num: 1, wx: "金" }, { name: "坎", num: 6, wx: "水" },
    { name: "艮", num: 7, wx: "土" }, { name: "震", num: 4, wx: "木" },
    { name: "巽", num: 5, wx: "木" }, { name: "离", num: 3, wx: "火" },
    { name: "坤", num: 8, wx: "土" }, { name: "兑", num: 2, wx: "金" },
  ];
  // 纳甲歌：乾金甲子外壬午，坎水戊寅外戊申，艮土丙辰外丙戌，震木庚子外庚午，
  //          巽木辛丑外辛未，离火己卯外己酉，坤土乙未外癸丑，兑金丁巳外丁亥
  //          （内卦三爻自所纳之支起顺行隔位：子寅辰 / 午申戌 等）
  const NAJIA = {
    1: { inner: ["甲子", "甲寅", "甲辰"], outer: ["壬午", "壬申", "壬戌"] },
    6: { inner: ["戊寅", "戊辰", "戊午"], outer: ["戊申", "戊戌", "戊子"] },
    7: { inner: ["丙辰", "丙午", "丙申"], outer: ["丙戌", "丙子", "丙寅"] },
    4: { inner: ["庚子", "庚寅", "庚辰"], outer: ["庚午", "庚申", "庚戌"] },
    5: { inner: ["辛丑", "辛亥", "辛酉"], outer: ["辛未", "辛巳", "辛卯"] },
    3: { inner: ["己卯", "己丑", "己亥"], outer: ["己酉", "己未", "己巳"] },
    8: { inner: ["乙未", "乙巳", "乙卯"], outer: ["癸丑", "癸亥", "癸酉"] },
    2: { inner: ["丁巳", "丁卯", "丁丑"], outer: ["丁亥", "丁酉", "丁未"] },
  };
  const LIU_SHOU = ["青龙", "朱雀", "勾陈", "腾蛇", "白虎", "玄武"];
  const SHOU_START = { "甲": 0, "乙": 0, "丙": 1, "丁": 1, "戊": 2, "己": 3, "庚": 4, "辛": 4, "壬": 5, "癸": 5 };

  function linesOf(upper, lower) { return [...TRIG[lower].lines, ...TRIG[upper].lines]; }
  function nameOf(upper, lower) { return root.HEXA[upper][lower]; }

  /** 由六爻阴阳（自下而上）推上下卦先天数 */
  function trigramsOf(lines) {
    const l3 = lines.slice(0, 3).join(""), u3 = lines.slice(3, 6).join("");
    const lower = +Object.keys(TRIG).find(k => TRIG[k].lines.join("") === l3);
    const upper = +Object.keys(TRIG).find(k => TRIG[k].lines.join("") === u3);
    return { upper, lower };
  }

  /**
   * 生成某一宫的八个卦：本宫、一世~五世、游魂、归魂
   * 规则：一世变初爻，二世再变二爻……五世变至五爻；
   *       游魂 = 五世卦第四爻复归本宫；归魂 = 游魂卦内卦（下三爻）复归本宫。
   * 世应：本宫世6应3；n世世n应n+3；游魂世4应1；归魂世3应6。
   */
  function buildPalace(palace) {
    const base = linesOf(palace.num, palace.num);
    const flip = (ls, i) => ls.map((v, k) => k === i ? 1 - v : v);
    const list = [];
    const push = (lines, shi, tag) => {
      const { upper, lower } = trigramsOf(lines);
      list.push({ lines: lines.slice(), upper, lower, name: nameOf(upper, lower), shi, tag });
    };
    push(base, 6, "本宫");
    let cur = base.slice();
    for (let n = 1; n <= 5; n++) { cur = flip(cur, n - 1); push(cur, n, n + "世"); }
    cur = flip(cur, 3); push(cur, 4, "游魂");      // 游魂：四爻复归
    cur = flip(cur, 0); cur = flip(cur, 1); cur = flip(cur, 2); // 内卦复本宫
    push(cur, 3, "归魂");
    return list;
  }

  /** 八宫六十四卦总表：卦名 → {宫, 世应, 爻纳甲} */
  function buildAll() {
    const map = {};
    PALACES.forEach(p => {
      buildPalace(p).forEach(g => {
        const najia = [...NAJIA[g.lower].inner, ...NAJIA[g.upper].outer];
        map[g.name] = {
          palace: p, lines: g.lines, shi: g.shi,
          ying: g.shi <= 3 ? g.shi + 3 : g.shi - 3, tag: g.tag, najia,
        };
      });
    });
    return map;
  }

  /** 六亲：以卦宫五行论爻支纳干之五行 */
  function liuQin(palaceWx, ganZhi) {
    const wx = LX.WU_XING_ZHI[ganZhi[1]]; // 纳甲爻五行以地支论（如甲子水）
    if (wx === palaceWx) return "兄弟";
    // 生我：水生木、木生火、火生土、土生金、金生水
    const SHENG = { "木": "水", "火": "木", "土": "火", "金": "土", "水": "金" };
    if (SHENG[palaceWx] === wx) return "父母";
    if (SHENG[wx] === palaceWx) return "子孙";
    // 克我：木克土、土克水、水克火、火克金、金克木
    const KE = { "木": "土", "土": "水", "水": "火", "火": "金", "金": "木" };
    if (KE[wx] === palaceWx) return "官鬼"; // 爻克宫：克我
    return "妻财";                            // 宫克爻：我克
  }

  /** 摇钱：三枚铜钱 → 6老阴 7少阳 8少阴 9老阳（背面数：0→6 1→7 2→8 3→9） */
  function coinToYao(backCount) { return 6 + backCount; }

  /** 由六次摇卦结果（数组，index0=初爻）得本卦、变卦 */
  function fromTosses(tosses) {
    const lines = tosses.map(v => (v === 7 || v === 9) ? 1 : 0);
    const moving = tosses.map((v, i) => (v === 9 || v === 6) ? i : -1).filter(i => i >= 0);
    const bianLines = lines.map((v, i) => (tosses[i] === 9 || tosses[i] === 6) ? 1 - v : v);
    const b = trigramsOf(lines), m = trigramsOf(bianLines);
    return {
      tosses, lines, moving,
      ben: { upper: b.upper, lower: b.lower, name: nameOf(b.upper, b.lower) },
      bian: { upper: m.upper, lower: m.lower, name: nameOf(m.upper, m.lower), lines: bianLines },
    };
  }

  /** 六合卦（初四/二五/三上支两两相合）/ 六冲卦（两两相冲） */
  function heChongGua(name) {
    const info = root.__LiuYaoMap[name];
    if (!info) return { liuHe: false, liuChong: false };
    const z = info.najia.map(g => g[1]);
    const HE = { "子":"丑","丑":"子","寅":"亥","亥":"寅","卯":"戌","戌":"卯","辰":"酉","酉":"辰","巳":"申","申":"巳","午":"未","未":"午" };
    const ch = i => ZHI[(ZHI.indexOf(z[i]) + 6) % 12];
    const liuHe = HE[z[0]] === z[3] && HE[z[1]] === z[4] && HE[z[2]] === z[5];
    const liuChong = ch(0) === z[3] && ch(1) === z[4] && ch(2) === z[5];
    return { liuHe, liuChong };
  }

  /**
   * 装卦：纳甲、六亲、六兽、世应、旬空
   * @param name 本卦名（64卦名）
   * @param bianName 变卦名（无动爻传 null）
   * @param dayGanZhi 日干支（六兽、旬空用）
   * @param monthZhi 月建
   */
  function zhuangGua(name, bianName, dayGanZhi, monthZhi) {
    const info = root.__LiuYaoMap[name];
    if (!info) throw new Error("未知卦名：" + name);
    const kRaw = (LX && LX.getXunKong) ? LX.getXunKong(dayGanZhi)
      : xunKongOf(dayGanZhi);
    const kong = Array.isArray(kRaw) ? kRaw : String(kRaw).split("");
    const start = SHOU_START[dayGanZhi[0]];
    const rows = [];
    for (let i = 0; i < 6; i++) {
      const gz = info.najia[i];
      rows.push({
        pos: i + 1,
        ganZhi: gz,
        wx: LX.WU_XING_ZHI[gz[1]],
        liuQin: liuQin(info.palace.wx, gz),
        shou: LIU_SHOU[(start + i) % 6],
        shi: info.shi === i + 1,
        ying: info.ying === i + 1,
        kong: kong.includes(gz[1]),
        yuePo: monthZhi && ZHI[(ZHI.indexOf(monthZhi) + 6) % 12] === gz[1],
        riChong: dayGanZhi && ZHI[(ZHI.indexOf(dayGanZhi[1]) + 6) % 12] === gz[1],
        monthJian: monthZhi === gz[1],
        dayChen: dayGanZhi[1] === gz[1],
        moving: null, bianGanZhi: null,
      });
    }
    // 动爻：本卦爻画 vs 变卦爻画
    if (bianName) {
      const bi = root.__LiuYaoMap[bianName];
      for (let i = 0; i < 6; i++) {
        if (bi.lines[i] !== info.lines[i]) {
          rows[i].moving = info.lines[i] === 1 ? "老阳" : "老阴";
          rows[i].bianGanZhi = bi.najia[i]; // 变出之爻取变卦纳甲
        }
      }
    }
    const hc = heChongGua(name);
    return Object.assign(hc, { info, rows, kong, palace: info.palace });
  }

  /** 干支旬空（无库时兜底） */
  function xunKongOf(gz) {
    const JIAZI = []; for (let i = 0; i < 60; i++) {
      JIAZI.push(GAN[i % 10] + ZHI[i % 12]);
    }
    const idx = JIAZI.indexOf(gz);
    const s = Math.floor(idx / 10) * 10;
    return [ZHI[(s + 10) % 12], ZHI[(s + 11) % 12]];
  }
  const GAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  const ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];

  root.__LiuYaoMap = buildAll();
  root.LiuYao = { PALACES, NAJIA, LIU_SHOU, buildPalace, buildAll, liuQin, coinToYao, fromTosses, zhuangGua, linesOf, trigramsOf, heChongGua };
})(typeof window !== "undefined" ? window : globalThis);
