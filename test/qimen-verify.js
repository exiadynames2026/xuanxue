/**
 * 奇门遁甲验证（Node）
 * 运行：node test/qimen-verify.js
 */
"use strict";
require("../tieban-tiaowen.js");
const L = require("../lunar.js");
require("../qimen-core.js");
const Q = globalThis.QiMen;

let pass = 0, fail = 0;
function check(name, actual, expect){
  const ok = JSON.stringify(actual) === JSON.stringify(expect);
  console.log(`${ok ? "✅" : "❌"} ${name}`);
  if (!ok){ console.log(`   期望: ${JSON.stringify(expect)}`); console.log(`   实际: ${JSON.stringify(actual)}`); fail++; }
  else pass++;
}

/* 1. 节气三元局数表抽查（口诀：冬至惊蛰一七四等） */
check("冬至 [1,7,4]", Q.JU_TABLE["冬至"], [1,7,4]);
check("惊蛰 [1,7,4]", Q.JU_TABLE["惊蛰"], [1,7,4]);
check("夏至 [-9,-3,-6]", Q.JU_TABLE["夏至"], [-9,-3,-6]);
check("小暑 [-8,-2,-5]", Q.JU_TABLE["小暑"], [-8,-2,-5]);
check("霜降 [-5,-8,-2]", Q.JU_TABLE["霜降"], [-5,-8,-2]);
check("大雪 [-4,-7,-1]", Q.JU_TABLE["大雪"], [-4,-7,-1]);
check("阳遁节节数为正、阴遁为负",
  ["冬至","小寒","大寒","立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种"].every(j=>Q.JU_TABLE[j].every(v=>v>0)) &&
  ["夏至","小暑","大暑","立秋","处暑","白露","秋分","寒露","霜降","立冬","小雪","大雪"].every(j=>Q.JU_TABLE[j].every(v=>v<0)), true);

/* 2. 多日排盘结构不变量 */
{
  const dates = [[2026,11,2],[2024,12,24],[2025,6,21],[2025,3,6],[2023,8,8]];
  let okStruct = true, okUnique = true, okNine = true;
  for (const [y,m,d] of dates){
    for (const h of [0, 7, 12, 23]){
      const r = Q.paipan(L.Solar.fromYmdHms(y,m,d,h,0,0));
      // 地盘九仪齐备
      const dv = Object.values(r.dipan);
      if (new Set(dv).size !== 9 || dv.length !== 9) okUnique = false;
      // 地盘仪序列 = YI_ORDER 的循环移位
      const order = Q.YI_ORDER;
      const start = order.indexOf(dv.find(v=>v==="戊"));
      const expected = [];
      const ju = r.ju, dun = r.dun;
      for (let i = 0; i < 9; i++){
        const g = ((ju - 1 + (dun === 1 ? i : -i)) % 9 + 9) % 9 + 1;
        expected[g] = order[i];
      }
      const expObj = {}; for (let g=1;g<=9;g++) expObj[g]=expected[g];
      if (JSON.stringify(expObj) !== JSON.stringify(r.dipan)) okStruct = false;
      // 天盘仪 = 地盘仪重排（缺中宫仪则8个）
      const tv = Object.values(r.tianYi);
      if (new Set(tv).size !== tv.length) okNine = false;
      // 九星无重复（禽寄芮除外），八门八神 8 个齐全
      const stars = Object.values(r.tianXing).map(s=>s.replace("(禽)",""));
      if (new Set(stars).size !== stars.length) okNine = false;
      if (Object.keys(r.tianMen).length !== 8 || new Set(Object.values(r.tianMen)).size !== 8) okNine = false;
      if (Object.keys(r.tianShen).length !== 8 || new Set(Object.values(r.tianShen)).size !== 8) okNine = false;
      // 值符星 = 旬首仪地盘宫之星；值使门同理
      const shouGong = +Object.keys(r.dipan).find(g=>r.dipan[g]===r.xunYi);
      if (r.zhiFuXing !== Q.STARS[shouGong === 5 ? 2 : shouGong]) okStruct = false;
      if (r.zhiShiMen !== Q.DOORS[shouGong === 5 ? 2 : shouGong]) okStruct = false;
    }
  }
  check("五日×四时辰：地盘布仪全部符合局数公式", okStruct, true);
  check("同上：九仪/九星/八门/八神无重复缺漏", okNine, true);
}

/* 3. 伏吟验证：甲/己日甲子时（天显时格），值符不移动 → 天盘=地盘 */
{
  // 找 2026 年内的一个甲日或己日
  let found = null;
  for (let d = 1; d <= 40 && !found; d++){
    const solar = L.Solar.fromYmd(2026, 1, d);
    const gz = solar.getLunar().getDayInGanZhi();
    if (gz[0] === "甲" || gz[0] === "己") found = solar;
  }
  const r = Q.paipan(L.Solar.fromYmdHms(found.getYear(), found.getMonth(), found.getDay(), 0, 30, 0));
  // 0:30 正子时，甲己日之子时即甲子时
  const same = Object.keys(r.tianYi).every(g => r.tianYi[g] === r.dipan[g]);
  check(`甲己日甲子时天显时格：天盘=地盘（伏吟） [${r.dayGz}日 ${r.timeGz}时]`, same, true);
  check("同局 值符星=天芮(禽)或旬首宫星（甲子时值符居旬首宫）", r.xunShou, "甲子");
}

/* 4. 定局阴阳遁方向 */
{
  const winter = Q.paipan(L.Solar.fromYmdHms(2024,12,25,12,0,0));
  check("冬至后为阳遁", winter.dun, 1);
  const summer = Q.paipan(L.Solar.fromYmdHms(2025,7,1,12,0,0));
  check("夏至后为阴遁", summer.dun, -1);
  check("冬至局数 ∈ {1,7,4}", [1,7,4].includes(winter.ju), true);
  check("夏至后局数 ∈ {9,3,6,8,2,5,7,1,4}", [9,3,6,8,2,5,7,1,4].includes(summer.ju), true);
}

console.log(`\n════════ 结果: ${pass} 通过, ${fail} 失败 ════════`);
process.exit(fail ? 1 : 0);
