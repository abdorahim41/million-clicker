/**
 * Million Click - Main Game Script
 * (Fixed: Shop Jittering & Updated Logic)
 */

// --- Game Data ---
const ITEMS = {
    // Power Shop (تكرار الشراء)
    'mouse_1': { id: 'mouse_1', name: 'Pro Mouse', type: 'power', cost: 100, effect: 1, desc: '+1 Click Value' },
    'coffee': { id: 'coffee', name: 'Espresso', type: 'power', cost: 500, effect: 5, desc: '+5 Click Value' },
    'keyboard': { id: 'keyboard', name: 'Mechanical Keyboard', type: 'power', cost: 1000, effect: 15, desc: '+15 Click Value' },
    
    // Passive Income Shop (تكرار الشراء)
    'lemonade': { id: 'lemonade', name: 'Lemonade Stand', type: 'passive', cost: 100, effect: 1, desc: '+$1/sec' },
    'news': { id: 'news', name: 'Paper Route', type: 'passive', cost: 500, effect: 8, desc: '+$8/sec' },
    'coding': { id: 'coding', name: 'Freelance Gig', type: 'passive', cost: 2000, effect: 20, desc: '+$20/sec' },
    'crypto': { id: 'crypto', name: 'Mining Rig', type: 'passive', cost: 9999, effect: 100, desc: '+$100/sec' },

    // Life Shop (شراء مرة واحدة - Unique)
    'apartment': { id: 'apartment', name: 'Wooden House', type: 'life', cost: 5000, effect: -100, desc: 'Upkeep -$100/sec', bgName: 'Studio Apt' },
    'house': { id: 'house', name: 'House', type: 'life', cost: 25000, effect: -500, desc: 'Upkeep -$500/sec', bgName: 'Modern-Villa' },
    'castle': { id: 'castle', name: 'Medieval Castle', type: 'life', cost: 100000, effect: -2000, desc: 'Upkeep -$2000/sec', bgName: 'Castle' },
    
    // Assets (شراء مرة واحدة - Unique)
    'sedan': { id: 'sedan', name: 'Family Sedan', type: 'asset', cost: 2000, effect: -50, desc: 'Cost -$50/sec', imgName: 'Family Sedan' },
    'sportscar': { id: 'sportscar', name: 'Sports Car', type: 'asset', cost: 50000, effect: -10000, imgName: 'Sports Car' }
};

// --- INITIAL STATE ---
const INITIAL_STATE = {
    balance: 0,
    lifetimeEarnings: 0,
    clickCount: 0,
    inventory: {},
    lastTick: Date.now(),
    sessionId: localStorage.getItem('clicker_session') || crypto.randomUUID()
};

const AD_CONFIG = {
    url: "https://www.effectivegatecpm.com/fgtrsv88h0?key=f440394394ddfb61b10d811ce16ed699",
    duration: 15,
    reward: 500
};

const BASE_EXPENSE_PER_SECOND = 100 / 60; 

function imagePath(name) {
    return `${encodeURIComponent(name)}.png`;
}

class GameEngine {
    constructor() {
        this.state = { ...INITIAL_STATE };
        this.adTimerActive = false;
        this.graceSeconds = 5; 
        this.graceEnd = Date.now() + this.graceSeconds * 1000;

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

        const winText = this.el.winModal.querySelector('p');
        if (winText) winText.innerText = "You own all Houses and Cars. You are a true Mogul!";

        this.el.shopToggle.onclick = () => this.toggleShop(true);
        this.el.closeShop.onclick = () => this.toggleShop(false);

        // Disable Enter key
        this.el.clickButton.tabIndex = -1;
        this.el.clickButton.onkeydown = (e) => {
            if (e.key === 'Enter') { e.preventDefault(); return false; }
        };
        this.el.clickButton.onclick = (e) => {
            if (e.detail !== 0) this.handleClick(e);
        };
        
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
        // الرسم المبدئي للمتجر مرة واحدة
        this.renderShop(this.currentTab);
        this.updateBackground();
        this.updateUI();
    }

