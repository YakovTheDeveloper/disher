#!/usr/bin/env python3
"""
Add European-relevant portions to all foods in combined-foods-final.json.
Remove US-specific portions (cups, oz, fl oz).
Portions based on typical European household measurements and natural units.
"""

import json
import sys
import re

# ============================================================
# PORTION DEFINITIONS BY SPECIFIC PRODUCT (name-based matching)
# These override category defaults when matched
# ============================================================

# Key = substring or exact match in food name (lowercase)
# Value = list of portions
SPECIFIC_PORTIONS = {}

def p(label, grams):
    """Shorthand for portion dict"""
    return {"label": label, "grams": grams}

# ------- EGGS -------
for name in ["яйцо цельное", "яйцо куриное"]:
    SPECIFIC_PORTIONS[name] = [
        p("1 яйцо, маленькое (S)", 48),
        p("1 яйцо, среднее (M)", 55),
        p("1 яйцо, крупное (L)", 63),
        p("1 яйцо, очень крупное (XL)", 73),
    ]

SPECIFIC_PORTIONS["яйцо белок"] = [
    p("белок 1 яйца", 33),
]
SPECIFIC_PORTIONS["яйцо желток"] = [
    p("желток 1 яйца", 17),
]
SPECIFIC_PORTIONS["белок"] = [
    p("белок 1 яйца", 33),
]
SPECIFIC_PORTIONS["желток"] = [
    p("желток 1 яйца", 17),
]
SPECIFIC_PORTIONS["меланж"] = [
    p("1 яйцо (эквивалент)", 55),
]

# ------- BANANAS -------
for name in ["банан", "бананы спелые"]:
    SPECIFIC_PORTIONS[name] = [
        p("1 банан, маленький", 80),
        p("1 банан, средний", 120),
        p("1 банан, крупный", 150),
    ]

# ------- APPLES -------
for name in ["яблоки", "яблоко"]:
    SPECIFIC_PORTIONS[name] = [
        p("1 яблоко, маленькое", 130),
        p("1 яблоко, среднее", 180),
        p("1 яблоко, крупное", 220),
    ]

# ------- CITRUS -------
SPECIFIC_PORTIONS["апельсин"] = [
    p("1 апельсин, маленький", 100),
    p("1 апельсин, средний", 150),
    p("1 апельсин, крупный", 200),
]
SPECIFIC_PORTIONS["мандарин"] = [
    p("1 мандарин, маленький", 50),
    p("1 мандарин, средний", 75),
    p("1 мандарин, крупный", 100),
]
SPECIFIC_PORTIONS["клементин"] = [
    p("1 клементин", 60),
]
SPECIFIC_PORTIONS["лимон"] = [
    p("1 лимон", 60),
    p("долька лимона", 10),
    p("сок 1 лимона", 30),
]
SPECIFIC_PORTIONS["грейпфрут"] = [
    p("½ грейпфрута", 125),
    p("1 грейпфрут", 250),
]
SPECIFIC_PORTIONS["лайм"] = [
    p("1 лайм", 50),
    p("сок 1 лайма", 20),
]

# ------- STONE FRUITS -------
SPECIFIC_PORTIONS["абрикос"] = [
    p("1 абрикос", 40),
    p("3 абрикоса", 120),
]
SPECIFIC_PORTIONS["персик"] = [
    p("1 персик, маленький", 100),
    p("1 персик, средний", 150),
]
SPECIFIC_PORTIONS["нектарин"] = [
    p("1 нектарин", 140),
]
SPECIFIC_PORTIONS["слива"] = [
    p("1 слива", 50),
    p("3 сливы", 150),
]
SPECIFIC_PORTIONS["вишня"] = [
    p("горсть (10 шт)", 60),
    p("100 г", 100),
]
SPECIFIC_PORTIONS["черешня"] = [
    p("горсть (10 шт)", 70),
    p("100 г", 100),
]
SPECIFIC_PORTIONS["алыча"] = [
    p("1 штука", 30),
    p("5 штук", 150),
]

# ------- BERRIES -------
for name in ["клубника", "земляника"]:
    SPECIFIC_PORTIONS[name] = [
        p("1 ягода, средняя", 12),
        p("горсть (5-6 шт)", 65),
        p("100 г", 100),
    ]
SPECIFIC_PORTIONS["малина"] = [
    p("горсть", 40),
    p("100 г", 100),
]
for name in ["черника", "голубика"]:
    SPECIFIC_PORTIONS[name] = [
        p("горсть", 40),
        p("100 г", 100),
    ]
SPECIFIC_PORTIONS["ежевика"] = [
    p("горсть", 50),
    p("100 г", 100),
]
SPECIFIC_PORTIONS["брусника"] = [
    p("столовая ложка", 15),
    p("100 г", 100),
]
SPECIFIC_PORTIONS["клюква"] = [
    p("столовая ложка", 15),
    p("100 г", 100),
]
SPECIFIC_PORTIONS["крыжовник"] = [
    p("горсть (10 шт)", 50),
    p("100 г", 100),
]
SPECIFIC_PORTIONS["смородина"] = [
    p("горсть", 30),
    p("100 г", 100),
]
SPECIFIC_PORTIONS["морошка"] = [
    p("горсть", 40),
    p("100 г", 100),
]

