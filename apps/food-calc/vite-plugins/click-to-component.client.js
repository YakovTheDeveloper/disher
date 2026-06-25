// Vendored from vite-plugin-react-click-to-component@4.2.2 (client.js).
//
// Why vendored: the npm plugin's 4.x line declares `peerDependencies.vite: ^7`
// and loads this client through a *virtual module* using object-form
// `resolveId`/`load` hook filters. Our Vite is 6.3.7, which only supports
// hook filters for `transform` (no `createFilterForResolveId`/`...Load`), so the
// unfiltered resolveId handler would prepend `\0` to every import and break all
// module resolution. We instead inject this file inline via `transformIndexHtml`
// (the v3-era mechanism) — see ../vite.config.ts. `__ROOT__`/`__BASE__` are
// string-replaced at inject time. Alt+hover outlines, Alt+right-click opens a
// component menu; each item hits Vite's built-in `/__open-in-editor`.
var style = document.createElement('style');
style.setAttribute('type', 'text/css');
style.setAttribute('data-vite-dev-id', 'react-click-to-component');
style.innerHTML = `[data-click-to-component-target] {
  outline: auto 1px !important;
}
#click-to-component-menu {
  position: fixed !important;
  z-index: 1000;
  margin-top: 8px !important;
  margin-bottom: 8px !important;
  background: #222 !important;
  color: white !important;
  padding: 8px !important;
  border-radius: 6px !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
  display: flex !important;
  gap: 2px !important;
  overflow: auto !important;
}
.click-to-component-menu-item {
  padding: 4px !important;
  border-radius: 4px !important;
  cursor: pointer !important;
  display: flex !important;
  justify-content: space-between !important;
  gap: 8px !important;
}
.click-to-component-menu-item:hover {
  background: #333 !important;
}
`;
document.head.appendChild(style);
var root = '__ROOT__';
var base = '__BASE__';
var currentTarget;
var hasMenu = false;
var menuElement = document.createElement('div');
menuElement.setAttribute('id', 'click-to-component-menu');
// Единая точка открытия: wantStyle=true → соседний стиль через /__open-style,
// иначе сам .tsx через встроенный /__open-in-editor. Лог в консоль браузера для
// обратной связи; ошибки запуска редактора живут в терминале dev-сервера.
function openInEditor(filePath, wantStyle) {
  const endpoint = wantStyle ? '__open-style' : '__open-in-editor';
  const url = `${base}${endpoint}?file=${encodeURIComponent(filePath)}`;
  console.info('[click-to-component] open', wantStyle ? '(scss)' : '(tsx)', '→', filePath);
  fetch(url)
    .then((r) => {
      if (!r.ok) console.error('[click-to-component] ' + endpoint + ' вернул', r.status);
    })
    .catch((e) => console.error('[click-to-component] запрос упал:', e));
}
// Прямой путь: Ctrl+клик по элементу сразу открывает .scss ближайшего
// компонента (Ctrl+Shift+клик → его .tsx), без захода в меню. Capture-фаза +
// preventDefault, чтобы перебить ctrl+click приложения (выделение / открытие
// ссылки в новой вкладке). Клики по самому меню не трогаем.
window.addEventListener(
  'click',
  (event) => {
    if (!event.ctrlKey || event.button !== 0) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest && target.closest('#click-to-component-menu')) return;
    const layers = getLayersForElement(target);
    if (!layers.length) return;
    event.preventDefault();
    event.stopPropagation();
    openInEditor(layers[0].path, !event.shiftKey);
    cleanUp();
  },
  true,
);
window.addEventListener('keyup', (event) => {
  if (!event.ctrlKey && (hasMenu || currentTarget)) cleanUp();
});
window.addEventListener('mousemove', (event) => {
  if (!event.ctrlKey) {
    cleanUp();
    return;
  }
  if (hasMenu) return;
  if (!(event.target instanceof HTMLElement)) {
    clearOverlay();
    return;
  }
  if (event.target === currentTarget) return;
  clearOverlay();
  currentTarget = event.target;
  event.target.dataset['clickToComponentTarget'] = 'true';
});
var getMaxZIndex = (target, current) => {
  const parent = target.parentElement;
  if (!parent || parent === document.body) return current;
  const zIndex = parseInt(window.getComputedStyle(parent).zIndex);
  return getMaxZIndex(parent, isNaN(zIndex) ? current : Math.max(zIndex, current));
};
window.addEventListener('contextmenu', (event) => {
  if (!event.ctrlKey) return;
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  event.preventDefault();
  const layers = getLayersForElement(target);
  if (layers.length === 0) return;
  const zIndex = getMaxZIndex(target, 999);
  if (zIndex > 999) menuElement.style.zIndex = `${zIndex + 1}`;
  const rect = target.getBoundingClientRect();
  if (rect.bottom < window.innerHeight / 2) {
    menuElement.style.top = `${rect.bottom}px`;
    menuElement.style.bottom = '';
    menuElement.style.maxHeight = `${window.innerHeight - rect.bottom - 16}px`;
  } else if (rect.top > window.innerHeight / 2) {
    menuElement.style.bottom = `${window.innerHeight - rect.top}px`;
    menuElement.style.top = '';
    menuElement.style.maxHeight = `${rect.top - 16}px`;
  } else {
    const bottomVisible = rect.bottom < window.innerHeight;
    menuElement.style.bottom = `${bottomVisible ? window.innerHeight - rect.bottom : 0}px`;
    menuElement.style.top = '';
    menuElement.style.maxHeight = `${(bottomVisible ? rect.bottom : window.innerHeight) - 16}px`;
  }
  if (rect.left < window.innerWidth / 2) {
    menuElement.style.left = `${rect.left}px`;
    menuElement.style.right = '';
  } else {
    menuElement.style.right = `${window.innerWidth - rect.right}px`;
    menuElement.style.left = '';
  }
  while (menuElement.firstChild) {
    menuElement.removeChild(menuElement.firstChild);
  }
  menuElement.style.flexDirection =
    menuElement.style.top !== '' ? 'column' : 'column-reverse';
  const hint = document.createElement('div');
  hint.textContent = 'клик — .scss · Shift+клик — .tsx';
  hint.style.cssText = 'opacity:.5;font-size:11px;padding:2px 4px;pointer-events:none';
  menuElement.appendChild(hint);
  for (const layer of layers) {
    const item = document.createElement('div');
    item.className = 'click-to-component-menu-item';
    const spanL = document.createElement('span');
    spanL.textContent = `<${layer.name} />`;
    item.appendChild(spanL);
    const spanR = document.createElement('span');
    spanR.textContent = layer.path.replace(`${root}/`, '');
    item.appendChild(spanR);
    item.addEventListener('click', (e) => {
      // По умолчанию клик → .scss; Shift+клик → сам .tsx.
      openInEditor(layer.path, !e.shiftKey);
      cleanUp();
    });
    menuElement.appendChild(item);
  }
  if (!hasMenu) {
    document.body.appendChild(menuElement);
    if (document.body.style.pointerEvents === 'none') {
      document.body.style.pointerEvents = 'auto';
      document.body.dataset['clickToComponentUnlocked'] = 'true';
    }
    hasMenu = true;
  }
});
var cleanUp = () => {
  clearOverlay();
  removeMenu();
};
var clearOverlay = () => {
  if (!currentTarget) return;
  const current = document.querySelector('[data-click-to-component-target]');
  if (current) delete current.dataset['clickToComponentTarget'];
  currentTarget = void 0;
};
var removeMenu = () => {
  if (!hasMenu) return;
  document.body.removeChild(menuElement);
  hasMenu = false;
};
var getLayersForElement = (element) => {
  let instance = getReactInstanceForElement(element);
  const layers = [];
  while (instance) {
    const path = getPath(instance);
    if (path) {
      const name =
        typeof instance.type === 'string'
          ? instance.type
          : instance.type.displayName ??
            instance.type.name ??
            instance.type.render?.name ??
            'undefined';
      layers.push({ name, path });
    }
    instance = instance._debugOwner;
  }
  return layers;
};
var getPath = (fiber) => {
  const source = fiber._debugSource ?? fiber._debugInfo;
  if (!source) {
    console.debug("Couldn't find a React instance for the element", fiber);
    return;
  }
  const { columnNumber = 1, fileName, lineNumber = 1 } = source;
  return `${fileName}:${lineNumber}:${columnNumber}`;
};
var getReactInstanceForElement = (element) => {
  if ('__REACT_DEVTOOLS_GLOBAL_HOOK__' in window) {
    const { renderers } = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    for (const renderer of renderers.values()) {
      try {
        const fiber = renderer.findFiberByHostInstance(element);
        if (fiber) return fiber;
      } catch {}
    }
  }
  if ('_reactRootContainer' in element) {
    return element._reactRootContainer._internalRoot.current.child;
  }
  for (const key in element) {
    if (key.startsWith('__reactFiber')) return element[key];
  }
};
