let timerInterval = null;
let totalSeconds = 0;
let remainingSeconds = 0;
let endTime = 0;
let warningNotified = false;

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
    endTime = Date.now() + totalSeconds * 1000;
    
    // UIの切り替え
    elements.input.readOnly = true;
    elements.actionBtn.textContent = 'Reset';
    elements.actionBtn.classList.add('reset-mode');
    
    // バーを最初100%にセット
    elements.barFill.style.width = '100%';
    elements.barFill.style.background = 'hsl(120, 84%, 60%)'; // 初期色は緑
    
    warningNotified = false;
    document.title = "TimeLeft";
    document.body.classList.remove('warning-flash');

    // 初回の表示更新（少し遅延させてトランジションを効かせる）
    setTimeout(() => {
        updateUI();
    }, 50);

    timerInterval = setInterval(() => {
        remainingSeconds = Math.round((endTime - Date.now()) / 1000);
        if (remainingSeconds < 0) remainingSeconds = 0;
        updateUI();

        if (remainingSeconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            elements.input.value = '0 分';
            elements.barFill.style.width = '0%';
            elements.barFill.style.background = '#ef4444'; // red-500
            
            document.title = "0! - TimeLeft";
            chrome.notifications.create({
                type: 'basic',
                iconUrl: '../icons/icon128.png',
                title: 'TimeLeft',
                message: '時間になりました！'
            });
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
    document.title = "TimeLeft";
    warningNotified = false;
}

function updateUI() {
    if (remainingSeconds <= 0) return;

    // 残り分数の表示更新
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    elements.input.value = `残り ${remainingMinutes} 分`;

    // バーの幅と色の更新
    const ratio = remainingSeconds / totalSeconds;
    elements.barFill.style.width = `${ratio * 100}%`;

    // ウィンドウタイトルの更新 (タスクバー表示用)
    let timeText = '';
    if (remainingSeconds >= 60) {
        timeText = Math.ceil(remainingSeconds / 60) + 'm';
    } else {
        timeText = remainingSeconds + 's';
    }
    document.title = `${timeText} - TimeLeft`;

    // HSLで色を計算: 緑(120) から 赤(0) へグラデーション
    const hue = ratio * 120;
    elements.barFill.style.background = `hsl(${hue}, 84%, 60%)`;

    // 残り1割以下で警告アニメーションと通知
    if (ratio <= 0.1) {
        document.body.classList.add('warning-flash');
        if (!warningNotified) {
            warningNotified = true;
            chrome.notifications.create({
                type: 'basic',
                iconUrl: '../icons/icon128.png',
                title: 'TimeLeft - 警告',
                message: '残り時間が10%を切りました！'
            });
        }
    } else {
        document.body.classList.remove('warning-flash');
    }
}