# ------- OTHER FRUITS -------
SPECIFIC_PORTIONS["груша"] = [
    p("1 груша, маленькая", 120),
    p("1 груша, средняя", 170),
    p("1 груша, крупная", 220),
]
SPECIFIC_PORTIONS["виноград"] = [
    p("горсть (10-12 ягод)", 50),
    p("100 г", 100),
    p("гроздь, маленькая", 150),
]
SPECIFIC_PORTIONS["арбуз"] = [
    p("ломтик", 250),
    p("порция, кубики", 150),
]
SPECIFIC_PORTIONS["дыня"] = [
    p("ломтик", 150),
    p("порция, кубики", 150),
]
SPECIFIC_PORTIONS["ананас"] = [
    p("кольцо", 80),
    p("порция, кубики", 150),
]
SPECIFIC_PORTIONS["хурма"] = [
    p("1 штука", 170),
]
SPECIFIC_PORTIONS["гранат"] = [
    p("½ граната", 100),
    p("1 гранат", 200),
]
SPECIFIC_PORTIONS["киви"] = [
    p("1 киви", 75),
    p("2 киви", 150),
]
SPECIFIC_PORTIONS["инжир"] = [
    p("1 штука, свежий", 50),
    p("3 штуки, свежие", 150),
]
SPECIFIC_PORTIONS["инжир сушен"] = [
    p("1 штука", 10),
    p("5 штук", 50),
]
SPECIFIC_PORTIONS["манго"] = [
    p("½ манго", 100),
    p("1 манго", 200),
]
SPECIFIC_PORTIONS["авокадо"] = [
    p("½ авокадо", 75),
    p("1 авокадо", 150),
]
SPECIFIC_PORTIONS["айва"] = [
    p("1 штука", 200),
]
SPECIFIC_PORTIONS["финики"] = [
    p("1 штука", 8),
    p("5 штук", 40),
]
SPECIFIC_PORTIONS["курага"] = [
    p("1 штука", 8),
    p("5 штук", 40),
    p("горсть", 30),
]
SPECIFIC_PORTIONS["урюк"] = [
    p("1 штука", 10),
    p("5 штук", 50),
]
SPECIFIC_PORTIONS["чернослив"] = [
    p("1 штука", 10),
    p("5 штук", 50),
]
SPECIFIC_PORTIONS["изюм"] = [
    p("столовая ложка", 15),
    p("горсть", 30),
]
# ------- JUICES (must come before fruit names to match first) -------
for juice_name in ["абрикосовый сок", "ананасовый сок", "апельсиновый сок",
                   "виноградный сок", "вишневый сок", "гранатовый сок",
                   "грейпфрутовый сок", "лимонный сок", "мандариновый сок",
                   "морковный сок", "персиковый сок", "свекольный сок",
                   "томатный сок", "черносмородиновый сок", "яблочный сок"]:
    SPECIFIC_PORTIONS[juice_name] = [
        p("стакан (200 мл)", 200),
    ]

SPECIFIC_PORTIONS["шиповник"] = [
    p("столовая ложка", 10),
]
SPECIFIC_PORTIONS["облепиха"] = [
    p("столовая ложка", 15),
    p("100 г", 100),
]
SPECIFIC_PORTIONS["рябина"] = [
    p("столовая ложка", 15),
    p("100 г", 100),
]
SPECIFIC_PORTIONS["папайя"] = [
    p("½ папайи", 150),
    p("порция, кубики", 150),
]
SPECIFIC_PORTIONS["маракуйя"] = [
    p("1 штука", 18),
    p("3 штуки", 54),
]
SPECIFIC_PORTIONS["личи"] = [
    p("1 штука", 10),
    p("5 штук", 50),
]
SPECIFIC_PORTIONS["гуава"] = [
    p("1 штука", 55),
]
SPECIFIC_PORTIONS["джекфрут"] = [
    p("порция", 150),
]
SPECIFIC_PORTIONS["кумкват"] = [
    p("1 штука", 19),
    p("5 штук", 95),
]

# ------- DRIED FRUITS -------
SPECIFIC_PORTIONS["яблоки сушен"] = [
    p("горсть", 30),
    p("100 г", 100),
]
SPECIFIC_PORTIONS["груша сушен"] = [
    p("горсть", 30),
    p("100 г", 100),
]
SPECIFIC_PORTIONS["виноград сушен"] = [
    p("столовая ложка", 15),
    p("горсть", 30),
]
SPECIFIC_PORTIONS["персики сушен"] = [
    p("горсть", 30),
]
SPECIFIC_PORTIONS["цукаты"] = [
    p("столовая ложка", 15),
    p("горсть", 30),
]
SPECIFIC_PORTIONS["банановые чипсы"] = [
    p("горсть", 30),
]

# ------- JAM -------
SPECIFIC_PORTIONS["варенье"] = [
    p("чайная ложка", 10),
    p("столовая ложка", 20),
]

