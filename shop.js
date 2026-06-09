const CART_KEY = "weasleysCart";
const ORDER_KEY = "weasleysOrder";

const validation = {
  contacts: {
    required: "Поле «Контакты» обязательно для заполнения.",
    invalid: "Контакты: 5–50 символов, разрешены буквы, цифры, пробел, +, -, @ и точка.",
    test(value) {
      return value.length >= 5 && value.length <= 50 && /^[A-Za-zА-Яа-яЁё0-9+\-@. ]+$/.test(value);
    }
  },
  firstName: {
    required: "Поле «Имя» обязательно для заполнения.",
    invalid: "Имя: 2–30 символов, разрешены только буквы и дефис.",
    test(value) {
      return value.length >= 2 && value.length <= 30 && /^[A-Za-zА-Яа-яЁё-]+$/.test(value);
    }
  },
  lastName: {
    required: "Поле «Фамилия» обязательно для заполнения.",
    invalid: "Фамилия: 2–40 символов, разрешены только буквы и дефис.",
    test(value) {
      return value.length >= 2 && value.length <= 40 && /^[A-Za-zА-Яа-яЁё-]+$/.test(value);
    }
  },
  address: {
    required: "Поле «Адрес» обязательно для заполнения.",
    invalid: "Адрес: 10–110 символов, разрешены буквы, цифры, пробелы, точки и запятые.",
    test(value) {
      return value.length >= 10 && value.length <= 110 && /^[A-Za-zА-Яа-яЁё0-9., ]+$/.test(value);
    }
  }
};

let selectedDate = "";
let selectedTime = "";
let selectedDelivery = "";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(product => product.id === item.id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }

  saveCart(cart);
}

function getCartTotal(cart) {
  return cart.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
}

function getCartCount(cart) {
  return cart.reduce((sum, item) => sum + Number(item.qty), 0);
}

function setText(id, text = "") {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function setFieldState(input, errorId, message) {
  const error = document.getElementById(errorId);

  if (message) {
    input.classList.add("input-error");
    if (error) error.textContent = message;
    return false;
  }

  input.classList.remove("input-error");
  if (error) error.textContent = "";
  return true;
}

function validateTextField(inputId, errorId, rules, showMessage = true) {
  const input = document.getElementById(inputId);
  if (!input) return true;

  const value = input.value.trim();
  let message = "";

  if (!value) {
    message = rules.required;
  } else if (!rules.test(value)) {
    message = rules.invalid;
  }

  if (showMessage) {
    setFieldState(input, errorId, message);
  }

  return !message;
}

function validateCartForm(showMessages = true) {
  const contactsOk = validateTextField("contacts", "contactsError", validation.contacts, showMessages);
  const firstNameOk = validateTextField("firstName", "firstNameError", validation.firstName, showMessages);
  const lastNameOk = validateTextField("lastName", "lastNameError", validation.lastName, showMessages);
  const addressOk = validateTextField("address", "addressError", validation.address, showMessages);

  const dateOk = Boolean(selectedDate);
  const timeOk = Boolean(selectedTime);
  const deliveryOk = Boolean(selectedDelivery);

  if (showMessages) {
    setText("dateError", dateOk ? "" : "Выберите дату доставки.");
    setText("timeError", timeOk ? "" : "Выберите временной интервал доставки.");
    setText("deliveryError", deliveryOk ? "" : "Выберите способ доставки.");
  }

  const isValid = contactsOk && firstNameOk && lastNameOk && addressOk && dateOk && timeOk && deliveryOk;
  updateOrderButton(isValid);

  return isValid;
}

function updateOrderButton(isValid = false) {
  const orderBtn = document.getElementById("orderBtn");
  if (!orderBtn) return;

  if (isValid) {
    orderBtn.classList.remove("is-disabled");
    orderBtn.setAttribute("aria-disabled", "false");
  } else {
    orderBtn.classList.add("is-disabled");
    orderBtn.setAttribute("aria-disabled", "true");
  }
}

function initFieldValidation() {
  const cartFields = [
    ["contacts", "contactsError", validation.contacts],
    ["firstName", "firstNameError", validation.firstName],
    ["lastName", "lastNameError", validation.lastName],
    ["address", "addressError", validation.address]
  ];

  cartFields.forEach(([inputId, errorId, rules]) => {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener("blur", () => validateTextField(inputId, errorId, rules, true));
    input.addEventListener("input", () => {
      validateTextField(inputId, errorId, rules, true);
      validateCartForm(false);
    });
  });

  const trackingFields = [
    ["trackContacts", "trackContactsError", validation.contacts],
    ["trackFirstName", "trackFirstNameError", validation.firstName],
    ["trackLastName", "trackLastNameError", validation.lastName]
  ];

  trackingFields.forEach(([inputId, errorId, rules]) => {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener("blur", () => validateTextField(inputId, errorId, rules, true));
    input.addEventListener("input", () => validateTextField(inputId, errorId, rules, true));
  });
}

document.querySelectorAll(".js-add-to-cart").forEach(button => {
  button.addEventListener("click", () => {
    addToCart({
      id: button.dataset.id,
      name: button.dataset.name,
      price: Number(button.dataset.price),
      img: button.dataset.img
    });

    button.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.18)" },
        { transform: "scale(1)" }
      ],
      { duration: 280 }
    );
  });
});

