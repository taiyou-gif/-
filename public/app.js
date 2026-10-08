// 状態管理
const state = {
    day_number: null,
    record_date: '',
    name: '',
    bedtime: '',
    waketime: '',
    weather: '',
    sleepiness: 5,
    mood_good: 5,
    mood_depressed: 5
};

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    
    // 日付の初期値を今日に設定
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateInput = document.getElementById('record_date');
    if (dateInput) {
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    // 起床時刻の初期値を現在時刻に設定
    const wakeInput = document.getElementById('waketime');
    if (wakeInput) {
        const hh = String(today.getHours()).padStart(2, '0');
        const min = String(today.getMinutes()).padStart(2, '0');
        wakeInput.value = `${hh}:${min}`;
    }

    // 前回の選択日数を表示
    const lastDay = localStorage.getItem('last_selected_day');
    if (lastDay) {
        const lastDayNumberEl = document.getElementById('last-day-number');
        const lastDayInfoEl = document.getElementById('last-day-info');
        if (lastDayNumberEl && lastDayInfoEl) {
            lastDayNumberEl.textContent = lastDay;
            lastDayInfoEl.style.display = 'block';
        }
    }
});

// 要素の取得
const screen0 = document.getElementById('screen-0');
const screen1 = document.getElementById('screen-1');
const screen2 = document.getElementById('screen-2');
const screen3 = document.getElementById('screen-3');
const screen4 = document.getElementById('screen-4');

const initialForm = document.getElementById('initial-form');
const finalForm = document.getElementById('final-form');
const startTimerBtn = document.getElementById('start-timer-btn');
const pauseTimerBtn = document.getElementById('pause-timer-btn');
const timerControls = document.getElementById('timer-controls');
const timerDisplay = document.getElementById('timer-display');
const timerStatus = document.getElementById('timer-status');
const alarmSound = document.getElementById('alarm-sound');
const postTimerConfirm = document.getElementById('post-timer-confirm');
const confirmYesBtn = document.getElementById('confirm-yes-btn');
const confirmNoBtn = document.getElementById('confirm-no-btn');
const backToTimerBtn = document.getElementById('back-to-timer-btn');
const backToInfoBtn = document.getElementById('back-to-info-btn');

// 画面遷移関数
function showScreen(screenElement) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screenElement.classList.add('active');
    window.scrollTo(0, 0);
}

// --- 画面0：日数選択 ---
const dayButtonsContainer = document.getElementById('day-buttons');
if (dayButtonsContainer) {
    for (let i = 1; i <= 21; i++) {
        const btn = document.createElement('button');
        btn.className = 'secondary-btn';
        btn.style.marginTop = '0';
        btn.style.padding = '1.2rem 0.5rem';
        btn.style.fontSize = '1.2rem';
        btn.textContent = `${i}日目`;
        
        btn.addEventListener('click', () => {
            state.day_number = i;
            const backToTimerBtn = document.getElementById('back-to-timer-btn');
            const backToDayBtnInfo = document.getElementById('back-to-day-btn-from-info');
            
            if (i >= 8 && i <= 14) {
                // 8〜14日目: タイマー画面へ
                if (backToTimerBtn) backToTimerBtn.style.display = 'block';
                if (backToDayBtnInfo) backToDayBtnInfo.style.display = 'none';
                showScreen(screen2);
            } else {
                // 1〜7日目, 15〜21日目: タイマーをスキップして基本情報入力へ
                if (backToTimerBtn) backToTimerBtn.style.display = 'none';
                if (backToDayBtnInfo) backToDayBtnInfo.style.display = 'block';
                showScreen(screen1);
            }
        });
        
        dayButtonsContainer.appendChild(btn);
    }
}

