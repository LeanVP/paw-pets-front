# Guía de instalación (Windows, desde cero)

Esta guía deja funcionando PawPets en un computador nuevo: backend (Spring Boot), frontend (React)
y base de datos en MongoDB Atlas.

> **Importante:** son dos proyectos con herramientas distintas.
> - `paw-pets-backend` es **Java + Spring Boot + Maven**. **No** usa `npm`. Se ejecuta con `mvnw.cmd`.
> - `paw-pets-frontend` es **React + Vite (Node.js)**. Usa `npm`.

---

## 1. Requisitos

| Herramienta | Versión | Para qué | Cómo comprobar |
|---|---|---|---|
| JDK (Java) | **17** (el `pom.xml` pide `java.version=17`) | Ejecutar el backend | `java -version` |
| Node.js | 20 o superior (probado con 22.20) | Ejecutar el frontend | `node -v` y `npm -v` |
| Git | cualquiera reciente | Clonar los repositorios | `git --version` |
| VS Code | reciente | Editor (opcional pero recomendado) | — |
| Cuenta MongoDB Atlas | plan gratis (M0) | Base de datos en la nube | — |
| Google Chrome | reciente | Pruebas del frontend (Karma) | — |

Maven **no** se instala: el backend trae el *Maven Wrapper* (`mvnw.cmd` + carpeta `.mvn/wrapper/`),
que descarga Maven la primera vez.

Si `java -version` muestra otra versión, instala el JDK 17 (por ejemplo *Microsoft Build of OpenJDK 17*
o *Eclipse Temurin 17*) y deja la variable `JAVA_HOME` apuntando a esa carpeta.

---

## 2. Crear la base de datos en MongoDB Atlas

> Los nombres de los botones pueden variar un poco con el tiempo; los pasos son siempre estos.

1. Entra a <https://www.mongodb.com/cloud/atlas> e inicia sesión (o crea una cuenta).
2. **Crear el cluster gratuito:** *Create* → plan **M0 (Free)** → proveedor y región cercanos
   (por ejemplo AWS / São Paulo) → nombre `Cluster0` → **Create Deployment**.
3. **Usuario de base de datos:** *Security → Database Access → Add New Database User*.
   - Método **Password**. Usuario, por ejemplo, `pawpets`.
   - Contraseña **solo con letras y números** (los símbolos `@ : / ? #` rompen la URI si no se codifican).
   - Privilegios: **Read and write to any database**.
4. **Acceso de red:** *Security → Network Access → Add IP Address*.
   - **Add Current IP Address** (recomendado) o, solo para desarrollo, `0.0.0.0/0`.
   - Si cambias de red (casa, Duoc) y deja de conectar, agrega la IP nueva.
