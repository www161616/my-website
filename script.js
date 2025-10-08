// ===== 您的個人化資訊 (已填入) =====
const myLiffId = "2008228791-ZBdVQo59";
const GAS_URL = "https://script.google.com/macros/s/AKfycby3HBNxfg8DvjatRaj9-1ADxQnXPplK60fFdKpstqgE9wuWbal9SXGIDcOGL-eKpLn_tg/exec";
// ===================================

const menu = {
    "shandong-mantou": { name: "山東饅頭", price: 21, category: "Mantou" },
    "brown-sugar-mantou": { name: "紅糖饅頭", price: 21, category: "Mantou" },
    "sweet-potato-mantou": { name: "微甜饅頭", price: 21, category: "Mantou" },
    "yam-mantou": { name: "芋頭饅頭", price: 21, category: "Mantou" },
    "whole-wheat-mantou": { name: "全麥饅頭", price: 21, category: "Mantou" },
    "five-grain-mantou": { name: "五穀雜糧", price: 27, category: "Mantou" },
    "peeled-pepper-bun": { name: "剝皮辣椒包", price: 32, category: "Baozi" },
    "fresh-meat-bun": { name: "鮮肉包", price: 27, category: "Baozi" },
    "snow-vegetable-bun": { name: "雪裡紅素包", price: 27, category: "Baozi" },
    "bamboo-shoot-bun": { name: "香椿竹筍包", price: 27, category: "Baozi" },
    "mustard-green-bun": { name: "梅干菜肉包", price: 27, category: "Baozi" },
    "cabbage-bun": { name: "高麗菜包", price: 27, category: "Baozi" },
    "chive-bun": { name: "蔥花捲", price: 27, category: "Baozi" },
    "sesame-bun": { name: "芝麻包", price: 27, category: "Baozi" },
    "red-bean-bun": { name: "紅豆包", price: 27, category: "Baozi" },
    "taro-mash-bun": { name: "芋泥地瓜包", price: 27, category: "Baozi" },
    "milk-cheese-roll": { name: "牛奶起司捲", price: 32, category: "Roll" },
    "brown-sugar-cheese-roll": { name: "紅糖起司捲", price: 32, category: "Roll" },
    "sausage-roll": { name: "德國香腸起司", price: 32, category: "Roll" },
    "assorted-mini": { name: "綜合起司小饅頭 (9入)", price: 95, category: "Roll" },
    "colorful-mini": { name: "彩色小饅頭 (400克)", price: 145, category: "None" },
    "milk-mini": { name: "牛奶小饅頭 (400克)", price: 165, category: "None" },
};

const eligibleCategories = [
    { id: "Mantou", name: "老麵饅頭" },
    { id: "Baozi", name: "老麵包子" },
    { id: "Roll", name: "起司捲" }
];

let customerName = "";
let pendingOrder = [];
let freebieGroups = {};
let chosenFreebieItems = [];

document.addEventListener("DOMContentLoaded", () => initializeLiff(myLiffId));

async function initializeLiff(liffId) {
    try {
        await liff.init({ liffId });
        if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            customerName = profile.displayName;
        }
        document.getElementById("submit-button").addEventListener("click", checkOrderEligibility);
        document.querySelectorAll(".qty-btn").forEach(btn => btn.addEventListener("click", handleQuantityChange));
    } catch (err) {
        console.error("LIFF 初始化失敗", err);
    }
}

function handleQuantityChange(e) {
    const btn = e.currentTarget;
    const id = btn.dataset.id;
    const input = document.getElementById(id);
    if (!input) return;
    let val = parseInt(input.value) || 0;
    if (btn.classList.contains("plus-btn")) val++;
    else if (btn.classList.contains("minus-btn")) val = Math.max(0, val - 1);
    input.value = val;
}

function checkOrderEligibility() {
    pendingOrder = [];
    let totalDiscountItemQty = {};
    let totalFreebieCount = 0;

    const eligibleIds = eligibleCategories.map(c => c.id);
    for (const id in menu) {
        const el = document.getElementById(id);
        if (!el) continue;
        const qty = parseInt(el.value) || 0;
        if (qty > 0) {
            pendingOrder.push({ ...menu[id], qty });
            if (eligibleIds.includes(menu[id].category)) {
                totalDiscountItemQty[menu[id].category] = (totalDiscountItemQty[menu[id].category] || 0) + qty;
            }
        }
    }

    if (pendingOrder.length === 0) {
        alert("您尚未選擇任何商品喔！");
        return;
    }

    freebieGroups = {};
    for (const cat in totalDiscountItemQty) {
        const count = Math.floor(totalDiscountItemQty[cat] / 5);
        if (count > 0) freebieGroups[cat] = count, totalFreebieCount += count;
    }

    chosenFreebieItems = [];
    totalFreebieCount > 0 ? showFreebieModal(totalFreebieCount) : submitFinalOrder();
}

