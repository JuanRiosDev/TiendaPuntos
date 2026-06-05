-- ============================================================
--  Consultas, Vistas, Procedimientos, Triggers y Funciones
--  Tienda de Puntos · Base de datos: railway  (MySQL 8+)
-- ============================================================


-- ── 1. Listado completo de estudiantes con su grado ──────────
--  JOIN simple entre ESTUDIANTE y sqlGRADO
SELECT
    e.id_estudiante,
    e.nombre,
    e.apellido,
    e.documento,
    g.nombre              AS grado,
    g.nivel,
    e.puntos_disponibles,
    e.puntos_acumulados
FROM ESTUDIANTE e
JOIN sqlGRADO g ON g.id_grado = e.id_grado
WHERE e.activo = TRUE
ORDER BY g.nivel, e.apellido, e.nombre;


-- ── 2. Ranking de estudiantes por puntos acumulados ──────────
--  Función de ventana RANK() para generar posición
SELECT
    RANK() OVER (ORDER BY puntos_acumulados DESC) AS posicion,
    nombre,
    apellido,
    puntos_acumulados,
    puntos_disponibles
FROM ESTUDIANTE
WHERE activo = TRUE;


-- ── 3. Resumen de transacciones por tipo y grado ─────────────
--  JOIN múltiple + GROUP BY + SUM
SELECT
    g.nombre              AS grado,
    t.tipo,
    COUNT(*)              AS total_transacciones,
    SUM(t.puntos)         AS puntos_movidos
FROM TRANSACCION t
JOIN ESTUDIANTE e ON e.id_estudiante = t.id_estudiante
JOIN sqlGRADO   g ON g.id_grado     = e.id_grado
GROUP BY g.id_grado, g.nombre, t.tipo
ORDER BY g.nivel, t.tipo;


-- ── 4. Artículos más canjeados ────────────────────────────────
--  JOIN entre DETALLE_CANJE, CANJE y ARTICULO + GROUP BY
SELECT
    a.nombre              AS articulo,
    a.precio_puntos,
    SUM(d.cantidad)       AS unidades_canjeadas,
    SUM(d.puntos_total)   AS puntos_totales_usados
FROM DETALLE_CANJE d
JOIN CANJE   c ON c.id_canje   = d.id_canje
JOIN ARTICULO a ON a.id_articulo = d.id_articulo
WHERE c.estado = 'completado'
GROUP BY a.id_articulo, a.nombre, a.precio_puntos
ORDER BY unidades_canjeadas DESC;


-- ── 5. Estudiantes que NUNCA han hecho un canje ──────────────
--  Subconsulta con NOT IN
SELECT
    e.id_estudiante,
    e.nombre,
    e.apellido,
    e.puntos_disponibles
FROM ESTUDIANTE e
WHERE e.id_estudiante NOT IN (
    SELECT DISTINCT t.id_estudiante
    FROM TRANSACCION t
    WHERE t.tipo = 'descuento'
)
  AND e.activo = TRUE;


-- ── 6. Grados con promedio de puntos acumulados > 100 ────────
--  GROUP BY + HAVING para filtrar grupos
SELECT
    g.nombre              AS grado,
    g.nivel,
    COUNT(e.id_estudiante) AS estudiantes,
    AVG(e.puntos_acumulados) AS promedio_acumulados,
    SUM(e.puntos_disponibles) AS total_disponibles
FROM sqlGRADO g
JOIN ESTUDIANTE e ON e.id_grado = g.id_grado
WHERE e.activo = TRUE
GROUP BY g.id_grado, g.nombre, g.nivel
HAVING AVG(e.puntos_acumulados) > 100
ORDER BY promedio_acumulados DESC;


-- ── 7. Historial completo de movimientos de un estudiante ────
--  CASE WHEN para etiquetar el tipo de movimiento
SELECT
    b.fecha,
    CASE
        WHEN b.puntos_despues > b.puntos_antes THEN '▲ Suma'
        WHEN b.puntos_despues < b.puntos_antes THEN '▼ Resta'
        ELSE '= Igual'
    END                   AS movimiento,
    ABS(b.puntos_despues - b.puntos_antes) AS puntos_cambiados,
    b.puntos_antes,
    b.puntos_despues,
    b.motivo,
    CONCAT(r.nombre, ' ', r.apellido) AS responsable
