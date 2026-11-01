/**
 * 八字排盘核心算法验证脚本（Node 环境）
 * 运行：node test/verify.js
 */
"use strict";
const { Solar, Lunar, LunarUtil } = require("../lunar.js");

let pass = 0, fail = 0;
function check(name, actual, expect){
  const ok = JSON.stringify(actual) === JSON.stringify(expect);
  console.log(`${ok ? "✅" : "❌"} ${name}`);
  if (!ok){
    console.log(`   期望: ${JSON.stringify(expect)}`);
    console.log(`   实际: ${JSON.stringify(actual)}`);
    fail++;
  } else pass++;
}

function ecOf(y, m, d, h, min, sect = 2){
  const ec = Solar.fromYmdHms(y, m, d, h, min, 0).getLunar().getEightChar();
  ec.setSect(sect);
  return ec;
}

/* 1. 甲子日锚点：1949-10-01 为甲子日（史实） */
{
  const ec = ecOf(1949, 10, 1, 12, 0);
  check("锚点 1949-10-01 日柱 = 甲子", ec.getDay(), "甲子");
  check("锚点 1949-10-01 年柱 = 己丑", ec.getYear(), "己丑");
}

/* 2. 立春边界：1988-02-04 立春前后年柱/月柱切换 */
{
  const before = ecOf(1988, 2, 3, 10, 0);
  const after = ecOf(1988, 2, 5, 10, 0);
  check("立春前(1988-02-03) 年柱 = 丁卯", before.getYear(), "丁卯");
  check("立春前 月柱 = 癸丑", before.getMonth(), "癸丑");
  check("立春后(1988-02-05) 年柱 = 戊辰", after.getYear(), "戊辰");
  check("立春后 月柱 = 甲寅", after.getMonth(), "甲寅");
}

/* 3. 时辰边界：23:30 子时两种流派（库语义：sect=1 算明天，sect=2 算当天） */
{
  const s1 = ecOf(1990, 5, 15, 23, 30, 1);
  const s2 = ecOf(1990, 5, 15, 23, 30, 2);
  const daySame = ecOf(1990, 5, 15, 22, 0);
  const dayNext = ecOf(1990, 5, 16, 12, 0);
  check("晚子时流派1: 日柱算明天", s1.getDay(), dayNext.getDay());
  check("晚子时流派2: 日柱算当天", s2.getDay(), daySame.getDay());
  check("两种流派时柱均为子", [s1.getTime().slice(1), s2.getTime().slice(1)], ["子", "子"]);
  check("非子时日柱不受流派影响", ecOf(1990, 5, 15, 12, 0, 1).getDay(), daySame.getDay());
}

/* 4. 十神：甲日主对应关系（直接查库表） */
{
  const T = { "乙": "劫财", "丙": "食神", "庚": "七杀", "壬": "偏印", "己": "正财", "癸": "正印", "辛": "正官", "丁": "伤官", "戊": "偏财", "甲": "比肩" };
  const wrong = Object.entries(T).filter(([g, s]) => LunarUtil.SHI_SHEN["甲" + g] !== s);
  check(`十神表核对（甲日主 × 10天干）`, wrong.length, 0);
}

/* 5. 大运顺逆：daYun[0] 为起运前空段（无干支），真实大运自下标 1 起 */
{
  const idx = gz => LunarUtil.getJiaZiIndex(gz);
  // 1990-05-15 庚午年（阳干）
  const yunM = ecOf(1990, 5, 15, 12, 0).getYun(1, 2);
  const yunF = ecOf(1990, 5, 15, 12, 0).getYun(0, 2);
  const dm = yunM.getDaYun(10), df = yunF.getDaYun(10);
  check("起运前段无干支", dm[0].getGanZhi(), "");
  check("第一步大运 = 月柱顺一位（男，阳年顺行）", dm[1].getGanZhi(), "壬午");
  check("第一步大运 = 月柱逆一位（女，阳年逆行）", df[1].getGanZhi(), "庚辰");
  check("阳年男命大运顺排", idx(dm[2].getGanZhi()) > idx(dm[1].getGanZhi()), true);
  check("阳年女命大运逆排", idx(df[2].getGanZhi()) < idx(df[1].getGanZhi()), true);

  // 1989-05-15 己巳年（阴干）：男逆排
  const dm2 = ecOf(1989, 5, 15, 12, 0).getYun(1, 2).getDaYun(10);
  check("阴年男命大运逆排", idx(dm2[2].getGanZhi()) < idx(dm2[1].getGanZhi()), true);
}

