CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    price FLOAT,
    stock INT DEFAULT 0
);

INSERT INTO products (name, price, stock) VALUES
    ("Mouse", 25.5, 10),
    ("Teclado", 45.0, 8),
    ("Monitor", 150.0, 5);