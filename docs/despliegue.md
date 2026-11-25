Guía de despliegue del sistema CLENA

Esta guía es para quien vaya a publicar el sistema en internet. No hace falta saber programar: todo se hace con clics en tres páginas web (GitHub, Neon y Vercel) y copiando y pegando valores. La primera vez toma entre 45 y 60 minutos.

Los nombres de botones pueden variar un poco según las actualizaciones de cada página. Si algo no coincide exactamente, busque el botón con el nombre más parecido.

1. Qué se va a publicar

El sistema tiene tres piezas. Cada una vive en un lugar distinto, y todas son gratuitas para este uso:

Pieza	Qué es	Dónde vive
Base de datos	Guarda libros, usuarios y préstamos	Neon
Backend (API)	Lo que responde las búsquedas e inicios de sesión	Vercel (proyecto 1)
Frontend	La página que ve la gente	Vercel (proyecto 2)

Se conectan entre sí con tres valores, que usted va a copiar y pegar:

El backend necesita la dirección de la base de datos (DATABASE_URL).
El frontend necesita la dirección del backend (VITE_API_BASE_URL).
El backend necesita saber cuál es la dirección del frontend para aceptarlo (CORS_ORIGIN).

Por eso el orden de los pasos importa: base de datos → backend → frontend → volver al backend.

2. Antes de empezar

Marque cada casilla antes de continuar.

[ ] Tiene una cuenta de GitHub con permisos de administrador sobre el repositorio (los necesita para guardar secretos).
[ ] Tiene una cuenta de Vercel (gratuita), iniciada con su cuenta de GitHub.
[ ] Tiene una cuenta de Neon (gratuita), creada en https://neon.com.
[ ] En el repositorio, en la rama main, existen estos tres archivos:
frontend/vercel.json
.github/workflows/base-de-datos.yml
docs/despliegue.md (este documento)
[ ] Tiene un lugar privado donde guardar contraseñas (un gestor de contraseñas o un documento privado del equipo). Nunca las envíe por chat ni las suba al repositorio.
[ ] Si activó la verificación en dos pasos (autenticador) en Vercel, GitHub o Neon, guarde los códigos de recuperación en un lugar compartido del equipo. Si se pierde el celular con el autenticador y no hay códigos, recuperar la cuenta puede tardar mucho.
3. Paso 0 · Generar las dos claves del sistema

Necesita dos valores secretos. Gérelos usted, de modo que nadie más los conozca.

a) JWT_ACCESS_SECRET: firma las sesiones. Debe tener al menos 32 caracteres.

En Windows (PowerShell):
powershell
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
En Git Bash, Mac o Linux:
bash
openssl rand -base64 48

b) SEED_PASSWORD: es la contraseña de los usuarios de demostración. Debe tener al menos 8 caracteres, con letras y números. Ejemplo de generación:

powershell
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 16 | ForEach-Object {[char]$_})

Revise que el resultado tenga letras y números. Si no, genérela otra vez.

Guarde las dos claves en su lugar privado. Más adelante les dará la contraseña demo únicamente a las personas que vayan a entrar al sistema.

4. Paso 1 · Crear la base de datos en Neon
Entre a Neon y cree un proyecto nuevo (New project).
Nombre sugerido: clena-catalogo.
Región sugerida: US East (N. Virginia), por cercanía con los servidores de Vercel. No es crítico.
Abra la ventana de conexión (botón Connect).
Desactive la opción Connection pooling (conexión agrupada).
Copie la cadena de conexión. Debe verse así:
postgresql://usuario:clave@ep-algo-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
Comprobaciones: el servidor no debe contener la palabra -pooler, y debe terminar en ?sslmode=require.
Guarde esa cadena en su lugar privado. En esta guía se llama la URL directa.
5. Paso 2 · Guardar los secretos en GitHub

Estos secretos solo los usa el proceso automático que prepara la base de datos.

En el repositorio de GitHub, vaya a Settings → Secrets and variables → Actions.
Pulse New repository secret y cree dos secretos:
Name (exactamente así)	Secret (el valor)
DATABASE_URL_DIRECT	La URL directa de Neon (paso 1)
SEED_PASSWORD	La clave SEED_PASSWORD (paso 0)
6. Paso 3 · Crear las tablas y cargar los datos demo
En GitHub, abra la pestaña Actions.
En la lista de la izquierda, elija Base de datos.
Si no aparece, el archivo base-de-datos.yml todavía no está en la rama principal del repositorio. Hay que fusionar a main el cambio que lo trae.
Pulse Run workflow.
Rama: main.
Marque la casilla Cargar también los datos de demostración.
Pulse el botón verde Run workflow.
Espere 1 o 2 minutos hasta ver una marca verde ✓.
Abra la ejecución y revise que el final del registro diga algo parecido a "Semillas listas: 50 libros…".

