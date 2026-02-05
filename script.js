/**
 * Million Click - Main Game Script
 * (تم تحديث رابط الإعلان المباشر - Direct Link Updated)
 */

// --- Game Data ---
const ITEMS = {
    // Power Shop
    'mouse_1': { id: 'mouse_1', name: 'Pro Mouse', type: 'power', cost: 50, effect: 1, desc: '+1 Click Value' },
    'coffee': { id: 'coffee', name: 'Espresso', type: 'power', cost: 250, effect: 5, desc: '+5 Click Value' },
    'keyboard': { id: 'keyboard', name: 'Mechanical Keyboard', type: 'power', cost: 1000, effect: 15, desc: '+15 Click Value' },
    
    // Passive Income Shop
    'lemonade': { id: 'lemonade', name: 'Lemonade Stand', type: 'passive', cost: 100, effect: 2, desc: '+$2/sec' },
    'news': { id: 'news', name: 'Paper Route', type: 'passive', cost: 500, effect: 8, desc: '+$8/sec' },
    'coding': { id: 'coding', name: 'Freelance Gig', type: 'passive', cost: 2000, effect: 25, desc: '+$25/sec' },
    'crypto': { id: 'crypto', name: 'Mining Rig', type: 'passive', cost: 10000, effect: 100, desc: '+$100/sec' },

    // Life Shop
    'apartment': { id: 'apartment', name: 'Studio Apt', type: 'life', cost: 5000, effect: -10, desc: 'Upkeep -$10/sec', bgName: 'Studio Apt' },
    'house': { id: 'house', name: 'Modern Villa', type: 'life', cost: 25000, effect: -50, desc: 'Upkeep -$50/sec', bgName: 'Modern-Villa' },
    'castle': { id: 'castle', name: 'Medieval Castle', type: 'life', cost: 100000, effect: -200, desc: 'Upkeep -$200/sec', bgName: 'Castle' },
    
    // Assets
    'sedan': { id: 'sedan', name: 'Family Sedan', type: 'asset', cost: 2000, effect: -5, desc: 'Cost -$5/sec', imgName: 'Family Sedan' },
    'sportscar': { id: 'sportscar', name: 'Sports Car', type: 'asset', cost: 50000, effect: -100, imgName: 'Sports Car' }
};

const INITIAL_STATE = {
    balance: 0,
    lifetimeEarnings: 0,
    clickCount: 0,
    inventory: {},
    lastTick: Date.now(),
    sessionId: localStorage.getItem('clicker_session') || crypto.randomUUID()
};

// --- إعدادات الإعلان ---
const AD_CONFIG = {
    // تم وضع الرابط الخاص بك هنا
    url: "https://www.effectivegatecpm.com/fgtrsv88h0?key=f440394394ddfb61b10d811ce16ed699",
    duration: 15, // مدة الانتظار بالثواني
    reward: 1000  // قيمة الجائزة
};

function imagePath(name) {
    return `${encodeURIComponent(name)}.jfif`;
}

class GameEngine {
    constructor() {
        this.state = { ...INITIAL_STATE };
        this.adTimerActive = false; 
        
        this.saveSessionId();
        this.initDOM();
        this.loadGame();
        this.startGameLoop();
    }

    saveSessionId() {
        localStorage.setItem('clicker_session', this.state.sessionId);
    }

    initDOM() {
        this.el = {
            balance: document.getElementById('balance'),
            income: document.getElementById('income'),
            expenses: document.getElementById('expenses'),
            shopPanel: document.getElementById('shop-panel'),
            shopToggle: document.getElementById('shop-toggle'),
            closeShop: document.getElementById('close-shop'),
            clickButton: document.getElementById('click-button'),
            clickValueDisplay: document.getElementById('click-value-display'),
            shopItems: document.getElementById('shop-items'),
            background: document.getElementById('background-layer'),
            assets: document.getElementById('assets-layer'),
            bankruptcyModal: document.getElementById('bankruptcy-modal'),
            winModal: document.getElementById('win-modal'),
            tabs: document.querySelectorAll('.tab-btn'),
            rewardBtn: document.getElementById('reward-ad-btn'),
            bailoutBtn: document.getElementById('bailout-btn'),
            restartBtn: document.getElementById('restart-btn'),
            continueBtn: document.getElementById('continue-btn'),
            resetWinBtn: document.getElementById('reset-win-btn')
        };

        this.el.shopToggle.onclick = () => this.toggleShop(true);
        this.el.closeShop.onclick = () => this.toggleShop(false);
        this.el.clickButton.onclick = (e) => this.handleClick(e);
        
        // ربط الأزرار بنظام الفيديو الجديد
        this.el.rewardBtn.onclick = () => this.watchVideoAd(this.el.rewardBtn);
        this.el.bailoutBtn.onclick = () => this.watchVideoAd(this.el.bailoutBtn, true);

        this.el.restartBtn.onclick = () => this.resetGame();
        this.el.continueBtn.onclick = () => this.el.winModal.classList.add('hidden');
        this.el.resetWinBtn.onclick = () => this.resetGame();

        this.el.tabs.forEach(tab => {
            tab.onclick = () => {
                this.el.tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderShop(tab.dataset.tab);
            };
        });

        this.currentTab = 'power';
        this.renderShop(this.currentTab);
        this.updateBackground();
    }

