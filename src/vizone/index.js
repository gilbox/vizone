// prevent double-load
if (window.vizone) return;

window.vizone = require('./vizone');
console.log("%cvizone loaded", "color:white; background-color:orange; font-size: 14pt; border-radius:8px; padding: 0 10px; font-family:Verdana;");
