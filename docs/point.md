```typescript
async function examples() {
	// Insertar una tienda con coordenadas
	const newStore = await query(StoresTable).insert({
		name: 'Tienda Central',
		address: 'Calle 5 #10-20',
		location: { x: -73.1198, y: 7.8939 } // Coordenadas de Cúcuta
	});

	console.log('Tienda creada:', newStore);

	// ========== BÚSQUEDA POR RADIO ==========
	// Encontrar todas las tiendas dentro de 5km del centro
	const centerPoint: Point = { x: -73.1198, y: 7.8939 };
	const storesNearby = await query(StoresTable)
		.whereWithinRadius('location', centerPoint, 5000) // 5000 metros
		.execute();

	console.log('Tiendas cercanas:', storesNearby);

	// ========== ORDENAR POR DISTANCIA ==========
	// Obtener las 10 tiendas más cercanas a un punto
	const myLocation: Point = { x: -73.115, y: 7.89 };
	const closestStores = await query(StoresTable)
		.orderByDistance('location', myLocation)
		.limit(10)
		.execute();

	console.log('Tiendas más cercanas:', closestStores);

	// ========== BÚSQUEDA EN ÁREA RECTANGULAR (BOUNDING BOX) ==========
	// Encontrar tiendas dentro de un área rectangular
	const topLeft: Point = { x: -73.13, y: 7.9 };
	const bottomRight: Point = { x: -73.11, y: 7.88 };

	const storesInBox = await query(StoresTable)
		.whereInBoundingBox('location', topLeft, bottomRight)
		.execute();

	console.log('Tiendas en área:', storesInBox);

	// ========== BÚSQUEDA EN POLÍGONO ==========
	// Encontrar tiendas dentro de un polígono personalizado
	const polygon: Point[] = [
		{ x: -73.13, y: 7.9 },
		{ x: -73.11, y: 7.9 },
		{ x: -73.11, y: 7.88 },
		{ x: -73.13, y: 7.88 }
	];

	const storesInPolygon = await query(StoresTable).whereInPolygon('location', polygon).execute();

	console.log('Tiendas en polígono:', storesInPolygon);

	// ========== COMBINACIÓN DE CONDICIONES ==========
	// Tiendas cerca de un punto Y con nombre específico
	const filteredStores = await query(StoresTable)
		.where('name', 'LIKE', '%Central%')
		.whereWithinRadius('location', centerPoint, 10000)
		.orderByDistance('location', myLocation)
		.execute();

	console.log('Tiendas filtradas:', filteredStores);

	// ========== PAGINACIÓN CON ORDENAMIENTO GEOESPACIAL ==========
	const [paginatedStores, pagination] = await query(StoresTable)
		.orderByDistance('location', myLocation)
		.paginate(1, 20);

	console.log('Página 1:', paginatedStores);
	console.log('Paginación:', pagination);
}
```