    // --- Video Ad Logic Start ---
    watchVideoAd(btnElement, isBailout = false) {
        if (this.adTimerActive) return;

        // فتح الرابط الخاص بك
        window.open(AD_CONFIG.url, '_blank');

        this.adTimerActive = true;
        let timeLeft = AD_CONFIG.duration;
        const originalText = isBailout ? "Watch Ad for Bailout" : "Watch Ad (+$1,000)";
        
        btnElement.disabled = true;
        btnElement.style.opacity = "0.7";

        const timerInterval = setInterval(() => {
            btnElement.innerText = `Watching... ${timeLeft}s`;
            timeLeft--;

            if (timeLeft < 0) {
                clearInterval(timerInterval);
                this.completeAdReward(btnElement, originalText, isBailout);
            }
        }, 1000);
    }

    completeAdReward(btnElement, originalText, isBailout) {
        this.adTimerActive = false;
        
        this.cheatMoney(AD_CONFIG.reward);
        this.spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2, `+$${AD_CONFIG.reward} Reward!`);

        if (isBailout) {
            this.el.bankruptcyModal.classList.add('hidden');
        }

        btnElement.innerText = "Claimed!";
        btnElement.classList.add('btn-success');
        
        setTimeout(() => {
            btnElement.innerText = originalText;
            btnElement.disabled = false;
            btnElement.style.opacity = "1";
            btnElement.classList.remove('btn-success');
        }, 2000);
    }
    // --- Video Ad Logic End ---

    async loadGame() {
        try {
            const localSave = localStorage.getItem('million_click_save');
            if (localSave) {
                const save = JSON.parse(localSave);
                this.state = { ...this.state, ...save.state };
                this.updateUI();
                this.updateBackground();
                this.renderAssets();
            }
        } catch (e) { console.error(e); }
    }

    async saveGame() {
        localStorage.setItem('million_click_save', JSON.stringify({
            sessionId: this.state.sessionId,
            state: this.state
        }));
    }

    startGameLoop() {
        const tick = () => {
            const now = Date.now();
            const delta = (now - this.state.lastTick) / 1000;
            if (delta >= 0.1) {
                const stats = this.calculateStats();
                const net = (stats.income - stats.expenses) * delta;
                this.state.balance += net;
                if (net > 0) this.state.lifetimeEarnings += net;
                this.state.lastTick = now;
                this.updateUI();
                this.checkBankruptcy();
                this.checkWinCondition();
            }
            if (!this.lastSave || now - this.lastSave > 30000) {
                this.saveGame();
                this.lastSave = now;
            }
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    calculateStats() {
        let income = 0; let expenses = 0; let clickValue = 1;
        Object.entries(this.state.inventory).forEach(([id, count]) => {
            const item = ITEMS[id];
            if (!item) return;
            if (item.type === 'power') clickValue += item.effect * count;
            if (item.type === 'passive') income += item.effect * count;
            if (item.type === 'life' || item.type === 'asset') expenses += Math.abs(item.effect) * count;
        });
        return { income, expenses, clickValue };
    }

    handleClick(e) {
        const stats = this.calculateStats();
        this.state.balance += stats.clickValue;
        this.state.lifetimeEarnings += stats.clickValue;
        this.state.clickCount++;
        this.spawnFloatingText(e.clientX, e.clientY, `+$${stats.clickValue}`);
        this.updateUI();
    }

    spawnFloatingText(x, y, text) {
        const el = document.createElement('div');
        el.className = 'floating-text';
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.innerText = text;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }

    buyItem(id) {
        const item = ITEMS[id];
        if (this.state.balance >= item.cost) {
            this.state.balance -= item.cost;
            this.state.inventory[id] = (this.state.inventory[id] || 0) + 1;
            if (item.type === 'life') this.updateBackground();
            if (item.type === 'asset') this.renderAssets();
            this.renderShop(this.currentTab);
            this.updateUI();
            this.saveGame();
        }
    }

    toggleShop(open) {
        this.el.shopPanel.classList.toggle('hidden', !open);
    }

    renderShop(tab) {
        this.currentTab = tab;
        this.el.shopItems.innerHTML = '';
        const filtered = Object.values(ITEMS).filter(i => {
            if (tab === 'life') return i.type === 'life' || i.type === 'asset';
            return i.type === tab;
        });
        filtered.forEach(item => {
            const count = this.state.inventory[item.id] || 0;
            const div = document.createElement('div');
            div.className = `shop-item ${this.state.balance < item.cost ? 'locked' : ''}`;
            div.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${item.name} (${count})</span>
                    <span class="item-desc">${item.desc}</span>
                    <div class="item-cost">$${item.cost.toLocaleString()}</div>
                </div>
                <button class="btn-primary" ${this.state.balance < item.cost ? 'disabled' : ''}>Buy</button>
            `;
            div.querySelector('button').onclick = () => this.buyItem(item.id);
            this.el.shopItems.appendChild(div);
        });
    }

    updateBackground() {
        let bgName = 'download'; 
        if ((this.state.inventory['castle'] || 0) >= 1 && ITEMS['castle']) bgName = ITEMS['castle'].bgName;
        else if ((this.state.inventory['house'] || 0) >= 1 && ITEMS['house']) bgName = ITEMS['house'].bgName;
        else if ((this.state.inventory['apartment'] || 0) >= 1 && ITEMS['apartment']) bgName = ITEMS['apartment'].bgName;
        this.el.background.style.backgroundImage = `url(${imagePath(bgName)})`;
    }

    renderAssets() {
        this.el.assets.innerHTML = '';
        if (this.state.inventory['apartment']) this.createAssetImg(imagePath(ITEMS['apartment'].bgName), '20%', '10%', '150px');
        if (this.state.inventory['house']) this.createAssetImg(imagePath(ITEMS['house'].bgName), '25%', '70%', '180px');
        if (this.state.inventory['castle']) this.createAssetImg(imagePath(ITEMS['castle'].bgName), '30%', '40%', '250px');

        let carX = 10;
        const sedans = this.state.inventory['sedan'] || 0;
        const sports = this.state.inventory['sportscar'] || 0;
        for (let i = 0; i < sedans; i++) { this.createCarImg(imagePath(ITEMS['sedan'].imgName), carX); carX += 8; }
        for (let i = 0; i < sports; i++) { this.createCarImg(imagePath(ITEMS['sportscar'].imgName), carX); carX += 10; }
    }

    createAssetImg(src, bottom, left, width) {
        const img = document.createElement('img');
        img.src = src; img.className = 'asset-img'; img.style.bottom = bottom; img.style.left = left; img.style.width = width;
        this.el.assets.appendChild(img);
    }

    createCarImg(src, left) {
        const img = document.createElement('img');
        img.src = src; img.className = 'asset-img car-img'; img.style.bottom = '5%'; img.style.left = `${left}%`; img.style.height = '50px'; img.style.width = 'auto';
        this.el.assets.appendChild(img);
    }

    updateUI() {
        const stats = this.calculateStats();
        this.el.balance.innerText = `$${Math.floor(this.state.balance).toLocaleString()}`;
        this.el.income.innerText = `+$${stats.income}/s`;
        this.el.expenses.innerText = `-$${stats.expenses}/s`;
        this.el.clickValueDisplay.innerText = `Click Value: $${stats.clickValue}`;
        if (!this.el.shopPanel.classList.contains('hidden')) {
             const buttons = this.el.shopItems.querySelectorAll('button');
             const items = Object.values(ITEMS).filter(i => {
                if (this.currentTab === 'life') return i.type === 'life' || i.type === 'asset';
                return i.type === this.currentTab;
            });
            buttons.forEach((btn, idx) => {
                const item = items[idx];
                btn.disabled = this.state.balance < item.cost;
                btn.parentElement.classList.toggle('locked', this.state.balance < item.cost);
            });
        }
    }

    checkBankruptcy() { if (this.state.balance < 0) this.el.bankruptcyModal.classList.remove('hidden'); }

    checkWinCondition() {
        const hasCastle = (this.state.inventory['castle'] || 0) >= 1;
        const carCount = (this.state.inventory['sedan'] || 0) + (this.state.inventory['sportscar'] || 0);
        if (hasCastle && carCount >= 5 && !this.winTriggered) {
            this.el.winModal.classList.remove('hidden');
            this.winTriggered = true;
        }
    }

    cheatMoney(amount) { this.state.balance += amount; this.updateUI(); }

    resetGame() {
        this.state = { ...INITIAL_STATE, sessionId: crypto.randomUUID() };
        this.saveSessionId();
        this.winTriggered = false;
        this.el.bankruptcyModal.classList.add('hidden');
        this.el.winModal.classList.add('hidden');
        this.updateBackground();
        this.renderAssets();
        this.updateUI();
        this.saveGame();
    }
}
window.onload = () => { window.game = new GameEngine(); };
