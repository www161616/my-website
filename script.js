// ✅ 防止雙指縮放／雙擊放大
document.addEventListener("touchstart", e => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

// ✅ 個人化設定
const myLiffId = "2008228791-ZBdVQo59";
const GAS_URL = "https://script.google.com/macros/s/AKfycby3HBNxfg8DvjatRaj9-1ADxQnXPplK60fFdKpstqgE9wuWbal9SXGIDcOGL-eKpLn_tg/exec";

// ✅ 商品清單
const menu = {
  // === 老麵饅頭 ===
  "shandong-mantou": { name: "山東饅頭", price: 21, category: "Mantou" },
  "brown-sugar-mantou": { name: "紅糖饅頭", price: 21, category: "Mantou" },
  "sweet-potato-mantou": { name: "微甜饅頭", price: 21, category: "Mantou" },
  "yam-mantou": { name: "芋頭饅頭", price: 21, category: "Mantou" },
  "whole-wheat-mantou": { name: "全麥饅頭", price: 21, category: "Mantou" },
  "five-grain-mantou": { name: "五穀雜糧", price: 27, category: "Mantou" },

  // === 老麵包子 ===
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

  // === 起司捲 ===
  "milk-cheese-roll": { name: "牛奶起司捲", price: 32, category: "Roll" },
  "brown-sugar-cheese-roll": { name: "紅糖起司捲", price: 32, category: "Roll" },
  "sausage-roll": { name: "德國香腸起司", price: 32, category: "Roll" },
  "assorted-mini": { name: "綜合起司小饅頭 (9入)", price: 95, category: "Roll", noFreebie: true },

  // === 小饅頭 (不參與優惠) ===
  "colorful-mini": { name: "彩色小饅頭 (400克)", price: 145, category: "None", noFreebie: true },
  "milk-mini": { name: "牛奶小饅頭 (400克)", price: 165, category: "None", noFreebie: true },
};

let customerName = "";
let pendingOrder = [];
let chosenFreebieItems = [];

// ===========================================
document.addEventListener("DOMContentLoaded", () => initializeLiff(myLiffId));

// ===== 初始化 LIFF =====
async function initializeLiff(liffId) {
  try {
    await liff.init({ liffId });
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      customerName = profile.displayName;
    }

    document.getElementById("submit-button").addEventListener("click", checkOrderEligibility);
    document.querySelectorAll(".qty-btn").forEach(btn => {
      btn.addEventListener("click", handleQuantityChange);

      // ✅ 長按連續加減
      let interval;
      btn.addEventListener("touchstart", () => {
        interval = setInterval(() => btn.click(), 120);
      });
      btn.addEventListener("touchend", () => clearInterval(interval));
      btn.addEventListener("touchcancel", () => clearInterval(interval));
    });
  } catch (err) {
    console.error("LIFF 初始化失敗", err);
  }
}

// ===== 數量加減 =====
function handleQuantityChange(e) {
  const btn = e.currentTarget;
  const id = btn.dataset.id;
  const input = document.getElementById(id);
  if (!input) return;

  let val = parseInt(input.value) || 0;
  btn.classList.add("btn-tap");
  setTimeout(() => btn.classList.remove("btn-tap"), 150);

  if (btn.classList.contains("plus-btn")) val++;
  else if (btn.classList.contains("minus-btn")) val = Math.max(0, val - 1);

  input.value = val;
}

// ===== 判斷優惠 =====
function checkOrderEligibility() {
  pendingOrder = [];
  let eligibleTotal = 0;

  for (const id in menu) {
    const el = document.getElementById(id);
    if (!el) continue;
    const qty = parseInt(el.value) || 0;

    if (qty > 0) {
      pendingOrder.push({ ...menu[id], qty });

      // ✅ 排除三項不參與買5送1的商品
      if (
        ["Mantou", "Baozi", "Roll"].includes(menu[id].category) &&
        !menu[id].noFreebie &&
        id !== "colorful-mini" &&
        id !== "milk-mini"
      ) {
        eligibleTotal += qty;
      }
    }
  }

  if (pendingOrder.length === 0) {
    alert("您尚未選擇任何商品喔！");
    return;
  }

  const totalFreebieCount = Math.floor(eligibleTotal / 5);
  chosenFreebieItems = [];

  if (totalFreebieCount > 0) {
    showFreebieModal(totalFreebieCount);
  } else {
    if (eligibleTotal > 0 && eligibleTotal < 5) {
      alert(`目前已選 ${eligibleTotal} 顆，再買 ${5 - eligibleTotal} 顆即可多送 1 顆 🎁`);
    }
    submitFinalOrder();
  }
}

