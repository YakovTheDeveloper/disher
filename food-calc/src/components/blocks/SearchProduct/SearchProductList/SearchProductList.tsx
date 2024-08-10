import React from 'react'
import { Menus } from '../../../../store/rootStore'
import { IProductBase } from '../../../../types/menu/Menu'
import { fromHash, generateHash } from '../../../../lib/hash/hash'

const products = [
    {
        name: 'Apples',
        id: '1',
    },
    {
        name: 'Oranges',
        id: '2',
    },

]


const SearchProductList = ({ searchValue }) => {

    if (!searchValue) return null

    const found = products.filter(({ name }) => name.toLowerCase().includes(searchValue.toLowerCase()))

    function onAdd(product: IProductBase) {
        Menus.addTo({
            ...product,
            quantity: 0
        })
    }

    const onGenerate = () => {
        const hash = generateHash(JSON.stringify(products))
        console.log(hash)
    }

    const onDecrypt = () => {
        const hash = fromHash('VTJGc2RHVmtYMStIWndhQmlvWEZ2bDJmUHZPcHNsbFE5cXE0RzQrTmtBS2JVbkU4emtyQ0thZTR0bG5DUTlIS1RGMjQyRHRydWJ1ME1pWUorTFJFR1BvRWdGRjJBeGlLTWlENlJOb0JNN1dGa2ZsTUw2b1NMMklmeWVyVHVjMUlpdTlKK0pSTDY2Qk5hRGhRZE5PTThVTmNOT093K0RlcE1MMVM0elNUeXlBY29YRzVNVWVFdGozeUNiWVY3TWRjL2w5b1BpY3p6SDJxVFpRcitpdXlZZ0c5NVpiODZXUTJEVlFpSXhySk1iV1BDeXRaMHlmdm5GMndZWnNudm5GMzZ0UkZVOUlXSVJNdHFDVzBFb1ZQTEpYbGtkbjhUUjJuU0FHYlpkSVVtaGp6R1FrRWMrS0svYVFzQVg1VGpjSTZzeEpzVzNPK2NCakpjUUM4ZHkvUkR3N2hCaHVSc3J0MmlmYWJMaTVRdVRkcjNnL1VjWG4zNEdIbzVIaThxRWRKNm5Gd1ZBZnZiL3BteFlEa0J4OWtTb25meUo1N3luWkhlamxpdGJhdktpWWtzQXBlM2oxZ3ZFellCSk9pcFFQeXMxK09qaGpDbXp3dUV1ZUFTR205Y1Flc0YwMk9XMjZRYkJLWW0xWVRtM3hkc3phaDkxVnpJMzJ3Q1pvL1hGVCtxKzlYNi9jN2N6RGpHRUQwTEV5OGFCY043bDNvQXlodjNuZDgvS1VFYnlJeC9QUDR4Sk1ETm4wRmduSnhwMjQxd3hBQ3o0VmRpQlhXM2ZHZ1ZIcmY5b0hGOGVIbXFXOXA1TUcyRDRENlhUeDJZdlRYNFYxVmxZb0pjT2theEphYVRwSENBL2YwZUJxdWI2R1dxY1Ftdy9CbzU0L2ZubFRmVXcvRmpFZlF3YlRuczhaRDV2WDFuWUpyYzJhQ1FveHlMT09qNVZkSUUrS0ZxaTZwaFVTZFFucHRnQmtyOEs4Z1J5Q1NZWUZyb3ZyS0pseUxwYjMwNDJRdUUralVaQ2tPODhLSXFDUXQ2WktEa0ZsYm5na3RIRWhwTk1jWmxldk4rTGhWNGlqdHcxOGlOZ1l2NVdYUWxZVmFuOGpKU21Fa1kyZ1d4eTMrOE5leDUzai9DR0R5MnNRTkdEbkMrUUI5amZCTmFHc1k0aWdOSUlERC9pVlY1blhpWk9UcENHeTQ5aXl3T3doczBqeDZMdHBhYzhsdXVrdlpXVytXMlB1dXNXa3RneGQwVTM0OVBLekUvQmtQd1E3eFp0blI0K253NGFONU5JTEZObnpqa0lyc0EzdGNtMWpkZXhjOHZlc0FNMTlJREQ1T2R5MHJsSlQ2NXRyTDJ2UDVRR0lkUk1JU3NYRTJmV2JWbkpWa3Fjb2g2dDdIT1R1MEp2NkJPbzJnalZzRjdvQXgxQkVkNWdkZENHV1hFa2tGTHlpNXpxaWJMNU5Kb3JCanpSNXZnQ0FsNlVLd1pBQ0lwOGRuQStEcTg1L0JNK3NleTZNPQ==')
        console.log(hash)
    }




    return (
        <ul>
            {found.map((product) => <li key={product.id} onClick={() => onAdd(product)}>{product.name}</li>)}
        </ul>
    )
}

export default SearchProductList