Quedan creados tres usuarios de demostración:

Correo	Rol
admin@clena.example	Administración
personal@clena.example	Personal de la biblioteca
publico@clena.example	Visitante

Todos usan la contraseña SEED_PASSWORD. Esta carga se puede repetir sin duplicar datos. La contraseña de un usuario que ya existe no cambia si más adelante se cambia el secreto.

7. Paso 4 · Publicar el backend en Vercel
En Vercel, pulse Add New… → Project y elija el repositorio del CLENA.
Antes de pulsar Deploy, configure:
Project Name: clena-api (o el que prefieran).
Root Directory: pulse Edit y elija la carpeta backend.
Framework Preset: debe detectar NestJS automáticamente. Si no, déjelo en el valor que proponga.
Abra la sección Environment Variables y agregue estas (una por una):
Name	Valor
NODE_ENV	production
DATABASE_URL	La URL directa de Neon (paso 1)
JWT_ACCESS_SECRET	La clave JWT_ACCESS_SECRET (paso 0)
CORS_ORIGIN	http://localhost:5173 (provisional; se cambia en el paso 6)
ALERTAS_ACTIVAS	false
LOG_LEVEL	info
Pulse Deploy y espere a que termine.
Copie la dirección pública que le asigna Vercel. Se ve algo como https://clena-api.vercel.app.
Pruebe: abra en el navegador https://clena-api.vercel.app/health. Debe mostrar una respuesta de estado sin errores. Después abra …/docs: debe verse la documentación de la API.

Si /health da error, no continúe. Vaya a la sección 13 (Si algo falla).

8. Paso 5 · Publicar el frontend en Vercel
En Vercel, pulse otra vez Add New… → Project y elija el mismo repositorio.
Configure:
Project Name: clena-biblioteca (o el que prefieran).
Root Directory: Edit y elija la carpeta frontend.
Framework Preset: debe detectar Vite.
Agregue estas Environment Variables:
Name	Valor
VITE_API_BASE_URL	https://clena-api.vercel.app/api/v1 (la dirección del backend + /api/v1)
VITE_API_TIMEOUT_MS	20000
VITE_TERMINAL_NOMBRE	(opcional) nombre visible de la terminal, por ejemplo Sala General 04
VITE_TERMINAL_CODIGO	(opcional) código visible, por ejemplo T-04 (Piso 1)
Pulse Deploy y copie la dirección pública, por ejemplo https://clena-biblioteca.vercel.app.

Estas variables se aplican al construir la página. Si cambia una después, hay que redesplegar el frontend para que surta efecto.

9. Paso 6 · Decirle al backend cuál es el frontend

Sin este paso el navegador bloquea todas las peticiones y la página aparecerá sin datos.

En Vercel, abra el proyecto del backend → Settings → Environment Variables.
Edite CORS_ORIGIN y pegue la dirección del frontend:
https://clena-biblioteca.vercel.app
Sin barra final (/).
Con https:// al principio.
Si hubiera más de una dirección, sepárelas con coma.
Guarde y vaya a Deployments. En el último despliegue, abra el menú ⋯ y elija Redeploy. Los cambios de variables no se aplican hasta redesplegar.
10. Paso 7 · Pruebas finales

Abra la dirección del frontend y marque cada prueba:

[ ] La página de inicio carga y el pie de página no muestra "sin conexión".
[ ] Una búsqueda de libros (por ejemplo, "Programación") devuelve resultados.
[ ] Escribir a mano la dirección …/la-biblioteca y pulsar Enter carga la página (no da error 404).
[ ] Lo mismo con …/ayuda.
[ ] El inicio de sesión funciona con admin@clena.example y la SEED_PASSWORD.
[ ] La primera carga tras un rato sin uso puede tardar unos segundos extra. Es normal.
11. Paso 8 · Dejar las direcciones en el README

Edite README.md (sección Despliegue) y reemplace los marcadores <PEGAR-URL> por las direcciones reales:

Pieza	Dirección
Frontend	<PEGAR-URL>
API	<PEGAR-URL>
Estado de la API	<PEGAR-URL>/health
Documentación de la API	<PEGAR-URL>/docs
Base de datos	Sin dirección pública; se administra desde el panel de Neon

Con esto se cumplen los criterios de aceptación del despliegue:

[ ] Backend, frontend y base de datos desplegados; la URL está en el README.
[ ] Las variables de entorno están configuradas en el proveedor, no en el código.
[ ] Cada fusión a main despliega (ver la siguiente sección).
12. Qué pasa con cada fusión a main
El código se despliega solo. Vercel vigila la rama main: cada fusión actualiza el backend y el frontend. Si lo prefiere, compruebe en Vercel → Settings → Git que Production Branch sea main, en los dos proyectos.
Las migraciones de la base de datos se aplican solas cuando la fusión cambia archivos de backend/prisma/ (el proceso Base de datos de la pestaña Actions).
Las ramas y los pull requests no afectan la versión publicada. Vercel crea vistas previas, pero esas vistas no pueden consultar la API porque la API solo acepta la dirección de producción del frontend.
Los datos demo no se vuelven a cargar solos. Solo si alguien ejecuta a mano el proceso Base de datos con la casilla marcada.
13. Si algo falla
Qué se ve	Causa probable	Qué hacer
El proceso Base de datos falla con "Falta el secreto…"	El secreto no existe o tiene otro nombre	Revisar los nombres exactos en el paso 2
Falla con error de conexión o de autenticación	La URL de Neon está mal copiada	Copiar de nuevo la URL directa (sin -pooler, con ?sslmode=require)
Falla con un error sobre una extensión (pg_trgm, unaccent)	La base de datos no permite esas extensiones	Avisar al equipo de desarrollo con una captura del registro
/health del backend da error 500	Falta una variable o la URL de la base es incorrecta	En Vercel, proyecto del backend, pestaña Logs: el mensaje indica qué variable falta (por ejemplo, JWT_ACCESS_SECRET con menos de 32 caracteres)
El frontend carga pero sin datos, y la consola del navegador dice "CORS"	CORS_ORIGIN no coincide con la dirección del frontend	Revisar que sea idéntica: https://, sin barra final. Luego redesplegar el backend
El frontend carga pero dice "sin conexión"	VITE_API_BASE_URL incorrecta	Verificar que termine en /api/v1; luego redesplegar el frontend
/la-biblioteca da error 404 al escribirla a mano	vercel.json no está en la carpeta frontend de main	Comprobar que existe y redesplegar
Vercel pide iniciar sesión para ver la página	La protección de despliegues está activa	En Vercel → Settings → Deployment Protection, desactivarla para el proyecto, o usar la dirección de producción del proyecto
El inicio de sesión demo falla	Los datos demo no se cargaron, o la contraseña es otra	Repetir el paso 3 con la casilla marcada. Recuerde que un usuario existente conserva su contraseña original
La primera consulta del día es lenta	La base de datos gratuita "duerme" tras un rato sin uso	Es normal; la segunda consulta ya es rápida
14. Plan B: si el backend no funciona en Vercel

Si, después de revisar los registros, el backend no responde correctamente en Vercel, se puede publicar en Render (también gratuito) usando la misma base de datos de Neon. El frontend y Neon no cambian.

En Render: New → Web Service y conectar el repositorio.
Configuración: Runtime: Docker, Root Directory: backend, Instance Type: Free, Health Check Path: /health.
Variables: las mismas del paso 4, más SEED_DEMO=false (los datos ya se cargaron con el paso 3).
Copiar la dirección pública (https://….onrender.com) y cambiar VITE_API_BASE_URL del frontend por https://….onrender.com/api/v1. Redesplegar el frontend.
Poner en CORS_ORIGIN (en Render) la dirección del frontend.

Con Render, el servidor gratuito se apaga tras unos 15 minutos sin tráfico y tarda alrededor de un minuto en responder la primera vez. VITE_API_TIMEOUT_MS debe estar en 60000.

15. Seguridad: lo que no se debe hacer
No pegar contraseñas ni la URL de la base de datos en el chat del equipo, en el código, en issues ni en el README.
No subir archivos .env al repositorio.
No compartir la contraseña de los usuarios demo con personas ajenas al proyecto: admin@clena.example tiene permisos de administración.
Si alguna clave se publicó por accidente, cámbiela de inmediato (genere una nueva, actualice el valor en Vercel o GitHub y redespliegue).
Las alertas de devolución por correo (HU-29) quedan desactivadas en este despliegue (ALERTAS_ACTIVAS=false).
16. Resumen de variables
Dónde	Nombre	Para qué sirve
GitHub (Secrets)	DATABASE_URL_DIRECT	URL directa de Neon, para crear las tablas
GitHub (Secrets)	SEED_PASSWORD	Contraseña de los usuarios demo
Vercel · backend	NODE_ENV	production
Vercel · backend	DATABASE_URL	URL directa de Neon
Vercel · backend	JWT_ACCESS_SECRET	Firma de sesiones (mínimo 32 caracteres)
Vercel · backend	CORS_ORIGIN	Dirección del frontend, sin barra final
Vercel · backend	ALERTAS_ACTIVAS	false
Vercel · backend	LOG_LEVEL	info
Vercel · frontend	VITE_API_BASE_URL	Dirección del backend + /api/v1
Vercel · frontend	VITE_API_TIMEOUT_MS	Tiempo de espera de la API en milisegundos (20000)
Vercel · frontend	VITE_TERMINAL_NOMBRE / VITE_TERMINAL_CODIGO	Opcionales: nombre y código visibles de la terminal