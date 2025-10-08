// ===== 您的個人化資訊 (已填入) =====
const myLiffId = "2008228791-ZBdVQo59";
const GAS_URL = "https://script.google.com/macros/s/AKfycby3HBNxfg8DvjatRaj9-1ADxQnXPplK60fFdKpstqgE9wuWbal9SXGIDcOGL-eKpLn_tg/exec";
// ===================================

// category 決定了商品屬於哪個優惠組別：Mantou, Baozi, Roll, None
const menu = {
    // ===== 老麵饅頭 (category: Mantou) =====
    "shandong-mantou": { name: "山東饅頭", price: 21, category: "Mantou", imageUrl: "https://via.placeholder.com/120x120?text=山東饅頭" },
    "brown-sugar-mantou": { name: "紅糖饅頭", price: 21, category: "Mantou", imageUrl: "https://via.placeholder.com/120x120?text=紅糖饅頭" },
    "sweet-potato-mantou": { name: "微甜饅頭", price: 21, category: "Mantou", imageUrl: "https://via.placeholder.com/120x120?text=微甜饅頭" }, // 已修正名稱
    "yam-mantou": { name: "芋頭饅頭", price: 21, category: "Mantou", imageUrl: "https://via.placeholder.com/120x120?text=芋頭饅頭" },
    "whole-wheat-mantou": { name: "全麥饅頭", price: 21, category: "Mantou", imageUrl: "https://via.placeholder.com/120x120?text=全麥饅頭" },
    "five-grain-mantou": { name: "五穀雜糧", price: 27, category: "Mantou", imageUrl: "https://via.placeholder.com/120x120?text=五穀雜糧" },
    
    // ===== 老麵包子 (category: Baozi) =====
    "peeled-pepper-bun": { name: "剝皮辣椒包", price: 32, category: "Baozi", imageUrl: "https://via.placeholder.com/120x120?text=剝皮辣椒包" },
    "fresh-meat-bun": { name: "鮮肉包", price: 27, category: "Baozi", imageUrl: "https://via.placeholder.com/120x120?text=鮮肉包" },
    "snow-vegetable-bun": { name: "雪裡紅素包", price: 27, category: "Baozi", imageUrl: "https://via.placeholder.com/120x120?text=雪裡紅素包" },
    "bamboo-shoot-bun": { name: "香椿竹筍包", price: 27, category: "Baozi", imageUrl: "https://via.placeholder.com/120x120?text=香椿竹筍包" },
    "mustard-green-bun": { name: "梅干菜肉包", price: 27, category: "Baozi", imageUrl: "https://via.placeholder.com/120x120?text=梅干菜肉包" },
    "cabbage-bun": { name: "高麗菜包", price: 27, category: "Baozi", imageUrl: "https://via.placeholder.com/120x120?text=高麗菜包" },
    "chive-bun": { name: "蔥花捲", price: 27, category: "Baozi", imageUrl: "https://via.placeholder.com/120x120?text=蔥花捲" },
    "sesame-bun": { name: "芝麻包", price: 27, category: "Baozi", imageUrl: "https://via.placeholder.com/120x120?text=芝麻包" },
    "red-bean-bun": { name: "紅豆包", price: 27, category: "Baozi", imageUrl: "https://via.placeholder.com/120x120?text=紅豆包" },
    "taro-mash-bun": { name: "芋泥地瓜包", price: 27, category: "Baozi", imageUrl: "https://via.placeholder.com/120x120?text=芋泥地瓜包" },
    
    // ===== 起司捲 (category: Roll) - 包含綜合小饅頭 (9入) =====
    "milk-cheese-roll": { name: "牛奶起司捲", price: 32, category: "Roll", imageUrl: "https://via.placeholder.com/120x120?text=牛奶起司捲" },
    "brown-sugar-cheese-roll": { name: "紅糖起司捲", price: 32, category: "Roll", imageUrl: "https://via.placeholder.com/120x120?text=紅糖起司捲" },
    "sausage-roll": { name: "德國香腸起司", price: 32, category: "Roll", imageUrl: "https://via.placeholder.com/120x120?text=德國香腸" },
    "assorted-mini": { name: "綜合起司小饅頭 (9入)", price: 95, category: "Roll", imageUrl: "https://via.placeholder.com/120x120?text=綜合小饅頭" }, // 雖然是小饅頭，但歸類到 Roll 參與優惠
    
    // ===== 小饅頭 (category: None) - 無優惠 =====
    "colorful-mini": { name: "彩色小饅頭 (400克)", price: 145, category: "None", imageUrl: "https://via.placeholder.com/120x120?text=彩色小饅頭" }, // 已修正價格
    "milk-mini": { name: "牛奶小饅頭 (400克)", price: 165, category: "None", imageUrl: "https://via.placeholder.com/120x120?text=牛奶小饅頭" }, // 已修正價格
};

