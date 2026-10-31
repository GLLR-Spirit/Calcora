(()=>{"use strict";
const root=document.documentElement.dataset.assetRoot||"../../";
const $=selector=>document.querySelector(selector);
const dictionaries=window.CALCORA_LOCALES||{};
const languageSelect=$("#language-select");
const themeButton=$("#theme-toggle");
const stylesheet=$("#theme-stylesheet");
function applyLanguage(code){
  const locale=dictionaries[code]||dictionaries.en;
  if(!locale)return;
  document.documentElement.lang=code;
  document.documentElement.dir=code==="ar"?"rtl":"ltr";
  document.querySelectorAll("[data-i18n]").forEach(element=>{
    const value=locale[element.dataset.i18n];
    if(typeof value==="string")element.textContent=value;
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach(element=>{
    const value=locale[element.dataset.i18nAriaLabel];
    if(typeof value==="string")element.setAttribute("aria-label",value);
  });
  document.title=(locale[document.documentElement.dataset.pageTitle]||"Calcora")+" — Calcora";
  const description=$('meta[name="description"]');
  if(description)description.content=locale[document.documentElement.dataset.pageDescription]||"";
  if(languageSelect){
    languageSelect.value=code;
    languageSelect.setAttribute("aria-label",locale.languageLabel||"Language");
  }
  updateThemeLabel();
  try{localStorage.setItem("calcora-language",code)}catch(_){}
}
function updateThemeLabel(){
  const locale=dictionaries[document.documentElement.lang]||dictionaries.en||{};
  const dark=document.documentElement.dataset.theme==="dark";
  if(themeButton){
    const label=dark?(locale.themeToLight||"Switch to light theme"):(locale.themeToDark||"Switch to dark theme");
    themeButton.setAttribute("aria-label",label);
    themeButton.title=label;
    themeButton.textContent=dark?"☀":"☾";
  }
}
function applyTheme(theme){
  const safeTheme=theme==="dark"?"dark":"light";
  document.documentElement.dataset.theme=safeTheme;
  if(stylesheet)stylesheet.href=root+"assets/css/theme-"+safeTheme+".css";
  updateThemeLabel();
  try{localStorage.setItem("calcora-theme",safeTheme)}catch(_){}
}
if(languageSelect)languageSelect.addEventListener("change",event=>applyLanguage(event.target.value));
if(themeButton)themeButton.addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));
const year=$("#year");if(year)year.textContent=String(new Date().getFullYear());
let language="en",theme="light";
try{language=localStorage.getItem("calcora-language")||language;theme=localStorage.getItem("calcora-theme")||theme}catch(_){}
applyLanguage(dictionaries[language]?language:"en");
applyTheme(theme);
})();