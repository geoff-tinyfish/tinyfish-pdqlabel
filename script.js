const form = document.querySelector("#labelForm");
const previewLabel = document.querySelector("#previewLabel");
const printStack = document.querySelector("#printStack");
const previewBox = document.querySelector("#previewBox");
const pageSummary = document.querySelector("#pageSummary");
const printButton = document.querySelector("#printButton");
const clearButton = document.querySelector("#clearButton");
const addBoxButton = document.querySelector("#addBoxButton");
const saveFromButton = document.querySelector("#saveFromButton");
const fromAddressSelect = document.querySelector("#fromAddressSelect");
const fromEditor = document.querySelector("#fromEditor");
const boxList = document.querySelector("#boxList");

const FROM_ADDRESSES_KEY = "pdqLabelFromAddresses";
const ADD_NEW_FROM_ID = "add-new-address";
const DEFAULT_FROM_ADDRESS = {
  id: "tiny-fish",
  label: "Tiny Fish Printing",
  name: "Tiny Fish Printing",
  address1: "601 Oak St.",
  address2: "",
  cityStateZip: "Rochester, NY 14608",
};

const fromFields = {
  name: document.querySelector("#fromName"),
  address1: document.querySelector("#fromAddress1"),
  address2: document.querySelector("#fromAddress2"),
  cityStateZip: document.querySelector("#fromCityStateZip"),
};

const fields = {
  company: document.querySelector("#company"),
  attention: document.querySelector("#attention"),
  address: document.querySelector("#address"),
  address2: document.querySelector("#address2"),
  cityStateZip: document.querySelector("#cityStateZip"),
};

let fromAddresses = loadFromAddresses();
let boxes = [
  {
    contents: "12 (L) Athletic Grey Mock Neck\nPO#47766 - Pioneer Millworks\nprint samples for Vicky",
  },
];

function cleanText(value) {
  return value.trim();
}

function cleanUpper(value) {
  return cleanText(value).toUpperCase();
}

