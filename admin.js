import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-analytics.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    query,
    orderBy,
    limit,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey:            "AIzaSyAtLfoS6Sas1SrGQnI3pIXMZ8EzehQKt3A",
    authDomain:        "creator-cstudios-9b0a3.firebaseapp.com",
    projectId:         "creator-cstudios-9b0a3",
    storageBucket:     "creator-cstudios-9b0a3.firebasestorage.app",
    messagingSenderId: "130486556837",
    appId:             "1:130486556837:web:bb4f6a94273df6d717d54c",
    measurementId:     "G-625LYCK2CP"
};

const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth      = getAuth(app);
const db        = getFirestore(app);

const loginBox   = document.getElementById("login-box");
const dashboard  = document.getElementById("dashboard");
const wrapper    = document.getElementById("admin-wrapper");
const emailInput = document.getElementById("email-input");
const passInput  = document.getElementById("password-input");
const errorEl    = document.getElementById("login-error");
const loginBtn   = document.getElementById("login-btn");
const logoutBtn  = document.getElementById("logout-btn");

const RARITY_COLORS = {
    Common:    "#9ca3af",
    Uncommon:  "#4ade80",
    Rare:      "#60a5fa",
    Legendary: "#f97316",
    Mythic:    "#e879f9"
};

let unsubscribeTrade = null;
let unsubscribeGift  = null;
let cachedTradeLogs  = [];
let cachedGiftLogs   = [];
let tradeSearch      = "";
let giftSearch       = "";
let activeTab        = "trade";

window.switchTab = function(tab) {
    activeTab = tab;
    document.getElementById("tab-trade").classList.toggle("active", tab === "trade");
    document.getElementById("tab-gift").classList.toggle("active", tab === "gift");
    document.getElementById("panel-trade").classList.toggle("active", tab === "trade");
    document.getElementById("panel-gift").classList.toggle("active", tab === "gift");
};

function showDashboard() {
    loginBox.style.display       = "none";
    dashboard.style.display      = "block";
    wrapper.style.justifyContent = "flex-start";
    wrapper.style.alignItems     = "center";
    loadTradeLogs();
    loadGiftLogs();
}

function showLogin() {
    loginBox.style.display       = "block";
    dashboard.style.display      = "none";
    wrapper.style.justifyContent = "center";
    wrapper.style.alignItems     = "center";
    if (unsubscribeTrade) { unsubscribeTrade(); unsubscribeTrade = null; }
    if (unsubscribeGift)  { unsubscribeGift();  unsubscribeGift  = null; }
}

function loadTradeLogs() {
    const q = query(
        collection(db, "tradeLogs"),
        orderBy("timestamp", "desc"),
        limit(200)
    );
    unsubscribeTrade = onSnapshot(q, snapshot => {
        cachedTradeLogs = snapshot.docs.map(d => d.data());
        renderTradeLogs(applySearch(cachedTradeLogs, tradeSearch));
    }, err => {
        console.error("Firestore trade log error:", err);
        document.getElementById("trade-log-list").innerHTML =
            '<p class="trade-log-empty">Failed to load trade logs. Check Firestore rules.</p>';
    });
}

function loadGiftLogs() {
    const q = query(
        collection(db, "giftLogs"),
        orderBy("timestamp", "desc"),
        limit(200)
    );
    unsubscribeGift = onSnapshot(q, snapshot => {
        cachedGiftLogs = snapshot.docs.map(d => d.data());
        renderGiftLogs(applySearch(cachedGiftLogs, giftSearch));
    }, err => {
        console.error("Firestore gift log error:", err);
        document.getElementById("gift-log-list").innerHTML =
            '<p class="trade-log-empty">Failed to load gift logs. Check Firestore rules.</p>';
    });
}

function fuzzyMatch(query, target) {
    if (!query) return true;
    if (!target) return false;
    const q = query.toLowerCase();
    const t = String(target).toLowerCase();
    if (t.includes(q)) return true;
    let qi = 0;
    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
        if (t[ti] === q[qi]) qi++;
    }
    return qi === q.length;
}

function applySearch(logs, rawQuery) {
    const q = (rawQuery || "").trim();
    if (!q) return logs;
    return logs.filter(log =>
        fuzzyMatch(q, log.playerAName)    ||
        fuzzyMatch(q, log.playerBName)    ||
        fuzzyMatch(q, log.playerAUserId)  ||
        fuzzyMatch(q, log.playerBUserId)  ||
        fuzzyMatch(q, log.buyerName)      ||
        fuzzyMatch(q, log.buyerUserId)    ||
        fuzzyMatch(q, log.gifteeName)     ||
        fuzzyMatch(q, log.gifteeUserId)   ||
        fuzzyMatch(q, log.perkId)
    );
}