    watchVideoAd(btnElement, isBailout = false) {
        if (this.adTimerActive) return;
        try { window.open(AD_CONFIG.url, '_blank', 'noopener,noreferrer'); } 
        catch (e) { console.warn('blocked', e); }

        this.adTimerActive = true;
        let timeLeft = Math.floor(AD_CONFIG.duration);
        const originalText = isBailout ? "Watch Ad for Bailout" : `Watch Ad (+$${AD_CONFIG.reward})`;
        
        btnElement.disabled = true;
        btnElement.style.opacity = "0.7";
        btnElement.innerText = `Watching... ${timeLeft}s`;

        const timerInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                this.completeAdReward(btnElement, originalText, isBailout);
            } else {
                btnElement.innerText = `Watching... ${timeLeft}s`;
            }
        }, 1000);
    }

    completeAdReward(btnElement, originalText, isBailout) {
        this.adTimerActive = false;
        this.cheatMoney(AD_CONFIG.reward);
        this.spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2, `+$${AD_CONFIG.reward} Reward!`);

        if (isBailout) this.el.bankruptcyModal.classList.add('hidden');

        btnElement.innerText = "Claimed!";
        btnElement.classList.add('btn-success');
        setTimeout(() => {
            btnElement.innerText = originalText;
            btnElement.disabled = false;
            btnElement.style.opacity = "1";
            btnElement.classList.remove('btn-success');
        }, 2000);
    }

    async loadGame() {
        try {
            const localSave = localStorage.getItem('million_click_save');
            if (localSave) {
                const save = JSON.parse(localSave);
                this.state = { ...this.state, ...save.state };
                this.updateUI();
                this.updateBackground();
                this.renderAssets();
                // إعادة رسم المتجر لتحديث حالة Owned بعد التحميل
                this.renderShop(this.currentTab);
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
        let income = 0;
        const now = Date.now();
        const graceActive = now < this.graceEnd;
        let expenses = graceActive ? 0 : BASE_EXPENSE_PER_SECOND; 
        let clickValue = 1;

        Object.entries(this.state.inventory).forEach(([id, count]) => {
            const item = ITEMS[id];
            if (!item) return;
            if (item.type === 'power') clickValue += item.effect * count;
            if (item.type === 'passive') income += item.effect * count;
            if (item.type === 'life' || item.type === 'asset') expenses += Math.abs(item.effect) * count;
        });

        const graceRemaining = Math.max(0, Math.ceil((this.graceEnd - now) / 1000));
        return { income, expenses, clickValue, graceActive, graceRemaining };
    }

    handleClick(e) {
        if (!e || e.detail === 0) return;
        const stats = this.calculateStats();
        this.state.balance += stats.clickValue;
        this.state.lifetimeEarnings += stats.clickValue;
        this.state.clickCount++;
        const x = (e && e.clientX) ? e.clientX : window.innerWidth / 2;
        const y = (e && e.clientY) ? e.clientY : window.innerHeight / 2;
        this.spawnFloatingText(x, y, `+$${stats.clickValue}`);
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
        if ((item.type === 'life' || item.type === 'asset') && (this.state.inventory[id] || 0) >= 1) return;

        if (this.state.balance >= item.cost) {
            this.state.balance -= item.cost;
            this.state.inventory[id] = (this.state.inventory[id] || 0) + 1;
            
            if (item.type === 'life') this.updateBackground();
            if (item.type === 'asset') this.renderAssets();
            
            // نعيد رسم المتجر بالكامل فقط هنا لأن حالة الزر تغيرت (من Buy إلى Owned)
            this.renderShop(this.currentTab);
            this.updateUI();
            this.saveGame();
        }
    }

    toggleShop(open) {
        this.el.shopPanel.classList.toggle('hidden', !open);
        // عند الفتح، تأكد من تحديث الأزرار مرة واحدة
        if (open) {
            this.renderShop(this.currentTab);
        }
    }

    // هذه الدالة تبني المتجر (تستدعى عند الضرورة فقط)
    renderShop(tab) {
        this.currentTab = tab;
        this.el.shopItems.innerHTML = '';
        const filtered = Object.values(ITEMS).filter(i => {
            if (tab === 'life') return i.type === 'life' || i.type === 'asset';
            return i.type === tab;
        });
        filtered.forEach(item => {
            const count = this.state.inventory[item.id] || 0;
            const isUnique = (item.type === 'life' || item.type === 'asset');
            const isOwned = isUnique && count >= 1;

            const div = document.createElement('div');
            div.className = 'shop-item';
            // نستخدم Dataset لربط العنصر بالكود لاحقاً
            div.dataset.id = item.id; 
            div.dataset.cost = item.cost;
            div.dataset.owned = isOwned;

            let buttonText = "Buy";
            let buttonClass = "btn-primary";
            let buttonDisabled = false;

            if (isOwned) {
                buttonText = "Owned";
                buttonClass = "btn-success";
                buttonDisabled = true;
            } else if (this.state.balance < item.cost) {
                // لا نعطل الزر هنا في الـ HTML مباشرة بل نتركه لدالة التحديث، لكن يمكن وضع حالة مبدئية
                // buttonDisabled = true; // (اختياري)
            }

            div.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${item.name} ${!isUnique ? `(${count})` : ''}</span>
                    <span class="item-desc">${item.desc}</span>
                    <div class="item-cost">$${item.cost.toLocaleString()}</div>
                </div>
                <button class="${buttonClass}" ${buttonDisabled ? 'disabled' : ''}>${buttonText}</button>
            `;
            
            if (!buttonDisabled) {
                div.querySelector('button').onclick = () => this.buyItem(item.id);
            }
            
            this.el.shopItems.appendChild(div);
        });
        
        // استدعاء تحديث الأزرار فوراً لضبط حالة التمكين/التعطيل
        this.updateShopButtons();
    }

    // دالة جديدة: تحديث حالة الأزرار فقط (خفيفة جداً، لا تسبب ارتجاج)
    updateShopButtons() {
        if (this.el.shopPanel.classList.contains('hidden')) return;

        const shopItems = this.el.shopItems.querySelectorAll('.shop-item');
        shopItems.forEach(div => {
            const cost = parseInt(div.dataset.cost);
            const isOwned = div.dataset.owned === 'true';
            const btn = div.querySelector('button');
            
            if (!isOwned) {
                if (this.state.balance < cost) {
                    btn.disabled = true;
                    div.classList.add('locked');
                } else {
                    btn.disabled = false;
                    div.classList.remove('locked');
                }
            }
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
        const sedans = this.state.inventory['sedan'] || 0;
        const sports = this.state.inventory['sportscar'] || 0;
        if (sedans > 0) this.createCarImg(imagePath(ITEMS['sedan'].imgName), 15); 
        if (sports > 0) this.createCarImg(imagePath(ITEMS['sportscar'].imgName), 35); 
    }

    createCarImg(src, left) {
        const img = document.createElement('img');
        img.src = src; img.className = 'asset-img car-img'; img.style.bottom = '5%'; img.style.left = `${left}%`; img.style.height = '400px'; img.style.width = 'auto';
        this.el.assets.appendChild(img);
    }

    updateUI() {
        const stats = this.calculateStats();
        this.el.balance.innerText = `$${Math.floor(this.state.balance).toLocaleString()}`;
        this.el.income.innerText = `+$${stats.income}/s`;

        if (stats.graceActive) {
            this.el.expenses.innerText = `-$${stats.expenses}/s (grace ${stats.graceRemaining}s)`;
        } else {
            this.el.expenses.innerText = `-$${stats.expenses.toFixed(2)}/s (Base: $${BASE_EXPENSE_PER_SECOND.toFixed(2)}/s)`;
        }

        this.el.clickValueDisplay.innerText = `Click Value: $${stats.clickValue}`;
        
        // استبدلنا renderShop بـ updateShopButtons لمنع الارتجاج
        this.updateShopButtons();
    }

    checkBankruptcy() { if (Date.now() >= this.graceEnd && this.state.balance < 0) this.el.bankruptcyModal.classList.remove('hidden'); }

    checkWinCondition() {
        const requiredIds = ['apartment', 'house', 'castle', 'sedan', 'sportscar'];
        const hasAll = requiredIds.every(id => (this.state.inventory[id] || 0) >= 1);
        if (hasAll && !this.winTriggered) {
            this.el.winModal.classList.remove('hidden');
            this.winTriggered = true;
        }
    }

    cheatMoney(amount) { this.state.balance += amount; this.updateUI(); }

    

    resetGame() {
        this.state = { ...INITIAL_STATE, sessionId: crypto.randomUUID() };
        this.graceEnd = Date.now() + this.graceSeconds * 1000;
        this.saveSessionId();
        this.winTriggered = false;
        this.el.bankruptcyModal.classList.add('hidden');
        this.el.winModal.classList.add('hidden');
        this.updateBackground();
        this.renderAssets();
        this.updateUI();
        this.renderShop(this.currentTab);
        this.saveGame();
    }
}
window.onload = () => { window.game = new GameEngine(); };