// 画面1の送信処理
initialForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const recordDateVal = document.getElementById('record_date').value.trim();
    const nameVal = document.getElementById('name').value.trim();
    const bedtimeVal = document.getElementById('bedtime').value;
    const waketimeVal = document.getElementById('waketime').value;
    const weatherRadio = document.querySelector('input[name="weather"]:checked');
    
    if (!recordDateVal || !nameVal || !bedtimeVal || !waketimeVal || !weatherRadio) {
        alert('すべての項目（日付・氏名・就寝時刻・起床時刻・天気）を入力・選択してください。');
        return;
    }
    
    // データ保存
    state.record_date = recordDateVal;
    state.name = nameVal;
    state.bedtime = bedtimeVal;
    state.waketime = waketimeVal;
    state.weather = weatherRadio.value;

    // 画面1(Info)から画面3(Feeling)へ遷移
    showScreen(screen3);
});

// 画面2：タイマー処理 (5分 = 300秒)
const TIMER_SECONDS = 5 * 60; 
let timeRemaining = TIMER_SECONDS;
let timerInterval = null;
let isPaused = false;

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function runTimer() {
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            
            // アラーム音を鳴らす
            alarmSound.play().catch(e => console.error("Audio play failed:", e));
            
            timerStatus.textContent = '完了しました！';
            
            // ボタンを隠して確認領域を表示
            timerControls.style.display = 'none';
            postTimerConfirm.style.display = 'block';
        }
    }, 1000);
}

startTimerBtn.addEventListener('click', () => {
    // 既に開始している場合は何もしない
    if (timerInterval) return;
    
    startTimerBtn.style.display = 'none';
    pauseTimerBtn.style.display = 'inline-block';
    
    timerStatus.textContent = 'リラックスして光を浴びましょう';
    isPaused = false;
    runTimer();
});

pauseTimerBtn.addEventListener('click', () => {
    if (isPaused) {
        // 再開
        isPaused = false;
        pauseTimerBtn.textContent = '一時停止';
        timerStatus.textContent = 'リラックスして光を浴びましょう';
        runTimer();
    } else {
        // 一時停止
        isPaused = true;
        pauseTimerBtn.textContent = '再開';
        timerStatus.textContent = '一時停止中...';
        clearInterval(timerInterval);
        timerInterval = null;
    }
});

// 確認画面：はい -> 次の画面へ（Info）
confirmYesBtn.addEventListener('click', () => {
    showScreen(screen1);
});

// 確認画面：いいえ -> タイマーリセット
confirmNoBtn.addEventListener('click', () => {
    postTimerConfirm.style.display = 'none';
    timerControls.style.display = 'block';
    startTimerBtn.style.display = 'inline-block';
    pauseTimerBtn.style.display = 'none';
    pauseTimerBtn.textContent = '一時停止';
    
    timeRemaining = TIMER_SECONDS;
    updateTimerDisplay();
    timerStatus.textContent = '';
});

// 戻るボタンの処理
backToTimerBtn.addEventListener('click', () => {
    showScreen(screen2);
});

backToInfoBtn.addEventListener('click', () => {
    showScreen(screen1);
});

// 日数選択に戻るボタンの処理
const backToDayBtnTimer = document.getElementById('back-to-day-btn-from-timer');
if (backToDayBtnTimer) {
    backToDayBtnTimer.addEventListener('click', () => {
        showScreen(screen0);
    });
}
const backToDayBtnInfo = document.getElementById('back-to-day-btn-from-info');
if (backToDayBtnInfo) {
    backToDayBtnInfo.addEventListener('click', () => {
        showScreen(screen0);
    });
}

// 画面3：最終送信処理
finalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const sleepinessVal = document.getElementById('sleepiness').value;
    const moodGoodVal = document.getElementById('mood_good').value;
    const moodDepressedVal = document.getElementById('mood_depressed').value;

    if (sleepinessVal === '' || moodGoodVal === '' || moodDepressedVal === '') {
        alert('すべての質問項目（眠気・気分の良さ・憂うつさ）を選択してください。');
        return;
    }

    state.sleepiness = sleepinessVal;
    state.mood_good = moodGoodVal;
    state.mood_depressed = moodDepressedVal;

    try {
        const response = await fetch('/api/records', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(state)
        });

        if (response.ok) {
            if (state.day_number) {
                localStorage.setItem('last_selected_day', state.day_number);
            }
            showScreen(screen4);
        } else {
            alert('エラーが発生しました。もう一度お試しください。');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('通信エラーが発生しました。ネットワークを確認してください。');
    }
});
