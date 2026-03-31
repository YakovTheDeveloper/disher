# Russian Food Product Translation Issues Report

**Date:** March 31, 2026
**File analyzed:** `food-catalog-lite.json`
**Total products:** 1,632
**Issues found:** 20 clear translation/phrasing problems

---

## Executive Summary

Analysis of the food catalog identified **20 significant translation and phrasing issues** that would confuse Russian-speaking users. Issues range from:

- **Foreign terminology** not adapted to Russian (6 instances)
- **Overly technical jargon** incomprehensible to consumers (4 instances)
- **Awkward literal translations** missing Russian idioms (1 instance)
- **Spacing bugs** from data corruption (3 instances)
- **Confusing or redundant phrasing** (6 instances)

---

## Issues by Category

| Category | Count | Severity |
|----------|-------|----------|
| Foreign Terminology | 6 | High |
| Overly Technical Jargon | 4 | High |
| Spacing Bugs | 3 | Medium |
| Awkward Phrasing | 2 | Medium |
| Confusing Structure | 2 | High |
| State Term Issues | 1 | Medium |
| Category Prefix Issues | 1 | Low |
| Verbose Descriptions | 1 | Low |

---

## Critical Issues (User-Facing Problems)

### 1. **Франкфуртер** → **Сосиска** (6 instances)
**IDs:** 4112, 5456, 6350, 2375, 5452, plus variations

"Франкфуртер" is a German loanword. Russian consumers use "сосиска" (sausage).

**Examples:**
- "Франкфуртер, курица" → "Сосиска куриная"
- "Франкфуртер, говядина, неотапливаемый" → "Сосиска говяжья, сырая"

**Impact:** Users searching for "сосиска" won't find products listed as "франкфуртер"

---

### 2. **Technical Beer Jargon** (4 instances)
**IDs:** sk-1076, sk-1077, sk-1078, sk-1079

**Current:** "Пиво светлое, с долей сухих веществ в исходном сусле 11%"
**Problem:** "Share of dry matter in original wort" is brewery technical jargon, not consumer language

**Correction:** "Пиво светлое (11% плотности)" or just "Пиво светлое"

**Impact:** Consumers cannot understand what these product names mean

---

### 3. **Duplicate Word (Google Translate Artifact)** (1 instance)
**ID:** 1702

**Current:** "Кукуруза сладкая, желтая, консервированная, цельное зерно, **с сухими сухими веществами**"
**Problem:** Double "сухими" (dry dry) - clear machine translation error
**Correction:** "Кукуруза сладкая, консервированная, целое зерно"

---

### 4. **Confusing Product Combination** (1 instance)
**ID:** 5422

**Current:** "Свиная колбаса, звено/котлета, неподготовленная"
**Problem:** "Звено" (sausage link) and "котлета" (patty) are different products. Cannot be both.

**Correction:** "Свиная колбаса (звено), сырая"

**Impact:** Users confused about what product they're buying

---

## All 20 Issues

