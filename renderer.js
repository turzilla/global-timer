class TimerApp {
    constructor() {
        this.timeRemaining = 0;
        this.timerInterval = null;
        this.isRunning = false;
        this.settings = {};
        
        this.initializeElements();
        this.loadSettings();
        this.setupEventListeners();
        this.setupHotkeyListeners();
    }
    
    initializeElements() {
        // Timer elements
        this.timerDisplay = document.getElementById('timerDisplay');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // Settings elements
        this.timerLengthInput = document.getElementById('timerLength');
        this.popupOnEndCheckbox = document.getElementById('popupOnEnd');
        this.soundOnEndCheckbox = document.getElementById('soundOnEnd');
        this.disableHotkeysCheckbox = document.getElementById('disableHotkeysWhenRunning');
        
        // Hotkey elements
        this.startHotkeyInput = document.getElementById('startHotkey');
        this.stopHotkeyInput = document.getElementById('stopHotkey');
        this.resetHotkeyInput = document.getElementById('resetHotkey');
        this.changeStartHotkeyBtn = document.getElementById('changeStartHotkey');
        this.changeStopHotkeyBtn = document.getElementById('changeStopHotkey');
        this.changeResetHotkeyBtn = document.getElementById('changeResetHotkey');
        
        // Modal elements
        this.hotkeyModal = document.getElementById('hotkeyModal');
        this.hotkeyPreview = document.getElementById('hotkeyPreview');
        this.saveHotkeyBtn = document.getElementById('saveHotkey');
        this.cancelHotkeyBtn = document.getElementById('cancelHotkey');
        
        this.currentHotkeyType = null;
        this.capturedHotkey = null;
    }
    
    async loadSettings() {
        this.settings = await window.electronAPI.getSettings();
        
        // Apply settings to UI
        this.timerLengthInput.value = this.settings.timerLength;
        this.popupOnEndCheckbox.checked = this.settings.popupOnEnd;
        this.soundOnEndCheckbox.checked = this.settings.soundOnEnd;
        this.disableHotkeysCheckbox.checked = this.settings.disableHotkeysWhenRunning;
        
        // Display hotkeys
        this.startHotkeyInput.value = this.formatHotkeyDisplay(this.settings.hotkeys.start);
        this.stopHotkeyInput.value = this.formatHotkeyDisplay(this.settings.hotkeys.stop);
        this.resetHotkeyInput.value = this.formatHotkeyDisplay(this.settings.hotkeys.reset);
        
        // Reset timer with current length
        this.resetTimer();
    }
    
    formatHotkeyDisplay(hotkey) {
        return hotkey.replace('CommandOrControl', 'Ctrl');
    }
    
    setupEventListeners() {
        // Timer controls
        this.startBtn.addEventListener('click', () => this.startTimer());
        this.stopBtn.addEventListener('click', () => this.stopTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        
        // Settings
        this.timerLengthInput.addEventListener('change', (e) => {
            if (!this.isRunning) {
                this.saveSetting('timerLength', parseInt(e.target.value));
                this.resetTimer();
            }
        });
        
        this.popupOnEndCheckbox.addEventListener('change', (e) => {
            this.saveSetting('popupOnEnd', e.target.checked);
        });
        
        this.soundOnEndCheckbox.addEventListener('change', (e) => {
            this.saveSetting('soundOnEnd', e.target.checked);
        });
        
        this.disableHotkeysCheckbox.addEventListener('change', (e) => {
            this.saveSetting('disableHotkeysWhenRunning', e.target.checked);
        });
        
        // Hotkey change buttons
        this.changeStartHotkeyBtn.addEventListener('click', () => this.openHotkeyModal('start'));
        this.changeStopHotkeyBtn.addEventListener('click', () => this.openHotkeyModal('stop'));
        this.changeResetHotkeyBtn.addEventListener('click', () => this.openHotkeyModal('reset'));
        
        // Modal buttons
        this.saveHotkeyBtn.addEventListener('click', () => this.saveHotkey());
        this.cancelHotkeyBtn.addEventListener('click', () => this.closeHotkeyModal());
        
        // Modal keyboard capture
        document.addEventListener('keydown', (e) => this.captureHotkey(e));
        
        // Close modal on background click
        this.hotkeyModal.addEventListener('click', (e) => {
            if (e.target === this.hotkeyModal) {
                this.closeHotkeyModal();
            }
        });
    }
    
    setupHotkeyListeners() {
        window.electronAPI.onHotkeyAction((action) => {
            switch (action) {
                case 'start':
                    if (!this.isRunning) this.startTimer();
                    break;
                case 'stop':
                    if (this.isRunning) this.stopTimer();
                    break;
                case 'reset':
                    this.resetTimer();
                    break;
            }
        });
    }
    
    async saveSetting(key, value) {
        this.settings[key] = value;
        await window.electronAPI.saveSetting(key, value);
    }
    
    startTimer() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.timerLengthInput.disabled = true;
        
        this.timerDisplay.classList.add('running');
        
        // Notify main process
        window.electronAPI.timerStatusChanged(true);
        
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateDisplay();
            
            if (this.timeRemaining <= 0) {
                this.finishTimer();
            }
        }, 1000);
    }
    
    stopTimer() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.timerLengthInput.disabled = false;
        
        this.timerDisplay.classList.remove('running');
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Notify main process
        window.electronAPI.timerStatusChanged(false);
    }
    
    resetTimer() {
        this.stopTimer();
        this.timeRemaining = this.settings.timerLength * 60; // Convert minutes to seconds
        this.updateDisplay();
        this.timerDisplay.classList.remove('finished');
    }
    
    finishTimer() {
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.timerLengthInput.disabled = false;
        
        this.timerDisplay.classList.remove('running');
        this.timerDisplay.classList.add('finished');
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Notify main process that timer ended
        window.electronAPI.timerStatusChanged(false);
        window.electronAPI.timerEnded();
        
        // Play sound if enabled
        if (this.settings.soundOnEnd) {
            this.playNotificationSound();
        }
    }
    
    playNotificationSound() {
        try {
            // Create a simple notification beep using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.warn('Could not play notification sound:', error);
        }
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Hotkey modal methods
    openHotkeyModal(type) {
        this.currentHotkeyType = type;
        this.capturedHotkey = null;
        this.hotkeyPreview.textContent = 'Press keys...';
        this.hotkeyPreview.classList.remove('recording');
        this.saveHotkeyBtn.disabled = true;
        this.hotkeyModal.style.display = 'block';
    }
    
    closeHotkeyModal() {
        this.hotkeyModal.style.display = 'none';
        this.currentHotkeyType = null;
        this.capturedHotkey = null;
    }
    
    captureHotkey(e) {
        if (this.hotkeyModal.style.display !== 'block') return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const keys = [];
        
        if (e.ctrlKey || e.metaKey) keys.push('CommandOrControl');
        if (e.altKey) keys.push('Alt');
        if (e.shiftKey) keys.push('Shift');
        
        // Add the main key (ignore modifier keys themselves)
        if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
            let keyName = e.key;
            
            // Handle special keys
            if (keyName === ' ') keyName = 'Space';
            else if (keyName.length === 1) keyName = keyName.toUpperCase();
            
            keys.push(keyName);
        }
        
        if (keys.length > 1) { // Must have at least one modifier + one key
            this.capturedHotkey = keys.join('+');
            this.hotkeyPreview.textContent = this.formatHotkeyDisplay(this.capturedHotkey);
            this.hotkeyPreview.classList.add('recording');
            this.saveHotkeyBtn.disabled = false;
        }
    }
    
    async saveHotkey() {
        if (!this.capturedHotkey || !this.currentHotkeyType) return;
        
        const newHotkeys = { ...this.settings.hotkeys };
        newHotkeys[this.currentHotkeyType] = this.capturedHotkey;
        
        await this.saveSetting('hotkeys', newHotkeys);
        
        // Update the display
        const inputElement = document.getElementById(this.currentHotkeyType + 'Hotkey');
        inputElement.value = this.formatHotkeyDisplay(this.capturedHotkey);
        
        this.closeHotkeyModal();
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TimerApp();
});

// Cleanup when page unloads
window.addEventListener('beforeunload', () => {
    if (window.electronAPI && window.electronAPI.removeAllListeners) {
        window.electronAPI.removeAllListeners();
    }
});