FROM BITACORA_PUNTOS b
JOIN RESPONSABLE r ON r.id_responsable = b.id_responsable
WHERE b.id_estudiante = 1          -- ← cambia el id
ORDER BY b.fecha DESC;


-- ── 8. Artículos con stock bajo o agotado ────────────────────
--  CASE WHEN para clasificar el nivel de stock
SELECT
    id_articulo,
    nombre,
    precio_puntos,
    stock_total,
    stock_disponible,
    CASE
        WHEN stock_disponible = 0            THEN 'Agotado'
        WHEN stock_disponible <= stock_total * 0.20 THEN 'Stock crítico'
        WHEN stock_disponible <= stock_total * 0.50 THEN 'Stock bajo'
        ELSE                                      'Disponible'
    END AS estado_stock
FROM ARTICULO
WHERE activo = TRUE
ORDER BY stock_disponible ASC;


-- ── 9. Canjes completos con todos los detalles ───────────────
--  JOIN de 5 tablas en una sola consulta
SELECT
    c.id_canje,
    c.fecha_canje,
    c.estado,
    CONCAT(e.nombre, ' ', e.apellido) AS estudiante,
    g.nombre                          AS grado,
    a.nombre                          AS articulo,
    d.cantidad,
    d.puntos_unitarios,
    d.puntos_total,
    CONCAT(r.nombre, ' ', r.apellido) AS atendido_por
FROM CANJE c
JOIN TRANSACCION t  ON t.id_transaccion = c.id_transaccion
JOIN ESTUDIANTE  e  ON e.id_estudiante  = t.id_estudiante
JOIN sqlGRADO    g  ON g.id_grado       = e.id_grado
JOIN DETALLE_CANJE d ON d.id_canje      = c.id_canje
JOIN ARTICULO    a  ON a.id_articulo    = d.id_articulo
JOIN RESPONSABLE r  ON r.id_responsable = t.id_responsable
ORDER BY c.fecha_canje DESC;


-- ── 10. Puntos asignados vs puntos gastados por estudiante ───
--  Subconsultas correlacionadas para comparar totales
SELECT
    e.nombre,
    e.apellido,
    e.puntos_acumulados,
    e.puntos_disponibles,
    (e.puntos_acumulados - e.puntos_disponibles) AS puntos_gastados,
    ROUND(
        (e.puntos_acumulados - e.puntos_disponibles)
        / NULLIF(e.puntos_acumulados, 0) * 100, 1
    )                                            AS pct_gastado
FROM ESTUDIANTE e
WHERE e.activo = TRUE
ORDER BY pct_gastado DESC;


-- ============================================================
--  VISTAS  (CREATE OR REPLACE VIEW)
-- ============================================================

-- ── V1. Vista: ranking general de estudiantes ────────────────
--  Muestra posición, grado y saldo en una sola consulta reutilizable
CREATE OR REPLACE VIEW v_ranking_estudiantes AS
SELECT
    RANK() OVER (ORDER BY e.puntos_acumulados DESC) AS posicion,
    e.id_estudiante,
    e.nombre,
    e.apellido,
    g.nombre              AS grado,
    g.nivel,
    e.puntos_disponibles,
    e.puntos_acumulados,
    (e.puntos_acumulados - e.puntos_disponibles) AS puntos_gastados
FROM ESTUDIANTE e
JOIN sqlGRADO g ON g.id_grado = e.id_grado
WHERE e.activo = TRUE;

-- Uso: SELECT * FROM v_ranking_estudiantes;
-- Uso: SELECT * FROM v_ranking_estudiantes WHERE grado = 'Primero';


-- ── V2. Vista: resumen de canjes por estudiante ──────────────
--  Agrega cuántos canjes hizo cada estudiante y cuántos puntos gastó
CREATE OR REPLACE VIEW v_resumen_canjes AS
SELECT
    e.id_estudiante,
    CONCAT(e.nombre, ' ', e.apellido) AS estudiante,
    g.nombre                          AS grado,
    COUNT(DISTINCT c.id_canje)        AS total_canjes,
    COALESCE(SUM(dc.puntos_total), 0) AS puntos_gastados_en_canjes
FROM ESTUDIANTE e
JOIN sqlGRADO g ON g.id_grado = e.id_grado
LEFT JOIN TRANSACCION t  ON t.id_estudiante  = e.id_estudiante AND t.tipo = 'descuento'
LEFT JOIN CANJE       c  ON c.id_transaccion = t.id_transaccion
LEFT JOIN DETALLE_CANJE dc ON dc.id_canje    = c.id_canje
WHERE e.activo = TRUE
GROUP BY e.id_estudiante, e.nombre, e.apellido, g.nombre;