# ------- VEGETABLES - SPECIFIC -------
SPECIFIC_PORTIONS["картофель"] = [
    p("1 картофелина, маленькая", 80),
    p("1 картофелина, средняя", 130),
    p("1 картофелина, крупная", 200),
]
SPECIFIC_PORTIONS["морковь"] = [
    p("1 морковь, маленькая", 60),
    p("1 морковь, средняя", 80),
    p("1 морковь, крупная", 120),
]
SPECIFIC_PORTIONS["лук репка"] = [
    p("1 луковица, маленькая", 60),
    p("1 луковица, средняя", 90),
    p("1 луковица, крупная", 130),
]
SPECIFIC_PORTIONS["лук белый"] = [
    p("1 луковица, средняя", 90),
]
SPECIFIC_PORTIONS["лук желтый"] = [
    p("1 луковица, средняя", 90),
]
SPECIFIC_PORTIONS["лук красный"] = [
    p("1 луковица, средняя", 80),
]
SPECIFIC_PORTIONS["лук сладкий"] = [
    p("1 луковица, средняя", 100),
]
SPECIFIC_PORTIONS["лук зеленый"] = [
    p("1 перо", 5),
    p("пучок", 50),
]
SPECIFIC_PORTIONS["лук-шалот"] = [
    p("1 штука", 30),
]
SPECIFIC_PORTIONS["лук порей"] = [
    p("1 стебель", 150),
]
SPECIFIC_PORTIONS["чеснок"] = [
    p("1 зубчик", 4),
    p("3 зубчика", 12),
    p("1 головка", 40),
]
SPECIFIC_PORTIONS["огурец"] = [
    p("1 огурец, маленький", 100),
    p("1 огурец, средний", 150),
    p("1 огурец, крупный", 200),
]
SPECIFIC_PORTIONS["огурцы солен"] = [
    p("1 штука, маленький", 50),
    p("1 штука, средний", 80),
]
SPECIFIC_PORTIONS["помидор"] = [
    p("1 помидор, маленький", 80),
    p("1 помидор, средний", 120),
    p("1 помидор, крупный", 180),
]
SPECIFIC_PORTIONS["томат"] = [
    p("1 помидор, маленький", 80),
    p("1 помидор, средний", 120),
    p("1 помидор, крупный", 180),
]
SPECIFIC_PORTIONS["помидоры grape"] = [
    p("5 штук", 50),
    p("10 штук", 100),
]
SPECIFIC_PORTIONS["помидоры вялен"] = [
    p("5 штук", 15),
    p("столовая ложка", 10),
]
SPECIFIC_PORTIONS["помидоры зелен"] = [
    p("1 штука", 120),
]
SPECIFIC_PORTIONS["томатная паста"] = [
    p("чайная ложка", 6),
    p("столовая ложка", 18),
]
SPECIFIC_PORTIONS["томатное пюре"] = [
    p("столовая ложка", 18),
    p("100 г", 100),
]
SPECIFIC_PORTIONS["кетчуп"] = [
    p("чайная ложка", 6),
    p("столовая ложка", 17),
]
SPECIFIC_PORTIONS["перец болгарский"] = [
    p("1 перец, маленький", 100),
    p("1 перец, средний", 150),
    p("1 перец, крупный", 200),
]
SPECIFIC_PORTIONS["перец сладкий"] = [
    p("1 перец, маленький", 100),
    p("1 перец, средний", 150),
]
SPECIFIC_PORTIONS["перец острый"] = [
    p("1 штука", 15),
]
SPECIFIC_PORTIONS["перец халапеньо"] = [
    p("1 штука", 15),
]
SPECIFIC_PORTIONS["перец венгерский"] = [
    p("1 штука", 20),
]
SPECIFIC_PORTIONS["баклажан"] = [
    p("1 баклажан, маленький", 180),
    p("1 баклажан, средний", 250),
]
SPECIFIC_PORTIONS["кабачки"] = [
    p("1 кабачок, маленький", 150),
    p("1 кабачок, средний", 250),
]
SPECIFIC_PORTIONS["кабачки зимние"] = [
    p("порция, кубики", 150),
]
SPECIFIC_PORTIONS["кабачки летние"] = [
    p("1 кабачок, маленький", 150),
    p("1 кабачок, средний", 250),
]
SPECIFIC_PORTIONS["тыква"] = [
    p("порция, кубики", 150),
    p("ломтик", 100),
]
SPECIFIC_PORTIONS["капуста белокочанная"] = [
    p("порция, нашинкованная", 100),
    p("100 г", 100),
]
SPECIFIC_PORTIONS["капуста"] = [
    p("порция, нашинкованная", 100),
    p("100 г", 100),
]
SPECIFIC_PORTIONS["капуста квашеная"] = [
    p("столовая ложка", 25),
    p("порция", 100),
]
SPECIFIC_PORTIONS["брокколи"] = [
    p("соцветие", 30),
    p("порция", 100),
]
SPECIFIC_PORTIONS["цветная капуста"] = [
    p("соцветие", 30),
    p("порция", 100),
]
SPECIFIC_PORTIONS["брюссельская капуста"] = [
    p("1 кочанчик", 15),
    p("порция (5-6 шт)", 85),
]
SPECIFIC_PORTIONS["брюква"] = [
    p("порция, кубики", 100),
]
SPECIFIC_PORTIONS["свекла"] = [
    p("1 свекла, маленькая", 80),
    p("1 свекла, средняя", 120),
]
SPECIFIC_PORTIONS["редис"] = [
    p("1 штука", 8),
    p("5 штук", 40),
    p("пучок (10 шт)", 80),
]
SPECIFIC_PORTIONS["редька"] = [
    p("1 штука", 150),
]
SPECIFIC_PORTIONS["репа"] = [
    p("1 штука", 150),
]
SPECIFIC_PORTIONS["пастернак"] = [
    p("1 штука", 120),
]
SPECIFIC_PORTIONS["сельдерей"] = [
    p("1 стебель", 40),
    p("порция", 100),
]
SPECIFIC_PORTIONS["сельдерей (корень)"] = [
    p("1 штука", 300),
    p("порция", 100),
]
SPECIFIC_PORTIONS["спаржа"] = [
    p("1 стебель", 15),
    p("порция (5-6 стеблей)", 80),
]
SPECIFIC_PORTIONS["шпинат"] = [
    p("горсть, свежий", 30),
    p("порция", 100),
]
SPECIFIC_PORTIONS["салат"] = [
    p("горсть", 30),
    p("порция", 50),
]
SPECIFIC_PORTIONS["руккола"] = [
    p("горсть", 20),
    p("порция", 40),
]
SPECIFIC_PORTIONS["кресс-салат"] = [
    p("горсть", 20),
    p("порция", 40),
]
SPECIFIC_PORTIONS["петрушка"] = [
    p("1 веточка", 3),
    p("столовая ложка, нарезанная", 5),
    p("пучок", 40),
]
SPECIFIC_PORTIONS["укроп"] = [
    p("1 веточка", 2),
    p("столовая ложка, нарезанный", 4),
    p("пучок", 30),
]
SPECIFIC_PORTIONS["щавель"] = [
    p("горсть", 30),
    p("порция", 100),
]
SPECIFIC_PORTIONS["артишок"] = [
    p("1 штука, средний", 120),
]
SPECIFIC_PORTIONS["ревень"] = [
    p("1 стебель", 60),
    p("порция", 100),
]
SPECIFIC_PORTIONS["хрен"] = [
    p("чайная ложка, тёртый", 5),
    p("столовая ложка, тёртый", 15),
]
SPECIFIC_PORTIONS["топинамбур"] = [
    p("1 штука", 50),
    p("порция", 100),
]
SPECIFIC_PORTIONS["кукуруза сладкая"] = [
    p("1 початок", 200),
    p("порция зёрен", 100),
]
SPECIFIC_PORTIONS["фасоль зеленая"] = [
    p("порция", 100),
]
SPECIFIC_PORTIONS["фасоль (стручок)"] = [
    p("порция", 100),
]
SPECIFIC_PORTIONS["соевые бобы"] = [
    p("порция", 80),
]
SPECIFIC_PORTIONS["горошек зеленый"] = [
    p("столовая ложка", 20),
    p("порция", 80),
]
SPECIFIC_PORTIONS["горох зеленый"] = [
    p("столовая ложка", 20),
    p("порция", 80),
]
SPECIFIC_PORTIONS["имбирь свежий"] = [
    p("ломтик (1 см)", 5),
    p("чайная ложка, тёртый", 5),
    p("столовая ложка, тёртый", 15),
]
SPECIFIC_PORTIONS["корень имбиря"] = [
    p("ломтик (1 см)", 5),
    p("чайная ложка, тёртый", 5),
]

