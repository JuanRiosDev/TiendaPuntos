-- Consultas basicas para Tienda de Puntos
-- Cambia los valores de ejemplo segun necesites

-- 1) Listado de estudiantes con grado
SELECT e.id_estudiante, e.nombre, e.apellido, e.documento, e.puntos_disponibles, g.nombre AS grado, g.nivel
FROM ESTUDIANTE e
JOIN sqlGRADO g ON g.id_grado = e.id_grado
ORDER BY g.nivel, e.apellido, e.nombre;

-- 2) Top 5 estudiantes por puntos acumulados
SELECT id_estudiante, nombre, apellido, puntos_acumulados
FROM ESTUDIANTE
ORDER BY puntos_acumulados DESC
LIMIT 5;

-- 3) Articulos disponibles (activos con stock)
SELECT id_articulo, nombre, precio_puntos, stock_disponible
FROM ARTICULO
WHERE activo = TRUE AND stock_disponible > 0
ORDER BY precio_puntos ASC;

-- 4) Total de puntos acumulados por grado
SELECT g.nombre AS grado, g.nivel, COUNT(e.id_estudiante) AS total_estudiantes,
       SUM(e.puntos_acumulados) AS puntos_acumulados
FROM sqlGRADO g
LEFT JOIN ESTUDIANTE e ON e.id_grado = g.id_grado
GROUP BY g.id_grado, g.nombre, g.nivel
ORDER BY g.nivel;

-- 5) Resumen de transacciones por tipo
SELECT tipo, COUNT(*) AS total_transacciones, SUM(puntos) AS puntos_total
FROM TRANSACCION
GROUP BY tipo;

-- 6) Canjes con detalle de articulos (ultimos 10)
SELECT c.id_canje, c.fecha_canje, c.estado,
       a.nombre AS articulo, d.cantidad, d.puntos_unitarios, d.puntos_total
FROM CANJE c
JOIN DETALLE_CANJE d ON d.id_canje = c.id_canje
JOIN ARTICULO a ON a.id_articulo = d.id_articulo
ORDER BY c.fecha_canje DESC
LIMIT 10;

-- 7) Bitacora de un estudiante (reemplaza el id)
SELECT b.fecha, b.motivo, b.puntos_antes, b.puntos_despues
FROM BITACORA_PUNTOS b
WHERE b.id_estudiante = 1
ORDER BY b.fecha DESC
LIMIT 20;

-- 8) Articulos con stock bajo (umbral 5)
SELECT id_articulo, nombre, stock_disponible
FROM ARTICULO
WHERE stock_disponible <= 5
ORDER BY stock_disponible ASC;

-- -----------------------------------------------------
-- Ejemplos de transacciones (comentadas)
-- Nota: los triggers actualizan puntos y bitacora
-- Ajusta id_estudiante e id_responsable segun tus datos
-- -----------------------------------------------------

-- 9) Asignacion de puntos por buen desempeno
INSERT INTO TRANSACCION (id_estudiante, id_responsable, tipo, puntos, descripcion)
VALUES (1, 1, 'asignacion', 50, 'Buen desempeno en clase');

-- 10) Ajuste manual de puntos
INSERT INTO TRANSACCION (id_estudiante, id_responsable, tipo, puntos, descripcion)
VALUES (2, 1, 'ajuste', 20, 'Ajuste por actividad extra');

-- 11) Descuento por canje manual (sin detalle)
INSERT INTO TRANSACCION (id_estudiante, id_responsable, tipo, puntos, descripcion)
VALUES (3, 1, 'descuento', 30, 'Descuento por canje rapido');