-- Uso: SELECT * FROM v_resumen_canjes ORDER BY total_canjes DESC;


-- ── V3. Vista: inventario con estado de stock ────────────────
--  Clasifica automáticamente el nivel de stock de cada artículo
CREATE OR REPLACE VIEW v_inventario AS
SELECT
    id_articulo,
    nombre,
    descripcion,
    precio_puntos,
    stock_total,
    stock_disponible,
    (stock_total - stock_disponible) AS unidades_canjeadas,
    CASE
        WHEN stock_disponible = 0                        THEN 'Agotado'
        WHEN stock_disponible <= stock_total * 0.20      THEN 'Crítico'
        WHEN stock_disponible <= stock_total * 0.50      THEN 'Bajo'
        ELSE                                                  'Disponible'
    END AS estado_stock
FROM ARTICULO
WHERE activo = TRUE;

-- Uso: SELECT * FROM v_inventario WHERE estado_stock IN ('Agotado','Crítico');


-- ── V4. Vista: bitácora enriquecida ──────────────────────────
--  Une BITACORA_PUNTOS con nombres de estudiante y responsable
CREATE OR REPLACE VIEW v_bitacora AS
SELECT
    b.id_registro,
    b.fecha,
    CONCAT(e.nombre, ' ', e.apellido) AS estudiante,
    g.nombre                          AS grado,
    b.puntos_antes,
    b.puntos_despues,
    (b.puntos_despues - b.puntos_antes) AS diferencia,
    b.motivo,
    CONCAT(r.nombre, ' ', r.apellido) AS responsable,
    r.rol
FROM BITACORA_PUNTOS b
JOIN ESTUDIANTE  e ON e.id_estudiante  = b.id_estudiante
JOIN sqlGRADO    g ON g.id_grado       = e.id_grado
JOIN RESPONSABLE r ON r.id_responsable = b.id_responsable;

-- Uso: SELECT * FROM v_bitacora WHERE estudiante LIKE '%Juan%';


-- ============================================================
--  FUNCIONES  (DELIMITER cambia el terminador para MySQL CLI)
-- ============================================================
DELIMITER $$

-- ── F1. Función: calcular nivel de un estudiante ─────────────
--  Devuelve una etiqueta según sus puntos acumulados
DROP FUNCTION IF EXISTS fn_nivel_estudiante$$
CREATE FUNCTION fn_nivel_estudiante(p_puntos INT)
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
    DECLARE v_nivel VARCHAR(20);
    IF    p_puntos >= 1000 THEN SET v_nivel = 'Oro';
    ELSEIF p_puntos >= 500  THEN SET v_nivel = 'Plata';
    ELSEIF p_puntos >= 200  THEN SET v_nivel = 'Bronce';
    ELSE                         SET v_nivel = 'Básico';
    END IF;
    RETURN v_nivel;
END$$

-- Uso: SELECT nombre, puntos_acumulados, fn_nivel_estudiante(puntos_acumulados) AS nivel FROM ESTUDIANTE;


-- ── F2. Función: calcular puntos necesarios para subir nivel ─
--  Indica cuántos puntos le faltan al estudiante para el siguiente nivel
DROP FUNCTION IF EXISTS fn_puntos_para_subir$$
CREATE FUNCTION fn_puntos_para_subir(p_puntos INT)
RETURNS INT
DETERMINISTIC
BEGIN
    IF    p_puntos < 200  THEN RETURN 200  - p_puntos;
    ELSEIF p_puntos < 500  THEN RETURN 500  - p_puntos;
    ELSEIF p_puntos < 1000 THEN RETURN 1000 - p_puntos;
    ELSE                        RETURN 0;
    END IF;
END$$

-- Uso: SELECT nombre, puntos_acumulados,
--             fn_nivel_estudiante(puntos_acumulados) AS nivel_actual,
--             fn_puntos_para_subir(puntos_acumulados) AS puntos_faltantes
--      FROM ESTUDIANTE;