# ------- MUSHROOMS -------
for name in ["грибы", "гриб,", "шампиньоны", "белые грибы", "лисички", "опята",
             "подберезовики", "подосиновики", "сыроежки"]:
    SPECIFIC_PORTIONS[name] = [
        p("порция", 100),
        p("50 г", 50),
    ]
SPECIFIC_PORTIONS["белые сушеные грибы"] = [
    p("горсть", 15),
    p("50 г", 50),
]

# ------- SEAWEED / SPIRULINA -------
SPECIFIC_PORTIONS["спирулина"] = [
    p("чайная ложка", 3),
    p("столовая ложка", 8),
]

# ------- IKRA (CAVIAR SPREAD) -------
SPECIFIC_PORTIONS["икра из баклажан"] = [
    p("столовая ложка", 25),
    p("порция", 80),
]
SPECIFIC_PORTIONS["икра кабачков"] = [
    p("столовая ложка", 25),
    p("порция", 80),
]
SPECIFIC_PORTIONS["икра свеклов"] = [
    p("столовая ложка", 25),
    p("порция", 80),
]

# ------- LEGUMES (DRY) -------
for name in ["горох лущен", "горох, зерно", "фасоль, зерно", "фасоль сухая",
             "фасоль, сухая", "нут", "соя, зерно", "чечевица", "бобы",
             "черный горошек"]:
    SPECIFIC_PORTIONS[name] = [
        p("столовая ложка (сухой)", 20),
        p("порция (сухой)", 60),
        p("порция (варёный)", 150),
    ]

SPECIFIC_PORTIONS["соевое молоко"] = [
    p("стакан (200 мл)", 200),
]
SPECIFIC_PORTIONS["молоко соевое"] = [
    p("стакан (200 мл)", 200),
]
SPECIFIC_PORTIONS["миндальное молоко"] = [
    p("стакан (200 мл)", 200),
]
SPECIFIC_PORTIONS["тофу"] = [
    p("порция (100 г)", 100),
    p("ломтик", 50),
]
SPECIFIC_PORTIONS["мисо"] = [
    p("чайная ложка", 6),
    p("столовая ложка", 18),
]

# ------- NUTS -------
for name in ["арахис", "грецкий орех", "кешью", "миндаль", "фундук",
             "орехи пекан", "бразильские орехи", "орехи, желуди",
             "орехи, каштан", "кедровые орехи", "орехи, кешью",
             "орехи, миндаль", "орехи, орехи макадамия", "орехи, фундук"]:
    SPECIFIC_PORTIONS[name] = [
        p("горсть", 30),
        p("столовая ложка", 10),
    ]
SPECIFIC_PORTIONS["кокосовая мякоть"] = [
    p("кусочек", 20),
    p("порция", 50),
]
SPECIFIC_PORTIONS["кокосовые сливки"] = [
    p("столовая ложка", 15),
]

# ------- SEEDS -------
for name in ["подсолнечник", "кунжут", "мак", "горчица",
             "семена тыквы", "семя подсолнечника", "семена, ядра",
             "семя льна", "семена чиа"]:
    SPECIFIC_PORTIONS[name] = [
        p("чайная ложка", 5),
        p("столовая ложка", 10),
        p("горсть", 20),
    ]

SPECIFIC_PORTIONS["оливки"] = [
    p("1 штука", 5),
    p("5 штук", 25),
    p("порция (10 шт)", 50),
]

# ------- DAIRY -------
SPECIFIC_PORTIONS["молоко пастеризован"] = [
    p("стакан (200 мл)", 200),
    p("столовая ложка", 15),
]
SPECIFIC_PORTIONS["молоко топлен"] = [
    p("стакан (200 мл)", 200),
]
SPECIFIC_PORTIONS["кефир"] = [
    p("стакан (200 мл)", 200),
]
SPECIFIC_PORTIONS["ряженка"] = [
    p("стакан (200 мл)", 200),
]
SPECIFIC_PORTIONS["простокваша"] = [
    p("стакан (200 мл)", 200),
]
SPECIFIC_PORTIONS["кумыс"] = [
    p("стакан (200 мл)", 200),
]
SPECIFIC_PORTIONS["йогурт"] = [
    p("баночка (125 г)", 125),
    p("стакан (200 мл)", 200),
]
SPECIFIC_PORTIONS["сметана"] = [
    p("чайная ложка", 10),
    p("столовая ложка", 20),
]
SPECIFIC_PORTIONS["сливки"] = [
    p("чайная ложка", 5),
    p("столовая ложка", 15),
]
SPECIFIC_PORTIONS["творог"] = [
    p("столовая ложка", 25),
    p("порция (100 г)", 100),
    p("пачка (200 г)", 200),
]
SPECIFIC_PORTIONS["масло сливочное"] = [
    p("тонкий слой (5 г)", 5),
    p("кусочек (10 г)", 10),
    p("столовая ложка", 15),
]
SPECIFIC_PORTIONS["масло топлен"] = [
    p("чайная ложка", 5),
    p("столовая ложка", 15),
]
SPECIFIC_PORTIONS["брынза"] = [
    p("ломтик (30 г)", 30),
    p("порция (50 г)", 50),
]
SPECIFIC_PORTIONS["сулугуни"] = [
    p("ломтик (30 г)", 30),
    p("порция (50 г)", 50),
]
SPECIFIC_PORTIONS["молоко сгущенн"] = [
    p("чайная ложка", 10),
    p("столовая ложка", 25),
]

# Cheese (generic for all "сыр")
CHEESE_PORTIONS = [
    p("ломтик (20 г)", 20),
    p("порция (30 г)", 30),
]

SPECIFIC_PORTIONS["мороженое"] = [
    p("шарик", 70),
    p("порция (100 г)", 100),
]

