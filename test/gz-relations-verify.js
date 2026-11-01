/**
 * 干支关系检测验证（Node）
 */
"use strict";
require("../gz-relations.js");
const GR = globalThis.GzRelations;

let pass = 0, fail = 0;
function check(name, actual, expect){
  const ok = JSON.stringify(actual) === JSON.stringify(expect);
  console.log(`${ok ? "✅" : "❌"} ${name}`);
  if (!ok){ console.log(`   期望: ${JSON.stringify(expect)}`); console.log(`   实际: ${JSON.stringify(actual)}`); fail++; }
  else pass++;
}
function descs(rels){ return rels.map(r => r.type + ":" + r.desc); }

/* 1. 天干五合（含化气） */
{
  const r = GR.detect([
    { label: "年柱", gan: "甲", zhi: "子" },
    { label: "月柱", gan: "己", zhi: "丑" },
  ]);
  check("甲己年月合（化土）", r.some(x => x.type === "天干五合" && x.desc.includes("甲己合（化土）")), true);
  check("子丑年月六合", r.some(x => x.type === "地支六合" && x.desc.includes("子丑合")), true);
}

/* 2. 六冲与相害 */
{
  const r = GR.detect([
    { label: "年柱", gan: "甲", zhi: "子" },
    { label: "日柱", gan: "庚", zhi: "午" },
  ]);
  check("子午年日六冲", r.some(x => x.type === "六冲" && x.desc.includes("年柱日柱")), true);
  const r2 = GR.detect([
    { label: "年柱", gan: "甲", zhi: "子" },
    { label: "日柱", gan: "庚", zhi: "未" },
  ]);
  check("子未相害", r2.some(x => x.type === "相害" && x.desc.includes("子未")), true);
}

/* 3. 三合局与三会方 */
{
  const r = GR.detect([
    { label: "年柱", gan: "甲", zhi: "申" },
    { label: "月柱", gan: "丙", zhi: "子" },
    { label: "日柱", gan: "戊", zhi: "辰" },
  ]);
  check("申子辰三合水局", r.some(x => x.type === "三合局" && x.desc.includes("水局")), true);
  const r2 = GR.detect([
    { label: "年柱", gan: "甲", zhi: "寅" },
    { label: "月柱", gan: "丙", zhi: "卯" },
    { label: "日柱", gan: "戊", zhi: "辰" },
  ]);
  check("寅卯辰三会东方木", r2.some(x => x.type === "三会方" && x.desc.includes("东方木")), true);
  const r3 = GR.detect([
    { label: "年柱", gan: "甲", zhi: "申" },
    { label: "日柱", gan: "戊", zhi: "子" },
  ]);
  check("申子半合（缺辰）", r3.some(x => x.type === "半合"), true);
}

/* 4. 相刑与自刑 */
{
  const r = GR.detect([
    { label: "年柱", gan: "甲", zhi: "寅" },
    { label: "月柱", gan: "丙", zhi: "巳" },
    { label: "日柱", gan: "戊", zhi: "申" },
  ]);
  check("寅巳申三支相刑（至少两条）", r.filter(x => x.type === "相刑").length >= 2, true);
  const r2 = GR.detect([
    { label: "日柱", gan: "戊", zhi: "辰" },
  ]);
  check("辰自刑", r2.some(x => x.type === "自刑" && x.desc.includes("辰自刑")), true);
  const r3 = GR.detect([{ label: "年柱", gan: "甲", zhi: "卯" }, { label: "日柱", gan: "庚", zhi: "子" }]);
  check("子卯相刑", r3.some(x => x.type === "相刑"), true);
}

/* 5. 无关系盘面 */
{
  const r = GR.detect([
    { label: "年柱", gan: "甲", zhi: "戌" },
    { label: "月柱", gan: "丙", zhi: "寅" },
    { label: "日柱", gan: "庚", zhi: "午" },
  ]);
  // 寅午戌三合火局会命中！改查：应只有三合局，无六冲六合
  check("寅午戌三合火局", r.some(x => x.type === "三合局" && x.desc.includes("火局")), true);
  check("无六冲", r.some(x => x.type === "六冲"), false);
  check("无六合", r.some(x => x.type === "地支六合"), false);
}

console.log(`\n════════ 结果: ${pass} 通过, ${fail} 失败 ════════`);
process.exit(fail ? 1 : 0);