-- ── F3. Función: verificar si un artículo tiene stock ────────
--  Retorna TRUE/FALSE según la cantidad solicitada
DROP FUNCTION IF EXISTS fn_hay_stock$$
CREATE FUNCTION fn_hay_stock(p_id_articulo INT, p_cantidad INT)
RETURNS BOOLEAN
READS SQL DATA
BEGIN
    DECLARE v_stock INT DEFAULT 0;
    SELECT stock_disponible INTO v_stock
    FROM ARTICULO
    WHERE id_articulo = p_id_articulo AND activo = TRUE;
    RETURN v_stock >= p_cantidad;
END$$

-- Uso: SELECT nombre, fn_hay_stock(id_articulo, 3) AS puede_canjear_3
--      FROM ARTICULO;


-- ============================================================
--  PROCEDIMIENTOS ALMACENADOS
-- ============================================================

-- ── P1. Procedimiento: asignar puntos a un estudiante ────────
--  Inserta una TRANSACCION tipo 'asignacion'; el trigger actualiza ESTUDIANTE
DROP PROCEDURE IF EXISTS sp_asignar_puntos$$
CREATE PROCEDURE sp_asignar_puntos(
    IN p_id_estudiante  INT,
    IN p_id_responsable INT,
    IN p_puntos         INT,
    IN p_descripcion    VARCHAR(255)
)
BEGIN
    IF p_puntos <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Los puntos deben ser mayores a 0';
    END IF;
    INSERT INTO TRANSACCION (id_estudiante, id_responsable, tipo, puntos, descripcion)
    VALUES (p_id_estudiante, p_id_responsable, 'asignacion', p_puntos, p_descripcion);
    SELECT 'OK' AS resultado, p_puntos AS puntos_asignados;
END$$

-- Uso: CALL sp_asignar_puntos(3, 1, 75, 'Premio por examen');


-- ── P2. Procedimiento: canje completo con validación ─────────
--  Crea TRANSACCION + CANJE + DETALLE en una sola llamada atómica
DROP PROCEDURE IF EXISTS sp_realizar_canje$$
CREATE PROCEDURE sp_realizar_canje(
    IN p_id_estudiante  INT,
    IN p_id_responsable INT,
    IN p_id_articulo    INT,
    IN p_cantidad       INT
)
BEGIN
    DECLARE v_precio    INT DEFAULT 0;
    DECLARE v_stock     INT DEFAULT 0;
    DECLARE v_saldo     INT DEFAULT 0;
    DECLARE v_total     INT DEFAULT 0;
    DECLARE v_id_trans  INT;
    DECLARE v_id_canje  INT;

    -- Validar artículo
    SELECT precio_puntos, stock_disponible
    INTO   v_precio, v_stock
    FROM   ARTICULO
    WHERE  id_articulo = p_id_articulo AND activo = TRUE;

    IF v_precio IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Artículo no encontrado o inactivo';
    END IF;
    IF v_stock < p_cantidad THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuficiente';
    END IF;

    -- Validar saldo del estudiante
    SELECT puntos_disponibles INTO v_saldo
    FROM   ESTUDIANTE WHERE id_estudiante = p_id_estudiante;

    SET v_total = v_precio * p_cantidad;
    IF v_saldo < v_total THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Saldo insuficiente';
    END IF;

    -- Crear transacción y canje (los triggers actualizan puntos y stock)
    START TRANSACTION;
        INSERT INTO TRANSACCION (id_estudiante, id_responsable, tipo, puntos, descripcion)
        VALUES (p_id_estudiante, p_id_responsable, 'descuento', v_total,
                CONCAT('Canje: ', p_cantidad, ' unidad(es) artículo #', p_id_articulo));
        SET v_id_trans = LAST_INSERT_ID();

        INSERT INTO CANJE (id_transaccion, estado) VALUES (v_id_trans, 'completado');
        SET v_id_canje = LAST_INSERT_ID();

        INSERT INTO DETALLE_CANJE (id_canje, id_articulo, cantidad, puntos_unitarios, puntos_total)
        VALUES (v_id_canje, p_id_articulo, p_cantidad, v_precio, v_total);
    COMMIT;

    SELECT 'OK' AS resultado, v_id_canje AS id_canje, v_total AS puntos_descontados;
END$$

-- Uso: CALL sp_realizar_canje(1, 1, 2, 2);   -- estudiante 1 canjea 2 lapiceros