// 設定參加買五送一的分類
const eligibleCategories = [
    { id: "Mantou", name: "老麵饅頭" },
    { id: "Baozi", name: "老麵包子" },
    { id: "Roll", name: "起司捲" }
];

let customerName = "";
let pendingOrder = [];
let freebieGroups = {}; 
let chosenFreebieItems = []; 

document.addEventListener("DOMContentLoaded", function() {
    initializeLiff(myLiffId);
});

async function initializeLiff(liffId) {
    try {
        await liff.init({ liffId: liffId });
        if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            customerName = profile.displayName;
        }
        
        const submitButton = document.getElementById('submit-button');
        if (submitButton) {
            submitButton.addEventListener('click', checkOrderEligibility);
        }

        const quantityButtons = document.querySelectorAll('.qty-btn');
        quantityButtons.forEach(button => {
            button.addEventListener('click', handleQuantityChange);
        });
        
    } catch (err) {
        console.error("LIFF 初始化或事件綁定失敗", err);
    }
}

function handleQuantityChange(event) {
    const button = event.currentTarget;
    const itemId = button.dataset.id;
    const inputElement = document.getElementById(itemId);
    
    if (!inputElement) return;

    let currentQty = parseInt(inputElement.value) || 0;
    
    if (button.classList.contains('plus-btn')) {
        currentQty += 1;
    } else if (button.classList.contains('minus-btn')) {
        currentQty = Math.max(0, currentQty - 1);
    }

    inputElement.value = currentQty;
}


function checkOrderEligibility() {
    pendingOrder = [];
    let totalDiscountItemQty = {}; 
    let totalFreebieCount = 0;

    const eligibleCategoryIds = eligibleCategories.map(c => c.id);

    // 1. 統計訂單總數與分類購買數量
    for (const id in menu) {
        const qty = parseInt(document.getElementById(id).value) || 0;
        if (qty > 0) {
            pendingOrder.push({ id: id, name: menu[id].name, qty: qty, price: menu[id].price, category: menu[id].category });
            
            const category = menu[id].category;
            // 只有在 eligibleCategories 內的商品才需要計數
            if (eligibleCategoryIds.includes(category)) {
                totalDiscountItemQty[category] = (totalDiscountItemQty[category] || 0) + qty;
            }
        }
    }

    if (pendingOrder.length === 0) {
        alert("您尚未選擇任何商品喔！");
        return;
    }

    // 2. 依分類計算贈品數量
    freebieGroups = {};
    for (const categoryId in totalDiscountItemQty) {
        const qty = totalDiscountItemQty[categoryId];
        const freebies = Math.floor(qty / 5);
        if (freebies > 0) {
            freebieGroups[categoryId] = freebies;
            totalFreebieCount += freebies;
        }
    }

    chosenFreebieItems = []; // 清空上次的選擇

    if (totalFreebieCount > 0) {
        // 符合贈品資格，彈出視窗讓客人分批選擇
        showFreebieModal(totalFreebieCount);
    } else {
        // 沒有贈品，直接送出訂單
        submitFinalOrder();
    }
}

