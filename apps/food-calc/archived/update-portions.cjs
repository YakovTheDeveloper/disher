const fs = require('fs');

const providedData = [
    {
        "id": "1",
        "name": "Хумус",
        "category": "legume",
        "portions": [
            {
                "label": "1 serving",
                "amount": 100,
                "unit": "g",
                "grams": 100
            }
        ]
    },
    {
        "id": "2",
        "name": "Помидоры, виноград, сырые",
        "category": "vegetable",
        "portions": [
            {
                "label": "1 medium tomato",
                "amount": 123,
                "unit": "g",
                "grams": 123
            },
            {
                "label": "1 cup grapes",
                "amount": 151,
                "unit": "g",
                "grams": 151
            }
        ]
    },
    {
        "id": "3",
        "name": "Фасоль, свежая, зеленая, консервированная",
        "category": "legume",
        "portions": [
            {
                "label": "1 cup",
                "amount": 130,
                "unit": "g",
                "grams": 130
            }
        ]
    },
    {
        "id": "4",
        "name": "Сосиски говяжьи, необжаренные",
        "category": "meat",
        "portions": [
            {
                "label": "1 sausage",
                "amount": 75,
                "unit": "g",
                "grams": 75
            }
        ]
    },
    {
        "id": "5",
        "name": "Орехи, миндаль, обжаренные в сухарях",
        "category": "nut",
        "portions": [
            {
                "label": "1 oz",
                "amount": 28,
                "unit": "g",
                "grams": 28
            }
        ]
    },
    {
        "id": "6",
        "name": "Капуста, сырая",
        "category": "vegetable",
        "portions": [
            {
                "label": "1 cup",
                "amount": 89,
                "unit": "g",
                "grams": 89
            }
        ]
    },
    {
        "id": "7",
        "name": "Яйца, целые, сырые",
        "category": "other",
        "portions": [
            {
                "label": "1 large egg",
                "amount": 50,
                "unit": "g",
                "grams": 50
            }
        ]
    },
    {
        "id": "8",
        "name": "Яйцо, белое, сырое",
        "category": "other",
        "portions": [
            {
                "label": "1 large egg white",
                "amount": 33,
                "unit": "g",
                "grams": 33
            }
        ]
    },
    {
        "id": "9",
        "name": "Яйцо, белое, сушеное",
        "category": "other",
        "portions": [
            {
                "label": "1 tbsp",
                "amount": 9,
                "unit": "g",
                "grams": 9
            }
        ]
    },
    {
        "id": "10",
        "name": "Луковые кольца, запанированные",
        "category": "other",
        "portions": [
            {
                "label": "1 serving",
                "amount": 85,
                "unit": "g",
                "grams": 85
            }
        ]
    },
    {
        "id": "11",
        "name": "Соленые огурцы",
        "category": "vegetable",
        "portions": [
            {
                "label": "1 pickle",
                "amount": 50,
                "unit": "g",
                "grams": 50
            }
        ]
    },
    {
        "id": "12",
        "name": "Сыр, пармезан, тертый",
        "category": "dairy",
        "portions": [
            {
                "label": "1 oz",
                "amount": 28,
                "unit": "g",
                "grams": 28
            }
        ]
    },
    {
        "id": "13",
        "name": "Сыр пастеризованный, американский",
        "category": "dairy",
        "portions": [
            {
                "label": "1 slice",
                "amount": 20,
                "unit": "g",
                "grams": 20
            }
        ]
    },
    {
        "id": "14",
        "name": "Сок грейпфрутовый",
        "category": "beverage",
        "portions": [
            {
                "label": "1 cup",
                "amount": 240,
                "unit": "ml",
                "grams": 240
            }
        ]
    },
    {
        "id": "15",
        "name": "Персики желтые, сырые",
        "category": "fruit",
        "portions": [
            {
                "label": "1 medium peach",
                "amount": 150,
                "unit": "g",
                "grams": 150
            }
        ]
    },
    {
        "id": "16",
        "name": "Семечки, ядра семян подсолнечника",
        "category": "seed",
        "portions": [
            {
                "label": "1 oz",
                "amount": 28,
                "unit": "g",
                "grams": 28
            }
        ]
    },
    {
        "id": "17",
        "name": "Хлеб белый",
        "category": "grain",
        "portions": [
            {
                "label": "1 slice",
                "amount": 28,
                "unit": "g",
                "grams": 28
            }
        ]
    },
    {
        "id": "18",
        "name": "Капуста кале, замороженная",
        "category": "vegetable",
        "portions": [
            {
                "label": "1 cup",
                "amount": 67,
                "unit": "g",
                "grams": 67
            }
        ]
    },
    {
        "id": "19",
        "name": "Горчица готовая",
        "category": "condiment",
        "portions": [
            {
                "label": "1 tsp",
                "amount": 5,
                "unit": "g",
                "grams": 5
            }
        ]
    },
    {
        "id": "20",
        "name": "Киви, зеленые, сырые",
        "category": "fruit",
        "portions": [
            {
                "label": "1 medium kiwi",
                "amount": 75,
                "unit": "g",
                "grams": 75
            }
        ]
    },
    {
        "id": "21",
        "name": "Нектарины, сырые",
        "category": "fruit",
        "portions": [
            {
                "label": "1 medium nectarine",
                "amount": 150,
                "unit": "g",
                "grams": 150
            }
        ]
    },
    {
        "id": "22",
        "name": "Сыр, чеддер",
        "category": "dairy",
        "portions": [
            {
                "label": "1 oz",
                "amount": 28,
                "unit": "g",
                "grams": 28
            }
        ]
    },
    {
        "id": "23",
        "name": "Сыр творожный, нежирный",
        "category": "dairy",
        "portions": [
            {
                "label": "1 oz",
                "amount": 28,
                "unit": "g",
                "grams": 28
            }
        ]
    },
    {
        "id": "24",
        "name": "Сыр моцарелла",
        "category": "dairy",
        "portions": [
            {
                "label": "1 oz",
                "amount": 28,
                "unit": "g",
                "grams": 28
            }
        ]
    },
    {
        "id": "25",
        "name": "Яйцо, цельное, сушеное",
        "category": "other",
        "portions": [
            {
                "label": "1 tbsp",
                "amount": 9,
                "unit": "g",
                "grams": 9
            }
        ]
    },
    {
        "id": "26",
        "name": "Яйцо, желток, сырое",
        "category": "other",
        "portions": [
            {
                "label": "1 large egg yolk",
                "amount": 17,
                "unit": "g",
                "grams": 17
            }
        ]
    },
    {
        "id": "27",
        "name": "Яйцо, желток, сушеное",
        "category": "other",
        "portions": [
            {
                "label": "1 tbsp",
                "amount": 9,
                "unit": "g",
                "grams": 9
            }
        ]
    },
    {
        "id": "28",
        "name": "Йогурт, греческий, простой",
        "category": "dairy",
        "portions": [
            {
                "label": "1 cup",
                "amount": 245,
                "unit": "g",
                "grams": 245
            }
        ]
    },
    {
        "id": "29",
        "name": "Йогурт, греческий, клубничный",
        "category": "dairy",
        "portions": [
            {
                "label": "1 cup",
                "amount": 245,
                "unit": "g",
                "grams": 245
            }
        ]
    },
    {
        "id": "30",
        "name": "Масло, кокосовое",
        "category": "oil",
        "portions": [
            {
                "label": "1 tbsp",
                "amount": 14,
                "unit": "g",
                "grams": 14
            }
        ]
    },
    {
        "id": "31",
        "name": "Курица, бройлеры",
        "category": "meat",
        "portions": [
            {
                "label": "1 leg",
                "amount": 100,
                "unit": "g",
                "grams": 100
            }
        ]
    },
    {
        "id": "32",
        "name": "Курица, приготовленная на гриле",
        "category": "meat",
        "portions": [
            {
                "label": "1 breast",
                "amount": 100,
                "unit": "g",
                "grams": 100
            }
        ]
    },
    {
        "id": "33",
        "name": "Соус, паста, спагетти",
        "category": "condiment",
        "portions": [
            {
                "label": "1/2 cup",
                "amount": 125,
                "unit": "g",
                "grams": 125
            }
        ]
    },
    {
        "id": "34",
        "name": "Ветчина, нарезанная ломтиками",
        "category": "meat",
        "portions": [
            {
                "label": "1 slice",
                "amount": 28,
                "unit": "g",
                "grams": 28
            }
        ]
    },
    {
        "id": "35",
        "name": "Оливки, зеленые",
        "category": "vegetable",
        "portions": [
            {
                "label": "1 oz",
                "amount": 28,
                "unit": "g",
                "grams": 28
            }
        ]
    },
    {
        "id": "36",
        "name": "Печенье овсяное",
        "category": "sweet",
        "portions": [
            {
                "label": "1 cookie",
                "amount": 15,
                "unit": "g",
                "grams": 15
            }
        ]
    },
    {
        "id": "37",
        "name": "Помидоры консервированные",
        "category": "vegetable",
        "portions": [
            {
                "label": "1/2 cup",
                "amount": 120,
                "unit": "g",
                "grams": 120
            }
        ]
    },
    {
        "id": "38",
        "name": "Рыба, пикша, сырая",
        "category": "fish",
        "portions": [
            {
                "label": "1 fillet",
                "amount": 100,
                "unit": "g",
                "grams": 100
            }
        ]
    },
    {
        "id": "39",
        "name": "Рыба, минтай, сырой",
        "category": "fish",
        "portions": [
            {
                "label": "1 fillet",
                "amount": 100,
                "unit": "g",
                "grams": 100
            }
        ]
    },
    {
        "id": "40",
        "name": "Рыба, тунец, консервированный",
        "category": "fish",
        "portions": [
            {
                "label": "1 can",
                "amount": 140,
                "unit": "g",
                "grams": 140
            }
        ]
    },
    {
        "id": "41",
        "name": "Ресторан, китайская кухня, жареный рис",
        "category": "grain",
        "portions": [
            {
                "label": "1 cup",
                "amount": 200,
                "unit": "g",
                "grams": 200
            }
        ]
    },
    {
        "id": "42",
        "name": "Ресторан, латиноамериканский, тамале",
        "category": "other",
        "portions": [
            {
                "label": "1 tamale",
                "amount": 100,
                "unit": "g",
                "grams": 100
            }
        ]
    },
    {
        "id": "43",
        "name": "Ресторан, латиноамериканский, pupusas",
        "category": "other",
        "portions": [
            {
                "label": "1 pupusa",
                "amount": 100,
                "unit": "g",
                "grams": 100
            }
        ]
    },
    {
        "id": "44",
        "name": "Хлеб цельнозерновой",
        "category": "grain",
        "portions": [
            {
                "label": "1 slice",
                "amount": 28,
                "unit": "g",
                "grams": 28
            }
        ]
    },
    {
        "id": "45",
        "name": "Говядина, корейка",
        "category": "meat",
        "portions": [
            {
                "label": "1 steak",
                "amount": 100,
                "unit": "g",
                "grams": 100
            }
        ]
    },
    {
        "id": "46",
        "name": "Говядина, филейная часть",
        "category": "meat",
        "portions": [
            {
                "label": "1 steak",
                "amount": 100,
                "unit": "g",
                "grams": 100
            }
        ]
    },
    {
        "id": "47",
        "name": "Говядина круглая",
        "category": "meat",
        "portions": [
            {
                "label": "1 steak",
                "amount": 100,
                "unit": "g",
                "grams": 100
            }
        ]
    },
    {
        "id": "48",
        "name": "Говядина круглая, обжаренная",
        "category": "meat",
        "portions": [
            {
                "label": "1 steak",
                "amount": 100,
                "unit": "g",
                "grams": 100
            }
        ]
    },
    {
        "id": "49",
        "name": "Говядина, филейная часть, стейк",
        "category": "meat",
        "portions": [
            {
                "label": "1 steak",
                "amount": 100,
                "unit": "g",
                "grams": 100
            }
        ]
    },
    {
        "id": "50",
        "name": "Говядина, филейная часть, стейк на т-образной кости",
        "category": "meat",
        "portions": [
            {
                "label": "1 steak",
                "amount": 100,
                "unit": "g",
                "grams": 100
            }
        ]
    }
];

// Read the file
const fileDataStr = fs.readFileSync('public/productsWithPortions.js', 'utf8');
const fileData = JSON.parse(fileDataStr);

// Create a map of portions by id
const portionsMap = {};
providedData.forEach(item => {
    portionsMap[item.id] = item.portions;
});

// Update the fileData
fileData.forEach(item => {
    if (portionsMap[item.id]) {
        item.portions = portionsMap[item.id];
    }
});

// Write back
fs.writeFileSync('public/productsWithPortions.js', JSON.stringify(fileData, null, 4));
