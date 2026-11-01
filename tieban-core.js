/**
 * 铁板神数 · 核心算法（河洛起卦 / 卦变 / 条文取数）
 * 浏览器与 Node 双端通用：依赖 tieban-tiaowen.js 提供的数据表。
 */
(function(root){
"use strict";
const TX = root.TAI_XUAN, TRIG = root.TRIGRAM, HEXA = root.HEXA,
      XU64 = root.XU64, TW = root.TIAOWEN;

/** 干支字符串的太玄数求和 */
root.taiXuanSum = function(str){ let s=0; for(const ch of str) s += (TX[ch]||0); return s; };

/** 上下卦先天数 → 六爻（自下而上：下卦三爻在前） */
root.linesOf = function(upper, lower){ return [...TRIG[lower].lines, ...TRIG[upper].lines]; };

/** 六爻（自下而上）→ 卦对象 {u,l,name,xu,lines} */
root.guaFromLines = function(lines){
  const l3 = lines.slice(0,3).join(""), u3 = lines.slice(3,6).join("");
  const lower = Object.keys(TRIG).find(k=>TRIG[k].lines.join("")===l3)*1;
  const upper = Object.keys(TRIG).find(k=>TRIG[k].lines.join("")===u3)*1;
  const name = HEXA[upper][lower];
  return { u: upper, l: lower, name, xu: XU64.indexOf(name)+1, lines: lines.slice() };
};

/** 互卦：二三四爻为下卦，三四五爻为上卦 */
root.huGua = function(lines){
  return root.guaFromLines([lines[1],lines[2],lines[3],lines[2],lines[3],lines[4]]);
};

/**
 * 河洛起卦：
 * 天数 = 四柱天干太玄数和 → 上卦 = (天数-1)%8+1
 * 地数 = 四柱地支太玄数和 → 下卦 = (地数-1)%8+1
 * 动爻 = (天数+地数-1)%6+1
 */
root.qiGua = function(pillars){
  const tianSum = pillars.reduce((a,p)=>a+root.taiXuanSum(p.gan),0);
  const diSum   = pillars.reduce((a,p)=>a+root.taiXuanSum(p.zhi),0);
  const upper = ((tianSum-1)%8)+1;
  const lower = ((diSum-1)%8)+1;
  const dong  = ((tianSum+diSum-1)%6)+1;
  const lines = root.linesOf(upper, lower);
  const ben  = root.guaFromLines(lines);
  const bian = root.guaFromLines(lines.map((v,i)=> i===dong-1 ? 1-v : v));
  const hu   = root.huGua(lines);
  const cuo  = root.guaFromLines(lines.map(v=>1-v));
  const zong = root.guaFromLines(lines.slice().reverse());
  const txYear = root.taiXuanSum(pillars[0].gan + pillars[0].zhi);
  return { tianSum, diSum, upper, lower, dong, ben, bian, hu, cuo, zong, txYear };
};

/**
 * 条文取数式（示例派，公式全部公开）：
 * 哈希 = 本卦通行序×131 + 变卦通行序×37 + 动爻×7
 *      + 年柱太玄数×11 + 相位×7 + 刻数×2 + 1013
 * 条文 = 条文库[类别][哈希 mod 该类条数]
 * 同盘同刻同相位恒取同条，完全确定；相位权重 7 与各类条数互质，
 * 保证相位扫描覆盖整类条文不塌缩。
 */
root.pickTW = function(cat, phase, guaCtx, k){
  const list = TW[cat];
  const h = guaCtx.ben.xu*131 + guaCtx.bian.xu*37 + guaCtx.dong*7
          + guaCtx.txYear*11 + (phase||0)*7 + (k||0)*2 + 1013;
  return list[((h % list.length)+list.length)%list.length];
};

/** 出生时辰内第 k 刻（0-7）的钟面区间，每刻 15 分钟，子时按 23:00 起算 */
root.keRange = function(hour, k){
  const zhiIdx = Math.floor(((hour+1)%24)/2);
  const startMin = zhiIdx===0 ? 23*60 : (zhiIdx*2-1)*60;
  const st = startMin + k*15;
  const fmt = x=>{ const m=((x%1440)+1440)%1440;
    return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0"); };
  return fmt(st)+"–"+fmt(st+15);
};
})(typeof window!=="undefined"?window:globalThis);
