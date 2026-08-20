/* =========================================================
 * 看板娘（Live2D）听歌戴猫耳耳麦
 * - 播放时：耳麦带弹性动画「戴上」+ 轻微摇摆 + 浮动音符（享受音乐）
 * - 暂停/结束时：耳麦丝滑「收起」
 * 不依赖任何外部资源，纯 SVG 叠加在看板娘头顶。
 * ========================================================= */
(function () {
    // 猫耳耳麦 SVG（粉色猫耳 + 头梁 + 两侧耳罩）
    var HEADPHONE_SVG =
        '<svg class="hp-svg" viewBox="0 0 140 122" width="140" height="122" aria-hidden="true">' +
        // 头梁
        '<path d="M26 80 C26 20, 114 20, 114 80" fill="none" stroke="#3a3a44" stroke-width="9" stroke-linecap="round"/>' +
        // 左猫耳
        '<path d="M22 68 L7 32 L42 56 Z" fill="#ffb3c6" stroke="#3a3a44" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M18 60 L11 42 L32 56 Z" fill="#ff7da0"/>' +
        // 右猫耳
        '<path d="M118 68 L133 32 L98 56 Z" fill="#ffb3c6" stroke="#3a3a44" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M122 60 L129 42 L108 56 Z" fill="#ff7da0"/>' +
        // 左耳罩
        '<g class="hp-cup">' +
        '<circle cx="26" cy="82" r="16" fill="#ffb3c6" stroke="#3a3a44" stroke-width="5"/>' +
        '<circle class="hp-glow" cx="26" cy="82" r="16" fill="none" stroke="#ffffff" stroke-width="3" opacity="0"/>' +
        '<circle cx="26" cy="82" r="6" fill="#ffffff" opacity="0.55"/>' +
        '</g>' +
        // 右耳罩
        '<g class="hp-cup">' +
        '<circle cx="114" cy="82" r="16" fill="#ffb3c6" stroke="#3a3a44" stroke-width="5"/>' +
        '<circle class="hp-glow" cx="114" cy="82" r="16" fill="none" stroke="#ffffff" stroke-width="3" opacity="0"/>' +
        '<circle cx="114" cy="82" r="6" fill="#ffffff" opacity="0.55"/>' +
        '</g>' +
        '</svg>';

    var attached = false;
    var on = false;

    function setListening(v) {
        if (v === on) return;
        on = v;
        var wrap = document.querySelector('.kanban-headphone');
        if (wrap) wrap.classList.toggle('on', v);
        // 让看板娘说句话，表达「正在享受音乐」
        try {
            if (v && window.L2Dwidget && typeof window.L2Dwidget.chat === 'function') {
                window.L2Dwidget.chat('♪ 戴好耳机，享受音乐~');
            }
        } catch (e) { /* 忽略 */ }
    }

    // 判断事件目标是否来自音乐播放器
    function fromPlayer(t) {
        if (!t || !t.tagName) return false;
        if (t.matches && t.matches('.music-player audio, .aplayer audio')) return true;
        if (t.closest && t.closest('.music-player, .aplayer')) return true;
        return false;
    }

    function attach() {
        if (attached) return;
        attached = true;
        // 原生 audio 的 play/pause/ended 不冒泡，用捕获阶段监听
        document.addEventListener('play', function (e) {
            if (fromPlayer(e.target)) setListening(true);
        }, true);
        document.addEventListener('pause', function (e) {
            if (fromPlayer(e.target)) setListening(false);
        }, true);
        document.addEventListener('ended', function (e) {
            if (fromPlayer(e.target)) setListening(false);
        }, true);
    }

    function build() {
        var widget = document.getElementById('live2d-widget');
        if (!widget) {
            var cv = document.getElementById('live2dcanvas');
            if (cv) widget = cv.parentElement;
        }
        if (!widget) return false;

        widget.style.overflow = 'visible';

        if (!widget.querySelector('.kanban-headphone')) {
            var wrap = document.createElement('div');
            wrap.className = 'kanban-headphone';
            wrap.innerHTML =
                '<div class="kanban-headphone__inner">' + HEADPHONE_SVG +
                '<div class="kanban-headphone__notes"><span>♪</span><span>♪</span></div>' +
                '</div>';
            widget.appendChild(wrap);
        }
        attach();
        return true;
    }

    // 等待看板娘 canvas 注入完成（live2d 脚本异步加载）
    var tries = 0;
    (function wait() {
        if (build()) return;
        if (tries++ < 150) setTimeout(wait, 200);
    })();
})();
