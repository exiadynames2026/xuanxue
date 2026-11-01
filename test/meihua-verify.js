/**
 * 梅花易数验证（Node）
 */
"use strict";
require("../tieban-tiaowen.js");
const L = require("../lunar.js");
require("../meihua-core.js");
const M = globalThis.MeiHua;

let pass = 0, fail = 0;
function check(name, actual, expect){
  const ok = JSON.stringify(actual) === JSON.stringify(expect);
  console.log(`${ok ? "✅" : "❌"} ${name}`);
  if (!ok){ console.log(`   期望: ${JSON.stringify(expect)}`); console.log(`   实际: ${JSON.stringify(actual)}`); fail++; }
  else pass++;
}

/* 1. 时间起卦手算对轴：2024-08-23 17:00（农历七月二十，酉时） */
{
  const solar = L.Solar.fromYmdHms(2024, 8, 23, 17, 0, 0);
  const lunar = solar.getLunar();
  check("农历取数 = 辰年七月二十酉时",
    [lunar.getYearZhi(), Math.abs(lunar.getMonth()), lunar.getDay()], ["辰", 7, 20]);
  // 手算：辰5+7+20=32 → 32%8=0→8坤 上卦；(32+10)=42 → 42%8=2兑 下卦；42%6=0→6 动爻
  const g = M.shiJianQiGua("辰", 7, 20, "酉");
  check("上卦 = 坤(8)", g.up, 8);
  check("下卦 = 兑(2)", g.low, 2);
  check("动爻 = 6", g.dong, 6);
  check("本卦 = 地泽临", g.name, "地泽临");
  check("动爻在上卦 → 用为上卦", g.yong, "上");
  // 临六爻动：上爻坤[0,0,0]末爻变 → 上艮下兑 = 山泽损
  check("变卦 = 山泽损", g.bian, "山泽损");
  // 互卦：临二三四爻[1,0,0]震下、三四五爻[0,0,0]坤上 → 地雷复
  check("互卦 = 地雷复", g.hu, "地雷复");
}

/* 2. 数字起卦：7、8、午时 */
{
  const g = M.shuZiQiGua(7, 8, "午");
  // 7%8=7艮 上；8%8=8坤 下；(7+8+7)=22%6=4 动爻
  check("数起 7/8 午时：上艮下坤 动四", [g.up, g.low, g.dong], [7, 8, 4]);
  check("本卦 = 山地剥", g.name, "山地剥");
  check("动爻四在上卦 → 用为上卦", g.yong, "上");
  // 剥四爻动：六四阴变阳 → 下坤变震? 剥[0,0,0,0,0,1] idx3 flip → [0,0,0,1,0,1] → 下[0,0,0]坤 上[1,0,1]离 = 火地晋
  check("变卦 = 火地晋", g.bian, "火地晋");
}

/* 3. 体用生克五系 */
{
  const T = M.tiYongDuan;
  check("体金 用土 → 土生金 用生体大吉", T("金","土").ji, 3);
  check("体金 用木 → 金克木 体克用小吉", T("金","木").ji, 1);
  check("体金 用金 → 比和吉", T("金","金").ji, 2);
  check("体金 用水 → 金生水 体生用泄", T("金","水").ji, 0);
  check("体金 用火 → 火克金 用克体凶", T("金","火").ji, -1);
}

/* 4. 类象表完整性 */
check("八卦类象 8 条齐备", Object.keys(M.LEIXIANG).length, 8);
check("乾类象含天/父/首/马", [M.LEIXIANG[1].xiang, M.LEIXIANG[1].ren.includes("父"), M.LEIXIANG[1].shen, M.LEIXIANG[1].dong], ["天", true, "首", "马"]);

console.log(`\n════════ 结果: ${pass} 通过, ${fail} 失败 ════════`);
process.exit(fail ? 1 : 0);
