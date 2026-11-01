/**
 * 紫微斗数安星验证（Node）
 */
"use strict";
const L = require("../lunar.js");
require("../ziwei-core.js");
ZiWeiInit(L);
const ZW = globalThis.ZiWei, __ZW = globalThis.__ZW;

let pass = 0, fail = 0;
function check(name, actual, expect){
  const ok = JSON.stringify(actual) === JSON.stringify(expect);
console.log(`${ok ? "✅" : "❌"} ${name}`);
  if (!ok){ console.log(`   期望: ${JSON.stringify(expect)}`); console.log(`   实际: ${JSON.stringify(actual)}`); fail++; }
  else pass++;
}
// 宫支序（0=寅）
const PAL = ["寅","卯","辰","巳","午","未","申","酉","戌","亥","子","丑"];

/** 经典「紫微在子」盘十四主星布局（斗数全书标准盘） */
function starsAt(chart){
  const m = {};
  for (const [p, stars] of Object.entries(chart.starMap)){
    stars.forEach(s => m[s.replace(/（化.）$/,"")] = PAL[+p]);
  }
  return m;
}

/* 1. 起紫微借数法：与斗数全书紫微星曜表对轴 */
{
  const an = (ju, d) => {
    const n = Math.ceil(d / ju), j = ju * n - d;
    return ((n - 1 + (j % 2 === 0 ? j : -j)) % 12 + 12) % 12;
  };
  // 水二局：初一丑 初二寅 初三寅 初四卯 初五卯 初六辰 初七辰 初九巳
  check("水二局 1/2/3/4/9 日紫微宫", [1,2,3,4,9].map(d=>PAL[an(2,d)]), ["丑","寅","寅","卯","巳"]);
  // 木三局：初一辰 初二丑 初三寅 初四巳 初五寅 初六卯 初七午 初八卯 初九辰
  check("木三局 1/2/3/4/5/7/8 日紫微宫", [1,2,3,4,5,7,8].map(d=>PAL[an(3,d)]), ["辰","丑","寅","巳","寅","午","卯"]);
  // 土五局：初一午 初二亥 初三辰 初四丑 初五寅 初六未 初七子 初八巳
  check("土五局 1/2/3/4/5/6/7/8 日紫微宫", [1,2,3,4,5,6,7,8].map(d=>PAL[an(5,d)]), ["午","亥","辰","丑","寅","未","子","巳"]);
}

/* 2. 命宫身宫手算：1990-05-28（农历五月初五? 用农历五月/午时抽象测试） */
{
  // 五月（月宫=午=idx4）、午时（时序6）：命宫=4-6=子(idx10)，身宫=4+6=子
  const chart = ZW.anXing("庚","午",5,15,"午",1);
  check("五月午时命宫 = 子", PAL[chart.mingPal], "子");
  check("五月午时身宫 = 子", PAL[chart.shenPal], "子");
  // 命宫干：庚年五虎遁（乙庚戊为头）→ 寅戊卯己辰庚巳辛午壬未癸申甲酉乙戌丙亥丁子戊丑己
  check("命宫干支 = 戊子", chart.mingGanZhi, "戊子");
  check("五行局：戊子纳音霹雳火 → 火六局", [chart.wx, chart.ju], ["火", 6]);
}

/* 3. 经典紫微在子盘：十四主星方位 */
{
  // 紫微在子 → 天机亥 太阳酉 武曲申 天同未 廉贞辰；天府辰 太阴巳 贪狼午 巨门未 天相申 天梁酉 七杀戌 破军寅
  const chart = ZW.anXing("庚","午",5,19,"午",1); // 命宫子·戊子·火六局；生日19: n=4,j=5奇逆 → 寅+3-5=子
  const m = starsAt(chart);
  check("紫微在子", m["紫微"], "子");
  check("天机在亥", m["天机"], "亥");
  check("太阳在酉", m["太阳"], "酉");
  check("武曲在申", m["武曲"], "申");
  check("天同在未", m["天同"], "未");
  check("廉贞在辰", m["廉贞"], "辰");
  check("天府在辰（紫微子/天府辰同宫廉贞）", m["天府"], "辰");
  check("太阴在巳", m["太阴"], "巳");
  check("贪狼在午", m["贪狼"], "午");
  check("巨门在未（与天同同宫）", m["巨门"], "未");
  check("天相在申", m["天相"], "申");
  check("天梁在酉", m["天梁"], "酉");
  check("七杀在戌", m["七杀"], "戌");
  check("破军在寅", m["破军"], "寅");
}