5. **Obtener la URI:** *Database → Connect → Drivers*. Copia la cadena:
   ```
   mongodb+srv://pawpets:<db_password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
6. Reemplaza `<db_password>` por la contraseña y agrega el nombre de la base **`/pawpets`** antes del `?`:
   ```
   mongodb+srv://pawpets:MiClave123@cluster0.xxxxx.mongodb.net/pawpets?retryWrites=true&w=majority&appName=Cluster0
   ```

---

## 3. Configurar los archivos `.env`

Los `.env` guardan los secretos. Están en `.gitignore`: **nunca se suben a GitHub**.
Cada proyecto trae un `.env.example` con valores de ejemplo para copiar.

### Backend (`paw-pets-backend/.env`)

```powershell
cd paw-pets-backend
copy .env.example .env
notepad .env
```

```properties
MONGODB_URI=mongodb+srv://pawpets:MiClave123@cluster0.xxxxx.mongodb.net/pawpets?retryWrites=true&w=majority
JWT_SECRET=una-frase-larga-y-secreta-de-32-o-mas-caracteres
CORS_ORIGIN=http://localhost:5173
```

- `JWT_SECRET` debe tener **32 caracteres o más** (si es más corta el backend no arranca y lo avisa).
- Spring Boot lee este archivo gracias a `spring.config.import=optional:file:.env[.properties]`
  en `src/main/resources/application.properties`. Por eso el `.env` va **junto al `pom.xml`**
  y el backend se debe ejecutar **desde esa carpeta**.

### Frontend (`paw-pets-frontend/.env`)

```powershell
cd paw-pets-frontend
copy .env.example .env
```

```properties
VITE_API_URL=http://localhost:8080/api/v1
```

---

## 4. Levantar el backend

```powershell
cd paw-pets-backend
.\mvnw.cmd spring-boot:run
```

- La primera vez descarga Maven y las dependencias (unos minutos).
- Cuando está listo aparece `Started Application in ... seconds`.
- La **primera vez** también aparecen:
  ```
  Categorías iniciales cargadas en MongoDB
  Productos iniciales cargados en MongoDB
  Usuarios iniciales cargados en MongoDB
  ```
  (`DataSeeder` llena las colecciones vacías con `src/main/resources/data/*.json`).
- Swagger: <http://localhost:8080/swagger-ui.html>

Otros comandos útiles (en la carpeta del backend):

| Comando | Qué hace |
|---|---|
| `.\mvnw.cmd test` | Corre las 45 pruebas unitarias y de integración (no necesitan Atlas) y genera la cobertura en `target/site/jacoco/` |
| `.\mvnw.cmd clean install` | Compila, prueba y genera `target/paw-pets-backend-0.0.1-SNAPSHOT.jar` |

---

## 5. Levantar el frontend

En **otra** terminal (deja el backend encendido):

```powershell
cd paw-pets-frontend
npm install        # solo la primera vez
npm run dev        # http://localhost:5173
```

| Comando | Qué hace |
|---|---|
| `npm test` | 68 pruebas Jasmine + Karma (necesita Chrome) y reporte de cobertura en `coverage/` |
| `npm run lint` | Revisa el código con oxlint |
| `npm run build` | Genera la versión de producción en `dist/` |

---

## 6. Comprobar que se conectó a Atlas

1. Con el backend encendido, en Atlas ve a *Database → Browse Collections* (o *Data Explorer*).
2. Debe aparecer la base **`pawpets`** con las colecciones `categorias`, `productos` y `usuarios`.
3. Haz una compra en el sitio: aparece la colección **`boletas`** con el documento de la compra.
4. En `usuarios`, el campo `clave` se ve como `$2a$10$...` (hash BCrypt), nunca en texto plano.

---

## 7. Trabajar desde VS Code

1. **Archivo → Abrir área de trabajo desde archivo…** → `paw-pets.code-workspace`.
2. Acepta instalar las **extensiones recomendadas** (Extension Pack for Java, Spring Boot Extension Pack,
   oxc y Prettier). La lista está en `.vscode/extensions.json`.
3. **Terminal → Ejecutar tarea…**:

| Tarea | Qué hace |
|---|---|
| **Levantar todo (backend + frontend)** | Abre dos terminales y levanta ambos a la vez |
| Backend: levantar (Spring Boot) | `mvnw.cmd spring-boot:run` en la carpeta del backend |
| Frontend: levantar (Vite) | `npm run dev` en la carpeta del frontend |
| Frontend: instalar dependencias | `npm install` |
| Backend: compilar y probar | `mvnw.cmd clean install` |
| Backend: pruebas unitarias / Frontend: pruebas unitarias | `mvnw.cmd test` / `npm test` |
| Frontend: lint y build | `npm run lint` y `npm run build` |

4. **Depurar el backend:** pestaña *Ejecutar y depurar* (Ctrl+Shift+D) → **"Depurar backend (Spring Boot)"** → F5.
   Pon un punto de interrupción (clic a la izquierda del número de línea), por ejemplo en
   `BoletaService.crear`, y haz una compra en el sitio: la ejecución se detiene ahí y puedes ver las variables.
   (Detén antes la tarea "Backend: levantar" para que no choquen en el puerto 8080).

---

## 8. Errores comunes y cómo resolverlos

| Mensaje o síntoma | Causa | Solución |
|---|---|---|
| `release version 17 not supported` | El JDK activo es menor a 17 | Instala JDK 17 y ajusta `JAVA_HOME` |
| `Could not resolve placeholder 'MONGODB_URI'` | No existe `.env` o no está junto al `pom.xml` | Crea `paw-pets-backend/.env` y ejecuta desde esa carpeta |
| `JWT_SECRET debe tener al menos 32 caracteres` | Frase secreta corta | Usa una frase de 32+ caracteres |
| `MongoTimeoutException` / `Timed out ... waiting for a server` | Tu IP no está en *Network Access* o la URI es incorrecta | Agrega tu IP en Atlas y revisa la URI |
| `Authentication failed` / `bad auth` | Usuario o contraseña de la URI incorrectos | Revisa la contraseña (sin símbolos) |
| `Port 8080 was already in use` | Otro programa usa el 8080 (por ejemplo, otro contenedor Docker) | Ciérralo, o cambia `server.port` y `VITE_API_URL` |
| En el sitio: "No se pudo conectar con el servidor" | El backend está apagado o `VITE_API_URL` no coincide | Enciende el backend y revisa `paw-pets-frontend/.env` (reinicia `npm run dev` tras cambiarlo) |
| En la consola del navegador: error de **CORS** | El frontend no corre en el origen permitido | Usa `http://localhost:5173` o ajusta `CORS_ORIGIN` en el `.env` del backend |
| `npm install` dentro de `paw-pets-backend` falla | El backend no es Node | Usa `mvnw.cmd` en el backend; `npm` solo en el frontend |
| Los íconos se ven como texto (`shopping_cart`) | Sin internet: los íconos se cargan desde Google Fonts | Conéctate a internet y recarga |
| `npm test` no abre Chrome | Karma necesita Google Chrome instalado | Instala Chrome |
