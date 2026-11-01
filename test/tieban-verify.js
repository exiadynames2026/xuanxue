/**
 * 铁板神数核心算法验证（Node）
 * 运行：node test/tieban-verify.js
 */
"use strict";
const { Solar, Lunar } = require("../lunar.js");
require("../tieban-tiaowen.js");
require("../tieban-core.js");
const G = globalThis;

let pass = 0, fail = 0;
function check(name, actual, expect){
  const ok = JSON.stringify(actual) === JSON.stringify(expect);
  console.log(`${ok ? "✅" : "❌"} ${name}`);
  if (!ok){ console.log(`   期望: ${JSON.stringify(expect)}`); console.log(`   实际: ${JSON.stringify(actual)}`); fail++; }
  else pass++;
}

/* 1. 太玄数表抽查 */
check("太玄数 甲=9 巳=4 戌=5", [G.TAI_XUAN["甲"], G.TAI_XUAN["巳"], G.TAI_XUAN["戌"]], [9, 4, 5]);
check("太玄数 覆盖 22 干支", Object.keys(G.TAI_XUAN).length, 22);

/* 2. 六十四卦名表：8×8 全覆盖且唯一 */
{
  const names = [];
  for (let u = 1; u <= 8; u++) for (let l = 1; l <= 8; l++) names.push(G.HEXA[u][l]);
  check("8×8 卦名表共 64 卦", names.length, 64);
  check("卦名无重复", new Set(names).size, 64);
  check("四正卦抽查", [G.HEXA[1][1], G.HEXA[8][8], G.HEXA[8][1], G.HEXA[1][8]], ["乾为天","坤为地","地天泰","天地否"]);
  check("水火既济/未济", [G.HEXA[6][3], G.HEXA[3][6]], ["水火既济","火水未济"]);
}

/* 3. 通行卦序 */
check("通行序 64 卦无重复", new Set(G.XU64).size, 64);
check("乾1 坤2 既济63 未济64", [G.XU64[0], G.XU64[1], G.XU64[62], G.XU64[63]], ["乾为天","坤为地","水火既济","火水未济"]);
check("卦名表与卦序表一致", new Set(G.XU64).size === 64 && G.XU64.every(n => Object.values(G.HEXA).some(r => r.includes(n))), true);

/* 4. 起卦手算对轴：1990-05-28 12:00（庚午 辛巳 癸巳 戊午） */
{
  const solar = Solar.fromYmdHms(1990, 5, 28, 12, 0, 0);
  const ec = solar.getLunar().getEightChar(); ec.setSect(2);
  const pillars = [
    { gan: ec.getYearGan(), zhi: ec.getYearZhi() },
    { gan: ec.getMonthGan(), zhi: ec.getMonthZhi() },
    { gan: ec.getDayGan(), zhi: ec.getDayZhi() },
    { gan: ec.getTimeGan(), zhi: ec.getTimeZhi() }
  ];
  check("对轴盘四柱 = 庚午/辛巳/癸巳/戊午",
    pillars.map(p => p.gan + p.zhi), ["庚午", "辛巳", "癸巳", "戊午"]);

  // 手算：天数 = 庚8+辛7+癸5+戊5 = 25；地数 = 午9+巳4+巳4+午9 = 26
  const g = G.qiGua(pillars);
  check("天数 = 25", g.tianSum, 25);
  check("地数 = 26", g.diSum, 26);
  check("上卦 = (25-1)%8+1 = 1 乾", g.upper, 1);
  check("下卦 = (26-1)%8+1 = 2 兑", g.lower, 2);
  check("动爻 = (51-1)%6+1 = 3", g.dong, 3);
  check("本卦 = 天泽履（通行第10卦）", [g.ben.name, g.ben.xu], ["天泽履", 10]);
  // 履卦爻画自下而上：下兑[1,1,0] + 上乾[1,1,1]
  check("履卦爻画 = [1,1,0,1,1,1]", g.ben.lines, [1,1,0,1,1,1]);
  // 三爻动（0→1）→ 六爻皆阳 → 乾为天（通行第1卦）
  check("变卦 = 乾为天（通行第1卦）", [g.bian.name, g.bian.xu], ["乾为天", 1]);
  // 互卦：二三四爻[1,0,1]离下，三四五爻[0,1,1]巽上 → 风火家人
  check("互卦 = 风火家人", g.hu.name, "风火家人");
  // 错卦六爻全变 → 下艮[0,0,1] 上坤[0,0,0] = 地山谦
  check("错卦 = 地山谦", g.cuo.name, "地山谦");
  // 综卦六爻颠倒 → 下乾上巽 = 风天小畜
  check("综卦 = 风天小畜", g.zong.name, "风天小畜");
}

