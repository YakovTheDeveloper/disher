// (function () {
//     const realPush = history.pushState;
//     const realReplace = history.replaceState;

//     // Это наш "виртуальный стек" истории (браузер не даёт доступ к настоящему)
//     const fakeStack = [location.pathname + location.search];
//     let pointer = 0;

//     function log(...args) {
//         console.log("%c[HISTORY]", "color:#4CAF50;font-weight:bold", ...args);
//     }

//     history.pushState = function (state, title, url) {
//         realPush.apply(this, arguments);
//         pointer++;
//         fakeStack.length = pointer; // обрезаем хвост, если были переходы назад
//         fakeStack.push(url.toString());
//         log("pushState:", url, "→ fakeStack:", [...fakeStack]);
//     };

//     history.replaceState = function (state, title, url) {
//         realReplace.apply(this, arguments);
//         fakeStack[pointer] = url.toString();
//         log("replaceState:", url, "→ fakeStack:", [...fakeStack]);
//     };

//     window.addEventListener("popstate", () => {
//         pointer = Math.max(0, pointer - 1);
//         log("popstate (← back)", "→ fakeStack:", [...fakeStack], "pointer:", pointer);
//     });

//     log("Initialized. First entry:", fakeStack);
// })();

export { default as ModalRoot } from "./ModalRoot.tsx";
