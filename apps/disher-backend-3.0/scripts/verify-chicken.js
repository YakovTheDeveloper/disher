export const meta = {
  name: 'verify-chicken',
  description: 'Re-verify the single chicken (курица) USDA match that the batch workflow dropped',
  phases: [{ title: 'Verify' }],
}

const LEGEND = 'Units: Fe/Mg/P/Ca/K/Na/Zn = mg; Cu/Mn/Se/I/A/B7/B9/B12/D/K1/bCar/aCar = ug; B1/B2/B3/B4/B5/B6/C/E = mg. Per 100 g, RAW.'
const VERDICT = {
  type: 'object', additionalProperties: false,
  required: ['id', 'chosenFdcId', 'productCorrect', 'reason', 'suspectSymbols', 'webUsed'],
  properties: {
    id: { type: 'string' }, chosenFdcId: { type: ['integer', 'null'] }, productCorrect: { type: 'boolean' },
    reason: { type: 'string' }, suspectSymbols: { type: 'array', items: { type: 'string' } }, webUsed: { type: 'boolean' },
  },
}
const p = `Verify the USDA match for the Russian food "курица" (chicken), id "7881", in a nutrition catalog.
Read c:/tmp/verify-input.json, find id "7881". It has: fingerprint (existing minerals per 100g = identity ground truth), existingVitamins, candidates[] {fdcId, src (SR/FDN), desc, corr (lower=better mineral fit; >0.4 suspect), nAdds, fills (exact values that would be written, our units)}.
${LEGEND}
Pick the SINGLE best candidate that is the same food RAW and PLAIN. Our "курица" is generic chicken; the fingerprint (esp. P, K, Zn, Fe) tells you the part/cut. REJECT cooked/fried/canned, breaded, or clearly wrong-cut candidates. Prefer raw. Sanity-check each fill value vs real chicken nutrition (use web if available); flag implausible ones in suspectSymbols. If none acceptable, chosenFdcId=null. Return the verdict for id "7881".`
const v = await agent(p, { label: 'verify:7881', phase: 'Verify', schema: VERDICT })
return v
