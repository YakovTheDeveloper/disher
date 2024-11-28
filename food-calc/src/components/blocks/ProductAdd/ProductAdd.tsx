import React, { RefObject, useRef } from 'react'
import { defaultNutrients } from './nutrients'
import styles from './ProductAdd.module.scss'
import { IProduct } from '../../../types/product/product'

const ProductAdd = () => {


  const inputRefs = useRef<{
    elements: {
      element: HTMLInputElement | null,
      id: number
    }[],
  }>({ elements: [] })

  const onAdd = () => {
    const productToAdd: IProduct = {
      name: '',
      description: '',
      content: {

      }
    }
    for (const elementData of inputRefs.current.elements) {
      productToAdd.content[elementData.id] = Number(elementData.element.value)
    }

  }

  return (
    <section className={styles.productAdd}>
      <div className={styles.describe}>
        <div className={styles.describeInputs}>
          <label htmlFor="">
            <span className={styles.describeNaming}>Наименование</span>
            <input type="text" placeholder='Tomato...' />
          </label>
          <label htmlFor="" className={styles.describeContainer}>
            <span className={styles.describeNaming}>Описание</span>
            <textarea placeholder='Some data...' />
          </label>
        </div>
        <h1 className={styles.title}><span>Create</span> <span className={styles.titleNotImportant}>product</span></h1>
      </div>
      <ul className={styles.nutrientList}>
        {defaultNutrients.map(({ displayName, unit, id }, index) => (
          <li className={styles.nutrient}>
            <label htmlFor="">{displayName}
              <div >
                <input type="number"
                  placeholder='0'
                  key={id}
                  ref={(element) => {
                    if (element) inputRefs.current.elements[index] = {
                      element,
                      id
                    };
                  }}
                />
                <span className={styles.unit}>{unit}</span>
              </div>

            </label>

          </li>
        ))}
      </ul>
      <div className={styles.actions}>
        <button onClick={onAdd} className={styles.addButton}>Create</button>
      </div>
    </section>
  )
}

export default ProductAdd