// ===== ✅ 改良版贈品彈窗控制 =====
function showFreebieModal(totalFreebieCount) {
    const modal = document.getElementById("freebie-modal");
    const modalContent = modal.querySelector(".modal-content");

    const generateCategoryOptions = catId =>
        Object.entries(menu)
            .filter(([_, item]) => item.category === catId)
            .map(([id, item]) => `<button class="freebie-choice-btn" data-item-id="${id}" data-category-id="${catId}">${item.name}</button>`)
            .join("");

    let sections = "";
    eligibleCategories.forEach(cat => {
        const count = freebieGroups[cat.id] || 0;
        if (count > 0)
            sections += `
                <div class="freebie-group" data-category-id="${cat.id}">
                    <h4>${cat.name}：共 ${count} 顆免費</h4>
                    <p>請選擇您的贈品 (已選: <span class="chosen-count-display" data-category-id="${cat.id}">0</span>/${count})</p>
                    <div class="freebie-options">${generateCategoryOptions(cat.id)}</div>
                </div>
                <hr style="margin:10px 0;">
            `;
    });

    modalContent.innerHTML = `
        <h3>恭喜您符合買5送1優惠！</h3>
        <p>您共可選擇 <strong id="freebie-remaining">${totalFreebieCount}</strong> 顆免費包子。</p>
        ${sections}
        <p style="font-weight:bold;">總計已選擇贈品：<span id="chosen-freebies-summary">無</span></p>
        <div>
            <button id="reset-freebie-btn" style="background:#aaa;color:white;padding:10px;border:none;border-radius:8px;font-weight:bold;">取消所有贈品</button>
            <button id="confirm-freebie-btn" disabled style="background:#aaa;color:white;padding:10px;border:none;border-radius:8px;font-weight:bold;">確認送出訂單</button>
        </div>
    `;

    // ✅ 動畫顯示 + 鎖背景
    document.body.classList.add("modal-open");
    modal.classList.add("show");

    const remaining = document.getElementById("freebie-remaining");
    const summary = document.getElementById("chosen-freebies-summary");
    const confirm = document.getElementById("confirm-freebie-btn");
    const reset = document.getElementById("reset-freebie-btn");

    let currentTotal = 0;
    let categoryCount = {};
    Object.keys(freebieGroups).forEach(id => (categoryCount[id] = 0));

    modal.querySelectorAll(".freebie-choice-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const itemId = btn.dataset.itemId;
            const catId = btn.dataset.categoryId;
            const maxCat = freebieGroups[catId];

            if (categoryCount[catId] < maxCat && currentTotal < totalFreebieCount) {
                chosenFreebieItems.push(itemId);
                categoryCount[catId]++;
                currentTotal++;

                btn.classList.add("selected");
                btn.textContent = `${menu[itemId].name} (${chosenFreebieItems.filter(i => i === itemId).length})`;
            } else {
                alert("此分類或總數已達上限！");
            }

            updateFreebieModalUI(totalFreebieCount, currentTotal, categoryCount, chosenFreebieItems, remaining, summary, confirm);
        });
    });

    reset.addEventListener("click", () => {
        chosenFreebieItems = [];
        currentTotal = 0;
        Object.keys(categoryCount).forEach(id => (categoryCount[id] = 0));
        modal.querySelectorAll(".freebie-choice-btn").forEach(b => {
            b.classList.remove("selected");
            b.textContent = menu[b.dataset.itemId].name;
        });
        updateFreebieModalUI(totalFreebieCount, currentTotal, categoryCount, chosenFreebieItems, remaining, summary, confirm);
    });

    confirm.addEventListener("click", () => {
        closeFreebieModal();
        submitFinalOrder();
    });
}

function closeFreebieModal() {
    const modal = document.getElementById("freebie-modal");
    modal.classList.remove("show");
    document.body.classList.remove("modal-open");
    setTimeout(() => (modal.style.display = "none"), 300); // 動畫結束後關閉
}

function updateFreebieModalUI(total, current, catCount, chosen, remaining, summary, confirm) {
    remaining.textContent = total - current;

    Object.keys(catCount).forEach(id => {
        const el = document.querySelector(`.chosen-count-display[data-category-id="${id}"]`);
        if (el) el.textContent = catCount[id];
    });

    const tally = chosen.reduce((a, id) => ((a[menu[id].name] = (a[menu[id].name] || 0) + 1), a), {});
    const text = Object.entries(tally).map(([n, c]) => `${n} x ${c}`).join("、");
    summary.textContent = text || "無";

    confirm.disabled = current !== total;
    confirm.style.backgroundColor = confirm.disabled ? "#aaa" : "#00B900";
}

// ===== 傳送訂單到 GAS =====
async function submitFinalOrder() {
    const submitButton = document.getElementById("submit-button");
    submitButton.disabled = true;
    submitButton.innerText = "訂單傳送中...";

    let subtotal = 0;
    let details = [];
    pendingOrder.forEach(i => {
        subtotal += i.qty * i.price;
        details.push(`${i.name} x ${i.qty} (單價 $${i.price})`);
    });

    let discount = 0;
    if (chosenFreebieItems.length > 0) {
        let freebieTotal = 0;
        let summary = {};
        chosenFreebieItems.forEach(id => {
            freebieTotal += menu[id].price;
            summary[menu[id].name] = (summary[menu[id].name] || 0) + 1;
        });
        discount = freebieTotal;
        for (const name in summary) details.push(`🎁 贈品: ${name} x ${summary[name]}`);
    }

    const final = subtotal - discount;
    let orderSummary = `--- 您的訂單明細 ---\n${details.join("\n")}\n------------------\n商品小計: $${subtotal} 元${
        discount ? `\n買5送1折扣: -$${discount} 元` : ""
    }\n總金額: $${final} 元\n------------------`;

    const data = { customerName, orderSummary, totalPrice: final };

    try {
        await fetch(GAS_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (liff.isInClient()) {
            await liff.sendMessages([{ type: "text", text: `【新訂單 - ${customerName}】\n${orderSummary}` }]);
            alert("訂單已成功送出並記錄！");
            liff.closeWindow();
        } else alert(`訂單已成功送出並記錄！\n\n${orderSummary}`);
    } catch (err) {
        console.error("傳送訂單失敗:", err);
        alert("傳送訂單失敗，請稍後再試。");
    } finally {
        submitButton.disabled = false;
        submitButton.innerText = "確認送出訂單";
    }
}
