function loadLanguage(langCode) {
  fetch(`lang/${langCode}.json`)
    .then(res => res.json())
    .then(strings => {
      document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (strings[key]) el.textContent = strings[key];
      });
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const selector = document.getElementById("lang-selector");
  const savedLang = localStorage.getItem("lang") || "en";

 
  if (selector) {
    selector.value = savedLang;

    selector.addEventListener("change", () => {
      const selectedLang = selector.value;
      localStorage.setItem("lang", selectedLang);
      loadLanguage(selectedLang);
    });
  }

 
  loadLanguage(savedLang);
});