function cleanAddressId(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function loadFromAddresses() {
  try {
    const saved = JSON.parse(localStorage.getItem(FROM_ADDRESSES_KEY) || "[]");
    const custom = Array.isArray(saved) ? saved.filter((address) => address.id !== DEFAULT_FROM_ADDRESS.id) : [];
    return [DEFAULT_FROM_ADDRESS, ...custom];
  } catch {
    return [DEFAULT_FROM_ADDRESS];
  }
}

function saveFromAddresses() {
  const custom = fromAddresses.filter((address) => address.id !== DEFAULT_FROM_ADDRESS.id);
  localStorage.setItem(FROM_ADDRESSES_KEY, JSON.stringify(custom));
}

function getFromAddressFromFields() {
  const name = cleanText(fromFields.name.value);
  const address1 = cleanText(fromFields.address1.value);
  const address2 = cleanText(fromFields.address2.value);
  const cityStateZip = cleanText(fromFields.cityStateZip.value);
  const label = name || address1 || cityStateZip || "Custom From Address";
  const matchesDefault =
    name === DEFAULT_FROM_ADDRESS.name &&
    address1 === DEFAULT_FROM_ADDRESS.address1 &&
    address2 === DEFAULT_FROM_ADDRESS.address2 &&
    cityStateZip === DEFAULT_FROM_ADDRESS.cityStateZip;

  return {
    id: matchesDefault
      ? DEFAULT_FROM_ADDRESS.id
      : cleanAddressId(`${label}-${address1}-${cityStateZip}`) || `from-${Date.now()}`,
    label,
    name,
    address1,
    address2,
    cityStateZip,
  };
}

function setFromFields(address) {
  fromFields.name.value = address.name || "";
  fromFields.address1.value = address.address1 || "";
  fromFields.address2.value = address.address2 || "";
  fromFields.cityStateZip.value = address.cityStateZip || "";
}

function syncFromAddressSelect(selectedId = fromAddressSelect.value) {
  fromAddressSelect.innerHTML = "";

  fromAddresses.forEach((address) => {
    const option = document.createElement("option");
    option.value = address.id;
    option.textContent = address.label;
    fromAddressSelect.append(option);
  });

  const addOption = document.createElement("option");
  addOption.value = ADD_NEW_FROM_ID;
  addOption.textContent = "Add New Address";
  fromAddressSelect.append(addOption);

  fromAddressSelect.value = selectedId === ADD_NEW_FROM_ID || fromAddresses.some((address) => address.id === selectedId)
    ? selectedId
    : DEFAULT_FROM_ADDRESS.id;
}

function getSelectedFromAddress() {
  if (fromAddressSelect.value === ADD_NEW_FROM_ID) {
    return getFromAddressFromFields();
  }

  return fromAddresses.find((address) => address.id === fromAddressSelect.value) || DEFAULT_FROM_ADDRESS;
}

function syncFromEditorVisibility() {
  fromEditor.hidden = fromAddressSelect.value !== ADD_NEW_FROM_ID;
}

function saveCurrentFromAddress() {
  const address = getFromAddressFromFields();
  const matchingIndex = fromAddresses.findIndex((savedAddress) => savedAddress.id === address.id);

  if (matchingIndex >= 0) {
    fromAddresses[matchingIndex] = address;
  } else {
    fromAddresses.push(address);
  }

  saveFromAddresses();
  syncFromAddressSelect(address.id);
  syncFromEditorVisibility();
  renderLabels();
}

function getFormData() {
  return {
    from: getSelectedFromAddress(),
    company: cleanUpper(fields.company.value),
    attention: cleanUpper(fields.attention.value),
    address: cleanUpper(fields.address.value),
    address2: cleanUpper(fields.address2.value),
    cityStateZip: cleanUpper(fields.cityStateZip.value),
    boxes: boxes.map((box) => ({ contents: cleanText(box.contents) })),
  };
}

function labelHtml(data, boxNumber) {
  const fromAddress2Line = data.from.address2 ? `<span>${escapeHtml(data.from.address2)}</span>` : "";
  const attentionLine = data.attention ? `attn: ${data.attention}` : "";
  const address2Line = data.address2 ? `<span class="destination-line">${escapeHtml(data.address2)}</span>` : "";
  const box = data.boxes[boxNumber - 1] || { contents: "" };
  const boxCount = data.boxes.length;

  return `
    <div class="label-content">
      <img class="tiny-fish-mark" src="assets/tiny-fish-logo.png" alt="">
      <img class="pdq-mark" src="assets/pdq-logo.png" alt="">
      <p class="from-copy">
        <span>${escapeHtml(data.from.name)}</span>
        <span>${escapeHtml(data.from.address1)}</span>
        ${fromAddress2Line}
        <span>${escapeHtml(data.from.cityStateZip)}</span>
      </p>
      <p class="to-copy">
        <span class="destination-line first">${escapeHtml(data.company)}</span>
        ${attentionLine ? `<span class="destination-line attention">${escapeHtml(attentionLine)}</span>` : ""}
        <span class="destination-line">${escapeHtml(data.address)}</span>
        ${address2Line}
        <span class="destination-line">${escapeHtml(data.cityStateZip)}</span>
      </p>
      <p class="contents-copy">
        <span class="field-kicker">CONTENTS:</span>
        <span class="contents-text">${escapeHtml(box.contents)}</span>
      </p>
      <p class="box-counter">${boxNumber} / ${boxCount}</p>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function syncBoxesFromEditors() {
  const editors = [...boxList.querySelectorAll("[data-box-index]")];

  boxes = editors.map((editor) => ({
    contents: editor.querySelector("textarea").value,
  }));

  if (boxes.length === 0) {
    boxes = [{ contents: "" }];
  }
}

function renderBoxEditors() {
  boxList.innerHTML = "";

  boxes.forEach((box, index) => {
    const editor = document.createElement("div");
    editor.className = "box-editor";
    editor.dataset.boxIndex = String(index);
    editor.innerHTML = `
      <div class="box-editor-header">
        <span class="box-title">Box ${index + 1}</span>
        ${boxes.length > 1 ? `<button type="button" class="secondary remove-box" data-remove-index="${index}">Remove</button>` : ""}
      </div>
      <label>
        <span>Contents</span>
        <textarea rows="4">${escapeHtml(box.contents)}</textarea>
      </label>
    `;
    boxList.append(editor);
  });
}

function syncPreviewOptions(data) {
  const current = Number.parseInt(previewBox.value, 10) || 1;
  previewBox.innerHTML = "";

  data.boxes.forEach((_, index) => {
    const boxNumber = index + 1;
    const option = document.createElement("option");
    option.value = String(boxNumber);
    option.textContent = `Box ${boxNumber} of ${data.boxes.length}`;
    previewBox.append(option);
  });

  previewBox.value = String(Math.min(current, data.boxes.length));
}

function renderLabels() {
  syncBoxesFromEditors();

  const data = getFormData();
  syncPreviewOptions(data);

  const selectedBox = Number.parseInt(previewBox.value, 10) || 1;
  previewLabel.innerHTML = labelHtml(data, selectedBox);

  printStack.innerHTML = "";
  data.boxes.forEach((_, index) => {
    const boxNumber = index + 1;
    const label = document.createElement("section");
    label.className = "label";
    label.innerHTML = labelHtml(data, boxNumber);
    printStack.append(label);
  });

  pageSummary.textContent = `${data.boxes.length} ${data.boxes.length === 1 ? "label" : "labels"}`;
  fitAllLabelText();
}

function fitAllLabelText() {
  document.querySelectorAll(".label").forEach((label) => {
    fitDestinationBlock(label.querySelector(".to-copy"));
    fitContentsBlock(label.querySelector(".contents-copy"));
  });
}

function fitDestinationBlock(block) {
  if (!block) return;

  block.style.setProperty("--destination-size", "24px");
  block.style.setProperty("--destination-gap", "7px");
  block.style.setProperty("--attention-gap", "11px");

  fitBlock(block, 6, 24, (size) => {
    const scale = size / 24;
    block.style.setProperty("--destination-size", `${size}px`);
    block.style.setProperty("--destination-gap", `${Math.max(2, 7 * scale)}px`);
    block.style.setProperty("--attention-gap", `${Math.max(3, 11 * scale)}px`);
  });
}

function fitContentsBlock(block) {
  if (!block) return;

  block.style.setProperty("--contents-size", "18px");
  block.style.setProperty("--contents-kicker-size", "15px");
  block.style.setProperty("--contents-gap", "5px");

  fitBlock(block, 5, 18, (size) => {
    const scale = size / 18;
    block.style.setProperty("--contents-size", `${size}px`);
    block.style.setProperty("--contents-kicker-size", `${Math.max(7, 15 * scale)}px`);
    block.style.setProperty("--contents-gap", `${Math.max(1, 5 * scale)}px`);
  });
}

function fitBlock(block, minSize, maxSize, applySize) {
  let low = minSize;
  let high = maxSize;
  let best = minSize;

  for (let index = 0; index < 9; index += 1) {
    const size = (low + high) / 2;
    applySize(size);

    if (blockFits(block)) {
      best = size;
      low = size;
    } else {
      high = size;
    }
  }

  applySize(best);
}

function blockFits(block) {
  return block.scrollHeight <= block.clientHeight + 1 && block.scrollWidth <= block.clientWidth + 1;
}

function addBox() {
  syncBoxesFromEditors();
  boxes.push({ contents: "" });
  renderBoxEditors();
  previewBox.value = String(boxes.length);
  renderLabels();

  const newTextarea = boxList.querySelector(`[data-box-index="${boxes.length - 1}"] textarea`);
  newTextarea.focus();
}

function removeBox(index) {
  syncBoxesFromEditors();
  boxes.splice(index, 1);
  renderBoxEditors();
  renderLabels();
}

function clearForm() {
  setFromFields(DEFAULT_FROM_ADDRESS);
  fromAddressSelect.value = DEFAULT_FROM_ADDRESS.id;
  syncFromEditorVisibility();
  fields.company.value = "";
  fields.attention.value = "";
  fields.address.value = "";
  fields.address2.value = "";
  fields.cityStateZip.value = "";
  boxes = [{ contents: "" }];
  renderBoxEditors();
  renderLabels();
  fields.company.focus();
}

form.addEventListener("input", renderLabels);
fromAddressSelect.addEventListener("change", () => {
  if (fromAddressSelect.value === ADD_NEW_FROM_ID) {
    setFromFields({ name: "", address1: "", address2: "", cityStateZip: "" });
    syncFromEditorVisibility();
    fromFields.name.focus();
    renderLabels();
    return;
  }

  const selected = getSelectedFromAddress();
  setFromFields(selected);
  syncFromEditorVisibility();
  renderLabels();
});
previewBox.addEventListener("change", renderLabels);
addBoxButton.addEventListener("click", addBox);
saveFromButton.addEventListener("click", saveCurrentFromAddress);
clearButton.addEventListener("click", clearForm);
boxList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-index]");
  if (!button) return;

  removeBox(Number.parseInt(button.dataset.removeIndex, 10));
});
printButton.addEventListener("click", () => {
  renderLabels();
  window.print();
});

syncFromAddressSelect(DEFAULT_FROM_ADDRESS.id);
setFromFields(DEFAULT_FROM_ADDRESS);
syncFromEditorVisibility();
renderBoxEditors();
renderLabels();