# ------- MEAT -------
MEAT_PORTIONS_RAW = [
    p("порция (100 г)", 100),
    p("порция (150 г)", 150),
]
SPECIFIC_PORTIONS["говядина, стейк"] = [
    p("стейк, маленький", 150),
    p("стейк, средний", 200),
    p("стейк, крупный", 300),
]
SPECIFIC_PORTIONS["фарш"] = [
    p("столовая ложка", 25),
    p("порция (100 г)", 100),
    p("котлета (80 г)", 80),
]
SPECIFIC_PORTIONS["печень"] = [
    p("порция (100 г)", 100),
]
SPECIFIC_PORTIONS["язык"] = [
    p("ломтик (30 г)", 30),
    p("порция (100 г)", 100),
]
SPECIFIC_PORTIONS["почки"] = [
    p("порция (100 г)", 100),
]
SPECIFIC_PORTIONS["сердце"] = [
    p("порция (100 г)", 100),
]

# Sausages / processed meat
SPECIFIC_PORTIONS["колбаса"] = [
    p("ломтик (20 г)", 20),
    p("порция (50 г)", 50),
]
SPECIFIC_PORTIONS["сосиски"] = [
    p("1 сосиска", 50),
    p("2 сосиски", 100),
]
SPECIFIC_PORTIONS["сардельки"] = [
    p("1 сарделька", 70),
    p("2 сардельки", 140),
]
SPECIFIC_PORTIONS["бекон"] = [
    p("1 ломтик", 15),
    p("3 ломтика", 45),
]
SPECIFIC_PORTIONS["ветчина"] = [
    p("ломтик (20 г)", 20),
    p("порция (50 г)", 50),
]
SPECIFIC_PORTIONS["грудинка"] = [
    p("ломтик (20 г)", 20),
    p("порция (50 г)", 50),
]
SPECIFIC_PORTIONS["корейка"] = [
    p("ломтик (20 г)", 20),
    p("порция (50 г)", 50),
]
SPECIFIC_PORTIONS["охотничьи колбаски"] = [
    p("1 штука", 40),
]
SPECIFIC_PORTIONS["пепперони"] = [
    p("5 ломтиков", 15),
    p("порция (30 г)", 30),
]
SPECIFIC_PORTIONS["пастрами"] = [
    p("ломтик (20 г)", 20),
    p("порция (50 г)", 50),
]
SPECIFIC_PORTIONS["кровяная колбаса"] = [
    p("ломтик (30 г)", 30),
    p("порция (80 г)", 80),
]
SPECIFIC_PORTIONS["ливерная колбас"] = [
    p("столовая ложка", 15),
    p("порция (30 г)", 30),
]
SPECIFIC_PORTIONS["паштет"] = [
    p("столовая ложка", 15),
    p("порция (30 г)", 30),
]
SPECIFIC_PORTIONS["говядина вялен"] = [
    p("ломтик (10 г)", 10),
    p("порция (30 г)", 30),
]

# ------- POULTRY -------
SPECIFIC_PORTIONS["курица, грудка"] = [
    p("½ грудки", 120),
    p("1 грудка", 240),
]
SPECIFIC_PORTIONS["курица, бедра"] = [
    p("1 бедро", 100),
]
SPECIFIC_PORTIONS["индейка, грудка"] = [
    p("порция (150 г)", 150),
]
SPECIFIC_PORTIONS["индейка, крылышки"] = [
    p("1 крылышко", 80),
]
SPECIFIC_PORTIONS["индейка, фарш"] = [
    p("порция (100 г)", 100),
    p("котлета (80 г)", 80),
]
SPECIFIC_PORTIONS["гусь"] = [
    p("порция (150 г)", 150),
]
SPECIFIC_PORTIONS["утки"] = [
    p("порция (150 г)", 150),
]

# ------- FISH -------
FISH_PORTIONS = [
    p("порция (100 г)", 100),
    p("порция (150 г)", 150),
]
SPECIFIC_PORTIONS["печень трески"] = [
    p("столовая ложка", 15),
    p("порция (30 г)", 30),
]
SPECIFIC_PORTIONS["консервы"] = [
    p("банка (100 г)", 100),
    p("½ банки", 50),
]
SPECIFIC_PORTIONS["краб"] = [
    p("порция (100 г)", 100),
]
SPECIFIC_PORTIONS["креветк"] = [
    p("1 штука, крупная", 10),
    p("порция (100 г)", 100),
]
SPECIFIC_PORTIONS["мидии"] = [
    p("1 штука", 10),
    p("порция (100 г)", 100),
]
SPECIFIC_PORTIONS["кальмар"] = [
    p("порция (100 г)", 100),
    p("1 тушка", 150),
]
SPECIFIC_PORTIONS["устрица"] = [
    p("1 штука", 15),
    p("6 штук", 90),
]
SPECIFIC_PORTIONS["раки речные"] = [
    p("1 штука", 30),
    p("порция (5 шт)", 150),
]
SPECIFIC_PORTIONS["лангуст"] = [
    p("порция (150 г)", 150),
]
SPECIFIC_PORTIONS["икра, смешанные виды"] = [
    p("чайная ложка", 7),
    p("столовая ложка", 14),
]
SPECIFIC_PORTIONS["осьминог"] = [
    p("порция (100 г)", 100),
]

# ------- GRAINS -------
GRAIN_DRY_PORTIONS = [
    p("столовая ложка (сухая)", 20),
    p("порция (сухая, 60 г)", 60),
]
SPECIFIC_PORTIONS["рис"] = [
    p("столовая ложка (сухой)", 20),
    p("порция (сухой, 60 г)", 60),
]
for name in ["крупа гречневая", "гречка"]:
    SPECIFIC_PORTIONS[name] = [
        p("столовая ложка (сухая)", 20),
        p("порция (сухая, 60 г)", 60),
    ]
SPECIFIC_PORTIONS["овсяная"] = [
    p("столовая ложка", 15),
    p("порция (40 г)", 40),
]
SPECIFIC_PORTIONS["овес"] = [
    p("столовая ложка", 15),
    p("порция (40 г)", 40),
]
SPECIFIC_PORTIONS["отруби"] = [
    p("столовая ложка", 10),
    p("порция (30 г)", 30),
]
SPECIFIC_PORTIONS["киноа"] = [
    p("столовая ложка (сухая)", 15),
    p("порция (сухая, 60 г)", 60),
]
SPECIFIC_PORTIONS["кускус"] = [
    p("столовая ложка (сухой)", 15),
    p("порция (сухой, 60 г)", 60),
]
SPECIFIC_PORTIONS["булгур"] = [
    p("столовая ложка (сухой)", 15),
    p("порция (сухая, 60 г)", 60),
]
for name in ["макароны", "лапша", "рисовая лапша"]:
    SPECIFIC_PORTIONS[name] = [
        p("порция (сухая, 80 г)", 80),
    ]
