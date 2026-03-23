import { useState, useEffect, useMemo } from "react";
import { useQuery, useEntity } from "@triplit/react";
import { triplit } from "@/api/triplit/client";
import { referenceDb } from "@/api/dexie/client";

export type NutrientEntry = { nutrientId: string; quantity: number };

export function useProduct(productId: string | undefined) {
  return useEntity(triplit, "foods", productId ?? "");
}

export function useProducts(search?: string) {
  const query = triplit.query("foods");
  return useQuery(triplit, search ? query.Where("name", "like", `%${search}%`) : query);
}

export function useProductsByIds(productIds: string[]) {
  return useQuery(
    triplit,
    triplit
      .query("foods")
      .Where("id", "in", productIds.length > 0 ? productIds : ["__none__"]),
  );
}

/**
 * Returns foodNutrients for a single product.
 * System (USDA) nutrients from Dexie (KV), user-created from Triplit.
 */
export function useProductNutrients(productId: string | undefined) {
  const [dexieEntries, setDexieEntries] = useState<NutrientEntry[]>([]);
  const [dexieFetching, setDexieFetching] = useState(false);

  useEffect(() => {
    if (!productId) {
      setDexieEntries([]);
      return;
    }
    let cancelled = false;
    setDexieFetching(true);
    referenceDb.foodNutrients
      .get(productId)
      .then((row) => {
        if (cancelled) return;
        if (row) {
          setDexieEntries(
            Object.entries(row.nutrients).map(([nutrientId, quantity]) => ({ nutrientId, quantity })),
          );
        } else {
          setDexieEntries([]);
        }
        setDexieFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const { results: triplitNutrients, fetching: triplitFetching } = useQuery(
    triplit,
    triplit
      .query("foodNutrients")
      .Where("foodId", "=", productId ?? "")
      .Where("userId", "!=", "__system__"),
  );

  const merged = useMemo(() => {
    // If Dexie has results, use them (system product)
    if (dexieEntries.length > 0) return dexieEntries;
    // Otherwise, use Triplit results (user-created product)
    if (!triplitNutrients) return [];
    return [...triplitNutrients.values()].map((n) => ({
      nutrientId: n.nutrientId,
      quantity: n.quantity,
    }));
  }, [dexieEntries, triplitNutrients]);

  return { results: merged, fetching: dexieFetching || triplitFetching };
}

/**
 * Returns a Map<foodId, NutrientEntry[]> for a batch of food IDs.
 *
 * Dual-source lookup:
 * - System (USDA) nutrients → Dexie KV (one row per food, ~9K rows total)
 * - User-created nutrients → Triplit (real-time sync)
 *
 * For foodIds found in Dexie, those results are used.
 * For foodIds NOT in Dexie, Triplit user-created nutrients fill in.
 */
export function useNutrientsByFoodIds(
  foodIds: string[],
): Map<string, NutrientEntry[]> {
  const foodIdsKey = foodIds.join(",");

  // ─── Source 1: Dexie KV (system/USDA nutrients) ──────────────────────────
  const [dexieMap, setDexieMap] = useState<Map<string, NutrientEntry[]>>(new Map());

  useEffect(() => {
    const ids = foodIdsKey ? foodIdsKey.split(",") : [];
    if (!ids.length) {
      setDexieMap(new Map());
      return;
    }
    let cancelled = false;
    referenceDb.foodNutrients
      .where("foodId")
      .anyOf(ids)
      .toArray()
      .then((rows) => {
        if (cancelled) return;
        const map = new Map<string, NutrientEntry[]>();
        for (const row of rows) {
          map.set(
            row.foodId,
            Object.entries(row.nutrients).map(([nutrientId, quantity]) => ({ nutrientId, quantity })),
          );
        }
        setDexieMap(map);
      });
    return () => {
      cancelled = true;
    };
  }, [foodIdsKey]);

  // ─── Source 2: Triplit (user-created nutrients) ───────────────────────────
  const { results: triplitNutrients } = useQuery(
    triplit,
    triplit
      .query("foodNutrients")
      .Where("foodId", "in", foodIds.length > 0 ? foodIds : ["__none__"])
      .Where("userId", "!=", "__system__"),
  );

  // ─── Merge: Dexie first, then Triplit for missing foodIds ────────────────
  return useMemo(() => {
    const map = new Map<string, NutrientEntry[]>(dexieMap);

    // Add Triplit (user-created) nutrients for foodIds not already covered
    if (triplitNutrients) {
      for (const n of triplitNutrients.values()) {
        if (!map.has(n.foodId)) {
          map.set(n.foodId, []);
        }
        const arr = map.get(n.foodId)!;
        arr.push({ nutrientId: n.nutrientId, quantity: n.quantity });
      }
    }

    return map;
  }, [dexieMap, triplitNutrients]);
}

export function useProductPortions(productId: string | undefined) {
  return useQuery(
    triplit,
    triplit
      .query("foodPortions")
      .Where("foodId", "=", productId ?? ""),
  );
}
