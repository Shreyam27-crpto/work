import { CITIES, fetchHotels } from "./api.js";

const PAGE_SIZE = 18;

const state = {
  filters: {
    search: "",
    location: "",
    min_price: "",
    max_price: "",
    min_rating: "",
    max_rating: "",
    order_by: "-rating",
  },
  skip: 0,
  total: 0,
  hotels: [],
  view: "grid",
  loading: false,
};

const elements = {
  form: document.querySelector("#search-form"),
  searchInput: document.querySelector("#search-input"),
  locationSelect: document.querySelector("#location-select"),
  cityChips: document.querySelector("#city-chips"),
  minPrice: document.querySelector("#min-price"),
  maxPrice: document.querySelector("#max-price"),
  minRating: document.querySelector("#min-rating"),
  maxRating: document.querySelector("#max-rating"),
  sortSelect: document.querySelector("#sort-select"),
  clearFilters: document.querySelector("#clear-filters"),
  status: document.querySelector("#status"),
  resultsMeta: document.querySelector("#results-meta"),
  hotelList: document.querySelector("#hotel-list"),
  loadMore: document.querySelector("#load-more"),
  dialog: document.querySelector("#hotel-dialog"),
  dialogContent: document.querySelector("#dialog-content"),
  dialogClose: document.querySelector("#dialog-close"),
  viewTools: document.querySelectorAll("[data-view]"),
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}

function safeImageUrl(url) {
  return String(url ?? "").startsWith("https://images.unsplash.com/")
    ? url
    : "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1080&q=80";
}

function debounce(callback, delay = 350) {
  let timer;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => callback(...args), delay);
  };
}

function queryForPage() {
  return {
    ...state.filters,
    limit: PAGE_SIZE,
    skip: state.skip,
  };
}

function setStatus(message, tone = "neutral") {
  elements.status.textContent = message;
  elements.status.dataset.tone = tone;
}

function syncFilterControls() {
  elements.searchInput.value = state.filters.search;
  elements.locationSelect.value = state.filters.location;
  elements.minPrice.value = state.filters.min_price;
  elements.maxPrice.value = state.filters.max_price;
  elements.minRating.value = state.filters.min_rating;
  elements.maxRating.value = state.filters.max_rating;
  elements.sortSelect.value = state.filters.order_by;

  [...elements.cityChips.children].forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.city === state.filters.location);
  });
}

function renderCities() {
  CITIES.forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    elements.locationSelect.append(option);

    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "city-chip";
    chip.dataset.city = city;
    chip.textContent = city;
    elements.cityChips.append(chip);
  });
}

function hotelCardTemplate(hotel) {
  const price = formatCurrency(hotel.price);
  const description = hotel.description?.split("\n")[0] ?? "A comfortable stay with thoughtful service.";
  const name = escapeHtml(hotel.name);
  const location = escapeHtml(hotel.location);

  return `
    <article class="hotel-card" data-id="${hotel.id}">
      <button class="image-button" type="button" data-action="details" aria-label="Open ${name}">
        <img src="${safeImageUrl(hotel.thumbnail)}" alt="${name}" loading="lazy" />
      </button>
      <div class="hotel-card-body">
        <div class="hotel-title-row">
          <div>
            <h3>${name}</h3>
            <p>${location}</p>
          </div>
          <span class="rating">${Number(hotel.rating).toFixed(1)}</span>
        </div>
        <p class="hotel-description">${escapeHtml(description)}</p>
        <div class="card-footer">
          <strong>${price}</strong>
          <button class="text-button" type="button" data-action="details">View details</button>
        </div>
      </div>
    </article>
  `;
}

function renderHotels() {
  elements.hotelList.className = state.view === "list" ? "hotel-grid list-view" : "hotel-grid";
  elements.hotelList.innerHTML = state.hotels.map(hotelCardTemplate).join("");

  const shown = state.hotels.length;
  elements.resultsMeta.textContent = `${shown} of ${state.total || shown} stays shown`;
  elements.loadMore.hidden = shown >= state.total || shown === 0 || state.loading;
}