SPECIFIC_PORTIONS["толокно"] = [
    p("столовая ложка", 15),
    p("порция (30 г)", 30),
]
SPECIFIC_PORTIONS["зародыши пшеницы"] = [
    p("столовая ложка", 10),
    p("порция (30 г)", 30),
]
SPECIFIC_PORTIONS["просо"] = [
    p("столовая ложка (сухое)", 20),
    p("порция (сухое, 60 г)", 60),
]
SPECIFIC_PORTIONS["дикий рис"] = [
    p("столовая ложка (сухой)", 20),
    p("порция (сухой, 60 г)", 60),
]
SPECIFIC_PORTIONS["ячмень перлов"] = [
    p("столовая ложка (сухой)", 20),
    p("порция (сухая, 60 г)", 60),
]
SPECIFIC_PORTIONS["ржаное зерно"] = [
    p("столовая ложка", 20),
    p("порция (60 г)", 60),
]

# ------- FLOUR -------
FLOUR_PORTIONS = [
    p("столовая ложка", 15),
    p("100 г", 100),
]
SPECIFIC_PORTIONS["кокосовая мука"] = FLOUR_PORTIONS
SPECIFIC_PORTIONS["мука кокосовая"] = FLOUR_PORTIONS
SPECIFIC_PORTIONS["мука, миндаль"] = FLOUR_PORTIONS
SPECIFIC_PORTIONS["миндаль мука"] = FLOUR_PORTIONS

# ------- BREAD / BAKERY -------
SPECIFIC_PORTIONS["хлеб"] = [
    p("ломтик", 30),
    p("2 ломтика", 60),
]
SPECIFIC_PORTIONS["батон"] = [
    p("ломтик", 25),
    p("2 ломтика", 50),
]
SPECIFIC_PORTIONS["фокачча"] = [
    p("кусок", 60),
]
SPECIFIC_PORTIONS["баранки простые"] = [
    p("1 штука", 10),
    p("5 штук", 50),
]
SPECIFIC_PORTIONS["баранки сдобные"] = [
    p("1 штука", 15),
    p("5 штук", 75),
]
SPECIFIC_PORTIONS["крекер"] = [
    p("1 штука", 5),
    p("5 штук", 25),
    p("порция (30 г)", 30),
]

# ------- OILS -------
OIL_PORTIONS = [
    p("чайная ложка", 5),
    p("столовая ложка", 14),
]
SPECIFIC_PORTIONS["майонез"] = [
    p("чайная ложка", 5),
    p("столовая ложка", 15),
]

# ------- BEVERAGES -------
SPECIFIC_PORTIONS["сок"] = [
    p("стакан (200 мл)", 200),
]
SPECIFIC_PORTIONS["квас"] = [
    p("стакан (200 мл)", 200),
]
SPECIFIC_PORTIONS["вода"] = [
    p("стакан (200 мл)", 200),
    p("бутылка (500 мл)", 500),
]
SPECIFIC_PORTIONS["боржоми"] = [
    p("стакан (200 мл)", 200),
    p("бутылка (500 мл)", 500),
]
SPECIFIC_PORTIONS["ессентуки"] = [
    p("стакан (200 мл)", 200),
    p("бутылка (500 мл)", 500),
]
SPECIFIC_PORTIONS["нарзан"] = [
    p("стакан (200 мл)", 200),
    p("бутылка (500 мл)", 500),
]
SPECIFIC_PORTIONS["газирован"] = [
    p("стакан (200 мл)", 200),
    p("банка (330 мл)", 330),
]
SPECIFIC_PORTIONS["кофе"] = [
    p("чашка (150 мл)", 150),
    p("кружка (250 мл)", 250),
]
SPECIFIC_PORTIONS["кофе жареный в зернах"] = [
    p("чайная ложка молотого", 5),
    p("столовая ложка молотого", 10),
]
SPECIFIC_PORTIONS["чай"] = [
    p("чашка (200 мл)", 200),
]
SPECIFIC_PORTIONS["какао-смесь, порошок"] = [
    p("чайная ложка", 5),
    p("столовая ложка", 10),
]
SPECIFIC_PORTIONS["какао порошок, приготовлен"] = [
    p("чашка (200 мл)", 200),
]
SPECIFIC_PORTIONS["кокосовая вода"] = [
    p("стакан (200 мл)", 200),
]
SPECIFIC_PORTIONS["водка"] = [
    p("рюмка (50 мл)", 50),
]
SPECIFIC_PORTIONS["пиво"] = [
    p("стакан (330 мл)", 330),
    p("кружка (500 мл)", 500),
]
SPECIFIC_PORTIONS["вино"] = [
    p("бокал (150 мл)", 150),
]

# ------- DESSERTS / SWEETS -------
SPECIFIC_PORTIONS["мед"] = [
    p("чайная ложка", 8),
    p("столовая ложка", 21),
]
SPECIFIC_PORTIONS["сахар-песок"] = [
    p("чайная ложка", 5),
    p("столовая ложка", 15),
]
SPECIFIC_PORTIONS["сахар, коричневый"] = [
    p("чайная ложка", 4),
    p("столовая ложка", 12),
]
SPECIFIC_PORTIONS["шоколад"] = [
    p("долька (1/8 плитки)", 12.5),
    p("½ плитки", 50),
    p("1 плитка (100 г)", 100),
]
SPECIFIC_PORTIONS["шоколадная паста"] = [
    p("чайная ложка", 10),
    p("столовая ложка", 20),
]
SPECIFIC_PORTIONS["шоколадные конфеты"] = [
    p("1 конфета", 15),
    p("3 конфеты", 45),
]
SPECIFIC_PORTIONS["зефир"] = [
    p("1 штука", 30),
    p("2 штуки", 60),
]
SPECIFIC_PORTIONS["пастила"] = [
    p("1 штука", 15),
    p("3 штуки", 45),
]
SPECIFIC_PORTIONS["халва"] = [
    p("кусочек (30 г)", 30),
    p("порция (50 г)", 50),
]
SPECIFIC_PORTIONS["вафли"] = [
    p("1 штука", 25),
]
SPECIFIC_PORTIONS["какао тертое"] = [
    p("столовая ложка", 15),
]
SPECIFIC_PORTIONS["какао-порошок"] = [
    p("чайная ложка", 5),
    p("столовая ложка", 10),
]
SPECIFIC_PORTIONS["патока"] = [
    p("чайная ложка", 7),
    p("столовая ложка", 21),
]
SPECIFIC_PORTIONS["фруктовый сироп"] = [
    p("чайная ложка", 7),
    p("столовая ложка", 20),
]