/* 5. 起卦确定性：同盘重算一致 */
{
  const mk = () => {
    const ec = Solar.fromYmdHms(1985, 8, 20, 8, 30, 0).getLunar().getEightChar(); ec.setSect(2);
    return G.qiGua([{gan:ec.getYearGan(),zhi:ec.getYearZhi()},{gan:ec.getMonthGan(),zhi:ec.getMonthZhi()},{gan:ec.getDayGan(),zhi:ec.getDayZhi()},{gan:ec.getTimeGan(),zhi:ec.getTimeZhi()}]);
  };
  const a = mk(), b = mk();
  check("同盘两次起卦完全一致", JSON.stringify(a), JSON.stringify(b));
}

/* 6. 条文取数：确定性 + 边界 + 考刻差异 */
{
  const ec = Solar.fromYmdHms(1990, 5, 28, 12, 0, 0).getLunar().getEightChar(); ec.setSect(2);
  const ctx = G.qiGua([{gan:ec.getYearGan(),zhi:ec.getYearZhi()},{gan:ec.getMonthGan(),zhi:ec.getMonthZhi()},{gan:ec.getDayGan(),zhi:ec.getDayZhi()},{gan:ec.getTimeGan(),zhi:ec.getTimeZhi()}]);

  const t1 = G.pickTW("父母", 0, ctx, 0);
  const t2 = G.pickTW("父母", 0, ctx, 0);
  check("取数确定性：同参数同条文", t1, t2);

  // 八刻父母条文（相位 = 刻×3）互不相同，才能考刻
  const keTws = [];
  for (let k = 0; k < 8; k++) keTws.push(G.pickTW("父母", k*3, ctx, k).t);
  check("八刻父母条文互不相同（可考刻）", new Set(keTws).size, 8);

  // 各类取数都在库内
  const cats = Object.keys(G.TIAOWEN);
  let okBounds = true;
  for (const c of cats) for (let ph = 0; ph < 40; ph++){
    const t = G.pickTW(c, ph, ctx, 3);
    if (!G.TIAOWEN[c].includes(t)) { okBounds = false; break; }
  }
  check("8 类 × 40 相位取数全部落在库内", okBounds, true);

  // 相位扫描覆盖面：一类 40 相位应命中多条不同条文（不塌缩到单条）
  const distinct = new Set(Array.from({length:40},(_,ph)=>G.pickTW("运程",ph,ctx,0).t)).size;
  check("运程类 40 相位命中 ≥15 条不同条文", distinct >= 15, true);
}

/* 7. 考刻区间：keRange */
check("巳时 8 刻首刻 09:00–09:15", G.keRange(10, 0), "09:00–09:15");
check("巳时 8 刻末刻 10:45–11:00", G.keRange(10, 7), "10:45–11:00");
check("子时 23 点首刻 23:00–23:15", G.keRange(23, 0), "23:00–23:15");
check("子时 0 点首刻 23:00–23:15", G.keRange(0, 0), "23:00–23:15");
check("未时 14 点第 3 刻 13:45–14:00", G.keRange(14, 3), "13:45–14:00");
check("未时 14 点第 2 刻 13:30–13:45", G.keRange(14, 2), "13:30–13:45");

/* 8. 六十四卦断语全覆盖 */
{
  const names = [];
  for (let u = 1; u <= 8; u++) for (let l = 1; l <= 8; l++) names.push(G.HEXA[u][l]);
  const missing = names.filter(n => !G.GUA64_DING[n]);
  check("64 卦断语无缺失", missing.length, 0);
}

/* 9. 条文库结构：8 类、每类 ≥20 条、生肖标签覆盖 12 父肖 */
{
  const cats = Object.keys(G.TIAOWEN);
  check("条文 8 大类", cats.length, 8);
  check("每类 ≥ 20 条", cats.every(c => G.TIAOWEN[c].length >= 20), true);
  check("条文总数 ≥ 220", Object.values(G.TIAOWEN).reduce((a,b)=>a+b.length,0) >= 220, true);
  const fathers = new Set(G.TIAOWEN["父母"].filter(t=>t.father).map(t=>t.father));
  check("父母类生肖标签覆盖 12 生肖", fathers.size, 12);
}

console.log(`\n════════ 结果: ${pass} 通过, ${fail} 失败 ════════`);
process.exit(fail ? 1 : 0);
