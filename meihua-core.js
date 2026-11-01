/**
 * 梅花易数核心（时间起卦 / 数字起卦 / 体用互变）
 */
(function (root) {
  "use strict";
  const TRIG = root.TRIGRAM, HEXA = root.HEXA, XU64 = root.XU64;
  const ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];

  /** 年支序：子1 ~ 亥12；时辰序：子1 ~ 亥12 */
  const zhiOrd = z => ZHI.indexOf(z) + 1;
  const mod8 = n => ((n - 1) % 8) + 1;   // 1~8
  const mod6 = n => ((n - 1) % 6) + 1;   // 1~6

  /** 时间起卦：农历年支序+月+日 取上卦，加时辰序取下卦，总和取动爻 */
  function shiJianQiGua(yearZhi, lunarMonth, lunarDay, hourZhi) {
    const a = zhiOrd(yearZhi) + lunarMonth + lunarDay;
    const b = a + zhiOrd(hourZhi);
    return build(a, b, b);
  }

  /** 数字起卦：数一取上卦，数二取下卦，两数之和加时辰序取动爻 */
  function shuZiQiGua(n1, n2, hourZhi) {
    const a = n1, b = n2, c = n1 + n2 + zhiOrd(hourZhi);
    return build(a, b, c);
  }

  function build(a, b, c) {
    const up = mod8(a), low = mod8(b), dong = mod6(c);
    const lines = [...TRIG[low].lines, ...TRIG[up].lines];
    const l3 = lines.slice(0,3).join(""), u3 = lines.slice(3,6).join("");
    const lower = +Object.keys(TRIG).find(k => TRIG[k].lines.join("") === l3);
    const upper = +Object.keys(TRIG).find(k => TRIG[k].lines.join("") === u3);
    const name = HEXA[upper][lower];
    const bianLines = lines.map((v, i) => i === dong - 1 ? 1 - v : v);
    const bl3 = bianLines.slice(0,3).join(""), bu3 = bianLines.slice(3,6).join("");
    const bLower = +Object.keys(TRIG).find(k => TRIG[k].lines.join("") === bl3);
    const bUpper = +Object.keys(TRIG).find(k => TRIG[k].lines.join("") === bu3);
    const hu = [lines[1],lines[2],lines[3],lines[2],lines[3],lines[4]];
    const hl3 = hu.slice(0,3).join(""), hu3 = hu.slice(3,6).join("");
    const hLower = +Object.keys(TRIG).find(k => TRIG[k].lines.join("") === hl3);
    const hUpper = +Object.keys(TRIG).find(k => TRIG[k].lines.join("") === hu3);
    return {
      up, low, dong, name, xu: XU64.indexOf(name) + 1,
      yong: dong <= 3 ? "下" : "上",     // 动爻所在卦为用，另一卦为体
      bian: HEXA[bUpper][bLower],
      hu: HEXA[hUpper][hLower],
    };
  }

  /** 体用生克断 */
  function tiYongDuan(bodyWx, useWx) {
    const SHENG = { "木":"水","火":"木","土":"火","金":"土","水":"金" }; // 值生键
    const KE = { "木":"土","土":"水","水":"火","火":"金","金":"木" };     // 值所克
    if (bodyWx === useWx) return { ji: 2, txt: "体用比和，吉。同气相求，事多顺遂。" };
    if (SHENG[bodyWx] === useWx) return { ji: 3, txt: "用生体，大吉。有进益之喜，得人相助。" };
    if (KE[bodyWx] === useWx) return { ji: 1, txt: "体克用，小吉。事可为但费力，所求可得。" };
    if (SHENG[useWx] === bodyWx) return { ji: 0, txt: "体生用，泄气。有耗损之虞，事多耗费。" };
    if (KE[useWx] === bodyWx) return { ji: -1, txt: "用克体，凶。事多阻逆，宜守不宜进。" };
    return { ji: 0, txt: "—" };
  }

  /** 八卦万物类象（简表） */
  const LEIXIANG = {
    1: { name:"乾", wx:"金", xiang:"天", ren:"父/首领/长者", shen:"首", dong:"马", shi:"晴/冰", wu:"金玉/圆物/果" },
    2: { name:"兑", wx:"金", xiang:"泽", ren:"少女/悦者/巫", shen:"口舌/肺", dong:"羊", shi:"雨泽/新星", wu:"口器/毁折之物" },
    3: { name:"离", wx:"火", xiang:"火", ren:"中女/文人/目疾者", shen:"目/心", dong:"雉", shi:"晴/炎", wu:"文书/灯/干燥物" },
    4: { name:"震", wx:"木", xiang:"雷", ren:"长男/行者", shen:"足/肝", dong:"龙", shi:"雷/春", wu:"草木/乐器/竹" },
    5: { name:"巽", wx:"木", xiang:"风", ren:"长女/商旅", shen:"股/气", dong:"鸡", shi:"风/春夏", wu:"绳直/木香/帆" },
    6: { name:"坎", wx:"水", xiang:"水", ren:"中男/盗/病者", shen:"耳/肾/血", dong:"猪", shi:"雨/月/冬", wu:"酒水/轮/卵" },
    7: { name:"艮", wx:"土", xiang:"山", ren:"少男/僧道/守者", shen:"手/背/骨", dong:"狗/鼠", shi:"雾/山岚", wu:"土石/门阙/瓜果" },
    8: { name:"坤", wx:"土", xiang:"地", ren:"母/众人/乡人", shen:"腹/脾", dong:"牛", shi:"阴云/郊野", wu:"布帛/方物/釜" },
  };

  root.MeiHua = { shiJianQiGua, shuZiQiGua, tiYongDuan, LEIXIANG };
})(typeof window !== "undefined" ? window : globalThis);
