-- Ejemplo de datos para probar el autocompletado de pesos
-- Producto: 000123 (Aceituna) con diferentes tipos de envase

INSERT INTO producto_pesos_config 
(producto_id, envase_tipo, peso_drenado_declarado, peso_drenado_min, peso_drenado_max, 
 peso_neto_declarado) 
VALUES 
('000123', 'Vidrio', 450.00, 430.00, 470.00, 480.00),
('000123', 'PET', 420.00, 400.00, 440.00, 450.00),
('000123', 'Bolsa', 480.00, 460.00, 500.00, 500.00),
('000123', 'Lata', 460.00, 440.00, 480.00, 490.00);

-- Producto: 000234 (Salsa de Tomate) con diferentes tipos de envase
INSERT INTO producto_pesos_config 
(producto_id, envase_tipo, peso_drenado_declarado, peso_drenado_min, peso_drenado_max, 
 peso_neto_declarado) 
VALUES 
('000234', 'Vidrio', 350.00, 330.00, 370.00, 380.00),
('000234', 'PET', 320.00, 300.00, 340.00, 350.00),
('000234', 'Bolsa', 400.00, 380.00, 420.00, 420.00),
('000234', 'Lata', 380.00, 360.00, 400.00, 410.00);
