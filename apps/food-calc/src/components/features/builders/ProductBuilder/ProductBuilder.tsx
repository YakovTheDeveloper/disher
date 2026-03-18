import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useDebounce } from 'use-debounce';
import styles from './ProductBuilder.module.scss';
import JSON5 from 'json5';
import { nutrientGroups } from '@/components/entities/nutrient/NutrientGroup/constants';

// TODO: migrate to Triplit — addFood was removed from @/api/food/food.api
const addFood = async (_payload: any): Promise<void> => {
  throw new Error('addFood not implemented — migrate to Triplit');
};

function ProductBuilder() {
  const [form, setForm] = useState({
    name: '',
    nameEng: '',
    description: '',
    descriptionEng: '',
    nutrients: {} as Record<number, number | undefined>,
  });

  const [importText, setImportText] = useState('');
  const [debouncedNutrients] = useDebounce(form.nutrients, 200); // optional

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (id: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      nutrients: { ...prev.nutrients, [id]: value === '' ? undefined : parseFloat(value) },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nutrients = Object.entries(form.nutrients)
      .filter(([_, val]) => val !== undefined)
      .map(([id, value]) => ({ id: Number(id), value: value! }));

    const payload = {
      name: form.name,
      nameEng: form.nameEng,
      description: form.description,
      descriptionEng: form.descriptionEng,
      nutrients,
    };

    try {
      setIsLoading(true);
      await addFood(payload);
      alert('Food added successfully!');
      setForm({ name: '', nameEng: '', description: '', descriptionEng: '', nutrients: {} });
      setImportText('');
    } catch (err) {
      console.error(err);
      alert('Error adding food');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    try {
      const data = JSON5.parse(importText);
      const nutrientMap: Record<number, number> = {};
      if (Array.isArray(data.nutrients)) {
        data.nutrients.forEach((n: any) => {
          if (n.id && typeof n.value === 'number') nutrientMap[n.id] = n.value;
        });
      }

      setForm({
        name: data.name ?? '',
        nameEng: data.nameEng ?? '',
        description: data.description ?? '',
        descriptionEng: data.descriptionEng ?? '',
        nutrients: nutrientMap,
      });

      alert('Data imported successfully!');
    } catch (err) {
      alert('Invalid JSON structure.');
    }
  };

  return (
    <div className={styles.wrapper}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.title}>Add / Edit Product</h2>

        {/* Import JSON */}
        <div className={styles.field}>
          <label>Import JSON</label>
          <textarea
            className={styles.importArea}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='Paste JSON like {"name":"Apple","description":"Fresh...","nutrients":[{"id":1,"value":0.3}]}'
          />
          <button type="button" onClick={handleImport} className={styles.importBtn}>
            Import
          </button>
        </div>

        {/* Name / Description Fields */}
        <div className={styles.field}>
          <label>Name (RU)</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Например, Яблоко"
            required
          />
        </div>

        <div className={styles.field}>
          <label>Name (EN)</label>
          <input
            type="text"
            value={form.nameEng}
            onChange={(e) => setForm({ ...form, nameEng: e.target.value })}
            placeholder="e.g., Apple"
          />
        </div>

        <div className={styles.field}>
          <label>Description (RU)</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Описание продукта..."
          />
        </div>

        <div className={styles.field}>
          <label>Description (EN)</label>
          <textarea
            value={form.descriptionEng}
            onChange={(e) => setForm({ ...form, descriptionEng: e.target.value })}
            placeholder="Product description..."
          />
        </div>

        {/* Scrollable Nutrients */}
        <div className={styles.nutrientContainer}>
          <h3>Nutrients</h3>
          <div className={styles.scrollArea}>
            {nutrientGroups.map((group: { name: string; displayName: string; content: { id: string; displayNameRu: string; unitRu: string }[] }) => (
              <div key={group.name} className={styles.group}>
                <h4>{group.displayName}</h4>
                <div className={styles.grid}>
                  {group.content.map((nutrient: { id: string; displayNameRu: string; unitRu: string }) => (
                    <div key={nutrient.id} className={styles.nutrient}>
                      <label>
                        {nutrient.displayNameRu} ({nutrient.unitRu})
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="0"
                        value={debouncedNutrients[Number(nutrient.id)] ?? ''}
                        onChange={(e) => handleChange(Number(nutrient.id), e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className={styles.submit}
          disabled={isLoading}
        >
          {isLoading ? <span className={styles.spinner}>Saving...</span> : 'Save Product'}
        </button>
      </form>
    </div>
  );
}

export default observer(ProductBuilder);
