// Репродукция механики матрицы: те же правила/структура, токены подставлены
// значениями. Мерим ширины колонок в вариантах max-content vs auto.
import { chromium } from 'playwright-core';

const html = (tableExtraCss) => `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin: 0; font: 16px/1.3 -apple-system, "Segoe UI", Roboto, sans-serif; background: #f7f3eb; }
  .shell-body { width: 370px; display: flex; flex-direction: column; }
  .scroller { overflow: auto; overscroll-behavior: contain; }
  .table { table-layout: fixed; border-collapse: separate; border-spacing: 0; ${tableExtraCss} }
  .table th, .table td {
    padding-block: 4px; padding-inline: 8px;
    border-bottom: 1px solid color-mix(in srgb, rgba(31,42,68,0.11), #221f19 70%);
    border-inline-end: 1px solid color-mix(in srgb, rgba(31,42,68,0.11), #221f19 70%);
    text-align: start; vertical-align: bottom;
  }
  .table tbody th, .table tbody td { vertical-align: middle; }
  .table thead th { position: sticky; top: 0; z-index: 2; background: #f7f3eb; }
  .table tbody th[scope='row'] { position: sticky; inset-inline-start: 0; z-index: 1; background: #f7f3eb; }
  .table thead th.corner { inset-inline-start: 0; z-index: 3; }
  .colFirst { width: 6.5rem; }
  .colFood { width: 5.5ch; }
  .colHeadName { display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: #221f19; }
  .colHeadTime { display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: #757169; }
  .rowHead { padding-inline-end: 0; }
  .groupHead { position: sticky; inset-inline-start: 0; z-index: 1; background: #f7f3eb; padding-block-start: 12px; text-align: start; }
  .cell { position: relative; isolation: isolate; text-align: end; white-space: nowrap; overflow: hidden; font-variant-numeric: tabular-nums; }
  .fig { display: grid; grid-template-columns: auto auto; justify-content: end; column-gap: 2px; row-gap: 1px; }
</style></head><body>
<div class="shell-body"><div class="scroller">
<table class="table">
  <caption style="position:absolute;width:1px;height:1px;overflow:hidden">x</caption>
  <colgroup><col class="colFirst"><col class="colFood"><col class="colFood"></colgroup>
  <thead><tr>
    <th scope="col" class="corner"></th>
    <th scope="col"><span class="colHeadName">Грецкий орех</span><span class="colHeadTime">9:30</span></th>
    <th scope="col"><span class="colHeadName">Творог 5%</span><span class="colHeadTime">12:15</span></th>
  </tr></thead>
  <tbody>
    <tr><th colSpan="3" scope="rowgroup" class="groupHead">БЖУ</th></tr>
    <tr><th scope="row" class="rowHead"><span style="display:flex;flex-direction:column;min-width:0"><span style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis">Белки</span></span></th>
        <td class="cell"><span class="fig"><b>15</b><i>г</i><b>29</b><i>%</i></span></td>
        <td class="cell"><span class="fig"><b>20</b><i>г</i><b>39</b><i>%</i></span></td></tr>
    <tr><th scope="row" class="rowHead"><span style="display:flex;flex-direction:column;min-width:0"><span style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis">Витамин B12</span><span style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;opacity:.72">Кобаламин</span></span></th>
        <td class="cell"><span class="fig"><b>100</b><i>%</i></span></td>
        <td class="cell">—</td></tr>
  </tbody>
</table>
</div></div>
<script>
  const cells = document.querySelectorAll('tbody tr:nth-child(2) > *');
  window.__measure = {
    table: document.querySelector('table').getBoundingClientRect().width,
    cols: [...document.querySelectorAll('colgroup col')].map(c => getComputedStyle(c).width),
    rowCells: [...cells].map(c => Math.round(c.getBoundingClientRect().width * 10) / 10),
    headCells: [...document.querySelectorAll('thead th')].map(c => Math.round(c.getBoundingClientRect().width * 10) / 10),
  };
</script>
</body></html>`;

const variants = {
  'max-content': 'inline-size: max-content;',
  'auto (no width)': '',
  'width 100%': 'inline-size: 100%;',
};

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, css] of Object.entries(variants)) {
  await page.setContent(html(css));
  const m = await page.evaluate(() => window.__measure);
  console.log(name, JSON.stringify(m));
}
await browser.close();
