const fs = require('fs');
const dir = 'apps/food-calc/src/shared/assets/icons/food-variants';
const centers = {
  'fv-bazaar': [300, 830],
  'fv-basket': [300, 830],
  'fv-crate': [300, 830],
  'fv-cart': [330, 760],
  'fv-feast': [260, 800],
  'fv-feast-iso': [250, 780],
  'fv-feast-roast': [240, 750],
  'fv-feast-toast': [340, 740],
  'fv-feast-cake': [300, 720],
  'fv-cornucopia': [240, 780],
  'fv-cornucopia-b': [240, 770],
  'fv-cornucopia-c': [310, 580],
  'fv-cornucopia-d': [290, 760],
  'fv-scale': [280, 800],
  'fv-shelf': [280, 810],
  'fv-receipt': [300, 720],
  'fv-clipboard': [260, 770],
  'fv-plate-list': [280, 810],
};
for (const [name, [cx, cy]] of Object.entries(centers)) {
  const p = `${dir}/${name}.svg`;
  let s = fs.readFileSync(p, 'utf8');
  const reps = [
    ['<circle cx="770" cy="300" r="181" fill="#000"/>', `<circle cx="${cx}" cy="${cy}" r="181" fill="#000"/>`],
    ['<circle cx="770" cy="300" r="135" fill="none" stroke="#fff" stroke-width="40"/>', `<circle cx="${cx}" cy="${cy}" r="135" fill="none" stroke="#fff" stroke-width="40"/>`],
    ['<rect x="748" y="225" width="44" height="150" rx="14"/>', `<rect x="${cx - 22}" y="${cy - 75}" width="44" height="150" rx="14"/>`],
    ['<rect x="695" y="278" width="150" height="44" rx="14"/>', `<rect x="${cx - 75}" y="${cy - 22}" width="150" height="44" rx="14"/>`],
    ['<!-- бейдж-плюс (канон event-variants) -->', `<!-- бейдж-плюс: нижний левый угол объекта, наползает ~30% -->`],
  ];
  for (const [a, b] of reps) {
    if (!s.includes(a)) throw new Error(`${name}: not found: ${a}`);
    s = s.split(a).join(b);
  }
  fs.writeFileSync(p, s);
  console.log('ok', name);
}
