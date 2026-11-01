/**
 * 奇门遁甲核心（时家转盘奇门 · 拆补定局）
 * 依赖：lunar.js（四柱/节气）、tieban-tiaowen.js
 */
(function (root) {
  "use strict";
  const LX = root.LunarUtil || null;
  const GAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  const ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];

  // 洛书九宫：1坎 2坤 3震 4巽 5中 6乾 7兑 8艮 9离
  // 转盘环序（九星/八门所在宫，顺时针相邻）：1→8→3→4→9→2→7→6→(1)
  const RING = [1, 8, 3, 4, 9, 2, 7, 6];
  const PALACE_NAME = { 1: "坎", 2: "坤", 3: "震", 4: "巽", 5: "中", 6: "乾", 7: "兑", 8: "艮", 9: "离" };
  // 九星按环序落本宫；中五天禽寄坤二
  const STARS = { 1: "天蓬", 8: "天任", 3: "天冲", 4: "天辅", 9: "天英", 2: "天芮", 7: "天柱", 6: "天心", 5: "天禽" };
  const DOORS = { 1: "休门", 8: "生门", 3: "伤门", 4: "杜门", 9: "景门", 2: "死门", 7: "惊门", 6: "开门" };
  const GODS = ["值符", "腾蛇", "太阴", "六合", "白虎", "玄武", "九地", "九天"];
  // 三奇六仪：戊己庚辛壬癸 + 丁丙乙（乙丙丁为三奇）
  const YI_ORDER = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"];
  // 旬首：甲子→戊 甲戌→己 甲申→庚 甲午→辛 甲辰→壬 甲寅→癸
  const XUN_SHOU = ["甲子", "甲戌", "甲申", "甲午", "甲辰", "甲寅"];
  const XUN_YI = ["戊", "己", "庚", "辛", "壬", "癸"];
  // 节气三元局数表（上元/中元/下元）：正为阳遁，负为阴遁（数值即局数）
  const JU_TABLE = {
    "冬至": [1, 7, 4], "小寒": [2, 8, 5], "大寒": [3, 9, 6], "立春": [8, 5, 2],
    "雨水": [9, 6, 3], "惊蛰": [1, 7, 4], "春分": [3, 9, 6], "清明": [4, 1, 7],
    "谷雨": [5, 2, 8], "立夏": [4, 1, 7], "小满": [5, 2, 8], "芒种": [6, 3, 9],
    "夏至": [-9, -3, -6], "小暑": [-8, -2, -5], "大暑": [-7, -1, -4], "立秋": [-2, -5, -8],
    "处暑": [-1, -4, -7], "白露": [-9, -3, -6], "秋分": [-7, -1, -4], "寒露": [-6, -9, -3],
    "霜降": [-5, -8, -2], "立冬": [-6, -9, -3], "小雪": [-4, -7, -1], "大雪": [-4, -7, -1],
  };

  /** 干支旬空 */
  function xunKong(gz) {
    const idx = ganZhiIndex(gz);
    const s = Math.floor(idx / 10) * 10;
    return [ZHI[(s + 10) % 12], ZHI[(s + 11) % 12]];
  }
  function ganZhiIndex(gz) {
    const g = GAN.indexOf(gz[0]), z = ZHI.indexOf(gz[1]);
    for (let i = 0; i < 60; i++) if (i % 10 === g && i % 12 === z) return i;
    return 0;
  }

  /** 拆补法定局：{dun:1阳/-1阴, ju:1-9, yuan:0上/1中/2下, jieqi, futou} */
  function dingJu(lunar) {
    const jieqi = lunar.getPrevJieQi().getName();
    const solar = lunar.getSolar();
    // 符头：往前找最近的甲/己日
    let futou = null, diff = 0;
    for (let i = 0; i < 5; i++) {
      const d = solar.nextDay ? solar.nextDay(-i) : null;
      const gz = d.getLunar().getDayInGanZhi();
      if (gz[0] === "甲" || gz[0] === "己") { futou = gz; diff = i; break; }
    }
    const fz = futou[1];
    const yuan = "子午卯酉".includes(fz) ? 0 : ("寅申巳亥".includes(fz) ? 1 : 2);
    const row = JU_TABLE[jieqi];
    const ju = Math.abs(row[yuan]);
    const dun = row[yuan] > 0 ? 1 : -1;
    return { dun, ju, yuan, jieqi, futou, diff };
  }

  /**
   * 排局
   * @param solar Solar 对象（用其时辰）
   */
  function paipan(solar) {
    const lunar = solar.getLunar();
    const dayGz = lunar.getDayInGanZhi();
    const timeGz = lunar.getTimeInGanZhi();
    const { dun, ju, yuan, jieqi, futou } = dingJu(lunar);

    // 地盘：阳遁顺飞、阴遁逆飞，戊落局数宫
    const dipan = {}; // 宫(1-9) → 仪
    for (let i = 0; i < 9; i++) {
      const g = ((ju - 1 + (dun === 1 ? i : -i)) % 9 + 9) % 9 + 1;
      dipan[g] = YI_ORDER[i];
    }
    // 时辰旬首
    const idx = ganZhiIndex(timeGz);
    const xunIdx = Math.floor(idx / 10);
    const xunShou = XUN_SHOU[xunIdx], xunYi = XUN_YI[xunIdx];
    // 旬首仪所在宫 → 值符星 / 值使门
    const shouGong = +Object.keys(dipan).find(g => dipan[g] === xunYi);
    const zhiFuXing = STARS[shouGong === 5 ? 2 : shouGong];
    const zhiShiMen = DOORS[shouGong === 5 ? 2 : shouGong];
    // 时干地盘宫（甲用旬首仪代）
    const shiGan = timeGz[0] === "甲" ? xunYi : timeGz[0];
    let shiGanGong = +Object.keys(dipan).find(g => dipan[g] === shiGan);
    if (shiGanGong === 5) shiGanGong = 2; // 中宫寄坤
    // 值符随时干：值符星落时干宫，携带原宫地盘仪升天盘
    const ringPos = g => RING.indexOf(g === 5 ? 2 : g);
    // 天盘：九星随值符转，各星携其原地盘仪
    const tianXing = {}, tianYi = {};
    const rFu = ringPos(shouGong), rShi = ringPos(shiGanGong);
    const shift = rShi - rFu; // 环上移动格数
    for (let i = 0; i < 8; i++) {
      const fromG = RING[(rFu + i) % 8];          // 原宫（含环上各星）
      const toG = RING[(rFu + i + shift + 64) % 8]; // 新宫
      tianXing[toG] = STARS[fromG];
      tianYi[toG] = dipan[fromG];
    }
    // 中宫天禽寄坤二（若天芮到某宫，禽随芮）
    if (shouGong === 5 || Object.values(tianXing).includes("天芮")) {
      // 天禽与天芮同宫
      const ruiGong = +Object.keys(tianXing).find(g => tianXing[g] === "天芮");
      tianXing[ruiGong] = "天芮(禽)";
    }
    // 八门：值使门从旬首宫起，按时辰数飞宫（阳顺阴逆），落宫后随转盘排布
    const shiNum = idx - xunIdx * 10; // 时辰距旬首(0-9)
    let shiGong = shouGong;
    for (let i = 0; i < shiNum; i++) {
      let p = RING.indexOf(shiGong === 5 ? 2 : shiGong);
      p = (p + (dun === 1 ? 1 : -1) + 8) % 8;
      shiGong = RING[p];
    }
    const tianMen = {};
    const rMenFu = ringPos(shouGong), rMenShi = ringPos(shiGong);
    const menShift = rMenShi - rMenFu;
    for (let i = 0; i < 8; i++) {
      const fromG = RING[(rMenFu + i) % 8];
      const toG = RING[(rMenFu + i + menShift + 64) % 8];
      tianMen[toG] = DOORS[fromG];
    }
    // 八神：值符神落值符(星)宫，阳顺阴逆按环布
    const tianShen = {};
    const rGod = ringPos(shiGanGong);
    for (let i = 0; i < 8; i++) {
      const toG = RING[(rGod + i * dun + 16) % 8];
      tianShen[toG] = GODS[i];
    }
    const kong = xunKong(timeGz);
    const maXing = YIMA[ZHI.indexOf(timeGz[1]) % 4];
    return { dun, ju, yuan, jieqi, futou, dayGz, timeGz, xunShou, xunYi, shouGong, zhiFuXing, zhiShiMen,
      dipan, tianXing, tianYi, tianMen, tianShen, shiGanGong, kong, maXing,
      PALACE_NAME, STARS, DOORS };
  }
  const YIMA = ["寅", "亥", "申", "巳"]; // 申子辰/巳酉丑/寅午戌/亥卯未 驿马

  root.QiMen = { paipan, dingJu, JU_TABLE, RING, STARS, DOORS, GODS, YI_ORDER };
})(typeof window !== "undefined" ? window : globalThis);
