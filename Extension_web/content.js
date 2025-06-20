// === Контент-скрипт для расширения "Word Translator & Explainer" ===

// Глобальный флаг для предотвращения авто-закрытия popup при клике на мини-иконку
let ignoreNextDocumentMousedown = false;

// Удаление мини-кнопки
function removeMiniButton() {
    const btn = document.getElementById('mini-translator-btn');
    if (btn) btn.remove();
}

// Удаление большого окна
function removePopup() {
    const oldPopup = document.getElementById('word-translator-popup');
    if (oldPopup) oldPopup.remove();
}

// Показ большого окна с переводом и объяснением
function showPopupAt(x, y, word, translation, explanation) {
    removePopup();

    const popup = document.createElement('div');
    popup.id = 'word-translator-popup';
    popup.style.position = 'fixed';
    popup.style.top = (y + 15) + 'px';
    popup.style.left = x + 'px';
    popup.style.zIndex = 10000;
    popup.style.background = '#fff';
    popup.style.border = '1px solid #ccc';
    popup.style.borderRadius = '8px';
    popup.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    popup.style.padding = '18px 20px';
    popup.style.fontSize = '16px';
    popup.style.maxWidth = '340px';

    popup.innerHTML = `
      <b>${word}</b> &rarr; <b>${translation}</b><br>
      <div style="margin: 12px 0;">${explanation}</div>
      <button id="save-word-btn" style="padding: 6px 16px; border-radius: 5px; background: #2e80ec; color: #fff; border: none; cursor: pointer;">
        Сохранить
      </button>
      <button id="close-popup-btn" style="margin-left: 8px; padding: 6px 16px; border-radius: 5px; background: #eee; color: #222; border: none; cursor: pointer;">
        Закрыть
      </button>
    `;

    document.body.appendChild(popup);

    document.getElementById('close-popup-btn').onclick = removePopup;

    document.getElementById('save-word-btn').onclick = () => {
        fetch('http://localhost:8000/save_word', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word, translation, explanation })
        }).then(() => {
            removePopup();
            alert('Word saved successfully!');
        }).catch(() => {
            alert("Error occurred while saving.");
        });
    };
}

// Показывает мини-кнопку рядом с выделением
function showMiniButton(range, word) {
    removeMiniButton();
    removePopup();

    const rect = range.getBoundingClientRect();
    const btn = document.createElement('div');
    btn.id = 'mini-translator-btn';
    btn.style.position = 'fixed';
    btn.style.top = (rect.top - 30 + window.scrollY) + 'px';
    btn.style.left = (rect.left + window.scrollX) + 'px';
    btn.style.zIndex = 10001;
    btn.style.background = '#fff';
    btn.style.borderRadius = '50%';
    btn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.18)';
    btn.style.width = '32px';
    btn.style.height = '32px';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.cursor = 'pointer';
    btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill="#2e80ec"/><text x="11" y="15" text-anchor="middle" fill="#fff" font-size="13" font-family="Arial">T</text></svg>`;

    btn.onclick = async (e) => {
        e.stopPropagation();
        ignoreNextDocumentMousedown = true;
        removeMiniButton();

        // Достаём перевод, если он уже есть, или ждём максимум 1.5 секунды
        let wordData = window._lastWordSelection || {text: word, translation: "...", explanation: "Loading..."};
        let tr = wordData.translation;
        if (tr === "...") {
            for (let i = 0; i < 15; i++) {
                await new Promise(res => setTimeout(res, 100));
                wordData = window._lastWordSelection;
                if (wordData && wordData.translation !== "...") {
                    tr = wordData.translation;
                    break;
                }
            }
        }

        showPopupAt(rect.left + window.scrollX, rect.bottom + window.scrollY, word, tr, wordData.explanation);
    };

    document.body.appendChild(btn);
}

// Глобальное закрытие при клике вне окна/кнопки
document.addEventListener('mousedown', function(e) {
    if (ignoreNextDocumentMousedown) {
        ignoreNextDocumentMousedown = false;
        return;
    }
    if (
        !e.target.closest('#word-translator-popup') &&
        !e.target.closest('#mini-translator-btn')
    ) {
        removeMiniButton();
        removePopup();
    }
});

// Главная логика — ловим выделение, показываем мини-кнопку и догружаем перевод
document.addEventListener('mouseup', async function (event) {
    setTimeout(async () => {
        removeMiniButton();
        removePopup();

        const selection = window.getSelection();
        const text = selection ? selection.toString().trim() : '';
        if (
            text &&
            /^([a-zA-Z'-]+\s?){1,5}$/.test(text) &&
            text.split(/\s+/).length <= 5
        ) {
            const range = selection.getRangeAt(0);

            // Показываем мини-кнопку сразу
            showMiniButton(range, text);

            // Асинхронно подгружаем перевод (и explanation, если потребуется)
            let translation = "...";
            let explanation = "Здесь будет объяснение"; // Можно сделать fetch к своему серверу
            try {
                const translateResp = await fetch("https://libretranslate.de/translate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        q: text,
                        source: "auto",
                        target: "ru",
                        format: "text"
                    })
                });
                const translateData = await translateResp.json();
                translation = translateData.translatedText || '—';
            } catch {
                translation = "Ошибка перевода";
            }

            // Сохраняем результат для popup
            window._lastWordSelection = {text, translation, explanation};
        }
    }, 50);
});
