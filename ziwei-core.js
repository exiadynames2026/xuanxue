/**
 * 紫微斗数安星核心（中州/全书通行口径）
 * 依赖：lunar.js（农历/干支/纳音）
 */
(function (root) {
  "use strict";
  let LX = root.LunarUtil || null;
  root.ZiWeiInit = function (util) { LX = (util && util.LunarUtil) ? util.LunarUtil : util; };
  const JIAZI = []; { const G=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"], Z=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
    for (let i=0;i<60;i++) JIAZI.push(G[i%10]+Z[i%12]); }
  const PAL = ["寅","卯","辰","巳","午","未","申","酉","戌","亥","子","丑"]; // 0=寅
  const pIdx = z => PAL.indexOf(z);
  const pName = i => PAL[((i % 12) + 12) % 12];

  /** 农历信息 → 基础盘 {命宫,身宫,五行局,紫微,...} */
  function anXing(yearGan, yearZhi, lunarMonth, lunarDay, hourZhi, gender) {
    // 1. 命宫身宫：寅起正月顺数生月，生月宫起子时逆/顺数生时
    const monthPal = (lunarMonth - 1);                    // 正月=寅(0)
    const hOff = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"].indexOf(hourZhi);
    const mingPal = ((monthPal - hOff) % 12 + 12) % 12;
    const shenPal = ((monthPal + hOff) % 12 + 12) % 12;
    // 2. 命宫天干：五虎遁
    const WUHU = { "甲":"丙","己":"丙","乙":"戊","庚":"戊","丙":"庚","辛":"庚","丁":"壬","壬":"壬","戊":"甲","癸":"甲" };
    const startGan = WUHU[yearGan];
    const mingGanZhi = GAN[(GAN.indexOf(startGan) + mingPal) % 10] + PAL[mingPal];
    // 3. 五行局：命宫干支纳音
    const nayin = LX.NAYIN[mingGanZhi];
    const wx = nayin.slice(-1);
    const JU = { "水": 2, "木": 3, "金": 4, "土": 5, "火": 6 };
    const ju = JU[wx];
    // 4. 起紫微（借数法）：n=ceil(D/ju)，j=ju*n-D；j 偶顺 j 位、奇逆 j 位
    const n = Math.ceil(lunarDay / ju);
    const j = ju * n - lunarDay;
    const ziweiPal = ((n - 1 + (j % 2 === 0 ? j : -j)) % 12 + 12) % 12;
    // 5. 紫微系（逆行）：紫微0 天机-1 太阳-3 武曲-4 天同-5 廉贞-8
    const zi = {};
    zi["紫微"] = ziweiPal;
    zi["天机"] = ziweiPal - 1;
    zi["太阳"] = ziweiPal - 3;
    zi["武曲"] = ziweiPal - 4;
    zi["天同"] = ziweiPal - 5;
    zi["廉贞"] = ziweiPal - 8;
    // 6. 天府：寅申轴对称 (12-pz)
    const tianfuPal = ((12 - ziweiPal) % 12 + 12) % 12;
    // 7. 天府系（顺行）：天府+0 太阴+1 贪狼+2 巨门+3 天相+4 天梁+5 七杀+6 破军+10
    zi["天府"] = tianfuPal;
    zi["太阴"] = tianfuPal + 1;
    zi["贪狼"] = tianfuPal + 2;
    zi["巨门"] = tianfuPal + 3;
    zi["天相"] = tianfuPal + 4;
    zi["天梁"] = tianfuPal + 5;
    zi["七杀"] = tianfuPal + 6;
    zi["破军"] = tianfuPal + 10;
    // 8. 禄存/擎羊/陀罗
    const LUCUN = { "甲":"寅","乙":"卯","丙":"巳","丁":"午","戊":"巳","己":"午","庚":"申","辛":"酉","壬":"亥","癸":"子" };
    const luPal = pIdx(LUCUN[yearGan]);
    // 9. 天马（年支三合）
    const zG = PAL.indexOf(yearZhi) % 4; // 子0 辰4 申8→0
    const TIANMA = ["寅", "亥", "申", "巳"]; // 申子辰→寅 巳酉丑→亥 寅午戌→申 亥卯未→巳
    const maPal = pIdx(TIANMA[zG]);
    // 10. 魁钺（天乙贵人位）
    const KUIYUE = { "甲":["丑","未"],"戊":["丑","未"],"庚":["丑","未"],"乙":["子","申"],"己":["子","申"],
      "丙":["亥","酉"],"丁":["亥","酉"],"壬":["卯","巳"],"癸":["卯","巳"],"辛":["午","寅"] };
    // 11. 昌曲辅弼
    const wcPal = pIdx("戌") - hOff;              // 文昌：戌起子时逆数
    const wqPal = pIdx("辰") + hOff;              // 文曲：辰起子时顺数
    const zfPal = pIdx("辰") + (lunarMonth - 1);  // 左辅：辰起顺数月
    const ybPal = pIdx("戌") - (lunarMonth - 1);  // 右弼：戌起逆数月
    // 12. 火铃
    // 火铃按 pIdx%4 分组：0寅午戌 1亥卯未 2申子辰 3巳酉丑
    const zG4 = pIdx(yearZhi) % 4;
    const HUO_START = ["丑", "酉", "寅", "卯"];
    const LING_START = ["卯", "戌", "戌", "戌"];
    const huoPal = pIdx(HUO_START[zG4]) + hOff;
    const lingPal = pIdx(LING_START[zG4]) + hOff;
    // 13. 空劫
    const kongPal = pIdx("亥") - hOff;   // 地空：亥起逆数时
    const jiePal = pIdx("亥") + hOff;    // 地劫：亥起顺数时
    // 14. 四化
    const SIHUA = {
      "甲": { "廉贞": "禄", "破军": "权", "武曲": "科", "太阳": "忌" },
      "乙": { "天机": "禄", "天梁": "权", "紫微": "科", "太阴": "忌" },
      "丙": { "天同": "禄", "天机": "权", "文昌": "科", "廉贞": "忌" },
      "丁": { "太阴": "禄", "天同": "权", "天机": "科", "巨门": "忌" },
      "戊": { "贪狼": "禄", "太阴": "权", "右弼": "科", "天机": "忌" },
      "己": { "武曲": "禄", "贪狼": "权", "天梁": "科", "文曲": "忌" },
      "庚": { "太阳": "禄", "武曲": "权", "太阴": "科", "天同": "忌" },
      "辛": { "巨门": "禄", "太阳": "权", "文曲": "科", "文昌": "忌" },
      "壬": { "天梁": "禄", "紫微": "权", "左辅": "科", "武曲": "忌" },
      "癸": { "破军": "禄", "巨门": "权", "太阴": "科", "贪狼": "忌" },
    };
    const sihua = SIHUA[yearGan];
    // 15. 十二宫名（命宫起逆布）
    const GONG = ["命宫","兄弟","夫妻","子女","财帛","疾厄","迁移","交友","官禄","田宅","福德","父母"];
    const gongName = {};
    for (let i = 0; i < 12; i++) gongName[(mingPal - i + 12) % 12] = GONG[i];
    // 16. 宫干：五虎遁全盘
    const gongGan = {};
    for (let i = 0; i < 12; i++) gongGan[i] = GAN[(GAN.indexOf(startGan) + i) % 10] + PAL[i];
    // 17. 大限：阳男阴女顺行，阴男阳女逆行；起限岁 = 局数
    const yangYear = GAN.indexOf(yearGan) % 2 === 0;
    const male = gender === 1;
    const forward = (yangYear && male) || (!yangYear && !male);
    const daxian = [];
    for (let i = 0; i < 12; i++) {
      const p = ((mingPal + (forward ? i : -i)) % 12 + 12) % 12;
      daxian.push({ palace: p, from: ju + i * 10, to: ju + i * 10 + 9 });
    }
    // 星曜落宫汇总
    const starMap = {};
    const put = (name, pal) => {
      const p = ((pal % 12) + 12) % 12;
      (starMap[p] = starMap[p] || []).push(name + (sihua[name] ? "（化" + sihua[name] + "）" : ""));
    };
    Object.keys(zi).forEach(k => put(k, zi[k]));
    put("禄存", luPal); put("擎羊", luPal + 1); put("陀罗", luPal - 1);
    put("天马", maPal);
    put("天魁", pIdx(KUIYUE[yearGan][0])); put("天钺", pIdx(KUIYUE[yearGan][1]));
    put("文昌", wcPal); put("文曲", wqPal);
    put("左辅", zfPal); put("右弼", ybPal);
    put("火星", huoPal); put("铃星", lingPal);
    put("地空", kongPal); put("地劫", jiePal);

    return { mingPal, shenPal, mingGanZhi, nayin, wx, ju, starMap, gongName, gongGan, daxian, forward, sihua, yearGan, yearZhi, lunarMonth, lunarDay, hourZhi, gender };
  }

  const GAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  root.ZiWei = { anXing, PAL };
  // 暴露内部表供测试
  root.__ZW = { JIAZI, WUHU: { "甲":"丙","己":"丙","乙":"戊","庚":"戊","丙":"庚","辛":"庚","丁":"壬","壬":"壬","戊":"甲","癸":"甲" } };
})(typeof window !== "undefined" ? window : globalThis);