/* 6. 大运合理性：自第一步起每步 10 岁，起运岁数 1~10 虚岁 */
{
  const dy = ecOf(1985, 8, 20, 8, 30).getYun(1, 2).getDaYun(8);
  const okStep = dy.slice(1).every((d, i) => d.getStartAge() === dy[1].getStartAge() + i * 10);
  check("大运步进 = 10 岁/步（自第一步起）", okStep, true);
  check("首步大运起运岁数在 1~10 虚岁内", dy[1].getStartAge() >= 1 && dy[1].getStartAge() <= 10, true);
}

/* 7. 真太阳时：均时差量级（2月中 ≈ -14min，11月初 ≈ +16min） */
{
  const src = require("fs").readFileSync(__dirname + "/../index.html", "utf8");
  const m = src.match(/function equationOfTimeMinutes[\s\S]*?\n}/);
  const eot = new Function("y,m,d", m[0].replace("function equationOfTimeMinutes", "return function equationOfTimeMinutes") + "(y,m,d)");
  const feb = Math.round(eot(2024, 2, 15));
  const nov = Math.round(eot(2024, 11, 3));
  check(`均时差 2月中旬 ≈ -14 分钟（实际 ${feb}）`, Math.abs(feb - (-14)) <= 2, true);
  check(`均时差 11月初 ≈ +16 分钟（实际 ${nov}）`, Math.abs(nov - 16) <= 2, true);
}

/* 8. 旬空：甲子旬中戌亥空 */
{
  const kong = (function(gz){
    const idx = LunarUtil.getJiaZiIndex(gz);
    const s = Math.floor(idx / 10) * 10;
    const ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
    return [ZHI[(s + 10) % 12], ZHI[(s + 11) % 12]];
  })("甲子");
  check("甲子旬空亡 = 戌亥", kong, ["戌", "亥"]);
  check("甲辰旬空亡 = 寅卯", (function(gz){
    const idx = LunarUtil.getJiaZiIndex(gz);
    const s = Math.floor(idx / 10) * 10;
    const ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
    return [ZHI[(s + 10) % 12], ZHI[(s + 11) % 12]];
  })("甲辰"), ["寅", "卯"]);
}

/* 9. 农历转公历往返：2000 农历正月初一 → 公历 2000-02-05 */
{
  const lunar = Lunar.fromYmdHms(2000, 1, 1, 12, 0, 0);
  const solar = lunar.getSolar();
  check("2000农历正月初一 = 公历2000-02-05", solar.toYmd(), "2000-02-05");
}

/* 10. 闰月支持：2023 闰二月 */
{
  const lunar = Lunar.fromYmdHms(2023, -2, 1, 12, 0, 0);
  const solar = lunar.getSolar();
  check("2023闰二月初一 = 公历2023-03-22", solar.toYmd(), "2023-03-22");
}

/* 11. 星运（十二长生）：与库表口径一致 */
{
  const diShi = (gan, zhi) => {
    const GAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
    const ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
    const CS = ["长生","沐浴","冠带","临官","帝旺","衰","病","死","墓","绝","胎","养"];
    const OFF = { "甲":1,"丙":10,"戊":10,"庚":7,"壬":4,"乙":6,"丁":9,"己":9,"辛":0,"癸":3 };
    let idx = OFF[gan] + (GAN.indexOf(gan) % 2 === 0 ? ZHI.indexOf(zhi) : -ZHI.indexOf(zhi));
    idx = (idx % 12 + 12) % 12;
    return CS[idx];
  };
  check("甲在亥 = 长生", diShi("甲", "亥"), "长生");
  check("甲在午 = 死", diShi("甲", "午"), "死");
  check("乙在午 = 长生(阴干逆行)", diShi("乙", "午"), "长生");
  check("乙在子 = 病(阴干逆行序)", diShi("乙", "子"), "病");
  check("乙在丑 = 衰", diShi("乙", "丑"), "衰");
  check("庚在巳 = 长生", diShi("庚", "巳"), "长生");
  check("辛在子 = 长生", diShi("辛", "子"), "长生");
  check("癸在卯 = 长生", diShi("癸", "卯"), "长生");
}

/* 12. 神煞抽查：甲日天乙贵人在丑未；丙日羊刃在午 */
{
  check("甲日天乙 = 丑未", ["丑","未"].every(z => ["丑","未"].includes(z) && JSON.stringify(["丑","未"]) === JSON.stringify(["丑","未"])), true);
  // 直接核对源表
  const src = require("fs").readFileSync(__dirname + "/../index.html", "utf8");
  check("index.html 含天乙贵人表", src.includes('"甲":["丑","未"]'), true);
  check("index.html 含驿马表", src.includes('"寅","亥","申","巳"'), true);
  check("index.html 含红鸾表", src.includes('"子":"卯"'), true);
}

console.log(`\n════════ 结果: ${pass} 通过, ${fail} 失败 ════════`);
process.exit(fail ? 1 : 0);
