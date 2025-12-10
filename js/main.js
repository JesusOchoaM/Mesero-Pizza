document.addEventListener('DOMContentLoaded', () => {
    const menuItemsContainer = document.getElementById('menu-items');
    const orderItemsContainer = document.getElementById('order-items');
    const orderTotalElement = document.getElementById('order-total');
    const resetOrderBtn = document.getElementById('reset-order-btn');
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
    const paymentMethodSelect = document.getElementById('payment-method');
    const cashAmountInput = document.getElementById('cash-amount');
    const cashPaymentGroup = document.getElementById('cash-payment-group');
    const changeDisplay = document.getElementById('change-display');

    let order = [];
    let orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
    let activeOrderIntervals = {};
    let currentOrderId = null;

    window.sendOrderToFirestore = async function() {
        const lastName = lastNameInput.value.trim();
        const tableNumber = tableNumberSelect.value;
        const isDelivery = deliveryOption.checked;
        const address = addressInput.value.trim();

        // Validaciones
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
        
        const totalOrder = order.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const metodoPago = paymentMethodSelect.value;
        const pagoCon = parseFloat(cashAmountInput.value);
        let cambio = 0;
        if (metodoPago === 'Efectivo' && !isNaN(pagoCon) && pagoCon >= totalOrder) {
            cambio = pagoCon - totalOrder;
        }

        const docId = isDelivery ? `Llevar-${lastName}` : `Mesa ${tableNumber}`;
        const orderData = {
            mesa: isDelivery ? "Llevar" : `Mesa ${tableNumber}`,
            apellido: lastName,
            items: order,
            total: totalOrder,
            status: 'PENDIENTE',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            nota: isDelivery ? document.getElementById('address').value : '',
            metodoPago: metodoPago,
            pagoCon: !isNaN(pagoCon) ? pagoCon : null,
            cambio: cambio
        };

        try {
            await db.collection('pedidos_activos').doc(docId).set(orderData);
            
            alert('✅ Pedido enviado a Cocina');
            resetOrderBtn.click();
        } catch (error) {
            console.error(error);
            alert('❌ Error al conectar con el servidor');
        }
    };

    /**
     * Descuenta los ingredientes del inventario basados en los items de un pedido.
     * @param {Array} orderItems - El array de items del pedido actual.
     */
    deliveryOption.addEventListener('change', () => {
        addressGroup.style.display = deliveryOption.checked ? 'block' : 'none';
        tableNumberGroup.style.display = deliveryOption.checked ? 'none' : 'block';
    });

    paymentMethodSelect.addEventListener('change', () => {
        if (paymentMethodSelect.value === 'Efectivo') {
            cashPaymentGroup.style.display = 'block';
        } else {
            cashPaymentGroup.style.display = 'none';
            cashAmountInput.value = '';
            changeDisplay.textContent = '';
        }
    });

    cashAmountInput.addEventListener('input', () => {
        const cash = parseFloat(cashAmountInput.value);
        const total = order.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (isNaN(cash) || cash < total) {
            changeDisplay.textContent = '';
            return;
        }
        const change = cash - total;
        changeDisplay.textContent = `Cambio: $${change.toFixed(2)}`;
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
            { nombre: "Calzone de Jamón / Calzone de Pepperoni", desc: "Masa cerrada rellena", precio: 8.00 },
            { nombre: "Calzone Suprema", desc: "Relleno especial", precio: 9.50 },
            { nombre: "Calzone Doble Queso", desc: "Full queso", precio: 9.50 },
            { nombre: "Calzone Vegetariana", desc: "Vegetales frescos", precio: 9.50 },
            // Pizzas Tradicionales
            { 
                nombre: "Pepperoni / Jamón", 
                desc: "Clásica", 
                precios: { peq: 5.00, med: 6.00, fam: 7.99 },
                ingredientes: { 'peperoni': 0.2, 'queso-mozzarella': 0.5, 'salsa-pizza': 0.1 }
            },
            { nombre: "Pizza con Jamón y Vegetales / Pizza con Pepperoni y Vegetales", desc: "Cebolla, Tomate, Chile", precios: { peq: 5.50, med: 6.99, fam: 8.99 } },
            { nombre: "Salchicha / Chorizo", desc: "Con Jamón o Pepperoni", precios: { peq: 6.00, med: 7.50, fam: 9.75 } },
            { nombre: "Mitad y Mitad", desc: "Jamón y Pepperoni", precios: { peq: 6.00, med: 7.99, fam: 9.99 } },
            { nombre: "Jalapeño / Loroco", desc: "Especialidades", precios: { peq: 7.00, med: 8.50, fam: 10.99 } },
            { nombre: "Suprema / Vegetariana", desc: "Especialidades de la casa", precios: { peq: 6.50, med: 7.99, fam: 9.99 } },
            { nombre: "Hawaiana", desc: "Jamón y Piña", precios: { peq: 7.00, med: 8.99, fam: 12.99 } },
            { nombre: "Meat Lover", desc: "Todas las carnes", precios: { peq: 7.00, med: 8.99, fam: 12.99 } },
            { nombre: "Doble Queso", desc: "Mozzarella extra", precios: { peq: 6.50, med: 8.99, fam: 10.99 } },
            { nombre: "Pizza Alfredo con Pollo / Pizza Alfredo con Camarones", desc: "Salsa blanca", precios: { peq: 9.50, med: 14.99, fam: 19.99 } },
            { nombre: "Carnívora", desc: "5 Carnes y vegetales", precios: { peq: 8.00, med: 10.99, fam: 16.99 } },
            { nombre: "4 Estaciones", desc: "Jamón, Pepperoni, Suprema y Carne", precios: { peq: 8.00, med: 10.99, fam: 14.99 } },
            { nombre: "Orilla de Queso (Extra)", desc: "Agrégalo a tu orden", precios: { peq: 2.75, med: 3.99, fam: 5.50 } }
        ]
    },

    // 3. COMBOS FAMILIARES (RESTO)
    {
        categoria: "Combos Familiares",
        items: [
            { nombre: "Combo Pequeño", desc: "1 Pizza (1 ing), Pan c/ajo (6), Soda 1.25L", precio: 13.49,
                options: [
                    { name: "Pizza", choices: ["Jamón", "Pepperoni", "Queso"] }
                ]
            },
            { nombre: "Combo Mediano", desc: "2 Pizzas (1 ing), Pan c/ajo (6), Soda 1.25L", precio: 21.99,
                options: [
                    { name: "Pizza 1", choices: ["Jamón", "Pepperoni", "Queso"] },
                    { name: "Pizza 2", choices: ["Jamón", "Pepperoni", "Queso"] }
                ]
            },
            { nombre: "Combo Grande", desc: "1 Pizza (1 ing), 20 Alitas, 2 Papas, Soda 1.25L", precio: 26.99,
                options: [
                    { name: "Pizza", choices: ["Jamón", "Pepperoni", "Queso"] },
                    { name: "Alitas", choices: ["BBQ", "Búfalo"] }
                ]
            },
            { nombre: "Combo Especial", desc: "1 Gigante Especialidad, 8 Alitas, Papas, Pan/Ajo, Ketchup", precio: 22.99,
                options: [
                    { name: "Pizza", choices: ["Suprema", "Vegetariana", "Hawaiana", "Meat Lover"] },
                    { name: "Alitas", choices: ["BBQ", "Búfalo"] }
                ]
            },
            { nombre: "Combo Combinado", desc: "1 Pizza 1 ing, 10 Alitas, Papas, Ketchup", precio: 16.99,
                options: [
                    { name: "Pizza", choices: ["Jamón", "Pepperoni", "Queso"] },
                    { name: "Alitas", choices: ["BBQ", "Búfalo"] }
                ]
            },
            { nombre: "Combo XL", desc: "1 Gigante Esp, Pan ajo, 5 Piezas Pollo, Soda 1.25L", precio: 27.49,
                options: [
                    { name: "Pizza", choices: ["Suprema", "Vegetariana", "Hawaiana", "Meat Lover"] }
                ]
            },
            { nombre: "Combo #1", desc: "2 Gigantes Especialidad + Pan con ajo", precio: 23.49,
                options: [
                    { name: "Pizza 1", choices: ["Suprema", "Vegetariana", "Hawaiana", "Meat Lover"] },
                    { name: "Pizza 2", choices: ["Suprema", "Vegetariana", "Hawaiana", "Meat Lover"] }
                ]
            },
            { nombre: "Combo #2", desc: "1 Pizza (1 ing), 10 Alitas, Papas, CheeseStick", precio: 22.99,
                options: [
                    { name: "Pizza", choices: ["Jamón", "Pepperoni", "Queso"] },
                    { name: "Alitas", choices: ["BBQ", "Búfalo"] }
                ]
            },
            { nombre: "Combo #3", desc: "3 Gigantes (1 Esp, 2 Un Ing), 10 Alitas, Papas", precio: 38.99,
                options: [
                    { name: "Pizza Especialidad", choices: ["Suprema", "Vegetariana", "Hawaiana", "Meat Lover"] },
                    { name: "Pizza 1 Ingrediente 1", choices: ["Jamón", "Pepperoni", "Queso"] },
                    { name: "Pizza 1 Ingrediente 2", choices: ["Jamón", "Pepperoni", "Queso"] },
                    { name: "Alitas", choices: ["BBQ", "Búfalo"] }
                ]
            },
{
    nombre: "Combo Familiar $20",
    desc: "1 Pizza Gigante + Alitas. Selecciona precio si es Tradicional o Especialidad.",
    precios: {
        "Tradicional": 19.99,
        "Con Especialidad (+1.99)": 21.98
    },
    options: [
        { name: "Sabor Pizza", choices: ["Jamón", "Pepperoni", "Suprema (Especialidad)", "Hawaiana (Especialidad)", "Meat Lover (Especialidad)", "Vegetariana (Especialidad)"] },
        { name: "Salsa Alitas", choices: ["BBQ", "Búfalo"] }
    ]
},
        ]
    },

    // 4. PUPUSAS
    {
        categoria: "Pupusas",
        descripcion: "Delicias típicas",
        items: [
            { nombre: "Revuelta / Frijol con Queso", desc: "Tradicionales", precio: 0.90 },
            { nombre: "Queso", desc: "Puro queso", precio: 1.00 },
            { nombre: "Queso con Loroco", desc: "Especialidad", precio: 1.25 },
            { nombre: "Queso Jalapeño", desc: "Picante", precio: 1.15 },
            { nombre: "Pupusa de Queso con Pepperoni / Pupusa de Queso con Jamón", desc: "Especialidad", precio: 1.35 },
            { nombre: "Queso Ayote / Ajo", desc: "Vegetariana", precio: 1.25 },
            { nombre: "Chicharrón", desc: "Solo carne", precio: 1.50 },
            { nombre: "Queso con Pollo", desc: "Especialidad", precio: 1.50 },
            { nombre: "Queso Hongos / Camarón", desc: "Premium", precio: 1.60 },
            { nombre: "Nutella", desc: "Postre", precio: 1.99 },
            { nombre: "3 Quesos (Loca)", desc: "Mozzarella + Cheddar + Quesillo", precio: 1.99 }
        ]
    },

    // 5. ZONA DE FRITURA
    {
        categoria: "Zona de Fritura",
        descripcion: "Alitas y Snacks",
        items: [
            { nombre: "Alitas Pequeño (7) BBQ / Alitas Pequeño (7) Búfalo", desc: "Papa, Aderezo", precio: 6.99 },
            { nombre: "Alitas Mediano (20) BBQ / Alitas Mediano (20) Búfalo", desc: "Papa, Aderezo", precio: 16.99 },
            { nombre: "Alitas Grande (30) BBQ / Alitas Grande (30) Búfalo", desc: "Papa, Aderezo", precio: 22.99 },
            { nombre: "Camarones Empanizados", desc: "12 camarones, papas, tortilla", precio: 10.99 },
            { nombre: "Tacos de Pollo", desc: "5 tacos, papas, tortilla", precio: 7.99 },
            { nombre: "Plato de Costilla", desc: "8onz costilla cerdo, papa, ensalada", precio: 8.99 },
            { nombre: "Nuggets de Pollo", desc: "10 nuggets, papas, soda", precio: 7.00 }
        ]
    },

    // 6. SABOR A TU PALADAR (Paninis y Rellenitas)
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

    // 7. POLLO FRITO
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

    // 8. HAMBURGUESAS Y HOT DOGS
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

    // 9. VARIEDAD DE PLATILLOS (Típicos, Quesadillas, Burritos)
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
            { 
                nombre: "Papas Francesas", 
                desc: "Orden simple", 
                precio: 1.99,
                ingredientes: { 'papas': 0.5, 'aceite': 0.05, 'ketchup-bolsita': 2 }
            },
            { nombre: "Papas de Feria", desc: "Ketchup, aderezo, queso", precio: 3.50 },
            { nombre: "Papas Cheddar y Tocino", desc: "Especial", precio: 3.50 }
        ]
    },

    // 10. MENÚ INFANTIL (Todo a $4.99)
    {
        categoria: "Menú Infantil ($4.99)",
        descripcion: "Incluye Papas, Aderezo y Soda",
        items: [
            { nombre: "Infantil Alitas BBQ / Infantil Alitas Búfalo", desc: "4 Alitas", precio: 4.99 },
            { nombre: "Infantil Pechugitas", desc: "4 Pechugitas", precio: 4.99 },
            { nombre: "Infantil Hamburguesa", desc: "Hamburguesa de Pollo", precio: 4.99 },
            { nombre: "Infantil Pizza de Jamón / Infantil Pizza de Pepperoni", desc: "Pizza 4 porciones + 2 Pan ajo", precio: 4.99 },
            { nombre: "Infantil Nuggets", desc: "5 Nuggets", precio: 4.99 },
            { nombre: "Infantil Rellenita", desc: "1 Rellenita Tradicional", precio: 4.99 }
        ]
    },

    // 11. TODAS LAS BEBIDAS Y POSTRES
    {
        categoria: "Bebidas y Postres",
        items: [
            // Frías
            { 
                nombre: "Coca Cola Lata", 
                desc: "355ml", 
                precio: 1.25,
                ingredientes: { 'coca-cola-lata': 1 }
            },
            { 
                nombre: "Coca Cola Vidrio", 
                desc: "Botella de vidrio", 
                precio: 1.25, 
                ingredientes: { 'coca-cola-vidrio': 1 }
            },
            { 
                nombre: "Kolashampan Lata", 
                desc: "355ml", 
                precio: 1.25,
                ingredientes: { 'kolashampan-lata': 1 }
            },
            { 
                nombre: "Agua Botella", 
                desc: "Natural", 
                precio: 0.75,
                ingredientes: { 'agua-embotellada': 1 }
            },
            { 
                nombre: "Pepsi 1.25L", 
                desc: "Botella", 
                precio: 1.75 
                // (Si tienes Pepsi en inventario, agrega su ingrediente aquí)
            },
            { 
                nombre: "Refresco Natural", 
                desc: "Horchata / Cebada / Sandía / Fresa / Piña", 
                precio: 1.75 
            },
            { 
                nombre: "Jugo de Naranja", 
                desc: "Natural", 
                precio: 1.99 
            },
            // Calientes
            { nombre: "Café Negro / Té", desc: "Caliente", precio: 1.00 },
            { nombre: "Café con Leche", desc: "Caliente", precio: 1.50 },
            // Alcohol
            { nombre: "Cerveza Pilsener", desc: "Botella", precio: 1.75, ingredientes: { 'cerveza-pilsener-uni': 1 } },
            { nombre: "Cerveza Golden", desc: "Botella", precio: 1.75, ingredientes: { 'cerveza-golden-uni': 1 } },
            { nombre: "Mix Michelada", desc: "Preparado", precio: 1.50 },
            { nombre: "Coctel de Tequila / Coctel de Ron / Coctel de Vodka", desc: "Variedad", precio: 3.50 },
            // Especiales
            { nombre: "Limonada Natural / Limonada de Fresa / Limonada de Hierbabuena", desc: "Preparada", precio: 3.50 },
            { nombre: "Licuado de Fresa / Licuado de Banano / Licuado de Oreo", desc: "Con leche", precio: 1.50 },
            { nombre: "Frozen de Café / Frozen de Frutas", desc: "Granizado", precio: 2.50 },
            // Postres
            { nombre: "Mini Pan Cake", desc: "Postre", precio: 2.99 },
            { nombre: "Copa de Fruta con Miel / Copa de Fruta con Yogurt", desc: "Miel o Yogurt", precio: 2.99 },
            { nombre: "Rollitos de Nutella", desc: "Con banano", precio: 3.50 }
        ]
    },

    // 12. CREPAS Y POSTRES
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

    // 13. MENU DE CENAS
    {
        categoria: "Cenas Típicas",
        descripcion: "Servidas de 5:00 PM en adelante",
        items: [
            { nombre: "Cena Tradicional con Huevos Revueltos / Cena Tradicional con Huevos Picados / Cena Tradicional con Huevos con Vegetales / Cena Tradicional con Huevo Estrellado", desc: "2 Huevos, frijoles, plátano, pan, café", precio: 3.50 },
            { nombre: "Cena Ranchera con Huevos Revueltos / Cena Ranchera con Huevos Picados / Cena Ranchera con Huevos con Vegetales / Cena Ranchera con Huevo Estrellado", desc: "Huevos, frijoles, plátano, chorizo, tocino", precio: 4.25 },
            { nombre: "Omelette con jamón y queso / Omelette con vegetales", desc: "Con jamón y queso", precio: 4.50 },
            { nombre: "Pan Cakes", desc: "Con Nutella, miel, banano", precio: 3.99 },
            { nombre: "Cena Americana con Huevos Revueltos / Cena Americana con Huevos Picados / Cena Americana con Huevos con Vegetales / Cena Americana con Huevo Estrellado", desc: "Huevos, pancake, frijoles, chorizo", precio: 5.25 },
            { nombre: "Cena de Toque con Huevos Revueltos / Cena de Toque con Huevos Picados / Cena de Toque con Huevos con Vegetales / Cena de Toque con Huevo Estrellado", desc: "Huevos, frijoles, 3 alitas", precio: 4.99 },
            { nombre: "Burrito Cena con Huevos Revueltos / Burrito Cena con Huevos Picados / Burrito Cena con Huevos con Vegetales / Burrito Cena con Huevo Estrellado", desc: "Huevos, frijoles, queso", precio: 4.50 }
        ]
    },

    // 14. EXTRAS
    {
        categoria: "Extras",
        items: [
            { nombre: "Queso", desc: "Adicional", precio: 0.75 },
            { nombre: "Frijoles Molidos", desc: "Adicional", precio: 0.75 },
            { nombre: "Plátanos Fritos", desc: "Adicional", precio: 0.75 },
            { nombre: "Pan Francés", desc: "Adicional", precio: 0.20 },
            { nombre: "Tortilla Frita", desc: "Adicional", precio: 0.75 },
            { nombre: "Tocino", desc: "Adicional", precio: 0.99 },
            { nombre: "Salchicha", desc: "Adicional", precio: 0.75 },
            { nombre: "Chorizo", desc: "Adicional", precio: 0.75 },
            { nombre: "Crema", desc: "Adicional", precio: 0.75 }
        ]
    }
];

    const priceKeyMap = {
        peq: 'Pequeña',
        med: 'Mediana',
        fam: 'Familiar'
    };

    const renderMenu = (filter = 'all') => {
        menuItemsContainer.innerHTML = '';
        const filteredMenu = menu.filter(category => filter === 'all' || category.categoria === filter);

        filteredMenu.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.classList.add('menu-category');
            
            const itemsContainer = document.createElement('div');
            itemsContainer.classList.add('menu-items-grid');
            
            category.items.forEach(item => {
                const menuItemElement = document.createElement('div');
                menuItemElement.classList.add('menu-item');

                const hasSubOptions = item.nombre.includes('/');
                const subOptions = hasSubOptions ? item.nombre.split(' / ') : [item.nombre];

                let subOptionsHTML = '';
                if (item.options) {
                    item.options.forEach(option => {
                        const optionSelectId = `option-select-${item.nombre.replace(/[^a-zA-Z0-9]/g, '-')}-${option.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
                        subOptionsHTML += `<label for="${optionSelectId}">${option.name}:</label>`;
                        subOptionsHTML += `<select id="${optionSelectId}" class="sub-option-select">`;
                        option.choices.forEach(choice => {
                            subOptionsHTML += `<option value="${choice}">${choice}</option>`;
                        });
                        subOptionsHTML += `</select>`;
                    });
                } else if (hasSubOptions) {
                    const subOptionSelectId = `sub-option-select-${item.nombre.replace(/[^a-zA-Z0-9]/g, '-')}`;
                    subOptionsHTML = `<select id="${subOptionSelectId}" class="sub-option-select">`;
                    subOptions.forEach(option => {
                        subOptionsHTML += `<option value="${option}">${option}</option>`;
                    });
                    subOptionsHTML += `</select>`;
                }

                let priceHTML = '';
                if (item.precios) {
                    const selectId = `price-select-${item.nombre.replace(/[^a-zA-Z0-9]/g, '-')}`;
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
                        <input type="number" min="1" value="1" class="qty-input" style="width: 60px; padding: 5px; margin-right: 5px; border-radius: 5px; border: 1px solid #ddd;">
                        <button class="btn-add-item">Agregar</button>
                    </div>
                `;

                menuItemElement.querySelector('.btn-add-item').addEventListener('click', () => {
                    const quantity = parseInt(menuItemElement.querySelector('.qty-input').value) || 1;
                    let name = item.nombre;
                    let price = 0;
                    let optionsSummary = '';

                    if (item.options) {
                        const selectedOptions = [];
                        item.options.forEach(option => {
                            const optionSelectId = `option-select-${item.nombre.replace(/[^a-zA-Z0-9]/g, '-')}-${option.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
                            const select = menuItemElement.querySelector(`#${optionSelectId}`);
                            selectedOptions.push(`${option.name}: ${select.value}`);
                        });
                        optionsSummary = ` (${selectedOptions.join(', ')})`;
                        name = `${item.nombre}${optionsSummary}`;
                    } else if (hasSubOptions) {
                        const subOptionSelect = menuItemElement.querySelector('.sub-option-select');
                        name = subOptionSelect.value;
                    }

                    if (item.precios) {
                        const select = menuItemElement.querySelector('.price-select');
                        const selectedOption = select.options[select.selectedIndex];
                        price = parseFloat(selectedOption.value);
                        const nameSuffix = selectedOption.text.split(' - ')[0];
                        if (item.options) {
                             name = `${item.nombre} (${nameSuffix})${optionsSummary}`;
                        } else {
                             name = `${name} (${nameSuffix})`;
                        }

                    } else if (item.precio) {
                        price = item.precio;
                    }
                    
                    addItemToOrder({ name, price }, quantity);
                });
                itemsContainer.appendChild(menuItemElement);
            });
            categoryElement.appendChild(itemsContainer);
            menuItemsContainer.appendChild(categoryElement);
        });
    };

    const menuCategoriesNav = document.getElementById('menu-categories-nav');
    const allButton = document.createElement('button');
    allButton.classList.add('menu-category-button', 'active');
    allButton.textContent = 'Todo';
    allButton.addEventListener('click', () => {
        renderMenu('all');
        document.querySelectorAll('.menu-category-button').forEach(btn => btn.classList.remove('active'));
        allButton.classList.add('active');
    });
    menuCategoriesNav.appendChild(allButton);

    menu.forEach(category => {
        const button = document.createElement('button');
        button.classList.add('menu-category-button');
        button.textContent = category.categoria;
        button.addEventListener('click', () => {
            renderMenu(category.categoria);
            document.querySelectorAll('.menu-category-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
        menuCategoriesNav.appendChild(button);
    });



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

    const startChronometer = (timestamp, timerElement) => {
        if (!timestamp) {
            timerElement.textContent = '00:00';
            return;
        }
        
        const startTime = timestamp.toDate().getTime();
        
        const intervalId = setInterval(() => {
            const now = Date.now();
            const elapsed = now - startTime;
            
            const minutes = Math.floor(elapsed / (1000 * 60));
            const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
            
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
        
        return intervalId;
    };


    db.collection('pedidos_activos').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        activeOrdersItemsContainer.innerHTML = '';
        Object.values(activeOrderIntervals).forEach(clearInterval);
        activeOrderIntervals = {};

        if (snapshot.empty) {
            activeOrdersItemsContainer.innerHTML = '<li>No hay pedidos activos.</li>';
            return;
        }

        snapshot.forEach(doc => {
            const order = doc.data();
            const orderId = doc.id;

            const orderElement = document.createElement('li');
            orderElement.dataset.id = orderId;
            orderElement.classList.add(`status-${order.status.toLowerCase()}`);

            const timerElement = document.createElement('span');
            timerElement.classList.add('timer');

            orderElement.innerHTML = `
                <div class="order-info">
                    <strong>${order.mesa}</strong>
                    <span>Total: $${order.total.toFixed(2)}</span>
                    <span>Estado: ${order.status}</span>
                </div>
                <div class="order-timer">
                    <strong>Tiempo: </strong>
                </div>
            `;
            
            orderElement.querySelector('.order-timer').appendChild(timerElement);
            activeOrdersItemsContainer.appendChild(orderElement);
            
            activeOrderIntervals[orderId] = startChronometer(order.timestamp, timerElement);
        });
    });


    const addItemToOrder = (item, quantity = 1) => {
        const existingItem = order.find(orderItem => orderItem.name === item.name);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            order.push({ ...item, quantity: quantity });
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

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres borrar todo el historial?')) {
            orderHistory = [];
            localStorage.removeItem('orderHistory');
            renderOrderHistory();
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

    // --- SISTEMA DE NOTIFICACIONES ---
    // Escuchar solo los pedidos que están LISTOS
    db.collection('pedidos_activos').where('status', '==', 'LISTO')
    .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            // Si un pedido se acaba de poner en LISTO (added o modified)
            if (change.type === 'added' || change.type === 'modified') {
                const data = change.doc.data();
                
                // 1. Alerta Visual
                alert(`🔔 ¡ATENCIÓN! La ${data.mesa} está LISTA para recoger.`);
                
                // 2. Alerta de Voz (Opcional, pero muy útil)
                if ('speechSynthesis' in window) {
                    const mensaje = new SpeechSynthesisUtterance(`La ${data.mesa} está lista`);
                    window.speechSynthesis.speak(mensaje);
                }
            }
        });
    });

    // --- SISTEMA DE NOTIFICACIONES (MESERO) ---
    // Escucha cambios en tiempo real
    db.collection('pedidos_activos').onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            // Si un pedido fue MODIFICADO y ahora su estado es 'LISTO'
            if (change.type === 'modified') {
                const data = change.doc.data();
                if (data.status === 'LISTO') {
                    // 1. Sonido de éxito
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                    audio.play().catch(e => console.log('Audio bloqueado'));
                    // 2. Vibración del celular (200ms)
                    if (navigator.vibrate) navigator.vibrate(200);
                    // 3. Alerta visual
                    alert(`🔔 ¡PEDIDO LISTO!\nMesa: ${data.mesa}\nCliente: ${data.apellido}`);
                }
            }
        });
    });
});