async function loadHotels({ append = false } = {}) {
  state.loading = true;
  elements.loadMore.hidden = true;
  setStatus(append ? "Loading more hotels..." : "Finding the best matches...");

  try {
    const payload = await fetchHotels(queryForPage());
    state.total = payload.count;
    state.hotels = append ? [...state.hotels, ...payload.data] : payload.data;

    if (!state.hotels.length) {
      setStatus("No hotels match those filters. Try widening the price or rating range.", "empty");
    } else {
      setStatus(payload.message, "success");
    }
  } catch (error) {
    setStatus(`${error.message} Please try again in a moment.`, "error");
    state.hotels = append ? state.hotels : [];
    state.total = state.hotels.length;
  } finally {
    state.loading = false;
    renderHotels();
  }
}

function updateFilter(key, value) {
  state.filters[key] = value;
  state.skip = 0;
  syncFilterControls();
  loadHotels();
}

const updateFilterDebounced = debounce(updateFilter);

function openHotelDetails(hotel) {
  const name = escapeHtml(hotel.name);
  const location = escapeHtml(hotel.location);
  const photos = [hotel.thumbnail, ...(hotel.photos ?? [])].map(safeImageUrl).slice(0, 7);
  elements.dialogContent.innerHTML = `
    <div class="dialog-hero">
      <img src="${photos[0]}" alt="${name}" />
      <div>
        <p class="eyebrow">${location}</p>
        <h2 id="dialog-title">${name}</h2>
        <div class="dialog-meta">
          <span>${Number(hotel.rating).toFixed(1)} rating</span>
          <strong>${formatCurrency(hotel.price)} per night</strong>
        </div>
        <p>${escapeHtml(hotel.description ?? "")}</p>
      </div>
    </div>
    <div class="photo-strip" aria-label="Hotel photos">
      ${photos.map((photo, index) => `<img src="${photo}" alt="${name} photo ${index + 1}" loading="lazy" />`).join("")}
    </div>
  `;
  elements.dialog.showModal();
}

function bindEvents() {
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    updateFilter("search", elements.searchInput.value);
  });

  elements.searchInput.addEventListener("input", (event) => {
    updateFilterDebounced("search", event.target.value);
  });

  elements.locationSelect.addEventListener("change", (event) => {
    updateFilter("location", event.target.value);
  });

  elements.cityChips.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-city]");
    if (!chip) return;
    updateFilter("location", state.filters.location === chip.dataset.city ? "" : chip.dataset.city);
  });

  [
    ["min_price", elements.minPrice],
    ["max_price", elements.maxPrice],
    ["min_rating", elements.minRating],
    ["max_rating", elements.maxRating],
  ].forEach(([key, element]) => {
    element.addEventListener("input", (event) => updateFilterDebounced(key, event.target.value));
  });

  elements.sortSelect.addEventListener("change", (event) => {
    updateFilter("order_by", event.target.value);
  });

  elements.clearFilters.addEventListener("click", () => {
    state.filters = {
      search: "",
      location: "",
      min_price: "",
      max_price: "",
      min_rating: "",
      max_rating: "",
      order_by: "-rating",
    };
    state.skip = 0;
    syncFilterControls();
    loadHotels();
  });

  elements.loadMore.addEventListener("click", () => {
    state.skip += PAGE_SIZE;
    loadHotels({ append: true });
  });

  elements.hotelList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action='details']");
    const card = event.target.closest("[data-id]");
    if (!button || !card) return;

    const hotel = state.hotels.find((item) => String(item.id) === card.dataset.id);
    if (hotel) openHotelDetails(hotel);
  });

  elements.dialogClose.addEventListener("click", () => elements.dialog.close());
  elements.dialog.addEventListener("click", (event) => {
    if (event.target === elements.dialog) elements.dialog.close();
  });

  elements.viewTools.forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      elements.viewTools.forEach((tool) => tool.classList.toggle("is-active", tool === button));
      renderHotels();
    });
  });
}

renderCities();
bindEvents();
syncFilterControls();
loadHotels();
