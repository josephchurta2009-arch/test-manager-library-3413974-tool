const API_URL = process.env.API_URL || 'http://localhost:8000/api/v1';
const USERNAME = process.env.ADMIN_USERNAME || 'admin';
const PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

async function run() {
  console.log(`[Tool] Conectando a ${API_URL}...`);
  
  // 1. Login
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD })
  });

  if (!loginRes.ok) {
    throw new Error(`Login falló con status ${loginRes.status}: ${await loginRes.text()}`);
  }

  const { access_token } = await loginRes.json();
  console.log('[Tool] Autenticado como Administrador exitosamente.');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  };

  // 2. Obtener categorías
  const catRes = await fetch(`${API_URL}/categories`, { headers });
  const categories = await catRes.json();
  console.log(`[Tool] Categorías disponibles: ${categories.map(c => c.name).join(', ')}`);

  const catMap = {};
  categories.forEach(c => { catMap[c.name] = c.id; });

  // 3. Crear Libros de prueba
  const sampleBooks = [
    { title: 'Cien Años de Soledad', author: 'Gabriel García Márquez', isbn: '9780307474728', category_id: catMap['Novela'] || categories[0].id, total_copies: 5 },
    { title: 'Breve Historia del Tiempo', author: 'Stephen Hawking', isbn: '9780553380163', category_id: catMap['Ciencia'] || categories[0].id, total_copies: 3 },
    { title: 'Clean Architecture', author: 'Robert C. Martin', isbn: '9780134494166', category_id: catMap['Tecnología'] || categories[0].id, total_copies: 4 },
    { title: 'Sapiens: De animales a dioses', author: 'Yuval Noah Harari', isbn: '9780062316097', category_id: catMap['Historia'] || categories[0].id, total_copies: 2 },
    { title: 'El Principito', author: 'Antoine de Saint-Exupéry', isbn: '9780156012195', category_id: catMap['Infantil'] || categories[0].id, total_copies: 6 }
  ];

  const createdBooks = [];
  for (const b of sampleBooks) {
    try {
      const res = await fetch(`${API_URL}/books`, {
        method: 'POST',
        headers,
        body: JSON.stringify(b)
      });
      if (res.ok) {
        const book = await res.json();
        createdBooks.push(book);
        console.log(`[Tool] Libro creado: "${b.title}"`);
      } else {
        console.log(`[Tool] Info libro "${b.title}": ${res.status}`);
      }
    } catch (err) {
      console.error(`[Tool] Error creando ${b.title}:`, err.message);
    }
  }

  // 4. Crear Socios de prueba
  const sampleMembers = [
    { full_name: 'Carlos Andrés Pérez', document_number: '1098765432' },
    { full_name: 'María Fernanda Gómez', document_number: '1023456789' },
    { full_name: 'Juan Sebastián Morales', document_number: '1087654321' }
  ];

  const createdMembers = [];
  for (const m of sampleMembers) {
    try {
      const res = await fetch(`${API_URL}/members`, {
        method: 'POST',
        headers,
        body: JSON.stringify(m)
      });
      if (res.ok) {
        const member = await res.json();
        createdMembers.push(member);
        console.log(`[Tool] Socio creado: "${m.full_name}"`);
      } else {
        console.log(`[Tool] Info socio "${m.full_name}": ${res.status}`);
      }
    } catch (err) {
      console.error(`[Tool] Error creando socio ${m.full_name}:`, err.message);
    }
  }

  // 5. Crear Préstamo de prueba si hay libros y socios
  if (createdBooks.length > 0 && createdMembers.length > 0) {
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);
      const loanPayload = {
        member_id: createdMembers[0].id,
        items: [{ book_id: createdBooks[0].id }],
        due_date: dueDate.toISOString().slice(0, 10)
      };

      const loanRes = await fetch(`${API_URL}/loans`, {
        method: 'POST',
        headers,
        body: JSON.stringify(loanPayload)
      });

      if (loanRes.ok) {
        console.log('[Tool] Préstamo de prueba registrado con éxito.');
      } else {
        console.log(`[Tool] Info préstamo: ${loanRes.status}`);
      }
    } catch (err) {
      console.error('[Tool] Error registrando préstamo:', err.message);
    }
  }

  console.log('[Tool] Sembrado de datos completado.');
}

run().catch(err => {
  console.error('[Tool] Fallo en la ejecución del sembrador:', err);
  process.exit(1);
});
