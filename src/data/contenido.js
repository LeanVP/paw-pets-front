// Contenido que NO viene del backend: artículos del blog y regiones/comunas para los formularios.

// Artículos del blog: id, titulo, resumen (lista) y contenido (detalle)
export const blogs = [
  {
    "id": 1,
    "titulo": "Cómo elegir el alimento ideal para tu perro",
    "resumen": "Edad, tamaño y actividad: claves para escoger bien.",
    "contenido": "Cada perro tiene necesidades distintas según su edad, tamaño y nivel de actividad. Un cachorro requiere más proteínas y calorías; un adulto necesita equilibrio; un perro senior, menos grasa y apoyo articular. Lee siempre la etiqueta y consulta con tu veterinario antes de cambiar la dieta."
  },
  {
    "id": 2,
    "titulo": "Adopta, no compres: tenencia responsable",
    "resumen": "Adoptar salva vidas y transforma hogares.",
    "contenido": "Miles de mascotas esperan un hogar. Adoptar implica un compromiso de años: alimentación, salud, tiempo y cariño. Antes de adoptar, evalúa tu espacio y tus horarios, y esteriliza a tu mascota para evitar camadas no deseadas."
  }
];

// Región -> comunas, para los selects dependientes del checkout y del registro
export const regiones = {
  "Región Metropolitana de Santiago": [
    "Puente Alto",
    "Maipú",
    "Providencia",
    "Santiago"
  ],
  "Región de Valparaíso": [
    "Valparaíso",
    "Viña del Mar",
    "Quilpué"
  ],
  "Región del Biobío": [
    "Concepción",
    "Talcahuano",
    "Los Ángeles"
  ]
};