const productAdd = document.querySelector(".js-product-add");
if (productAdd) {
  productAdd.addEventListener("click", () => {
    addToCart({
      id: "potion",
      name: "Амортенция",
      price: 7,
      img: "Love potion.png"
    });
    window.location.href = "cart.html";
  });
}

document.querySelectorAll(".option-btn").forEach(button => {
  button.addEventListener("click", () => {
    const group = button.parentElement;
    group.querySelectorAll(".option-btn").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
  });
});

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");
  const cartCount = document.getElementById("cartCount");
  if (!cartItems || !cartTotal) return;

  let cart = getCart();

  if (cart.length === 0) {
    cart = [
      { id: "potion", name: "Амортенция", price: 7, img: "Love potion.png", qty: 1 },
      { id: "diary", name: "Дневник Томочки", price: 7, img: "Tom Riddle’s Diary.png", qty: 1 }
    ];
    saveCart(cart);
  }

  cartItems.innerHTML = "";

  cart.forEach(item => {
    const article = document.createElement("article");
    article.className = "cart-item";
    article.innerHTML = `
      <div class="frame cart-frame">
        <img class="frame__item" src="assets/${item.img}" alt="${item.name}">
        <img class="frame__decor" src="assets/рама 2.png" alt="">
      </div>
      <div>
        <h2 class="cart-item__title">${item.name}</h2>
        <div class="qty" aria-label="Количество товара">
          <button type="button" data-action="minus" data-id="${item.id}">−</button>
          <span>${item.qty} шт</span>
          <button type="button" data-action="plus" data-id="${item.id}">+</button>
        </div>
        <div class="cart-price">${item.price * item.qty} сиклей</div>
        <button class="remove-btn" type="button" data-action="remove" data-id="${item.id}">удалить ×</button>
      </div>
    `;
    cartItems.appendChild(article);
  });

  cartTotal.textContent = getCartTotal(cart);
  if (cartCount) cartCount.textContent = getCartCount(cart);
}

function updateCart(id, action) {
  const cart = getCart();
  const item = cart.find(product => product.id === id);
  if (!item) return;

  if (action === "plus") item.qty += 1;
  if (action === "minus") item.qty = Math.max(1, item.qty - 1);
  if (action === "remove") {
    const index = cart.findIndex(product => product.id === id);
    cart.splice(index, 1);
  }

  saveCart(cart);
  renderCart();
  validateCartForm(false);
}

document.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  updateCart(button.dataset.id, button.dataset.action);
});

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function initCalendar() {
  const calendarDays = document.getElementById("calendarDays");
  if (!calendarDays) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  selectedDate = formatDate(today);
  calendarDays.innerHTML = "";

  const startWeekday = (today.getDay() + 6) % 7;
  for (let i = 0; i < startWeekday; i++) {
    const empty = document.createElement("span");
    empty.className = "calendar-empty";
    calendarDays.appendChild(empty);
  }

  for (let i = 0; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day";
    button.dataset.date = formatDate(date);
    button.textContent = String(date.getDate());

    if (i === 0) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      document.querySelectorAll(".calendar-day").forEach(day => day.classList.remove("active"));
      button.classList.add("active");
      selectedDate = button.dataset.date;
      setText("dateError", "");
      validateCartForm(false);
    });

    calendarDays.appendChild(button);
  }
}