| # | ID | Category | Current Name | Correction |
|----|----|----|----|----|
| 1 | 4193 | Awkward Phrasing | Авокадо сырое, **все коммерческие сорта** | Авокадо сырое |
| 2 | 3175 | Spacing Bug | Мука, ​​гречневая | Мука гречневая |
| 3 | 7863 | Spacing + Format | Мука, ​​кокос. | Мука кокосовая |
| 4 | 7834 | Spacing Bug | Мука, ​​манная крупа, мелкая | Мука манная, мелкая |
| 5 | sk-1076 | Overly Technical | Пиво светлое, **с долей сухих веществ в исходном сусле 11%** | Пиво светлое |
| 6 | sk-1077 | Overly Technical | Пиво светлое, **с долей сухих веществ в исходном сусле 20%** | Пиво светлое |
| 7 | sk-1078 | Overly Technical | Пиво темное, **с долей сухих веществ в исходном сусле 13%** | Пиво темное |
| 8 | sk-1079 | Overly Technical | Пиво темное, **с долей сухих веществ в исходном сусле 20%** | Пиво темное |
| 9 | 5422 | Confusing + Awkward | Свиная колбаса, **звено/котлета, неподготовленная** | Свиная колбаса (звено), сырая |
| 10 | 6350 | Foreign + Awkward | **Франкфуртер**, говядина, **неотапливаемый** | Сосиска говяжья, сырая |
| 11 | 4112 | Foreign Terminology | **Франкфуртер**, курица | Сосиска куриная |
| 12 | 5456 | Foreign Terminology | **Франкфуртер**, мясо | Сосиска мясная |
| 13 | 1046 | Awkward Literal Translation | Соленые огурцы, укроп или **кошерный укроп** | Соленые огурцы с укропом |
| 14 | 7405 | Confusing Structure | Хлеб, **белок (включая глютен)** | Хлеб пшеничный (содержит глютен) |
| 15 | 6418 | Verbose Description | Яблоки, консервированные, подслащенные, **нарезанные, осушенные, подогретые** | Яблоки консервированные, подслащенные |
| 16 | 2456 | Awkward State Term | Брокколи, замороженная, нарезанная, **неподготовленная** | Брокколи замороженная, нарезанная, сырая |
| 17 | 5715 | Wrong Category Prefix | **Напитки** чай черный заварной | Чай черный заварной |
| 18 | 1702 | Duplication | Кукуруза сладкая, **с сухими сухими веществами** | Кукуруза сладкая, консервированная |
| 19 | 2375 | Foreign Terminology | **Франкфуртер**, постный | Сосиска постная |
| 20 | 5452 | Foreign Terminology | **Франкфуртер**, свинина | Сосиска свиная |

---

## Pattern Analysis

### Foreign Words Not Localized (6 instances)
All instances of "франкфуртер" should be "сосиска" - this is a clear terminology mapping issue.

### Awkward State Descriptions (Multiple instances)
- "Неподготовленная" (unprepared) appears awkward - should be "сырая" (raw)
- "Неотапливаемый" (unheated) is confusing - should be "сырой"

### Technical Terminology Issues (4 beer products)
These appear to be copied directly from technical specifications, not consumer-facing names.

### Spacing Corruption (3 flour products)
Unicode non-breaking spaces after commas indicate data source encoding issues.

---

## Recommendations

### High Priority
1. **Replace all "франкфуртер" → "сосиска"** (6 products)
2. **Simplify beer product names** - remove "с долей сухых веществ в исходном сусле" phrase (4 products)
3. **Fix the duplicate word** in ID 1702 ("сухими сухими" → "сухими")

### Medium Priority
4. Fix Unicode spacing bugs in flour products (3 products)
5. Replace "неподготовленная/неподготовленный" with "сырая/сырой" where applicable
6. Remove confusing product type combinations

### Low Priority
7. Remove redundant phrases like "все коммерческие сорта"
8. Shorten overly verbose descriptions
9. Fix structural issues like "Напитки чай" → "Чай"

---

## Data Quality Notes

1. **Unicode Issues:** The мука entries have non-breaking spaces (U+200B, U+200C) corrupting the format
2. **Machine Translation Artifacts:** Some entries show clear Google Translate patterns (duplicate words, awkward technical jargon)
3. **Source Data Inconsistency:** Some products appear to use USDA database descriptions directly without localization
4. **Term Localization:** Foreign words aren't adapted to Russian idioms and common usage

---

## Files

- **JSON Report:** `translation-issues-report.json` (detailed structured data)
- **This Report:** `TRANSLATION_ISSUES_REPORT.md`

---

## Conclusion

The 20 identified issues represent approximately **1.2%** of the 1,632 products in the catalog, but they have outsized impact because:
- Several affect major food categories (beer, sausages, flour)
- They create search/discoverability problems
- They confuse Russian-speaking users
- Some indicate data corruption or incomplete localization

Fixing these should be straightforward, mostly involving terminology mapping and removing jargon.