-- ── P3. Procedimiento: reporte de actividad por fecha ────────
--  Lista transacciones en un rango de fechas con nombre del estudiante
DROP PROCEDURE IF EXISTS sp_reporte_actividad$$
CREATE PROCEDURE sp_reporte_actividad(
    IN p_fecha_inicio DATE,
    IN p_fecha_fin    DATE
)
BEGIN
    SELECT
        t.id_transaccion,
        t.fecha,
        CONCAT(e.nombre, ' ', e.apellido) AS estudiante,
        g.nombre                          AS grado,
        t.tipo,
        t.puntos,
        t.descripcion,
        CONCAT(r.nombre, ' ', r.apellido) AS responsable
    FROM TRANSACCION t
    JOIN ESTUDIANTE  e ON e.id_estudiante  = t.id_estudiante
    JOIN sqlGRADO    g ON g.id_grado       = e.id_grado
    JOIN RESPONSABLE r ON r.id_responsable = t.id_responsable
    WHERE DATE(t.fecha) BETWEEN p_fecha_inicio AND p_fecha_fin
    ORDER BY t.fecha DESC;
END$$

-- Uso: CALL sp_reporte_actividad('2026-01-01', '2026-12-31');


-- ============================================================
--  TRIGGERS ADICIONALES
-- ============================================================

-- ── T1. Trigger: descontar stock al anular un canje ──────────
--  Cuando un canje pasa a 'anulado', devuelve el stock al artículo
DROP TRIGGER IF EXISTS trg_after_update_canje$$
CREATE TRIGGER trg_after_update_canje
AFTER UPDATE ON CANJE
FOR EACH ROW
BEGIN
    -- Solo actuar cuando el estado cambia A 'anulado'
    IF OLD.estado <> 'anulado' AND NEW.estado = 'anulado' THEN
        UPDATE ARTICULO a
        JOIN DETALLE_CANJE dc ON dc.id_articulo = a.id_articulo
        SET a.stock_disponible = a.stock_disponible + dc.cantidad
        WHERE dc.id_canje = NEW.id_canje;
    END IF;
END$$


-- ── T2. Trigger: registrar en bitácora cuando se anula un canje
--  Deja trazabilidad del ajuste de puntos al anular
DROP TRIGGER IF EXISTS trg_after_update_canje_bitacora$$
CREATE TRIGGER trg_after_update_canje_bitacora
AFTER UPDATE ON CANJE
FOR EACH ROW
BEGIN
    DECLARE v_id_est   INT;
    DECLARE v_id_resp  INT;
    DECLARE v_puntos   INT;
    DECLARE v_antes    INT;
    DECLARE v_despues  INT;

    IF OLD.estado <> 'anulado' AND NEW.estado = 'anulado' THEN
        -- Obtener datos de la transacción vinculada
        SELECT id_estudiante, id_responsable, puntos
        INTO   v_id_est, v_id_resp, v_puntos
        FROM   TRANSACCION WHERE id_transaccion = NEW.id_transaccion;

        -- Devolver puntos al estudiante
        SELECT puntos_disponibles INTO v_antes
        FROM ESTUDIANTE WHERE id_estudiante = v_id_est;

        SET v_despues = v_antes + v_puntos;
        UPDATE ESTUDIANTE
            SET puntos_disponibles = v_despues
            WHERE id_estudiante = v_id_est;

        -- Registrar en bitácora
        INSERT INTO BITACORA_PUNTOS
            (id_estudiante, id_responsable, puntos_antes, puntos_despues, motivo)
        VALUES
            (v_id_est, v_id_resp, v_antes, v_despues,
             CONCAT('Anulación de canje #', NEW.id_canje));
    END IF;
END$$

DELIMITER ;


-- ============================================================
--  CONSULTAS DE PRUEBA PARA VERIFICAR TODO
-- ============================================================

-- Verificar vistas
SELECT * FROM v_ranking_estudiantes;
SELECT * FROM v_resumen_canjes;
SELECT * FROM v_inventario;
SELECT * FROM v_bitacora LIMIT 10;

-- Verificar funciones
SELECT
    nombre,
    apellido,
    puntos_acumulados,
    fn_nivel_estudiante(puntos_acumulados)  AS nivel,
    fn_puntos_para_subir(puntos_acumulados) AS puntos_faltantes
FROM ESTUDIANTE WHERE activo = TRUE;

-- Verificar procedimientos
CALL sp_asignar_puntos(4, 1, 100, 'Premio primer canje');
CALL sp_realizar_canje(4, 1, 2, 5);        -- Luisa canjea 5 lapiceros
CALL sp_reporte_actividad('2026-01-01', '2026-12-31');