// 根據可選贈品數量，調整彈出視窗內容並顯示
function showFreebieModal(totalFreebieCount) {
    const modal = document.getElementById('freebie-modal');
    const modalContent = modal.querySelector('.modal-content');

    // 根據 category 篩選出可選的贈品按鈕
    const generateCategoryOptions = (categoryId) => {
        return Object.entries(menu)
            .filter(([id, item]) => item.category === categoryId)
            .map(([id, item]) => 
                `<button class="freebie-choice-btn" data-item-id="${id}" data-category-id="${categoryId}">${item.name}</button>`
            ).join('');
    };

    let selectionSections = "";
    
    // 為每個符合條件的類別建立選擇區塊
    eligibleCategories.forEach(cat => {
        const count = freebieGroups[cat.id] || 0;
        if (count > 0) {
             const categoryOptions = generateCategoryOptions(cat.id);
             selectionSections += `
                <div class="freebie-group" data-category-id="${cat.id}">
                    <h4>${cat.name}：共 ${count} 顆免費</h4>
                    <p>請選擇您的 ${cat.name} 贈品 (已選: <span class="chosen-count-display" data-category-id="${cat.id}">0</span>/${count})</p>
                    <div class="freebie-options">
                        ${categoryOptions}
                    </div>
                </div>
                <hr style="margin: 15px 0;">
             `;
        }
    });

    let htmlContent = `
        <h3>恭喜您符合買5送1優惠！</h3>
        <p>您共可選擇 <strong id="freebie-remaining">${totalFreebieCount}</strong> 顆免費包子。</p>
        
        ${selectionSections}

        <p style="font-weight: bold;">總計已選擇贈品：<span id="chosen-freebies-summary">無</span></p>
        <button id="confirm-freebie-btn" disabled style="background-color: #aaa;">確認選擇並送出訂單</button>
    `;

    modalContent.innerHTML = htmlContent;

    const remainingSpan = document.getElementById('freebie-remaining');
    const summarySpan = document.getElementById('chosen-freebies-summary');
    const confirmBtn = document.getElementById('confirm-freebie-btn');
    
    let currentFreebieSelection = 0;
    
    let categorySelectionCounts = {};
    Object.keys(freebieGroups).forEach(id => categorySelectionCounts[id] = 0);


    // 綁定選擇按鈕事件
    modal.querySelectorAll('.freebie-choice-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const chosenItemId = event.target.dataset.itemId;
            const categoryId = event.target.dataset.categoryId;
            
            const maxCount = freebieGroups[categoryId];
            
            if (categorySelectionCounts[categoryId] < maxCount) {
                // 1. 紀錄選擇
                chosenFreebieItems.push(chosenItemId);
                categorySelectionCounts[categoryId]++;
                currentFreebieSelection++;
                
                // 2. 更新顯示
                remainingSpan.textContent = totalFreebieCount - currentFreebieSelection;
                
                modal.querySelector(`.chosen-count-display[data-category-id="${categoryId}"]`).textContent = categorySelectionCounts[categoryId];

                // 統計總摘要
                const freebieTally = chosenFreebieItems.reduce((acc, id) => {
                    const name = menu[id].name;
                    acc[name] = (acc[name] || 0) + 1;
                    return acc;
                }, {});

                const summary = Object.entries(freebieTally)
                                        .map(([name, count]) => `${name} x ${count}`)
                                        .join('、');

                summarySpan.textContent = summary;

                // 3. 檢查是否全部選完
                if (currentFreebieSelection === totalFreebieCount) {
                    confirmBtn.disabled = false;
                    confirmBtn.style.backgroundColor = '#00B900';
                }
            } else {
                 alert(`您在【${eligibleCategories.find(c => c.id === categoryId).name}】類別的贈品數量已選完囉！`);
            }
        });
    });

    // 綁定確認送出事件
    confirmBtn.addEventListener('click', () => {
        submitFinalOrder();
    });

    // 顯示彈出視窗
    modal.style.display = 'flex';
}


async function submitFinalOrder() {
    
    const submitButton = document.getElementById('submit-button');
    submitButton.disabled = true;
    submitButton.innerText = "訂單傳送中...";
    
    document.getElementById('freebie-modal').style.display = 'none';

    let subtotal = 0;
    let finalOrderDetails = [];
    
    // 1. 計算商品小計
    pendingOrder.forEach(item => {
        subtotal += item.qty * item.price;
        finalOrderDetails.push(`${item.name} x ${item.qty} (單價 $${item.price})`); 
    });

    let discountAmount = 0;
    
    // 2. 處理贈品折扣 (折扣客人選擇的贈品的總金額)
    if (chosenFreebieItems.length > 0) {
        
        let freebieTotalDiscount = 0;
        let freebieSummary = {}; 
        
        chosenFreebieItems.forEach(id => {
            const freebie = menu[id];
            freebieTotalDiscount += freebie.price;
            freebieSummary[freebie.name] = (freebieSummary[freebie.name] || 0) + 1;
        });

        discountAmount = freebieTotalDiscount;
        
        // 將贈品細節加入摘要
        for (const name in freebieSummary) {
             finalOrderDetails.push(`🎁 贈品: ${name} x ${freebieSummary[name]}`);
        }
    }

    let finalPrice = subtotal - discountAmount;
    let discountText = discountAmount > 0 ? `\n買5送1優惠折扣: -$${discountAmount} 元` : "";

    // 3. 建立最終摘要
    let orderSummary = "--- 您的訂單明細 ---\n";
    orderSummary += finalOrderDetails.join('\n');
    orderSummary += `\n------------------\n商品小計: $${subtotal} 元`;
    orderSummary += discountText;
    orderSummary += `\n總金額: $${finalPrice} 元`;
    orderSummary += "\n------------------";


    const orderData = {
        customerName: customerName,
        orderSummary: orderSummary,
        totalPrice: finalPrice
    };

    try {
        await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (liff.isInClient()) {
            await liff.sendMessages([{
                'type': 'text',
                'text': `【新訂單 - ${customerName}】\n${orderSummary}`
            }]);
            alert("訂單已成功送出並記錄！");
            liff.closeWindow();
        } else {
             alert(`訂單已成功送出並記錄！\n\n${orderSummary}`);
        }
    } catch (error) {
        console.error("傳送訂單失敗:", error);
        alert("傳送訂單失敗，請稍後再試。");
    } finally {
        submitButton.disabled = false;
        submitButton.innerText = "確認送出訂單";
    }
}