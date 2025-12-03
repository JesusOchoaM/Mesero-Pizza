document.addEventListener('DOMContentLoaded', () => {
    const menuItemsContainer = document.getElementById('menu-items');
    const orderItemsContainer = document.getElementById('order-items');
    const orderTotalElement = document.getElementById('order-total');
    const resetOrderBtn = document.getElementById('reset-order-btn');
    const payOrderBtn = document.getElementById('pay-order-btn');
    const orderHistoryItemsContainer = document.getElementById('order-history-items');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const lastNameInput = document.getElementById('last-name');
    const tableNumberSelect = document.getElementById('table-number');
    const phoneNumberInput = document.getElementById('phone-number');
    const extraItemNameInput = document.getElementById('extra-item-name');
    const extraItemPriceInput = document.getElementById('extra-item-price');
    const addExtraItemBtn = document.getElementById('add-extra-item-btn');
    const activeOrdersItemsContainer = document.getElementById('active-orders-items');
    const clearActiveOrdersBtn = document.getElementById('clear-active-orders-btn');
    const deliveryOption = document.getElementById('delivery-option');
    const addressGroup = document.getElementById('address-group');
    const tableNumberGroup = document.getElementById('table-number-group');
    const addressInput = document.getElementById('address');

    let order = [];
    let orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
    let activeOrders = JSON.parse(localStorage.getItem('activeOrders')) || [];
    let activeOrderIntervals = {};
    let currentOrderId = null;

    deliveryOption.addEventListener('change', () => {
        addressGroup.style.display = deliveryOption.checked ? 'block' : 'none';
        tableNumberGroup.style.display = deliveryOption.checked ? 'none' : 'block';
    });

    const menu = [
    // 1. ENTRADAS
    {
        categoria: "Entradas",
        descripcion: "Para empezar a compartir",
        items: [
            { nombre: "Pan con Ajo", desc: "Tostado con mantequilla de ajo", precios: { "Orden (6)": 2.50, "Familiar (12)": 5.00 } },
            { nombre: "Pan con Ajo y Loroco", desc: "Especialidad salvadoreña", precios: { "Orden (6)": 3.50, "Familiar (12)": 6.99 } },
            { nombre: "Cheesestick", desc: "Palitos rellenos de queso", precios: { "Orden (10)": 3.50, "Familiar (20)": 6.99 } },
            { nombre: "Cheesestick Loroco", desc: "Rellenos de queso y loroco", precios: { "Orden (10)": 3.99, "Familiar (20)": 7.99 } },
            { nombre: "Aros de Cebolla", desc: "Empanizados y crujientes", precios: { "Orden (10)": 4.49, "Familiar (20)": 8.99 } },
            { nombre: "Deditos de Queso", desc: "Queso frito empanizado", precios: { "Orden (6)": 4.99, "Familiar (12)": 9.99 } },
            { nombre: "Wantan", desc: "Fritos y crujientes", precios: { "Orden (6)": 2.50, "Familiar (12)": 5.00 } }
        ]
    },

    // 2. PIZZA CALZONE Y TRADICIONAL
    {
        categoria: "Pizzas y Calzones",
        descripcion: "Tamaños: Peq (4 porc) | Med (8 porc) | Fam (12 porc)",
        items: [
            // Calzones
            { nombre: "Calzone Jamón / Pepperoni", desc: "Masa cerrada rellena", precio: 8.00 },
            { nombre: "Calzone Suprema", desc: "Relleno especial", precio: 9.50 },
            { nombre: "Calzone Doble Queso", desc: "Full queso", precio: 9.50 },
            { nombre: "Calzone Vegetariana", desc: "Vegetales frescos", precio: 9.50 },
            // Pizzas Tradicionales
            { nombre: "Pepperoni / Jamón", desc: "Clásica", precios: { peq: 5.00, med: 6.00, fam: 7.99 } },
            { nombre: "Cebolla / Tomate / Chile", desc: "Con Jamón o Pepperoni", precios: { peq: 5.50, med: 6.99, fam: 8.99 } },
            { nombre: "Salchicha / Chorizo", desc: "Con Jamón o Pepperoni", precios: { peq: 6.00, med: 7.50, fam: 9.75 } },
            { nombre: "Mitad y Mitad", desc: "Jamón y Pepperoni", precios: { peq: 6.00, med: 7.99, fam: 9.99 } },
            { nombre: "Jalapeño / Loroco", desc: "Especialidades", precios: { peq: 7.00, med: 8.50, fam: 10.99 } },
            { nombre: "Suprema / Vegetariana", desc: "Especialidades de la casa", precios: { peq: 6.50, med: 7.99, fam: 9.99 } },
            { nombre: "Hawaiana", desc: "Jamón y Piña", precios: { peq: 7.00, med: 8.99, fam: 12.99 } },
            { nombre: "Meat Lover", desc: "Todas las carnes", precios: { peq: 7.00, med: 8.99, fam: 12.99 } },
            { nombre: "Doble Queso", desc: "Mozzarella extra", precios: { peq: 6.50, med: 8.99, fam: 10.99 } },
            { nombre: "Alfredo Pollo y Camarones", desc: "Salsa blanca", precios: { peq: 9.50, med: 14.99, fam: 19.99 } },
            { nombre: "Carnívora", desc: "5 Carnes y vegetales", precios: { peq: 8.00, med: 10.99, fam: 16.99 } },
            { nombre: "4 Estaciones", desc: "Jamón, Pepperoni, Suprema y Carne", precios: { peq: 8.00, med: 10.99, fam: 14.99 } },
            { nombre: "Orilla de Queso (Extra)", desc: "Agrégalo a tu orden", precios: { peq: 2.75, med: 3.99, fam: 5.50 } }
        ]
    },

    // 3. COMBO FAMILIAR $19.99 (DESTACADO)
    {
        categoria: "🔥 SÚPER COMBO FAMILIAR",
        descripcion: "¡El más vendido!",
        items: [
            { 
                nombre: "Combo Familiar $19.99", 
                desc: "1 Pizza Gigante (Jamón o Peperoni) + 1 Orden Pan con Ajo + 10 Alitas (BBQ o Búfalo) + 1 Soda (1 Litro) + 1 Orden Papas Francesas. (Cambio a Suprema +$1.99)", 
                precio: 19.99 
            }
        ]
    },

    // 4. COMBOS FAMILIARES (RESTO)
    {
        categoria: "Combos Familiares",
        items: [
            { nombre: "Combo Pequeño", desc: "1 Pizza (1 ing), Pan c/ajo (6), Soda 1.25L", precio: 13.49 },
            { nombre: "Combo Mediano", desc: "2 Pizzas (1 ing), Pan c/ajo (6), Soda 1.25L", precio: 21.99 },
            { nombre: "Combo Grande", desc: "1 Pizza (1 ing), 20 Alitas, 2 Papas, Soda 1.25L", precio: 26.99 },
            { nombre: "Combo Especial", desc: "1 Gigante Especialidad, 8 Alitas, Papas, Pan/Ajo, Ketchup", precio: 22.99 },
            { nombre: "Combo Combinado", desc: "1 Pizza 1 ing, 10 Alitas, Papas, Ketchup", precio: 16.99 },
            { nombre: "Combo XL", desc: "1 Gigante Esp, Pan ajo, 5 Piezas Pollo, Soda 1.25L", precio: 27.49 },
            { nombre: "Combo #1", desc: "2 Gigantes Especialidad + Pan con ajo", precio: 23.49 },
            { nombre: "Combo #2", desc: "1 Pizza (1 ing), 10 Alitas, Papas, CheeseStick", precio: 22.99 },
            { nombre: "Combo #3", desc: "3 Gigantes (1 Esp, 2 Un Ing), 10 Alitas, Papas", precio: 38.99 }
        ]
    },

    // 5. PUPUSAS
    {
        categoria: "Pupusas",
        descripcion: "Delicias típicas",
        items: [
            { nombre: "Revuelta / Frijol con Queso", desc: "Tradicionales", precio: 0.90 },
            { nombre: "Queso", desc: "Puro queso", precio: 1.00 },
            { nombre: "Queso con Loroco", desc: "Especialidad", precio: 1.25 },
            { nombre: "Queso Jalapeño", desc: "Picante", precio: 1.15 },
            { nombre: "Queso Pepperoni / Jamón", desc: "Especialidad", precio: 1.35 },
            { nombre: "Queso Ayote / Ajo", desc: "Vegetariana", precio: 1.25 },
            { nombre: "Chicharrón", desc: "Solo carne", precio: 1.50 },
            { nombre: "Queso con Pollo", desc: "Especialidad", precio: 1.50 },
            { nombre: "Queso Hongos / Camarón", desc: "Premium", precio: 1.60 },
            { nombre: "Nutella", desc: "Postre", precio: 1.99 },
            { nombre: "3 Quesos (Loca)", desc: "Mozzarella + Cheddar + Quesillo", precio: 1.99 }
        ]
    },

    // 6. ZONA DE FRITURA
    {
        categoria: "Zona de Fritura",
        descripcion: "Alitas y Snacks",
        items: [
            { nombre: "Alitas Pequeño (7)", desc: "BBQ/Buf, Papa, Aderezo", precio: 6.99 },
            { nombre: "Alitas Mediano (20)", desc: "BBQ/Buf, Papa, Aderezo", precio: 16.99 },
            { nombre: "Alitas Grande (30)", desc: "BBQ/Buf, Papa, Aderezo", precio: 22.99 },
            { nombre: "Camarones Empanizados", desc: "12 camarones, papas, tortilla", precio: 10.99 },
            { nombre: "Tacos de Pollo", desc: "5 tacos, papas, tortilla", precio: 7.99 },
            { nombre: "Plato de Costilla", desc: "8onz costilla cerdo, papa, ensalada", precio: 8.99 },
            { nombre: "Nuggets de Pollo", desc: "10 nuggets, papas, soda", precio: 7.00 }
        ]
    },

    // 7. SABOR A TU PALADAR (Paninis y Rellenitas)
    {
        categoria: "Sabor a tu Paladar",
        descripcion: "Paninis, Rellenitas y Chicharrones",
        items: [
            // Rellenitas
            { nombre: "Rellenita de Pollo", desc: "Especialidad", precio: 8.50 },
            { nombre: "Rellenita Tradicional / Full Cheese", desc: "Quesos", precio: 7.50 },
            { nombre: "Rellenita Cangrejo", desc: "Premium", precio: 8.99 },
            // Paninis (Todos con papas)
            { nombre: "Panini Tradicional", desc: "Jamón pavo, quesos, vegetales", precio: 7.49 },
            { nombre: "Panini Loroco", desc: "Con papas francesas", precio: 8.49 },
            { nombre: "Panini Quesos", desc: "Con papas francesas", precio: 7.49 },
            { nombre: "Panini Chicharrones", desc: "Con papas francesas", precio: 9.49 },
            { nombre: "Panini Jalapeño / Hongos", desc: "Con papas francesas", precio: 8.99 },
            { nombre: "Panini Hawaiano / Pollo / Pizza", desc: "Con papas francesas", precio: 8.49 },
            { nombre: "Panini Camarones", desc: "Con papas francesas", precio: 9.49 },
            // Chicharrones
            { nombre: "Chicharrones (Media Libra)", desc: "Frijoles, cebolla, tortilla, papas", precio: 9.49 },
            { nombre: "Chicharrones (Libra)", desc: "Frijoles, cebolla, tortilla, papas", precio: 15.99 }
        ]
    },

    // 8. POLLO FRITO
    {
        categoria: "Pollo Frito",
        items: [
            { nombre: "1 Pieza (Personal)", desc: "Pollo, papa, tortilla, aderezo", precio: 3.99 },
            { nombre: "2 Piezas", desc: "Pollo, papa, tortilla, aderezo", precio: 5.49 },
            { nombre: "3 Piezas", desc: "Pollo, papa, tortilla, aderezo", precio: 6.99 },
            { nombre: "Familiar 5 Piezas", desc: "5 Pollo, 2 papas, aderezo", precio: 11.49 },
            { nombre: "Familiar 8 Piezas", desc: "8 Pollo, 3 papas, aderezo", precio: 18.99 },
            { nombre: "Familiar 12 Piezas", desc: "12 Pollo, 5 papas, aderezo", precio: 26.99 }
        ]
    },

    // 9. HAMBURGUESAS Y HOT DOGS
    {
        categoria: "Hamburguesas y Hot Dogs",
        items: [
            { nombre: "Hamburguesa Medieval", desc: "Pollo + 3 alitas + papas + soda", precio: 8.00 },
            { nombre: "Hamburguesa de Carne", desc: "Res + papas", precio: 6.50 },
            { nombre: "Hamburguesa Camarones", desc: "Camarones empanizados + papas", precio: 7.50 },
            { nombre: "Hamburguesa Doble Carne", desc: "Doble res + papas", precio: 8.99 },
            { nombre: "Hot Dog Intenso", desc: "Salchicha jumbo + queso", precio: 1.00 },
            { nombre: "Hot Dog El Tóxico", desc: "Con chimichurri y cebolla curtida", precio: 1.25 },
            { nombre: "Hot Dog Conquistador", desc: "Envuelto en tocino", precio: 1.75 },
            { nombre: "Hot Dog El Exótico", desc: "Tocino + Salsa aguacate", precio: 2.00 },
            { nombre: "Pizza Hot Dog", desc: "Salsa italiana y pepperoni", precio: 2.50 }
        ]
    },

    // 10. VARIEDAD DE PLATILLOS (Típicos, Quesadillas, Burritos)
    {
        categoria: "Variedad de Platillos",
        descripcion: "Quesadillas, Burritos, Lasañas y Típicos",
        items: [
            // Quesadillas
            { nombre: "Quesadilla de Pollo / Loroco", desc: "Con queso", precio: 8.99 },
            { nombre: "Quesadilla Tradicional / Jamón", desc: "Con queso", precio: 7.99 },
            // Burritos
            { nombre: "Burrito de Pollo", desc: "Con papas y aderezo", precio: 7.50 },
            { nombre: "Burrito de Carne", desc: "Con papas y aderezo", precio: 8.50 },
            { nombre: "Burrito de Camarón", desc: "Con papas y aderezo", precio: 9.00 },
            // Lasaña y Ensalada
            { nombre: "Lasaña Pollo con Hongos", desc: "Pasta artesanal", precio: 8.99 },
            { nombre: "Lasaña Tres Quesos", desc: "Mozzarella, americano, crema", precio: 8.50 },
            { nombre: "Ensalada de la Casa", desc: "Atún, huevo, vegetales", precio: 6.99 },
            // Típicos y Papas
            { nombre: "Enchilada Tradicional", desc: "Unidad", precio: 0.75 },
            { nombre: "Yuca Frita + Chicharrón", desc: "Plato", precio: 2.50 },
            { nombre: "Canoa de Leche", desc: "Plátano dulce", precio: 1.75 },
            { nombre: "Papas Francesas", desc: "Orden simple", precio: 1.99 },
            { nombre: "Papas de Feria", desc: "Ketchup, aderezo, queso", precio: 3.50 },
            { nombre: "Papas Cheddar y Tocino", desc: "Especial", precio: 3.50 }
        ]
    },

    // 11. MENÚ INFANTIL (Todo a $4.99)
    {
        categoria: "Menú Infantil ($4.99)",
        descripcion: "Incluye Papas, Aderezo y Soda",
        items: [
            { nombre: "Infantil Alitas", desc: "4 Alitas BBQ/Buf", precio: 4.99 },
            { nombre: "Infantil Pechugitas", desc: "4 Pechugitas", precio: 4.99 },
            { nombre: "Infantil Hamburguesa", desc: "Hamburguesa de Pollo", precio: 4.99 },
            { nombre: "Infantil Pizza", desc: "Pizza 4 porciones (Jamón/Pep) + 2 Pan ajo", precio: 4.99 },
            { nombre: "Infantil Nuggets", desc: "5 Nuggets", precio: 4.99 },
            { nombre: "Infantil Rellenita", desc: "1 Rellenita Tradicional", precio: 4.99 }
        ]
    },

    // 12. TODAS LAS BEBIDAS Y POSTRES
    {
        categoria: "Bebidas y Postres",
        items: [
            // Frías
            { nombre: "Coca Cola / Sabores Lata", desc: "Bebida fría", precio: 1.25 },
            { nombre: "Pepsi 1.25L", desc: "Botella", precio: 1.75 },
            { nombre: "Agua Botella", desc: "Natural", precio: 0.75 },
            { nombre: "Refrescos Naturales", desc: "Horchata, Cebada, Sandía, Fresa, Piña", precio: 1.75 },
            { nombre: "Jugo de Naranja", desc: "Natural", precio: 1.99 },
            // Calientes
            { nombre: "Café Negro / Té", desc: "Caliente", precio: 1.00 },
            { nombre: "Café con Leche", desc: "Caliente", precio: 1.50 },
            // Alcohol
            { nombre: "Cerveza (Pilsener/Golden)", desc: "Botella", precio: 1.75 },
            { nombre: "Mix Michelada", desc: "Preparado", precio: 1.50 },
            { nombre: "Cocteles (Tequila/Ron/Vodka)", desc: "Variedad", precio: 3.50 },
            // Especiales
            { nombre: "Limonada (Natural/Fresa/Hierba)", desc: "Preparada", precio: 3.50 },
            { nombre: "Licuados (Fresa/Banano/Oreo)", desc: "Con leche", precio: 1.50 },
            { nombre: "Frozen (Café/Frutas)", desc: "Granizado", precio: 2.50 },
            // Postres
            { nombre: "Mini Pan Cake", desc: "Postre", precio: 2.99 },
            { nombre: "Copa de Fruta", desc: "Miel o Yogurt", precio: 2.99 },
            { nombre: "Rollitos de Nutella", desc: "Con banano", precio: 3.50 }
        ]
    },

    // 13. CREPAS Y POSTRES
    {
        categoria: "Crepas y Postres",
        items: [
            // --- CLÁSICAS ($3.50) ---
            { nombre: "Banano Nutella", desc: "Clásica", precio: 3.50 },
            { nombre: "Fresa Nutella", desc: "Clásica", precio: 3.50 },
            { nombre: "Oreo Caramelo", desc: "Toque dulce", precio: 3.50 },
            { nombre: "Oreo Nutella", desc: "Toque dulce", precio: 3.50 },
            
            // --- COMBINACIONES ($3.99) ---
            { nombre: "Fresa, Banano, Nutella", desc: "Combinación frutal", precio: 3.99 },
            { nombre: "Fresa, Banano, Caramelo", desc: "Combinación frutal", precio: 3.99 },
            { nombre: "Oreo, Fresa, Caramelo", desc: "Combinación especial", precio: 3.99 },
            { nombre: "Oreo, Fresa, Nutella", desc: "Combinación especial", precio: 3.99 },

            // --- SIMPLES ($2.50) ---
            { nombre: "Crepa Nutella (Simple)", desc: "Crepa básica solo con topping", precio: 2.50 },
            { nombre: "Crepa Caramelo (Simple)", desc: "Crepa básica solo con topping", precio: 2.50 },

            // --- MIXTA ($4.49) ---
            { nombre: "Mixta Especial", desc: "Oreo, banano, fresa, granola y Chantilly", precio: 4.49 }
        ]
    },

    // 14. MENU DE CENAS
    {
        categoria: "Cenas Típicas",
        descripcion: "Servidas de 5:00 PM en adelante",
        items: [
            { nombre: "Cena Tradicional", desc: "2 Huevos, frijoles, plátano, pan, café", precio: 3.50 },
            { nombre: "Cena Ranchera", desc: "Huevos, frijoles, plátano, chorizo, tocino", precio: 4.25 },
            { nombre: "Omelette", desc: "Con jamón y queso", precio: 4.50 },
            { nombre: "Pan Cakes", desc: "Con Nutella, miel, banano", precio: 3.99 },
            { nombre: "Cena Americana", desc: "Huevos, pancake, frijoles, chorizo", precio: 5.25 },
            { nombre: "Cena de Toque", desc: "Huevos, frijoles, 3 alitas", precio: 4.99 },
            { nombre: "Burrito Cena", desc: "Huevos, frijoles, queso", precio: 4.50 }
        ]
    }
];

    const priceKeyMap = {
        peq: 'Pequeña',
        med: 'Mediana',
        fam: 'Familiar'
    };

    const renderMenu = () => {
        menuItemsContainer.innerHTML = '';
        menu.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.classList.add('menu-category');
            let categoryHTML = `<h3>${category.categoria}</h3>`;
            if (category.descripcion) {
                categoryHTML += `<p class="category-description">${category.descripcion}</p>`;
            }
            categoryElement.innerHTML = categoryHTML;
            const itemsContainer = document.createElement('div');
            itemsContainer.classList.add('menu-items-grid');
            
            category.items.forEach(item => {
                const menuItemElement = document.createElement('div');
                menuItemElement.classList.add('menu-item');

                const hasSubOptions = item.nombre.includes('/');
                const subOptions = hasSubOptions ? item.nombre.split(' / ') : [item.nombre];
                const baseName = hasSubOptions ? '' : item.nombre;

                let subOptionsHTML = '';
                if (hasSubOptions) {
                    const subOptionSelectId = `sub-option-select-${item.nombre.replace(/\s+/g, '-')}`;
                    subOptionsHTML = `<select id="${subOptionSelectId}" class="sub-option-select">`;
                    subOptions.forEach(option => {
                        subOptionsHTML += `<option value="${option}">${option}</option>`;
                    });
                    subOptionsHTML += `</select>`;
                }

                let priceHTML = '';
                if (item.precios) {
                    const selectId = `price-select-${item.nombre.replace(/\s+/g, '-')}`;
                    priceHTML = `<select id="${selectId}" class="price-select">`;
                    for (const option in item.precios) {
                        const optionText = priceKeyMap[option] || option;
                        priceHTML += `<option value="${item.precios[option]}">${optionText} - $${item.precios[option].toFixed(2)}</option>`;
                    }
                    priceHTML += `</select>`;
                } else if (item.precio) {
                    priceHTML = `<p>$${item.precio.toFixed(2)}</p>`;
                }

                menuItemElement.innerHTML = `
                    <div class="menu-item-details">
                        <h4>${item.nombre}</h4>
                        <p class="item-description">${item.desc || ''}</p>
                        ${subOptionsHTML}
                        ${priceHTML.includes('<select') ? '' : priceHTML}
                    </div>
                    <div class="menu-item-actions">
                        ${priceHTML.includes('<select') ? priceHTML : ''}
                        <button class="btn-add-item">Agregar</button>
                    </div>
                `;

                menuItemElement.querySelector('.btn-add-item').addEventListener('click', () => {
                    let name = item.nombre;
                    let price = 0;

                    if (hasSubOptions) {
                        const subOptionSelect = menuItemElement.querySelector('.sub-option-select');
                        name = subOptionSelect.value;
                    }

                    if (item.precios) {
                        const select = menuItemElement.querySelector('.price-select');
                        const selectedOption = select.options[select.selectedIndex];
                        price = parseFloat(selectedOption.value);
                        const nameSuffix = selectedOption.text.split(' - ')[0];
                        name = `${name} (${nameSuffix})`;

                    } else if (item.precio) {
                        price = item.precio;
                    }
                    
                    addItemToOrder({ name, price });
                });
                itemsContainer.appendChild(menuItemElement);
            });
            categoryElement.appendChild(itemsContainer);
            menuItemsContainer.appendChild(categoryElement);
        });
    };

    const renderOrder = () => {
        orderItemsContainer.innerHTML = '';
        let total = 0;
        order.forEach((item, index) => {
            const orderItemElement = document.createElement('li');
            orderItemElement.innerHTML = `
                <span>${item.name} x ${item.quantity}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
                <button class="btn-remove-item" data-index="${index}">X</button>
                <button class="btn-increase-quantity" data-index="${index}">+</button>
                <button class="btn-decrease-quantity" data-index="${index}">-</button>
            `;
            orderItemsContainer.appendChild(orderItemElement);
            total += item.price * item.quantity;
        });
        orderTotalElement.textContent = `$${total.toFixed(2)}`;

        if (order.length === 0) {
            payOrderBtn.disabled = true;
        } else {
            payOrderBtn.disabled = false;
        }

        document.querySelectorAll('.btn-remove-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                removeItemFromOrder(index);
            });
        });

        document.querySelectorAll('.btn-increase-quantity').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                updateOrderItemQuantity(index, 1);
            });
        });

        document.querySelectorAll('.btn-decrease-quantity').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                updateOrderItemQuantity(index, -1);
            });
        });
    };

    const renderOrderHistory = () => {
        orderHistoryItemsContainer.innerHTML = '';
        orderHistory.forEach(orderData => {
            const orderHistoryItemElement = document.createElement('li');
            const total = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const itemsSummary = orderData.items.map(item => `${item.name} x ${item.quantity}`).join(', ');
            
            let location = '';
            if (orderData.delivery) {
                location = `<strong>Dirección:</strong> ${orderData.address}`;
            } else {
                location = `<strong>Mesa:</strong> ${orderData.tableNumber}`;
            }

            orderHistoryItemElement.innerHTML = `
                <span><strong>Orden #${orderData.id}</strong> - ${new Date(orderData.date).toLocaleString()}</span>
                <span><strong>Cliente:</strong> ${orderData.lastName} - ${location} - <strong>Tel:</strong> ${orderData.phoneNumber || 'N/A'}</span>
                <span>${itemsSummary}</span>
                <span>Total Pagado: $${total.toFixed(2)}</span>
                <span class="order-status">Entregado</span>
            `;
            orderHistoryItemsContainer.appendChild(orderHistoryItemElement);
        });
    };

    const getRemainingTime = (order) => {
        const now = Date.now();
        const creationTime = order.creationTime;
        const deliveryDuration = order.deliveryTime * 60 * 1000;
        return deliveryDuration - (now - creationTime);
    };

    const renderActiveOrders = () => {
        activeOrdersItemsContainer.innerHTML = '';
        Object.values(activeOrderIntervals).forEach(clearInterval);
        activeOrderIntervals = {};

        activeOrders.sort((a, b) => {
            const remainingTimeA = getRemainingTime(a);
            const remainingTimeB = getRemainingTime(b);
            return remainingTimeA - remainingTimeB;
        });

        activeOrders.forEach(orderData => {
            const activeOrderItemElement = document.createElement('li');
            activeOrderItemElement.setAttribute('data-order-id', orderData.id);
            const total = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const itemsSummary = `
                <ol class="active-order-item-list">
                    ${orderData.items.map(item => `<li>${item.name} x ${item.quantity}</li>`).join('')}
                </ol>
            `;
            
            let location = '';
            if (orderData.delivery) {
                location = `<strong>Dirección:</strong> ${orderData.address}`;
            } else {
                location = `<strong>Mesa:</strong> ${orderData.tableNumber}`;
            }

            activeOrderItemElement.innerHTML = `
                <span><strong>Orden #${orderData.id}</strong> - ${new Date(orderData.date).toLocaleTimeString()}</span>
                <span><strong>Cliente:</strong> ${orderData.lastName} - ${location} - <strong>Tel:</strong> ${orderData.phoneNumber || 'N/A'}</span>
                <div>${itemsSummary}</div>
                <div class="order-summary">
                    <strong>Total:</strong>
                    <span>$${total.toFixed(2)}</span>
                </div>
                <div class="timer">Tiempo restante: <span class="countdown">--:--</span></div>
                <div class="active-order-actions">
                    <button class="btn-edit-order" data-id="${orderData.id}">Editar</button>
                    <button class="btn-deliver-order" data-id="${orderData.id}">Entregar</button>
                </div>
            `;
            activeOrdersItemsContainer.appendChild(activeOrderItemElement);

            const countdownElement = activeOrderItemElement.querySelector('.countdown');
            updateTimer(orderData, countdownElement);
            activeOrderIntervals[orderData.id] = setInterval(() => {
                updateTimer(orderData, countdownElement);
            }, 1000);

            activeOrderItemElement.querySelector('.btn-deliver-order').addEventListener('click', (e) => {
                const orderId = e.target.getAttribute('data-id');
                deliverOrder(orderId);
            });
            activeOrderItemElement.querySelector('.btn-edit-order').addEventListener('click', (e) => {
                const orderId = e.target.getAttribute('data-id');
                editOrder(orderId);
            });
        });
    };

    const deliverOrder = (orderId) => {
        const orderIndex = activeOrders.findIndex(o => o.id == orderId);
        if (orderIndex > -1) {
            const deliveredOrder = activeOrders.splice(orderIndex, 1)[0];
            orderHistory.unshift(deliveredOrder);
            localStorage.setItem('activeOrders', JSON.stringify(activeOrders));
            localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
            renderActiveOrders();
            renderOrderHistory();
            clearInterval(activeOrderIntervals[orderId]);
            delete activeOrderIntervals[orderId];
        }
    };
    
    const editOrder = (orderId) => {
        const orderToEdit = activeOrders.find(o => o.id == orderId);
        if (orderToEdit) {
            // Remove editing class from all other orders
            document.querySelectorAll('#active-orders-items li').forEach(li => {
                li.classList.remove('editing');
            });

            // Add editing class to the current order
            const orderElement = document.querySelector(`[data-order-id="${orderId}"]`);
            if (orderElement) {
                orderElement.classList.add('editing');
            }

            currentOrderId = orderToEdit.id;
            lastNameInput.value = orderToEdit.lastName;
            phoneNumberInput.value = orderToEdit.phoneNumber;
            deliveryOption.checked = orderToEdit.delivery;
            addressGroup.style.display = orderToEdit.delivery ? 'block' : 'none';
            tableNumberGroup.style.display = orderToEdit.delivery ? 'none' : 'block';
            addressInput.value = orderToEdit.address || '';
            tableNumberSelect.value = orderToEdit.tableNumber || '';
            order = JSON.parse(JSON.stringify(orderToEdit.items)); // Deep copy
            renderOrder();
            window.scrollTo(0, 0);
        }
    };


    const updateTimer = (order, timerElement) => {
        const remainingTime = getRemainingTime(order);

        if (remainingTime <= 0) {
            timerElement.textContent = 'Retrasado';
            timerElement.parentElement.classList.add('delayed');
        } else {
            const minutes = Math.floor(remainingTime / (1000 * 60));
            const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    };


    const addItemToOrder = (item) => {
        const existingItem = order.find(orderItem => orderItem.name === item.name);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            order.push({ ...item, quantity: 1 });
        }
        renderOrder();
    };

    const removeItemFromOrder = (index) => {
        order.splice(index, 1);
        renderOrder();
    };

    const updateOrderItemQuantity = (index, change) => {
        const item = order[index];
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                removeItemFromOrder(index);
            } else {
                renderOrder();
            }
        }
    };

    resetOrderBtn.addEventListener('click', () => {
        order = [];
        currentOrderId = null;
        lastNameInput.value = '';
        phoneNumberInput.value = '';
        deliveryOption.checked = false;
        addressInput.value = '';
        tableNumberSelect.value = '';
        renderOrder();
        document.querySelectorAll('#active-orders-items li').forEach(li => {
            li.classList.remove('editing');
        });
    });

    payOrderBtn.addEventListener('click', () => {
        const lastName = lastNameInput.value.trim();
        const tableNumber = tableNumberSelect.value;
        const phoneNumber = phoneNumberInput.value.trim();
        const isDelivery = deliveryOption.checked;
        const address = addressInput.value.trim();
        const total = order.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        if (!lastName) {
            alert('Por favor, ingrese el apellido.');
            return;
        }

        if (isDelivery && !address) {
            alert('Por favor, ingrese la dirección de entrega.');
            return;
        }

        if (!isDelivery && !tableNumber) {
            alert('Por favor, seleccione una mesa.');
            return;
        }

        if (order.length === 0) {
            alert('No hay items en el pedido.');
            return;
        }

        payOrderBtn.disabled = true;
        payOrderBtn.textContent = 'Enviando...';

        const orderData = {
            id: currentOrderId || Date.now(),
            date: new Date().toISOString(),
            items: order,
            lastName: lastName,
            tableNumber: isDelivery ? null : tableNumber,
            phoneNumber: phoneNumber,
            total: total.toFixed(2),
            delivery: isDelivery,
            address: isDelivery ? address : null,
            creationTime: Date.now(),
            deliveryTime: Math.floor(Math.random() * (45 - 10 + 1)) + 10, // Random time between 10 and 45 minutes, a more realistic range for preparation.
        };

        const existingOrderIndex = activeOrders.findIndex(o => o.id === currentOrderId);
        if (existingOrderIndex > -1) {
            activeOrders[existingOrderIndex] = orderData;
        } else {
            activeOrders.push(orderData);
        }
        localStorage.setItem('activeOrders', JSON.stringify(activeOrders));

        alert(`¡Gracias por tu pedido, ${lastName}! Tu pedido se está procesando.`);

        order = [];
        currentOrderId = null;
        renderOrder();
        renderActiveOrders();

        lastNameInput.value = '';
        tableNumberSelect.value = '';
        phoneNumberInput.value = '';
        addressInput.value = '';
        deliveryOption.checked = false;
        addressGroup.style.display = 'none';
        tableNumberGroup.style.display = 'block';
        payOrderBtn.textContent = 'Enviar Pedido';
        payOrderBtn.disabled = false;
        
        document.querySelectorAll('#active-orders-items li').forEach(li => {
            li.classList.remove('editing');
        });
    });


    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres borrar todo el historial?')) {
            orderHistory = [];
            localStorage.removeItem('orderHistory');
            renderOrderHistory();
        }
    });

    clearActiveOrdersBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres limpiar todos los pedidos activos?')) {
            activeOrders = [];
            localStorage.removeItem('activeOrders');
            Object.values(activeOrderIntervals).forEach(clearInterval);
            activeOrderIntervals = {};
            renderActiveOrders();
        }
    });

    addExtraItemBtn.addEventListener('click', () => {
        const name = extraItemNameInput.value.trim();
        const price = parseFloat(extraItemPriceInput.value);


        if (!name || isNaN(price) || price <= 0) {
            alert('Por favor, ingrese un nombre y un precio válido para el extra.');
            return;
        }

        addItemToOrder({ name: `EXTRA: ${name}`, price });

        extraItemNameInput.value = '';
        extraItemPriceInput.value = '';
    });

    renderMenu();
    renderOrder();
    renderOrderHistory();
    renderActiveOrders();
});