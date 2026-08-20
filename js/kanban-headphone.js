/* =========================================================
 * 看板娘（Live2D）听歌戴猫耳耳麦
 * - 播放时：耳麦带弹性动画「戴上」+ 轻微摇摆 + 浮动音符（享受音乐）
 * - 暂停/结束时：耳麦丝滑「收起」
 * 叠加层挂在 body（position:fixed, 高 z-index），按看板娘画布实时定位，
 * 避免被画布裁剪或层级盖住。状态同步双保险：audio 的 play/pause/ended
 * 事件 + 定时轮询 audio.paused（事件万一不冒泡也照样生效）。
 * ========================================================= */
(function () {
    var HEADPHONE_SVG =
        '<svg class="hp-svg" viewBox="0 0 140 122" width="140" height="122" aria-hidden="true">' +
        '<path d="M26 80 C26 20, 114 20, 114 80" fill="none" stroke="#3a3a44" stroke-width="9" stroke-linecap="round"/>' +
        '<path d="M22 68 L7 32 L42 56 Z" fill="#ffb3c6" stroke="#3a3a44" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M18 60 L11 42 L32 56 Z" fill="#ff7da0"/>' +
        '<path d="M118 68 L133 32 L98 56 Z" fill="#ffb3c6" stroke="#3a3a44" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M122 60 L129 42 L108 56 Z" fill="#ff7da0"/>' +
        '<g class="hp-cup">' +
        '<circle cx="26" cy="82" r="16" fill="#ffb3c6" stroke="#3a3a44" stroke-width="5"/>' +
        '<circle class="hp-glow" cx="26" cy="82" r="16" fill="none" stroke="#ffffff" stroke-width="3" opacity="0"/>' +
        '<circle cx="26" cy="82" r="6" fill="#ffffff" opacity="0.55"/>' +
        '</g>' +
        '<g class="hp-cup">' +
        '<circle cx="114" cy="82" r="16" fill="#ffb3c6" stroke="#3a3a44" stroke-width="5"/>' +
        '<circle class="hp-glow" cx="114" cy="82" r="16" fill="none" stroke="#ffffff" stroke-width="3" opacity="0"/>' +
        '<circle cx="114" cy="82" r="6" fill="#ffffff" opacity="0.55"/>' +
        '</g>' +
        '</svg>';

    var wrap = null;       // 耳麦叠加层
    var canvas = null;     // 看板娘画布
    var on = false;
    var chatTimer = null;

    function findCanvas() {
        return document.getElementById('live2dcanvas') ||
            document.querySelector('#live2d-widget canvas') ||
            null;
    }

    function findAudio() {
        return document.querySelector('.music-player audio') ||
            document.querySelector('.aplayer audio') ||
            null;
    }

    // 判断音乐是否正在播放。
    // 关键坑：APlayer 创建的 <audio> 是「脱离 DOM 的游离元素」，它的 play/pause/ended
    // 事件不会冒泡到 document，也不在 DOM 里、无法被 querySelector 选中——
    // 所以监听 audio 事件 / 轮询 audio.paused 永远抓不到，这是之前耳机一直不生效的根因。
    // 改用 APlayer 在播放时给封面按钮加的 .aplayer-pause 类（显示暂停图标 = 正在播放）
    // 作为可靠信号；audio 兜底仅用于某些把音频放进 DOM 的配置。
    function isPlaying() {
        var btn = document.querySelector('.aplayer .aplayer-button');
        if (btn && btn.classList.contains('aplayer-pause')) return true;
        var a = findAudio();
        return !!(a && !a.paused);
    }

    // 把耳麦定位到看板娘画布头顶（画布是 fixed，位置基本稳定；resize 时重算）
    function position() {
        if (!wrap || !canvas) return;
        var r = canvas.getBoundingClientRect();
        if (!r.width) return;
        var w = 140, h = 122;
        var left = r.left + r.width / 2 - w / 2;
        var top = r.top + r.height * 0.05; // 略低于画布顶，落在头顶区域
        wrap.style.left = left + 'px';
        wrap.style.top = top + 'px';
        wrap.style.width = w + 'px';
        wrap.style.height = h + 'px';
    }

    function setListening(v) {
        if (v === on) return;
        on = v;
        if (wrap) wrap.classList.toggle('on', v);
        if (v) {
            try {
                if (window.L2Dwidget && typeof window.L2Dwidget.chat === 'function') {
                    window.L2Dwidget.chat('♪ 戴好耳机，享受音乐~');
                }
            } catch (e) { /* 忽略 */ }
        }
    }

    function fromPlayer(t) {
        if (!t || !t.tagName) return false;
        if (t.matches && t.matches('.music-player audio, .aplayer audio')) return true;
        if (t.closest && t.closest('.music-player, .aplayer')) return true;
        return false;
    }

    function build() {
        if (wrap) return true;
        canvas = findCanvas();
        if (!canvas) return false;

        wrap = document.createElement('div');
        wrap.className = 'kanban-headphone';
        wrap.innerHTML =
            '<div class="kanban-headphone__inner">' + HEADPHONE_SVG +
            '<div class="kanban-headphone__notes"><span>♪</span><span>♪</span></div>' +
            '</div>';
        document.body.appendChild(wrap);
        position();

        // 事件（捕获阶段，play/pause/ended 不冒泡也能抓到）
        document.addEventListener('play', function (e) {
            if (fromPlayer(e.target)) setListening(true);
        }, true);
        document.addEventListener('pause', function (e) {
            if (fromPlayer(e.target)) setListening(false);
        }, true);
        document.addEventListener('ended', function (e) {
            if (fromPlayer(e.target)) setListening(false);
        }, true);

        window.addEventListener('resize', position);
        // 看板娘画布加载完成后尺寸才确定，下一帧再定位一次
        setTimeout(position, 300);
        setTimeout(position, 1200);

        // 轮询：用按钮类判断播放状态（audio 事件/元素本身在游离态下都不可靠）
        setInterval(function () {
            setListening(isPlaying());
        }, 400);

        return true;
    }

    // 等待画布出现（live2d 异步加载），用轮询 + 监听 DOM
    var tries = 0;
    (function wait() {
        if (build()) return;
        if (tries++ < 200) setTimeout(wait, 200);
    })();
    var mo = new MutationObserver(function () { build(); });
    mo.observe(document.documentElement, { childList: true, subtree: true });
})();
