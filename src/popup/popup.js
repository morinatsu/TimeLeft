let timerInterval = null;
let totalSeconds = 0;
let remainingSeconds = 0;
let lastSegment = 10;

const elements = {
    input: document.getElementById('time-input'),
    actionBtn: document.getElementById('action-btn'),
    barFill: document.getElementById('bar-fill')
};

// 初期化
elements.actionBtn.addEventListener('click', handleAction);
elements.input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAction();
});

function handleAction() {
    if (elements.actionBtn.classList.contains('reset-mode')) {
        resetTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    const rawVal = elements.input.value.trim();
    if (!rawVal) return;

    if (rawVal.includes(':')) {
        const parts = rawVal.split(':');
        if (parts.length !== 2) return;
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (isNaN(h) || isNaN(m)) return;

        const target = new Date();
        target.setHours(h, m, 0, 0);
        
        // もし指定時刻が過去なら、翌日とする
        if (target < new Date()) {
            target.setDate(target.getDate() + 1);
        }
        totalSeconds = Math.floor((target.getTime() - new Date().getTime()) / 1000);
    } else {
        const minutes = parseFloat(rawVal);
        if (isNaN(minutes) || minutes <= 0) return;
        totalSeconds = Math.floor(minutes * 60);
    }

    if (totalSeconds <= 0) return;
    
    remainingSeconds = totalSeconds;
    
    // UIの切り替え
    elements.input.readOnly = true;
    elements.actionBtn.textContent = 'Reset';
    elements.actionBtn.classList.add('reset-mode');
    
    // バーを最初100%にセット
    elements.barFill.style.width = '100%';
    elements.barFill.style.background = 'hsl(120, 84%, 60%)'; // 初期色は緑
    
    lastSegment = 10;
    document.body.classList.remove('warning-flash');

    // 初回の表示更新（少し遅延させてトランジションを効かせる）
    setTimeout(() => {
        updateUI();
    }, 50);

    timerInterval = setInterval(() => {
        remainingSeconds--;
        updateUI();

        if (remainingSeconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            elements.input.value = '0 分';
            elements.barFill.style.width = '0%';
            elements.barFill.style.background = '#ef4444'; // red-500
        }
    }, 1000);
}

function resetTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    elements.input.readOnly = false;
    elements.input.value = '';
    elements.actionBtn.textContent = 'Start';
    elements.actionBtn.classList.remove('reset-mode');
    
    elements.barFill.style.width = '0%';
    elements.barFill.style.background = 'transparent';
    document.body.classList.remove('warning-flash');
}

function updateUI() {
    if (remainingSeconds <= 0) return;

    // 残り分数の表示更新
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    elements.input.value = `残り ${remainingMinutes} 分`;

    // バーの幅と色の更新
    const ratio = remainingSeconds / totalSeconds;
    elements.barFill.style.width = `${ratio * 100}%`;

    // 10%単位の節目で最前面へ
    const currentSegment = Math.ceil(ratio * 10);
    if (currentSegment < lastSegment) {
        lastSegment = currentSegment;
        if (chrome && chrome.windows) {
            chrome.windows.getCurrent((win) => {
                chrome.windows.update(win.id, { focused: true });
            });
        }
    }

    // 残り1割以下で警告アニメーション
    if (ratio <= 0.1) {
        document.body.classList.add('warning-flash');
    } else {
        document.body.classList.remove('warning-flash');
    }

    // HSLで色を計算: 緑(120) から 赤(0) へグラデーション
    const hue = ratio * 120;
    elements.barFill.style.background = `hsl(${hue}, 84%, 60%)`;
}
