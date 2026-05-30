export const meta = {
  name: 'usda-micro-verify',
  description: 'Independently verify USDA micronutrient matches + values for 43 catalog foods (pick correct raw/plain product, adversarially refute, web-check numbers)',
  phases: [
    { title: 'Verify', detail: 'per food: pick correct candidate + flag bad values' },
    { title: 'Refute', detail: 'adversarial check of each accepted match' },
  ],
}

const foods = [
  { id: '4185', name: 'абрикос' }, { id: '7811', name: 'фасоль белая' }, { id: '7861', name: 'бразильский орех' },
  { id: '2867', name: 'брокколи' }, { id: '3176', name: 'булгур' }, { id: '2774', name: 'гречка' },
  { id: '3175', name: 'мука гречневая' }, { id: '7838', name: 'грибы экзотические' }, { id: '2214', name: 'рис дикий' },
  { id: '1580', name: 'дыня' }, { id: '3772', name: 'йогурт' }, { id: '2463', name: 'капуста зелёная' },
  { id: '2465', name: 'капуста краснокочанная' }, { id: '909', name: 'капуста кудрявая (кале)' }, { id: '3079', name: 'кедровые орехи' },
  { id: '250', name: 'клубника' }, { id: '7863', name: 'мука кокосовая' }, { id: '7881', name: 'курица' },
  { id: '7959', name: 'люциан' }, { id: '4824', name: 'масло канола' }, { id: '7841', name: 'молоко миндальное' },
  { id: '7703', name: 'молоко соевое' }, { id: '7845', name: 'мука миндальная' }, { id: '7846', name: 'мука овсяная' },
  { id: '2402', name: 'нектарин' }, { id: '7865', name: 'нут' }, { id: '7849', name: 'овёс' },
  { id: '897', name: 'огурец' }, { id: '2670', name: 'пекан' }, { id: '2666', name: 'макадамия' },
  { id: '3069', name: 'фундук' }, { id: '2905', name: 'пастернак' }, { id: '7843', name: 'перец болгарский' },
  { id: '1618', name: 'плантаны' }, { id: '2190', name: 'просо' }, { id: '2863', name: 'свекольная зелень' },
  { id: '3044', name: 'семена тыквы' }, { id: '3042', name: 'семена чиа' }, { id: '1902', name: 'семя льна' },
  { id: '7853', name: 'сладкий картофель' }, { id: '5956', name: 'соль' }, { id: '7810', name: 'фасоль красная' },
  { id: '7814', name: 'фасоль чёрная' },
]

const LEGEND =
  'Units: Fe/Mg/P/Ca/K/Na/Zn = mg; Cu/Mn/Se/I/A/B7/B9/B12/D/K1/bCar/aCar = ug (micrograms); B1/B2/B3/B4/B5/B6/C/E = mg. All per 100 g, RAW basis.'

const VERDICT = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'chosenFdcId', 'productCorrect', 'reason', 'suspectSymbols', 'webUsed'],
  properties: {
    id: { type: 'string' },
    chosenFdcId: { type: ['integer', 'null'], description: 'fdcId of the single best candidate, or null if NONE is an acceptable raw/plain match' },
    productCorrect: { type: 'boolean', description: 'true only if the chosen candidate is the same real food, raw and plain' },
    reason: { type: 'string', description: '1-2 sentences: why this candidate (or why reject all)' },
    suspectSymbols: { type: 'array', items: { type: 'string' }, description: "symbols of fill values that look implausible for this food, e.g. ['A','E']; empty if all plausible" },
    webUsed: { type: 'boolean', description: 'true if you verified numbers via web search/fetch, false if from nutritional knowledge only' },
  },
}

const REFUTE = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'isWrong', 'argument', 'webUsed'],
  properties: {
    id: { type: 'string' },
    isWrong: { type: 'boolean', description: 'true if the chosen match is the WRONG product or has clearly wrong values' },
    argument: { type: 'string', description: 'the strongest case that this match is wrong; or why it withstands scrutiny' },
    webUsed: { type: 'boolean' },
  },
}

