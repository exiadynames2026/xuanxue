/**
 * 大六壬验证（Node）
 */
"use strict";
const L = require("../lunar.js");
require("../liuren-core.js");
const LR = globalThis.LiuRen, ZHI = LR ? null : null;
const Z = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];

let pass = 0, fail = 0;
function check(name, actual, expect){
  const ok = JSON.stringify(actual) === JSON.stringify(expect);
  console.log(`${ok ? "✅" : "❌"} ${name}`);
  if (!ok){ console.log(`   期望: ${JSON.stringify(expect)}`); console.log(`   实际: ${JSON.stringify(actual)}`); fail++; }
  else pass++;
}

/* 1. 月将：雨水后亥将 */
{
  const lunar = L.Solar.fromYmd(2025, 3, 10).getLunar(); // 雨水(2/18)后、春分(3/20)前
  const yj = LR.yueJiang(lunar);
  check("2025-03-10 月将 = 亥（雨水后）", yj.jiang, "亥");
  const lunar2 = L.Solar.fromYmd(2025, 12, 25).getLunar(); // 冬至(12/21中气)后 → 丑将
  const yj2 = LR.yueJiang(lunar2);
  check("2025-12-25 月将 = 丑（冬至中气后）", yj2.jiang, "丑");
}

/* 2. 天盘：亥将午时 → 天盘(地盘X) = 亥+(X-午) */
{
  const tian = LR.tianPan("亥", "午");
  check("天盘(午)=亥 月将加时", tian["午"], "亥");
  check("天盘(寅)=未", tian["寅"], "未");
  check("天盘(子)=巳", tian["子"], "巳");
  check("天盘(申)=丑", tian["申"], "丑");
}

/* 3. 手算对轴：甲子日 午时 亥将（找 2025-02-20~03-19 之间的甲子日） */
{
  let found = null;
  for (let d = 18; d <= 19 && !found; d++) {} // 占位
  for (let m = 2; m <= 3 && !found; m++) {
    const maxD = m === 2 ? 28 : 19;
    for (let d = (m === 2 ? 19 : 1); d <= maxD; d++) {
      const lunar = L.Solar.fromYmd(2025, m, d).getLunar();
      if (lunar.getDayInGanZhi() === "甲子") { found = L.Solar.fromYmd(2025, m, d); break; }
    }
  }
  if (!found) { console.log("⚠ 未找到甲子日测试窗，跳过手算对轴"); }
  else {
    const lunar = found.getLunar();
    const tian = LR.tianPan("亥", "午");
    const ke = LR.siKe("甲子", tian);
    // 手算四课：甲寄寅→天盘寅=未；未上=申；支子→巳；巳上=辰
    check("四课手算对轴（寅未/未子/子巳/巳戌）",
      ke.map(c => c.xia + c.shang), ["寅未", "未子", "子巳", "巳戌"]);
    const sc = LR.sanChuan("甲子", ke, tian);
    // 三贼（未、子、巳）：甲阳日仅子为阳 → 比用取子 → 初子 中巳 末戌
    check("甲子日午时亥将 三传门 = 比用", sc.men, "比用");
    check("三传 = 子 巳 戌", sc.chuan, ["子", "巳", "戌"]);
  }
}

/* 4. 伏吟：月将=时支（如 亥将亥时） */
{
  const tian = LR.tianPan("亥", "亥");
  const ke = LR.siKe("甲子", tian);
  const sc = LR.sanChuan("甲子", ke, tian);
  check("伏吟判定", sc.men, "伏吟");
  // 甲子日伏吟阳日：初=干上神=寅，中=寅刑巳，末=巳刑申
  check("伏吟三传 = 寅巳申（刑传）", sc.chuan, ["寅", "巳", "申"]);
}

/* 5. 返吟：月将=时支+6（如 亥将巳时） */
{
  const tian = LR.tianPan("亥", "巳");
  const ke = LR.siKe("甲子", tian);
  const sc = LR.sanChuan("甲子", ke, tian);
  // 甲子日返吟：课1 下寅木 上申金 金克木贼；课3 下子水 上午火 水克火贼 → 两贼，甲阳日，巳/午皆阴? 巳 idx5 阴、午 idx6 阳 → 比用取午
  check("返吟门", sc.men.startsWith("返吟"), true);
}

/* 6. 天将顺逆与贵人 */
{
  const tian = LR.tianPan("亥", "午");
  const tj = LR.tianJiang("甲子", tian, false);
  check("甲日昼贵 = 丑", tj.dayGui, "丑");
  // 昼贵丑临何位：天盘(X)=丑 → X = 丑-4? tian: 亥+(X-午)=丑 → X=申. 贵人临申 → 逆行
  check("昼贵落宫 = 申", tj.renGong, "申");
  check("逆行", tj.forward, false);
  check("申位天将 = 贵人", tj.map["申"], "贵人");
  check("未位（顺下一位的逆）= 螣蛇", tj.map["未"], "螣蛇");
}

/* 7. 六亲 */
check("甲日（寄寅木）见子水 = 父母（水生木）", LR.liuQin("甲", "子"), "父母");
check("甲日见巳火 = 子孙（木生火）", LR.liuQin("甲", "巳"), "子孙");
check("甲日见申金 = 官鬼（金克木）", LR.liuQin("甲", "申"), "官鬼");

/* 8. 端到端：真实日期排盘结构完整 */
{
  const r = LR.paipan(L.Solar.fromYmdHms(2026, 11, 2, 12, 0, 0));
  check("端到端：三传三个地支", r.chuan.length === 3 && r.chuan.every(z => Z.includes(z)), true);
  check("端到端：四课四条", r.ke.length, 4);
  check("端到端：天将十二位齐", Object.keys(r.tj.map).length, 12);
  check("端到端：月将与中气对应", LR.ZHONGQI_JIANG[r.qi] === r.jiang && r.jiang.length === 1, true);
}

console.log(`\n════════ 结果: ${pass} 通过, ${fail} 失败 ════════`);
process.exit(fail ? 1 : 0);
