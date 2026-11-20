/**
 * Contenido estático del sitio que NO está en el modelo de datos de la pauta (Figura 1):
 * artículos del blog y regiones/comunas para los formularios de dirección.
 * Categorías, productos y usuarios ya no viven aquí: los entrega el backend (MongoDB Atlas).
 */


// Artículos del blog: título, resumen corto y texto completo
// Campos: id = número único; titulo; resumen = se ve en la lista; contenido = se ve en el detalle
export const blogs = [
  // Artículo 1: consejos de alimentación
  {
    id: 1,
    titulo: 'Cómo elegir el alimento ideal para tu perro',
    resumen: 'Edad, tamaño y actividad: claves para escoger bien.',
    contenido:
      'Cada perro tiene necesidades distintas según su edad, tamaño y nivel de actividad. Un cachorro requiere más proteínas y calorías; un adulto necesita equilibrio; un perro senior, menos grasa y apoyo articular. Lee siempre la etiqueta y consulta con tu veterinario antes de cambiar la dieta.',
  },
  // Artículo 2: adopción y tenencia responsable
  {
    id: 2,
    titulo: 'Adopta, no compres: tenencia responsable',
    resumen: 'Adoptar salva vidas y transforma hogares.',
    contenido:
      'Miles de mascotas esperan un hogar. Adoptar implica un compromiso de años: alimentación, salud, tiempo y cariño. Antes de adoptar, evalúa tu espacio y tus horarios, y esteriliza a tu mascota para evitar camadas no deseadas.',
  },
];

// Región -> comunas, para los selects dependientes del checkout y del registro.
// Es un objeto: la clave es el nombre de la región y el valor es la lista de sus comunas.
// No hay lista de órdenes aquí: db.js parte esa colección vacía ([]) hasta la primera compra.
export const regiones = {
  'Región Metropolitana de Santiago': ['Puente Alto', 'Maipú', 'Providencia', 'Santiago'],
  'Región de Valparaíso': ['Valparaíso', 'Viña del Mar', 'Quilpué'],
  'Región del Biobío': ['Concepción', 'Talcahuano', 'Los Ángeles'],
};