function renderTradeLogs(logs) {
    const list = document.getElementById("trade-log-list");

    if (logs.length === 0) {
        const msg = tradeSearch.trim()
            ? "No matches for this search."
            : "No trade logs yet.";
        list.innerHTML = `<p class="trade-log-empty">${msg}</p>`;
        return;
    }

    list.innerHTML = logs.map(log => {
        const accentColor = RARITY_COLORS[log.topRarity] || RARITY_COLORS.Common;
        const dateStr     = log.timestamp
            ? formatTimestamp(log.timestamp)
            : "Unknown time";

        const nameA = esc(log.playerAName || "Unknown");
        const nameB = esc(log.playerBName || "Unknown");
        const idA   = esc(log.playerAUserId || "");
        const idB   = esc(log.playerBUserId || "");

        const offerAText = esc(log.offerAFormatted || log.offerA || "Nothing");
        const offerBText = esc(log.offerBFormatted || log.offerB || "Nothing");

        return `
        <div class="tl-card">
            <div class="tl-card-accent" style="background:${accentColor}"></div>
            <div class="tl-card-body">
                <div class="tl-card-title">Trade Completed</div>
                <div class="tl-players">
                    <div class="tl-player-name">
                        <span class="tl-dot" style="background:#3b82f6"></span>${nameB} (${idB})
                    </div>
                    <div class="tl-player-name">
                        <span class="tl-dot" style="background:#ef4444"></span>${nameA} (${idA})
                    </div>
                </div>
                <div class="tl-divider"></div>
                <div class="tl-offers">
                    <div>
                        <div class="tl-offer-label">${nameB} gave</div>
                        <div class="tl-offer-items">${offerBText}</div>
                    </div>
                    <div>
                        <div class="tl-offer-label">${nameA} gave</div>
                        <div class="tl-offer-items">${offerAText}</div>
                    </div>
                </div>
                <div class="tl-footer">Weapon X Simulator — Trade Log &bull; ${dateStr}</div>
            </div>
        </div>`;
    }).join("");
}

function renderGiftLogs(logs) {
    const list = document.getElementById("gift-log-list");

    if (logs.length === 0) {
        const msg = giftSearch.trim()
            ? "No matches for this search."
            : "No gift logs yet.";
        list.innerHTML = `<p class="trade-log-empty">${msg}</p>`;
        return;
    }

    list.innerHTML = logs.map(log => {
        const dateStr    = log.timestamp ? formatTimestamp(log.timestamp) : "Unknown time";
        const buyer      = esc(log.buyerName    || "Unknown");
        const giftee     = esc(log.gifteeName   || "Unknown");
        const buyerId    = esc(log.buyerUserId  ?? "");
        const gifteeId   = esc(log.gifteeUserId ?? "");
        const perkId     = esc(log.perkId       || "Unknown");
        const success    = log.success === true;
        const failReason = esc(log.failReason   || "");

        const accentColor  = success ? "#4ade80" : "#f87171";
        const statusLabel  = success
            ? `<span style="color:#4ade80;font-weight:700;">✓ Success</span>`
            : `<span style="color:#f87171;font-weight:700;">✗ Failed</span>`;
        const failRow = !success && failReason
            ? `<div class="tl-offer-label" style="margin-top:8px;color:#f87171;">Fail Reason: <span style="font-weight:400;color:rgba(255,255,255,0.65)">${failReason}</span></div>`
            : "";

        return `
        <div class="tl-card">
            <div class="tl-card-accent" style="background:${accentColor}"></div>
            <div class="tl-card-body">
                <div class="tl-card-title">Purchase / Gift &nbsp;${statusLabel}</div>
                <div class="tl-players">
                    <div class="tl-player-name">
                        <span class="tl-dot" style="background:#a78bfa"></span>${buyer} (${buyerId})
                    </div>
                    <div class="tl-player-name">
                        <span class="tl-dot" style="background:#f9a8d4"></span>${giftee} (${gifteeId})
                    </div>
                </div>
                <div class="tl-divider"></div>
                <div class="tl-offers">
                    <div>
                        <div class="tl-offer-label">Buyer</div>
                        <div class="tl-offer-items">${buyer}</div>
                    </div>
                    <div>
                        <div class="tl-offer-label">Perk Gifted</div>
                        <div class="tl-offer-items">${perkId}</div>
                    </div>
                </div>
                ${failRow}
                <div class="tl-footer">Weapon X Simulator — Gift Log &bull; ${dateStr}</div>
            </div>
        </div>`;
    }).join("");
}

function formatTimestamp(iso) {
    const d     = new Date(iso);
    const today = new Date();
    const isToday =
        d.getDate()     === today.getDate()   &&
        d.getMonth()    === today.getMonth()  &&
        d.getFullYear() === today.getFullYear();

    const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return isToday
        ? `Today at ${time}`
        : `${d.toLocaleDateString([], { month: "short", day: "numeric" })} at ${time}`;
}

function esc(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

onAuthStateChanged(auth, user => {
    if (user) showDashboard();
    else       showLogin();
});

loginBtn.addEventListener("click", async () => {
    const email    = emailInput.value.trim();
    const password = passInput.value;
    errorEl.textContent = "";

    if (!email || !password) {
        errorEl.textContent = "Enter email and password.";
        return;
    }

    loginBtn.disabled    = true;
    loginBtn.textContent = "Signing in…";

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
        loginBtn.disabled    = false;
        loginBtn.textContent = "Sign In";
        errorEl.textContent  = friendlyError(err.code);
    }
});

passInput.addEventListener("keydown", e => {
    if (e.key === "Enter") loginBtn.click();
});

logoutBtn.addEventListener("click", () => signOut(auth));

const tradeSearchInput = document.getElementById("trade-log-search");
tradeSearchInput.addEventListener("input", e => {
    tradeSearch = e.target.value;
    renderTradeLogs(applySearch(cachedTradeLogs, tradeSearch));
});

const giftSearchInput = document.getElementById("gift-log-search");
giftSearchInput.addEventListener("input", e => {
    giftSearch = e.target.value;
    renderGiftLogs(applySearch(cachedGiftLogs, giftSearch));
});

function friendlyError(code) {
    switch (code) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":  return "Incorrect email or password.";
        case "auth/too-many-requests": return "Too many attempts. Try again later.";
        case "auth/network-request-failed": return "Network error. Check your connection.";
        default: return "Sign-in failed. Try again.";
    }
}
