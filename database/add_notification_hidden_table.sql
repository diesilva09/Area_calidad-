-- Migración para agregar tabla de mensajes ocultos/borrados por usuario
-- Esta tabla permite que cada usuario "borre" mensajes sin eliminarlos de la base de datos

-- Crear tabla para rastrear notificaciones ocultas por usuario
CREATE TABLE IF NOT EXISTS notificaciones.notification_hidden (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    notification_id INTEGER NOT NULL,
    hidden_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Restricción única para evitar duplicados
    CONSTRAINT unique_user_hidden_notification UNIQUE (user_id, notification_id)
);

-- Índice para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_notification_hidden_user_id 
ON notificaciones.notification_hidden(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_hidden_notification_id 
ON notificaciones.notification_hidden(notification_id);

-- Comentarios de documentación
COMMENT ON TABLE notificaciones.notification_hidden IS 'Registra notificaciones ocultas/borradas por cada usuario. El mensaje permanece en la BD pero no se muestra al usuario que lo borró.';
COMMENT ON COLUMN notificaciones.notification_hidden.user_id IS 'ID del usuario que ocultó la notificación';
COMMENT ON COLUMN notificaciones.notification_hidden.notification_id IS 'ID de la notificación oculta';
COMMENT ON COLUMN notificaciones.notification_hidden.hidden_at IS 'Fecha y hora cuando el usuario ocultó la notificación';
