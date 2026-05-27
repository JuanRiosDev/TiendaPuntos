require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error('DATABASE_URL no definida'); process.exit(1); }

// Parsea mysql://user:pass@host:port/db
function parseUrl(url) {
  const m = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!m) throw new Error('DATABASE_URL inválida: ' + url);
  return { user: m[1], password: m[2], host: m[3], port: parseInt(m[4]), database: m[5] };
}

async function run(conn, sql, label) {
  await conn.query(sql);
  if (label) console.log('✓', label);
}

async function main() {
  console.log('\n=== Seed TiendaPuntos ===\n');
  const conn = await mysql.createConnection({ ...parseUrl(DB_URL), multipleStatements: false });

  try {
    // ── Triggers ──────────────────────────────────────────────────────────────
    await run(conn, `DROP TRIGGER IF EXISTS trg_after_insert_transaccion`);
    await run(conn, `DROP TRIGGER IF EXISTS trg_before_insert_detalle_canje`);
    await run(conn, `DROP TRIGGER IF EXISTS trg_after_insert_detalle_canje`);
    console.log('✓ Triggers anteriores eliminados');

    await run(conn, `
      CREATE TRIGGER trg_after_insert_transaccion
      AFTER INSERT ON TRANSACCION
      FOR EACH ROW
      BEGIN
        DECLARE v_antes INT DEFAULT 0;
        DECLARE v_despues INT DEFAULT 0;
        SELECT puntos_disponibles INTO v_antes
          FROM ESTUDIANTE WHERE id_estudiante = NEW.id_estudiante FOR UPDATE;
        IF NEW.tipo IN ('asignacion','ajuste') THEN
          SET v_despues = v_antes + NEW.puntos;
          UPDATE ESTUDIANTE
            SET puntos_disponibles = v_despues,
                puntos_acumulados  = puntos_acumulados + NEW.puntos
            WHERE id_estudiante = NEW.id_estudiante;
        ELSEIF NEW.tipo = 'descuento' THEN
          SET v_despues = v_antes - NEW.puntos;
          IF v_despues < 0 THEN
            SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'Saldo insuficiente: puntos_disponibles no puede quedar negativo';
          END IF;
          UPDATE ESTUDIANTE
            SET puntos_disponibles = v_despues
            WHERE id_estudiante = NEW.id_estudiante;
        END IF;
        INSERT INTO BITACORA_PUNTOS
          (id_estudiante, id_responsable, puntos_antes, puntos_despues, motivo, fecha)
        VALUES
          (NEW.id_estudiante, NEW.id_responsable, v_antes, v_despues,
           CONCAT('TRANSACCION ', NEW.tipo, ': ', IFNULL(NEW.descripcion, '')), NEW.fecha);
      END
    `, 'Trigger trg_after_insert_transaccion');

    await run(conn, `
      CREATE TRIGGER trg_before_insert_detalle_canje
      BEFORE INSERT ON DETALLE_CANJE
      FOR EACH ROW
      BEGIN
        IF NEW.puntos_unitarios IS NULL OR NEW.puntos_unitarios = 0 THEN
          SELECT precio_puntos INTO @pu FROM ARTICULO WHERE id_articulo = NEW.id_articulo;
          SET NEW.puntos_unitarios = IFNULL(@pu, 0);
        END IF;
        SET NEW.puntos_total = NEW.cantidad * NEW.puntos_unitarios;
      END
    `, 'Trigger trg_before_insert_detalle_canje');

    await run(conn, `
      CREATE TRIGGER trg_after_insert_detalle_canje
      AFTER INSERT ON DETALLE_CANJE
      FOR EACH ROW
      BEGIN
        DECLARE v_stock INT;
        SELECT stock_disponible INTO v_stock
          FROM ARTICULO WHERE id_articulo = NEW.id_articulo FOR UPDATE;
        IF v_stock - NEW.cantidad < 0 THEN
          SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Stock insuficiente: stock_disponible no puede quedar negativo';
        END IF;
        UPDATE ARTICULO
          SET stock_disponible = stock_disponible - NEW.cantidad
          WHERE id_articulo = NEW.id_articulo;
      END
    `, 'Trigger trg_after_insert_detalle_canje');

    // ── Datos ──────────────────────────────────────────────────────────────────
    await run(conn, `
      INSERT IGNORE INTO sqlGRADO (id_grado, nombre, nivel) VALUES
        (1, 'Primero', 1), (2, 'Segundo', 2)
    `, 'Grados');

    await run(conn, `
      INSERT IGNORE INTO RESPONSABLE (id_responsable, nombre, apellido, usuario, contrasena_hash, rol, activo)
      VALUES (1, 'Admin', 'Principal', 'admin', '$2b$10$EXAMPLEHASHADMINPASSWORD', 'admin', TRUE)
    `, 'Responsable admin');

    // Puntos insertados directamente (sin disparar trigger de TRANSACCION)
    await run(conn, `
      INSERT IGNORE INTO ESTUDIANTE (id_estudiante, id_grado, nombre, apellido, documento, puntos_disponibles, puntos_acumulados, activo)
      VALUES
        (1, 1, 'Juan',   'Pérez',    '1001', 500, 500, TRUE),
        (2, 1, 'María',  'Gómez',    '1002', 300, 300, TRUE),
        (3, 2, 'Carlos', 'Ruiz',     '1003', 150, 150, TRUE),
        (4, 2, 'Luisa',  'Martínez', '1004',   0,   0, TRUE),
        (5, 1, 'Ana',    'López',    '1005',  50,  50, TRUE)
    `, 'Estudiantes (5)');

    await run(conn, `
      INSERT IGNORE INTO ARTICULO (id_articulo, nombre, descripcion, precio_puntos, stock_total, stock_disponible, activo)
      VALUES
        (1, 'Cuaderno',          'Cuaderno escolar tamaño carta',           50,  20,  20, TRUE),
        (2, 'Lapicero',          'Lapicero azul',                           10, 100, 100, TRUE),
        (3, 'Tarjeta de salida', 'Permiso especial para salida anticipada', 200,  10,  10, TRUE),
        (4, 'Pelota',            'Pelota deportiva',                        150,   5,   5, TRUE)
    `, 'Artículos (4)');

    // Transacción de asignación — trigger añade 100 pts a Juan (500→600 / acum 500→600)
    await run(conn, `
      INSERT IGNORE INTO TRANSACCION (id_transaccion, id_estudiante, id_responsable, tipo, puntos, descripcion)
      VALUES (1, 1, 1, 'asignacion', 100, 'Bonificación por participación')
    `, 'Transacción asignación Juan (+100 pts, trigger disparado)');

    // Canje ejemplo: María canjea 1 cuaderno (50 pts) — trigger descuenta 50 de 300→250
    await run(conn, `
      INSERT IGNORE INTO TRANSACCION (id_transaccion, id_estudiante, id_responsable, tipo, puntos, descripcion)
      VALUES (2, 2, 1, 'descuento', 50, 'Canje por cuaderno')
    `, 'Transacción descuento María (-50 pts, trigger disparado)');

    await run(conn, `
      INSERT IGNORE INTO CANJE (id_canje, id_transaccion, estado)
      VALUES (1, 2, 'completado')
    `, 'Canje creado');

    await run(conn, `
      INSERT IGNORE INTO DETALLE_CANJE (id_detalle, id_canje, id_articulo, cantidad, puntos_unitarios, puntos_total)
      VALUES (1, 1, 1, 1, 50, 50)
    `, 'Detalle canje (1 cuaderno)');

    console.log('\n✅ Seed completado. Estado final:');
    console.log('   Juan:   600 disponibles / 600 acumulados');
    console.log('   María:  250 disponibles / 300 acumulados');
    console.log('   Carlos: 150 disponibles / 150 acumulados');
    console.log('   Luisa:    0 disponibles /   0 acumulados');
    console.log('   Ana:     50 disponibles /  50 acumulados\n');

  } finally {
    await conn.end();
  }
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
