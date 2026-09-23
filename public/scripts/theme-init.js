/* global document, localStorage */
(function () {
  try {
    var cookieTheme = document.cookie.match(/(?:^|; )fp_theme=([^;]*)/);
    var theme = cookieTheme ? decodeURIComponent(cookieTheme[1]) : null;
    if (!theme) {
      theme = localStorage.getItem("fp_theme_pref") || localStorage.getItem("fp_theme");
    }
    if (!theme || (theme !== "light" && theme !== "dark" && theme !== "black")) {
      theme = "dark";
    }
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark" || theme === "black") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch {
    // Non-fatal fallback
  }
})();
