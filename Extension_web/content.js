let skipNextDocumentMousedown = false;
function removeMiniIcon() {
    const btn = document.getElementById('my-minibtn');
    if (btn) btn.remove();
}
function removePopup() {
    const popup = document.getElementById('my-big-popup');
    if (popup) popup.remove();
}

function showMiniIcon(range, word) {
    removeMiniIcon();
    removePopup();
    const rect = range.getBoundingClientRect();
    const btn = document.createElement('div');
    btn.id = 'my-minibtn';
    btn.style.position = 'fixed';
    btn.style.top = (rect.top - 32 + window.scrollY) + 'px';
    btn.style.left = (rect.left + window.scrollX) + 'px';
    btn.style.zIndex = 9999;
    btn.style.background = '#fff';
    btn.style.border = '1px solid #2e80ec';
    btn.style.borderRadius = '50%';
    btn.style.width = '30px';
    btn.style.height = '30px';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 1px 4px rgba(0,0,0,0.10)';
    btn.innerHTML = `<span style="color:#2e80ec;font-weight:bold;font-size:18px;">W</span>`;

    btn.onclick = (e) => {
        e.stopPropagation();
        skipNextDocumentMousedown = true;
        removeMiniIcon();
        showBigPopup(rect, word);
    };

    document.body.appendChild(btn);
}

function showBigPopup(rect, word) {
    removePopup();
    const popup = document.createElement('div');
    popup.id = 'my-big-popup';
    popup.style.position = 'fixed';
    popup.style.top = (rect.bottom + 10 + window.scrollY) + 'px';
    popup.style.left = (rect.left + window.scrollX) + 'px';
    popup.style.zIndex = 9999;
    popup.style.background = '#fff';
    popup.style.border = '1.5px solid #2e80ec';
    popup.style.borderRadius = '12px';
    popup.style.boxShadow = '0 2px 14px rgba(0,0,0,0.15)';
    popup.style.padding = '20px 28px';
    popup.style.fontSize = '17px';
    popup.style.maxWidth = '330px';
    popup.innerHTML = `
      <div style="font-weight:bold;margin-bottom:12px;">${word}</div>
      <div style="color:#888;margin-bottom:18px;">Здесь появится перевод/действия</div>
      <button id="close-my-popup" style="padding:6px 16px; border-radius:5px; border:none; background:#eee; color:#2e80ec; font-weight:bold;cursor:pointer;">Закрыть</button>
    `;
    document.body.appendChild(popup);
    document.getElementById('close-my-popup').onclick = removePopup;
}

// Глобальное закрытие popup/minibutton по клику вне них
document.addEventListener('mousedown', function(e) {
    if (skipNextDocumentMousedown) {
        skipNextDocumentMousedown = false;
        return;
    }
    if (
        !e.target.closest('#my-big-popup') &&
        !e.target.closest('#my-minibtn')
    ) {
        removeMiniIcon();
        removePopup();
    }
});

function showIfSelection() {
    removeMiniIcon();
    removePopup();
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';
    if (text && text.split(/\s+/).length <= 5) {
        try {
            const range = selection.getRangeAt(0);
            showMiniIcon(range, text);
        } catch {}
    }
}

// --- вот эти два слушателя ---
// Быстрое появление после выделения мышкой:
document.addEventListener('mouseup', showIfSelection);
// Появление после даблклика по слову:
document.addEventListener('dblclick', function() {
    // Даем браузеру "доделать" выделение
    setTimeout(showIfSelection, 0);
});
