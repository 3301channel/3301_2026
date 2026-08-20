/**
 * 3301 channel — 滚动动效 & 微交互
 * 1) 滚动揭示：元素进入视口时淡入上移（IntersectionObserver，错峰）
 * 2) 导航栏滚动态：向下滚动加毛玻璃 + 阴影
 * 3) 首页头图视差：滚动时标题文字慢速上移 + 淡出
 * 4) 文章卡片 spotlight：鼠标悬停跟随光晕
 * 5) 深浅色切换：包装 switchNightMode 给内容颜色加平滑过渡
 * 不依赖 AOS，自动跳过带 data-aos 的元素，避免与瀑布流/卡片缩放冲突。
 */
(function () {
  'use strict';

  var prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el_add(el, cls) {
    if (el.classList) el.classList.add(cls);
    else el.className += ' ' + cls;
  }

  function initReveal() {
    if (prefersReduced) return;
    var selectors = [
      '#articleContent > *',
      '.index-card',
      '.archive .collection-item',
      '.tag-list .tag-chips .chip',
      '.friends-container .friend-div',
      '.my-projects .info',
      '.card-hover'
    ];
    var nodes = [];
    for (var s = 0; s < selectors.length; s++) {
      var list = document.querySelectorAll(selectors[s]);
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        if (el.getAttribute('data-aos')) continue;
        if ((' ' + (el.className || '') + ' ').indexOf(' reveal ') !== -1) continue;
        nodes.push(el);
      }
    }
    if (!nodes.length) return;
    for (var j = 0; j < nodes.length; j++) el_add(nodes[j], 'reveal');
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

  function initParallax() {
    if (prefersReduced) return;
    var cover = document.querySelector('.index-cover');
    if (!cover) return;
    var brand = cover.querySelector('.brand');
    if (!brand) return;
    var ticking = false;
    function update() {
      var y = window.pageYOffset;
      if (y < window.innerHeight) {
        brand.style.transform = 'translate3d(0,' + (y * 0.35).toFixed(1) + 'px,0)';
        brand.style.opacity = Math.max(1 - y / 520, 0).toFixed(3);
      }
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  function initSpotlight() {
    if (prefersReduced) return;
    var cards = document.querySelectorAll('.article .card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].addEventListener('mousemove', function (e) {
        var r = this.getBoundingClientRect();
        this.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        this.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    }
  }

  function wrapNightMode() {
    if (prefersReduced) return;
    if (typeof window.switchNightMode !== 'function') return;
    if (window.__nightWrapped) return;
    var orig = window.switchNightMode;
    window.switchNightMode = function () {
      var root = document.documentElement;
      root.classList.add('theme-anim');
      setTimeout(function () { root.classList.remove('theme-anim'); }, 700);
      return orig.apply(this, arguments);
    };
    window.__nightWrapped = true;
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    initReveal();
    initNavScroll();
    initParallax();
    initSpotlight();
    wrapNightMode();
  });
})();