function verifyPrompt(f) {
  return `You verify a USDA FoodData Central match for a Russian-named food in a nutrition app catalog.

Read the file c:/tmp/verify-input.json and find the entry with id === "${f.id}" (name: "${f.name}").
Each entry has:
- fingerprint: the food's EXISTING mineral values per 100g (ground truth for identity)
- existingVitamins: values already present (do not need filling)
- candidates[]: {fdcId, src (SR=SR Legacy / FDN=Foundation), desc (English USDA description), corr (median |ln(fdc/our)| over Fe/Mg/P/Ca/K/Zn — LOWER means the candidate's mineral profile matches our food better; >0.4 is suspicious), nAdds, fills (the EXACT micronutrient values that would be written into our catalog from this candidate, per 100g, our units)}

${LEGEND}

YOUR TASK:
1. Pick the SINGLE best candidate that is the SAME real food as "${f.name}", in RAW and PLAIN form.
   REJECT: chocolate/coffee/vanilla/sweetened/fortified, cooked/boiled/canned/fried, dried/dehydrated (unless our food is itself a flour/dried seed), wrong part (e.g. "leaves" when we mean the root), wrong variety/colour (use fingerprint+corr to disambiguate), or any branded prepared product.
   Use corr to confirm identity — prefer low corr, but description correctness OUTWEIGHS a slightly lower corr.
2. If NO candidate is an acceptable raw/plain match, set chosenFdcId=null and productCorrect=false.
3. For the chosen candidate's fills, sanity-check EACH value against real nutrition data. Use web search/fetch if available; otherwise use nutritional knowledge. Flag (in suspectSymbols) any value that is implausible for this food at 100g raw. Be conservative: when genuinely unsure a value is right, flag it — leaving a cell empty is better than writing a wrong number.

Return the structured verdict for id "${f.id}".`
}

function refutePrompt(f, v) {
  return `Adversarial check. A USDA match was ACCEPTED for the Russian food "${f.name}" (id ${f.id}): chosen fdcId=${v.chosenFdcId}.
Read c:/tmp/verify-input.json, find id "${f.id}", locate the candidate with that fdcId, and try HARD to prove the match is WRONG — wrong species/variety/part/state, wrong basis, or values inconsistent with the food's mineral fingerprint or with real-world nutrition data (use web if available).
${LEGEND}
Default to isWrong=false ONLY if you cannot find a real problem. If the product is clearly correct raw/plain and values are plausible, say so. Return the structured result for id "${f.id}".`
}

const results = await pipeline(
  foods,
  (f) => agent(verifyPrompt(f), { label: `verify:${f.id}`, phase: 'Verify', schema: VERDICT }),
  (v, f) => {
    if (!v || !v.chosenFdcId || !v.productCorrect) return { food: f, verdict: v, refute: null }
    return agent(refutePrompt(f, v), { label: `refute:${f.id}`, phase: 'Refute', schema: REFUTE }).then((r) => ({ food: f, verdict: v, refute: r }))
  },
)

const clean = results.filter(Boolean)
const accepted = clean.filter((x) => x.verdict && x.verdict.productCorrect && x.verdict.chosenFdcId && (!x.refute || !x.refute.isWrong))
const rejected = clean.filter((x) => !accepted.includes(x))

return {
  total: clean.length,
  acceptedCount: accepted.length,
  accepted: accepted.map((x) => ({ id: x.food.id, name: x.food.name, fdcId: x.verdict.chosenFdcId, suspectSymbols: x.verdict.suspectSymbols, webUsed: x.verdict.webUsed, refuteWeb: x.refute ? x.refute.webUsed : null })),
  rejected: rejected.map((x) => ({ id: x.food.id, name: x.food.name, chosenFdcId: x.verdict ? x.verdict.chosenFdcId : null, reason: x.verdict ? x.verdict.reason : 'no verdict', refute: x.refute ? x.refute.argument : null })),
}
