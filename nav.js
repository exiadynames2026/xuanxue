/**
 * 玄学工具箱 · 共享导航与页头
 * 用法：页面引入后调用 NAV.render("六爻") 自动填充 <nav>，并给页脚追加工具箱说明。
 */
(function (root) {
  "use strict";
  const TOOLS = [
    ["index.html", "八字排盘"],
    ["tieban.html", "铁板神数"],
    ["liuyao.html", "六爻排卦"],
    ["qimen.html", "奇门遁甲"],
    ["liuren.html", "大六壬"],
    ["ziwei.html", "紫微斗数"],
    ["meihua.html", "梅花易数"],
    ["huangli.html", "黄历择日"],
    ["xingming.html", "姓名学"],
    ["chengu.html", "称骨"],
  ];
  root.XXNav = {
    render(current) {
      const nav = document.querySelector("nav");
      if (!nav) return;
      nav.innerHTML = TOOLS.map(([href, label]) =>
        `<a href="${href}" class="${label === current ? "cur" : ""}">${label}</a>`).join("");
    },
    footer(extra) {
      const f = document.querySelector("footer");
      if (!f) return;
      f.innerHTML = `玄学工具箱 · 历法内核 <a href="https://github.com/6tail/lunar-javascript" target="_blank" style="color:var(--accent)">lunar-javascript</a>（MIT）· ` +
        (extra || "本站所有排盘仅供传统文化学习与娱乐，不构成任何人生建议。");
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