/* 4. 四化表全查 */
{
  const SI = globalThis.ZiWei;
  const cases = [
    ["甲", { "廉贞":"禄","破军":"权","武曲":"科","太阳":"忌" }],
    ["乙", { "天机":"禄","天梁":"权","紫微":"科","太阴":"忌" }],
    ["庚", { "太阳":"禄","武曲":"权","太阴":"科","天同":"忌" }],
    ["癸", { "破军":"禄","巨门":"权","太阴":"科","贪狼":"忌" }],
  ];
  for (const [g, exp] of cases){
    const c = ZW.anXing(g, "子", 1, 1, "子", 1);
    check(`${g}干四化`, c.sihua, exp);
  }
}

/* 5. 十二宫名逆布 */
{
  const c = ZW.anXing("庚","午",5,15,"午",1);
  check("命宫在子", PAL[c.mingPal]==="子" && c.gongName[c.mingPal], "命宫");
  check("兄弟宫在亥（逆布）", c.gongName[9], "兄弟");
  check("父母宫在丑", c.gongName[11], "父母");
}

/* 6. 大限方向：阳男顺行 */
{
  const maleYang = ZW.anXing("庚","午",5,15,"午",1);   // 庚阳干男 → 顺行
  check("阳男大限顺行（第二限父母宫丑）", PAL[maleYang.daxian[1].palace], "丑");
  check("起限岁 = 局数（火六局6岁起）", maleYang.daxian[0].from, 6);
  const femYin = ZW.anXing("癸","卯",5,15,"午",0);      // 癸阴干女 → 阴女顺行
  check("阴女亦顺行", PAL[femYin.daxian[1].palace], "丑");
  const maleYin = ZW.anXing("癸","卯",5,15,"午",1);     // 阴男 → 逆行
  check("阴男大限逆行（第二限兄弟宫亥）", PAL[maleYin.daxian[1].palace], "亥");
}

/* 7. 禄存擎羊陀罗 */
{
  const c = ZW.anXing("甲","子",1,1,"子",1);
  const m = starsAt(c);
  check("甲年禄存在寅、擎羊卯、陀罗丑", [m["禄存"], m["擎羊"], m["陀罗"]], ["寅","卯","丑"]);
}

/* 8. 火星铃星起宫诀对轴 */
{
  const c1 = ZW.anXing("庚","午",1,1,"子",1);
  const m1 = starsAt(c1);
  check("午年子时 火星在丑 铃星在卯", [m1["火星"], m1["铃星"]], ["丑", "卯"]);
  const c2 = ZW.anXing("甲","子",1,1,"午",1);
  const m2 = starsAt(c2);
  check("子年午时 火星在申 铃星在辰（起宫后顺数午位）", [m2["火星"], m2["铃星"]], ["申", "辰"]);
}

/* 9. 命主身主与长生十二神 */
{
  const c = ZW.anXing("庚", "午", 5, 5, "午", 1); // 五月初五午时：命宫子 火六局 阳男
  check("命宫子 → 命主贪狼", c.mingZhu, "贪狼");
  check("午年 → 身主火星", c.shenZhu, "火星");
  check("火六局长生起寅", PAL.findIndex((z2, i) => c.csMap[i] === "长生"), 0);
  check("阳男顺行：卯沐浴", c.csMap[1], "沐浴");
  check("命宫子(寅起第9位) = 胎", c.csMap[c.mingPal], "胎");
  // 阳女逆行（庚阳干+女）：火六局长生寅起逆数，丑第11位 = 沐浴
  const c2 = ZW.anXing("庚", "午", 5, 5, "午", 0);
  check("阳女逆行：丑第11位 = 沐浴", c2.csMap[11], "沐浴");
}

console.log(`\n════════ 结果: ${pass} 通过, ${fail} 失败 ════════`);
process.exit(fail ? 1 : 0);
