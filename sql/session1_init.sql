

CREATE DATABASE IF NOT EXISTS tienda_puntos;
USE tienda_puntos;

-- -----------------------------------------------------
-- Tablas
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS sqlGRADO (
  id_grado INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  nivel INT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS RESPONSABLE (
  id_responsable INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  usuario VARCHAR(100) NOT NULL UNIQUE,
  contrasena_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin','docente','monitor') NOT NULL DEFAULT 'docente',
  activo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ESTUDIANTE (
  id_estudiante INT AUTO_INCREMENT PRIMARY KEY,
  id_grado INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  documento VARCHAR(50) NOT NULL UNIQUE,
  puntos_disponibles INT NOT NULL DEFAULT 0,
  puntos_acumulados INT NOT NULL DEFAULT 0,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_estudiante_grado FOREIGN KEY (id_grado) REFERENCES sqlGRADO(id_grado) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_puntos_disponibles CHECK (puntos_disponibles >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ARTICULO (
  id_articulo INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  precio_puntos INT NOT NULL,
  stock_total INT NOT NULL DEFAULT 0,
  stock_disponible INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_stock_disponible CHECK (stock_disponible >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS TRANSACCION (
  id_transaccion INT AUTO_INCREMENT PRIMARY KEY,
  id_estudiante INT NOT NULL,
  id_responsable INT NOT NULL,
  tipo ENUM('asignacion','descuento','ajuste') NOT NULL,
  puntos INT NOT NULL,
  descripcion VARCHAR(255),
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_transaccion_estudiante FOREIGN KEY (id_estudiante) REFERENCES ESTUDIANTE(id_estudiante) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_transaccion_responsable FOREIGN KEY (id_responsable) REFERENCES RESPONSABLE(id_responsable) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS CANJE (
  id_canje INT AUTO_INCREMENT PRIMARY KEY,
  id_transaccion INT NOT NULL UNIQUE,
  fecha_canje DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('pendiente','completado','anulado') NOT NULL DEFAULT 'pendiente',
  CONSTRAINT fk_canje_transaccion FOREIGN KEY (id_transaccion) REFERENCES TRANSACCION(id_transaccion) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS DETALLE_CANJE (
  id_detalle INT AUTO_INCREMENT PRIMARY KEY,
  id_canje INT NOT NULL,
  id_articulo INT NOT NULL,
  cantidad INT NOT NULL,
  puntos_unitarios INT NOT NULL,
  puntos_total INT GENERATED ALWAYS AS (cantidad * puntos_unitarios) STORED,
  CONSTRAINT fk_detalle_canje FOREIGN KEY (id_canje) REFERENCES CANJE(id_canje) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_detalle_articulo FOREIGN KEY (id_articulo) REFERENCES ARTICULO(id_articulo) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS BITACORA_PUNTOS (
  id_registro INT AUTO_INCREMENT PRIMARY KEY,
  id_estudiante INT NOT NULL,
  id_responsable INT NOT NULL,
  puntos_antes INT NOT NULL,
  puntos_despues INT NOT NULL,
  motivo VARCHAR(255) NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bitacora_estudiante FOREIGN KEY (id_estudiante) REFERENCES ESTUDIANTE(id_estudiante) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_bitacora_responsable FOREIGN KEY (id_responsable) REFERENCES RESPONSABLE(id_responsable) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Triggers
-- -----------------------------------------------------

DELIMITER $$

-- Trigger: sincroniza puntos cuando se inserta una TRANSACCION
CREATE TRIGGER trg_after_insert_transaccion
AFTER INSERT ON TRANSACCION
FOR EACH ROW
BEGIN
  DECLARE v_puntos_antes INT DEFAULT 0;
  DECLARE v_puntos_despues INT DEFAULT 0;

  SELECT puntos_disponibles INTO v_puntos_antes FROM ESTUDIANTE WHERE id_estudiante = NEW.id_estudiante FOR UPDATE;

  IF NEW.tipo IN ('asignacion','ajuste') THEN
    SET v_puntos_despues = v_puntos_antes + NEW.puntos;
    UPDATE ESTUDIANTE SET puntos_disponibles = v_puntos_despues, puntos_acumulados = puntos_acumulados + NEW.puntos WHERE id_estudiante = NEW.id_estudiante;
  ELSEIF NEW.tipo = 'descuento' THEN
    SET v_puntos_despues = v_puntos_antes - NEW.puntos;
    IF v_puntos_despues < 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Saldo insuficiente: puntos_disponibles no puede quedar negativo';
    END IF;
    UPDATE ESTUDIANTE SET puntos_disponibles = v_puntos_despues WHERE id_estudiante = NEW.id_estudiante;
  END IF;

  INSERT INTO BITACORA_PUNTOS (id_estudiante, id_responsable, puntos_antes, puntos_despues, motivo, fecha)
  VALUES (NEW.id_estudiante, NEW.id_responsable, v_puntos_antes, v_puntos_despues, CONCAT('TRANSACCION ', NEW.tipo, ': ', IFNULL(NEW.descripcion,'')), NEW.fecha);
END$$

-- Trigger: congelar precio unitario al insertar DETALLE_CANJE si no viene dado
CREATE TRIGGER trg_before_insert_detalle_canje
BEFORE INSERT ON DETALLE_CANJE
FOR EACH ROW
BEGIN
  IF NEW.puntos_unitarios IS NULL OR NEW.puntos_unitarios = 0 THEN
    SELECT precio_puntos INTO @pu FROM ARTICULO WHERE id_articulo = NEW.id_articulo;
    SET NEW.puntos_unitarios = IFNULL(@pu, 0);
  END IF;
END$$

-- Trigger: actualizar stock al insertar DETALLE_CANJE
CREATE TRIGGER trg_after_insert_detalle_canje
AFTER INSERT ON DETALLE_CANJE
FOR EACH ROW
BEGIN
  DECLARE v_stock INT;
  SELECT stock_disponible INTO v_stock FROM ARTICULO WHERE id_articulo = NEW.id_articulo FOR UPDATE;
  IF v_stock - NEW.cantidad < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuficiente: stock_disponible no puede quedar negativo';
  END IF;
  UPDATE ARTICULO SET stock_disponible = stock_disponible - NEW.cantidad WHERE id_articulo = NEW.id_articulo;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- Datos de prueba
-- -----------------------------------------------------

-- Grados
INSERT INTO sqlGRADO (nombre, nivel) VALUES
('Primero', 1),
('Segundo', 2);

-- Responsable admin (contrasena_hash generada de ejemplo: 'adminpass' hashed)

INSERT INTO RESPONSABLE (nombre, apellido, usuario, contrasena_hash, rol, activo)
VALUES ('Admin', 'Principal', 'admin', '$2b$10$EXAMPLEHASHADMINPASSWORD', 'admin', TRUE);

-- Estudiantes (5)
INSERT INTO ESTUDIANTE (id_grado, nombre, apellido, documento, puntos_disponibles, puntos_acumulados, activo)
VALUES
(1, 'Juan', 'Pérez', '1001', 500, 500, TRUE),
(1, 'María', 'Gómez', '1002', 300, 300, TRUE),
(2, 'Carlos', 'Ruiz', '1003', 150, 150, TRUE),
(2, 'Luisa', 'Martínez', '1004', 0, 0, TRUE),
(1, 'Ana', 'López', '1005', 50, 50, TRUE);

-- Artículos (4)
INSERT INTO ARTICULO (nombre, descripcion, precio_puntos, stock_total, stock_disponible, activo) VALUES
('Cuaderno', 'Cuaderno escolar tamaño carta', 50, 20, 20, TRUE),
('Lapicero', 'Lapicero azul', 10, 100, 100, TRUE),
('Tarjeta de salida', 'Permiso especial para salida anticipada', 200, 10, 10, TRUE),
('Pelota', 'Pelota deportiva', 150, 5, 5, TRUE);

-- Ejemplo de TRANSACCION de asignación (no necesario crear canje)
INSERT INTO TRANSACCION (id_estudiante, id_responsable, tipo, puntos, descripcion)
VALUES (1, 1, 'asignacion', 100, 'Bonificación por participación');

-- Ejemplo de CANJE completo con DETALLE_CANJE (demuestra atomicidad en aplicación):
-- Nota: lo ideal es que la aplicación cree TRANSACCION + CANJE + DETALLE_CANJE dentro de la misma transacción DB.
START TRANSACTION;
  INSERT INTO TRANSACCION (id_estudiante, id_responsable, tipo, puntos, descripcion)
    VALUES (2, 1, 'descuento', 50, 'Canje por cuaderno');
  SET @last_trans = LAST_INSERT_ID();
  INSERT INTO CANJE (id_transaccion, estado) VALUES (@last_trans, 'completado');
  SET @last_canje = LAST_INSERT_ID();
  INSERT INTO DETALLE_CANJE (id_canje, id_articulo, cantidad, puntos_unitarios) VALUES (@last_canje, 1, 1, 50);
COMMIT;

-- Fin del script