# ------- SPICES (custom ones without existing portions) -------
SPICE_GROUND_PORTIONS = [
    p("щепотка", 0.5),
    p("чайная ложка", 2),
]
SPICE_DRIED_HERB_PORTIONS = [
    p("щепотка", 0.3),
    p("чайная ложка", 1),
]
SPECIFIC_PORTIONS["ванильный экстракт"] = [
    p("чайная ложка", 4),
]
SPECIFIC_PORTIONS["хмели-сунели"] = [
    p("щепотка", 0.5),
    p("чайная ложка", 2),
]
SPECIFIC_PORTIONS["васаби"] = [
    p("чайная ложка", 5),
]
SPECIFIC_PORTIONS["соль поваренная"] = [
    p("щепотка", 0.5),
    p("чайная ложка", 6),
]
SPECIFIC_PORTIONS["лимонная кислота"] = [
    p("щепотка", 0.5),
    p("чайная ложка", 5),
]

# ------- OTHER (baking, gelatin, etc.) -------
SPECIFIC_PORTIONS["желатин"] = [
    p("чайная ложка", 5),
    p("столовая ложка", 10),
    p("пакетик (15 г)", 15),
]
SPECIFIC_PORTIONS["агар-агар"] = [
    p("чайная ложка", 3),
    p("столовая ложка", 8),
]
SPECIFIC_PORTIONS["крахмал"] = [
    p("чайная ложка", 5),
    p("столовая ложка", 15),
]
SPECIFIC_PORTIONS["разрыхлитель"] = [
    p("чайная ложка", 5),
]
SPECIFIC_PORTIONS["сода пищевая"] = [
    p("чайная ложка", 5),
]
SPECIFIC_PORTIONS["дрожжи сухие"] = [
    p("чайная ложка", 3),
    p("пакетик (7 г)", 7),
]

# ------- SUPPLEMENTS -------
SUPPLEMENT_PORTIONS = [
    p("1 порция", 1),
]
SUPPLEMENT_PILL_PORTIONS = [
    p("1 таблетка", 1),
]
SUPPLEMENT_POWDER_PORTIONS = [
    p("мерная ложка (5 г)", 5),
    p("порция (30 г)", 30),
]

# Map specific supplement names to portions
SPECIFIC_PORTIONS["витамин d3"] = [p("1 капсула", 0.025)]
SPECIFIC_PORTIONS["витамин c"] = [p("1 таблетка (500 мг)", 0.5)]
SPECIFIC_PORTIONS["витамин b12"] = [p("1 таблетка", 0.001)]
SPECIFIC_PORTIONS["фолиевая кислота"] = [p("1 таблетка", 0.001)]
SPECIFIC_PORTIONS["витамин a"] = [p("1 капсула", 0.3)]
SPECIFIC_PORTIONS["витамин e"] = [p("1 капсула", 0.4)]
SPECIFIC_PORTIONS["витамин k2"] = [p("1 капсула", 0.1)]
SPECIFIC_PORTIONS["железо (добавка)"] = [p("1 таблетка", 0.3)]
SPECIFIC_PORTIONS["магний (добавка)"] = [p("1 таблетка", 0.5)]
SPECIFIC_PORTIONS["кальций (добавка)"] = [p("1 таблетка", 1)]
SPECIFIC_PORTIONS["цинк (добавка)"] = [p("1 таблетка", 0.025)]
SPECIFIC_PORTIONS["йод (добавка)"] = [p("1 таблетка", 0.001)]
SPECIFIC_PORTIONS["селен (добавка)"] = [p("1 таблетка", 0.001)]
SPECIFIC_PORTIONS["калий (добавка)"] = [p("1 таблетка", 0.6)]
SPECIFIC_PORTIONS["омега-3"] = [p("1 капсула", 1)]
SPECIFIC_PORTIONS["мультивитамины"] = [p("1 таблетка", 1)]
SPECIFIC_PORTIONS["пробиотик"] = [p("1 капсула", 0.5)]
SPECIFIC_PORTIONS["коллаген"] = [p("мерная ложка (10 г)", 10)]
SPECIFIC_PORTIONS["креатин"] = [p("мерная ложка (5 г)", 5)]
SPECIFIC_PORTIONS["протеин сывороточный"] = [p("мерная ложка (30 г)", 30)]
SPECIFIC_PORTIONS["l-карнитин"] = [p("1 капсула", 0.5)]
SPECIFIC_PORTIONS["мелатонин"] = [p("1 таблетка (3 мг)", 0.003)]
SPECIFIC_PORTIONS["глицин"] = [p("1 таблетка (100 мг)", 0.1)]
SPECIFIC_PORTIONS["валериана"] = [p("1 таблетка", 0.5)]

# ------- GOULASH / COOKED DISHES -------
SPECIFIC_PORTIONS["гуляш"] = [
    p("порция (150 г)", 150),
]
SPECIFIC_PORTIONS["щи"] = [
    p("порция (250 мл)", 250),
]
SPECIFIC_PORTIONS["фрикадельки"] = [
    p("1 фрикаделька", 20),
    p("порция (5 шт)", 100),
]

# ------- SOUPS-RELATED VEGETABLES -------
SPECIFIC_PORTIONS["свекла, тушенная"] = [
    p("порция", 150),
]

