/**
 * 3301 channel — 滚动动效 & 微交互
 * 1) 滚动揭示：元素进入视口时淡入上移（IntersectionObserver，错峰）
 * 2) 导航栏滚动态：向下滚动加毛玻璃 + 阴影
 * 不依赖 AOS，自动跳过带 data-aos 的元素，避免与瀑布流/卡片缩放冲突。
 */
(function () {
  'use strict';

  var prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initReveal() {
    if (prefersReduced) return;

    var selectors = [
      '#articleContent > *',          // 文章正文各块（标题/段落/代码块/引用/列表）
      '.index-card',                  // 首页推荐卡
      '.archive .collection-item',    // 归档页条目
      '.tag-list .tag-chips .chip',   // 标签页
      '.friends-container .friend-div',
      '.my-projects .info',
      '.card-hover'
    ];

    var nodes = [];
    for (var s = 0; s < selectors.length; s++) {
      var list = document.querySelectorAll(selectors[s]);
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        if (el.getAttribute('data-aos')) continue;            // 交给 AOS 处理
        if ((' ' + el.className + ' ').indexOf(' reveal ') !== -1) continue;
        nodes.push(el);
      }
    }
    if (!nodes.length) return;

    for (var j = 0; j < nodes.length; j++) {
      el_add(nodes[j], 'reveal');
    }

    if (!('IntersectionObserver' in window)) {
      for (var k = 0; k < nodes.length; k++) el_add(nodes[k], 'is-visible');
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      for (var e = 0; e < entries.length; e++) {
        var en = entries[e];
        if (en.isIntersecting) {
          el_add(en.target, 'is-visible');
          io.unobserve(en.target);
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    for (var n = 0; n < nodes.length; n++) {
      nodes[n].style.transitionDelay = (Math.min(n % 9, 8) * 70) + 'ms';
      io.observe(nodes[n]);
    }
  }

  function initNavScroll() {
    var nav = document.getElementById('headNav');
    if (!nav) return;
    var ticking = false;
    function update() {
      if (window.pageYOffset > 24) nav.classList.add('nav-scrolled');
      else nav.classList.remove('nav-scrolled');
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  function el_add(el, cls) {
    if (el.classList) el.classList.add(cls);
    else el.className += ' ' + cls;
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () { initReveal(); initNavScroll(); });
})();