document.querySelectorAll(".time-btn").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".time-btn").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    selectedTime = button.dataset.time || button.textContent.trim();
    setText("timeError", "");
    validateCartForm(false);
  });
});

document.querySelectorAll(".delivery-option").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".delivery-option").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    selectedDelivery = button.dataset.delivery || button.textContent.trim();
    setText("deliveryError", "");
    validateCartForm(false);
  });
});

document.querySelectorAll(".payment-method").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".payment-method").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
  });
});

const orderBtn = document.getElementById("orderBtn");
if (orderBtn) {
  orderBtn.addEventListener("click", () => {
    const message = document.getElementById("cartMessage");
    message.className = "message";

    if (!validateCartForm(true)) {
      message.textContent = "Проверьте поля получателя, дату, время и способ доставки.";
      message.classList.add("message--error");
      return;
    }

    const order = {
      contacts: document.getElementById("contacts").value.trim(),
      firstName: document.getElementById("firstName").value.trim(),
      lastName: document.getElementById("lastName").value.trim(),
      address: document.getElementById("address").value.trim(),
      deliveryDate: selectedDate,
      deliveryTime: selectedTime,
      deliveryMethod: selectedDelivery,
      total: getCartTotal(getCart()),
      status: "Заказ принят. Сейчас он собирается на складе."
    };

    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
    window.location.href = "payment.html";
  });
}

function initPaymentTotal() {
  const paymentTotal = document.getElementById("paymentTotal");
  if (!paymentTotal) return;
  const order = JSON.parse(localStorage.getItem(ORDER_KEY) || "null");
  const total = order?.total || getCartTotal(getCart()) || 14;
  paymentTotal.textContent = total;
}

const paymentForm = document.getElementById("paymentForm");
if (paymentForm) {
  paymentForm.addEventListener("submit", event => {
    event.preventDefault();
    const message = document.getElementById("paymentMessage");
    const number = document.getElementById("cardNumber").value.trim();
    const holder = document.getElementById("cardholder").value.trim();
    const expiry = document.getElementById("expiry").value.trim();
    const cvv = document.getElementById("cvv").value.trim();

    message.className = "message";

    if (!number || !holder || !expiry || !cvv) {
      message.textContent = "Ошибка оплаты. Заполните данные карты.";
      message.classList.add("message--error");
      return;
    }

    message.textContent = "Оплата прошла успешно. Статус заказа можно проверить на странице отслеживания.";
    message.classList.add("message--success");

    const order = JSON.parse(localStorage.getItem(ORDER_KEY) || "{}") || {};
    order.status = "Оплачено. Заказ собирается и готовится к доставке.";
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  });
}

const trackingForm = document.getElementById("trackingForm");
if (trackingForm) {
  trackingForm.addEventListener("submit", event => {
    event.preventDefault();
    const message = document.getElementById("trackingMessage");

    const contactsOk = validateTextField("trackContacts", "trackContactsError", validation.contacts, true);
    const firstNameOk = validateTextField("trackFirstName", "trackFirstNameError", validation.firstName, true);
    const lastNameOk = validateTextField("trackLastName", "trackLastNameError", validation.lastName, true);

    message.className = "message";

    if (!contactsOk || !firstNameOk || !lastNameOk) {
      message.textContent = "Проверьте контакты, имя и фамилию получателя.";
      message.classList.add("message--error");
      return;
    }

    const contacts = document.getElementById("trackContacts").value.trim();
    const firstName = document.getElementById("trackFirstName").value.trim();
    const lastName = document.getElementById("trackLastName").value.trim();
    const order = JSON.parse(localStorage.getItem(ORDER_KEY) || "null");

    if (order && order.contacts === contacts && order.firstName === firstName && order.lastName === lastName) {
      message.textContent = `${order.status || "Заказ найден. Статус: собирается."} Доставка: ${order.deliveryDate || "дата не указана"}, ${order.deliveryTime || "время не указано"}, ${order.deliveryMethod || "способ не указан"}.`;
      message.classList.add("message--success");
    } else {
      message.textContent = "Заказ не найден. Проверьте данные получателя и попробуйте ещё раз.";
      message.classList.add("message--error");
    }
  });
}

renderCart();
initCalendar();
initFieldValidation();
validateCartForm(false);
initPaymentTotal();