# ============================================================
# US-SPECIFIC PATTERNS TO REMOVE
# ============================================================
US_PATTERNS = [
    "cup", "cups",
    "fl oz", "fluid ounce",
    "oz", "ounce",
    "tbsp", "tablespoon",
    # Keep these only if they appear in English context
]

def is_us_portion(portion):
    """Check if a portion uses US-specific measurements"""
    label_eng = portion.get("labelEng", "").lower()
    label = portion.get("label", "").lower()

    # Remove if labelEng contains cup/oz patterns
    for pat in ["cup,", "cup ", "cups", "fl oz", "fluid oz",
                " oz)", " oz ", "oz,", "oz pkg", "ounce"]:
        if pat in label_eng:
            return True

    # Remove if Russian label mentions "чашка" (cup) or "унция" (oz)
    if "чашка" in label or "унци" in label:
        return True

    return False


def find_specific_portions(food_name):
    """Find portions matching this food name using substring matching"""
    # Remove zero-width spaces and other invisible chars
    name_lower = food_name.replace("\u200b", "").replace("\u200c", "").replace("\u200d", "").replace("\ufeff", "").lower()

    # Try exact match first
    if name_lower in SPECIFIC_PORTIONS:
        return SPECIFIC_PORTIONS[name_lower]

    # Try "food name is substring of key" (for full-name keys)
    for key in SPECIFIC_PORTIONS:
        if name_lower == key:
            return SPECIFIC_PORTIONS[key]

    # Try substring match: key in name (longest match first for specificity)
    matches = []
    for key in SPECIFIC_PORTIONS:
        if key in name_lower:
            matches.append((len(key), key))

    if matches:
        # Return the most specific (longest) match
        matches.sort(reverse=True)
        return SPECIFIC_PORTIONS[matches[0][1]]

    return None


def get_category_default_portions(categories, food_name):
    """Get default portions based on category if no specific match found"""
    cats = set(categories)
    name_lower = food_name.lower()

    if "supplement" in cats:
        return SUPPLEMENT_PILL_PORTIONS

    if "spice" in cats:
        if "молот" in name_lower or "порошок" in name_lower:
            return SPICE_GROUND_PORTIONS
        if "сушён" in name_lower or "сушен" in name_lower or "сушёный" in name_lower:
            return SPICE_DRIED_HERB_PORTIONS
        return SPICE_GROUND_PORTIONS

    if "oil" in cats:
        return OIL_PORTIONS

    if "fish" in cats or "seafood" in cats:
        return FISH_PORTIONS

    if "meat" in cats or "poultry" in cats:
        return MEAT_PORTIONS_RAW

    if "grain" in cats:
        if "мука" in name_lower:
            return FLOUR_PORTIONS
        return GRAIN_DRY_PORTIONS

    if "dairy" in cats:
        if "сыр" in name_lower:
            return CHEESE_PORTIONS
        return None  # Too varied; skip

    if "fruit" in cats:
        return [p("порция (100 г)", 100)]

    if "vegetable" in cats:
        return [p("порция (100 г)", 100)]

    if "legume" in cats:
        return [
            p("столовая ложка (сухой)", 20),
            p("порция (сухой, 60 г)", 60),
        ]

    if "dessert" in cats:
        return [p("порция (30 г)", 30)]

    if "beverage" in cats or "juice" in cats:
        return [p("стакан (200 мл)", 200)]

    if "bakery" in cats:
        return [p("порция (30 г)", 30)]

    if "other" in cats:
        return None  # Too varied

    return None


def make_portion(label, grams):
    """Create a proper portion dict"""
    return {
        "label": label,
        "grams": grams
    }


def process_food(food):
    """Process a single food item: remove US portions, add European portions"""
    name = food["name"]
    categories = food.get("categories", [])
    existing_portions = food.get("portions", [])

    # Step 1: Remove US-specific portions from existing
    cleaned_portions = [p for p in existing_portions if not is_us_portion(p)]

    # Step 2: Clean remaining portions to simple format (remove labelEng, unit, amount)
    for portion in cleaned_portions:
        # Keep only label and grams
        keys_to_remove = [k for k in portion if k not in ("label", "grams")]
        for k in keys_to_remove:
            del portion[k]

    # Step 3: Find new portions to add
    specific = find_specific_portions(name)
    if specific:
        new_portions = [make_portion(p["label"], p["grams"]) for p in specific]
    else:
        category_portions = get_category_default_portions(categories, name)
        if category_portions:
            new_portions = [make_portion(p["label"], p["grams"]) for p in category_portions]
        else:
            new_portions = []

    # Step 4: Merge - add new portions, avoiding duplicates by label
    existing_labels = {p["label"] for p in cleaned_portions}
    for np in new_portions:
        if np["label"] not in existing_labels:
            cleaned_portions.append(np)
            existing_labels.add(np["label"])

    food["portions"] = cleaned_portions
    return food


def main():
    input_file = "combined-foods-final.json"
    output_file = "combined-foods-final.json"

    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Total foods: {len(data)}", file=sys.stderr)

    stats = {
        "us_removed": 0,
        "portions_added": 0,
        "foods_with_new_portions": 0,
        "foods_still_empty": 0,
    }

    for food in data:
        old_count = len(food.get("portions", []))
        old_us = sum(1 for p in food.get("portions", []) if is_us_portion(p))

        process_food(food)

        new_count = len(food.get("portions", []))
        stats["us_removed"] += old_us

        if new_count > (old_count - old_us):
            stats["portions_added"] += new_count - (old_count - old_us)
            stats["foods_with_new_portions"] += 1

        if new_count == 0:
            stats["foods_still_empty"] += 1

    print(f"US portions removed: {stats['us_removed']}", file=sys.stderr)
    print(f"New portions added: {stats['portions_added']}", file=sys.stderr)
    print(f"Foods with new portions: {stats['foods_with_new_portions']}", file=sys.stderr)
    print(f"Foods still without portions: {stats['foods_still_empty']}", file=sys.stderr)

    # List foods still without portions
    empty = [f["name"] for f in data if not f.get("portions")]
    if empty:
        print(f"\nFoods still empty:", file=sys.stderr)
        for name in empty:
            print(f"  - {name}", file=sys.stderr)

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=None, separators=(",", ":"))

    print(f"\nSaved to {output_file}", file=sys.stderr)


if __name__ == "__main__":
    main()
