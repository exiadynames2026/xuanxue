/**
 * 干支关系检测：天干五合、地支六合/六冲/相刑/相害、三合局、三会方
 * 浏览器与 Node 双端通用。
 */
(function (root) {
  "use strict";
  const GAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  const ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
  const idx = z => ZHI.indexOf(z);

  // 天干五合（含化气）
  const GAN_HE = { "甲":"己","己":"甲","乙":"庚","庚":"乙","丙":"辛","辛":"丙","丁":"壬","壬":"丁","戊":"癸","癸":"戊" };
  const GAN_HE_HUA = { "甲己":"土","乙庚":"金","丙辛":"水","丁壬":"木","戊癸":"火" };
  // 地支六合
  const ZHI_HE = { "子":"丑","丑":"子","寅":"亥","亥":"寅","卯":"戌","戌":"卯","辰":"酉","酉":"辰","巳":"申","申":"巳","午":"未","未":"午" };
  // 六冲
  const CHONG = i => ZHI[(i + 6) % 12];
  // 相害
  const ZHI_HAI = { "子":"未","未":"子","丑":"午","午":"丑","寅":"巳","巳":"寅","卯":"辰","辰":"卯","申":"亥","亥":"申","酉":"戌","戌":"酉" };
  // 相刑组
  const XING_GROUPS = [["寅","巳","申"],["丑","戌","未"],["子","卯"],["辰"],["午"],["酉"],["亥"]];
  // 三合局
  const SANHE = [ { g:["申","子","辰"], hua:"水局" }, { g:["寅","午","戌"], hua:"火局" }, { g:["巳","酉","丑"], hua:"金局" }, { g:["亥","卯","未"], hua:"木局" } ];
  // 三会方
  const SANHUI = [ { g:["寅","卯","辰"], fang:"东方木" }, { g:["巳","午","未"], fang:"南方火" }, { g:["申","酉","戌"], fang:"西方金" }, { g:["亥","子","丑"], fang:"北方水" } ];

  /**
   * 检测四柱干支关系
   * @param arr [{label:"年柱", gan:"甲", zhi:"子"}, ...]
   * @returns {list: [{type, a, b, desc}]}
   */
  function detect(arr) {
    const out = [];
    const push = (type, desc) => out.push({ type, desc });
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const A = arr[i], B = arr[j];
        const tag = A.label + B.label;
        // 天干五合
        if (GAN_HE[A.gan] === B.gan) {
          const key = [A.gan, B.gan].sort ? GAN_HE_HUA[A.gan + B.gan] || GAN_HE_HUA[B.gan + A.gan] : "";
          push("天干五合", `${tag} ${A.gan}${B.gan}合（化${key}）`);
        }
        const a = idx(A.zhi), b = idx(B.zhi);
        // 六合
        if (ZHI_HE[A.zhi] === B.zhi) push("地支六合", `${tag} ${A.zhi}${B.zhi}合`);
        // 六冲
        if (CHONG(a) === B.zhi) push("六冲", `${tag} ${A.zhi}${B.zhi}冲`);
        // 相害
        if (ZHI_HAI[A.zhi] === B.zhi) push("相害", `${tag} ${A.zhi}${B.zhi}相害`);
        // 相刑（二支成刑：子卯、寅巳、巳申、丑戌、戌未；同支唯自刑组辰午酉亥另行判定）
        if (A.zhi !== B.zhi && XING_GROUPS.some(g => g.includes(A.zhi) && g.includes(B.zhi) && g.length > 1))
          push("相刑", `${tag} ${A.zhi}${B.zhi}相刑`);
      }
    }
    // 三合局 / 半合（含月支优先提示省略，仅报组合）
    const zhis = arr.map(p => p.zhi);
    SANHE.forEach(({ g, hua }) => {
      const hit = g.filter(z => zhis.includes(z));
      if (hit.length === 3) push("三合局", `${g.join("")}三合${hua}（${arr.filter(p=>g.includes(p.zhi)).map(p=>p.label).join("、")}）`);
      else if (hit.length === 2) push("半合", `${hit.join("")}半合${hua.replace("局","")}（缺${g.find(z=>!hit.includes(z))}）`);
    });
    // 三会
    SANHUI.forEach(({ g, fang }) => {
      const hit = g.filter(z => zhis.includes(z));
      if (hit.length === 3) push("三会方", `${g.join("")}三会${fang}（${arr.filter(p=>g.includes(p.zhi)).map(p=>p.label).join("、")}）`);
    });
    // 自刑
    arr.forEach(p => { if (["辰","午","酉","亥"].includes(p.zhi)) push("自刑", `${p.label} ${p.zhi}自刑`); });
    return out;
  }

  root.GzRelations = { detect, GAN_HE, ZHI_HE, ZHI_HAI, XING_GROUPS, SANHE, SANHUI };
})(typeof window !== "undefined" ? window : globalThis);