// ===== 贈品彈窗 =====
function showFreebieModal(totalFreebieCount) {
  const modal = document.getElementById("freebie-modal");
  const modalContent = modal.querySelector(".modal-content");

  // ✅ 贈品不包含綜合起司小饅頭、彩色小饅頭、牛奶小饅頭
  const freebieList = Object.entries(menu)
    .filter(([id, item]) =>
      ["Mantou", "Baozi", "Roll"].includes(item.category) &&
      !item.noFreebie &&
      id !== "colorful-mini" &&
      id !== "milk-mini"
    )
    .map(([id, item]) => `<button class="freebie-choice-btn" data-item-id="${id}">${item.name}</button>`)
    .join("");

  modalContent.innerHTML = `
    <h3>🎉 恭喜您符合買5送1優惠！</h3>
    <p>您可選擇 <strong id="freebie-remaining">${totalFreebieCount}</strong> 顆免費商品。</p>
    <div class="freebie-options">${freebieList}</div>
    <p style="font-weight:bold;">已選擇：<span id="chosen-freebies-summary">無</span></p>
    <div style="display:flex;justify-content:space-around;margin-top:15px;">
      <button id="reset-freebie-btn" style="background:#bbb;color:white;padding:12px 18px;border:none;border-radius:8px;font-weight:bold;font-size:1.1em;">取消所有贈品</button>
      <button id="confirm-freebie-btn" disabled style="background:#aaa;color:white;padding:12px 18px;border:none;border-radius:8px;font-weight:bold;font-size:1.1em;">確認送出訂單</button>
    </div>
  `;

  document.body.classList.add("modal-open");
  modal.classList.add("show");

  const remaining = document.getElementById("freebie-remaining");
  const summary = document.getElementById("chosen-freebies-summary");
  const confirm = document.getElementById("confirm-freebie-btn");
  const reset = document.getElementById("reset-freebie-btn");

  let currentTotal = 0;

  modal.querySelectorAll(".freebie-choice-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const itemId = btn.dataset.itemId;

      if (currentTotal < totalFreebieCount) {
        chosenFreebieItems.push(itemId);
        currentTotal++;
        btn.classList.add("selected");
        btn.textContent = `${menu[itemId].name} (${chosenFreebieItems.filter(i => i === itemId).length})`;
      } else {
        btn.classList.add("shake");
        setTimeout(() => btn.classList.remove("shake"), 400);
      }

      updateFreebieModalUI(totalFreebieCount, currentTotal, chosenFreebieItems, remaining, summary, confirm);
    });
  });

  reset.addEventListener("click", () => {
    chosenFreebieItems = [];
    currentTotal = 0;
    modal.querySelectorAll(".freebie-choice-btn").forEach(b => {
      b.classList.remove("selected");
      b.textContent = menu[b.dataset.itemId].name;
    });
    updateFreebieModalUI(totalFreebieCount, currentTotal, chosenFreebieItems, remaining, summary, confirm);
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
  setTimeout(() => {
    modal.style.display = "none";
    modal.querySelector(".modal-content").innerHTML = "";
  }, 300);
}

function updateFreebieModalUI(total, current, chosen, remaining, summary, confirm) {
  remaining.textContent = total - current;
  const tally = chosen.reduce((a, id) => ((a[menu[id].name] = (a[menu[id].name] || 0) + 1), a), {});
  const text = Object.entries(tally).map(([n, c]) => `${n} x ${c}`).join("、");
  summary.textContent = text || "無";
  confirm.disabled = current !== total;
  confirm.style.backgroundColor = confirm.disabled ? "#aaa" : "#00B900";
}

// ===== 傳送訂單 =====
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
      alert("✅ 訂單已成功送出並記錄！");
      liff.closeWindow();
    } else {
      alert(`✅ 訂單已成功送出並記錄！\n\n${orderSummary}`);
    }
  } catch (err) {
    console.error("傳送訂單失敗:", err);
    alert("⚠️ 傳送訂單失敗，請稍後再試。");
  } finally {
    submitButton.disabled = false;
    submitButton.innerText = "確認送出訂單";
  }
}
