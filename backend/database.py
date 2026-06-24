import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'store.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Создаем таблицы
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            img TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            price REAL NOT NULL,
            desc TEXT NOT NULL,
            img TEXT NOT NULL
        )
    ''')
    
    # Проверяем, есть ли уже данные
    cursor.execute("SELECT COUNT(*) FROM categories")
    if cursor.fetchone()[0] == 0:
        seed_data(cursor)
        
    conn.commit()
    conn.close()
    print("Database initialized successfully.")

def seed_data(cursor):
    categories = [
        ('Бакалея', 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=200&q=80'),
        ('Сыры для еды', 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=200&q=80'),
        ('Сыры с плесенью', 'https://images.unsplash.com/photo-1629824641323-eb19cb8d9e2c?auto=format&fit=crop&w=200&q=80'),
        ('Козьи и овечьи сыры', 'https://images.unsplash.com/photo-1628186591016-f38f7129f12b?auto=format&fit=crop&w=200&q=80')
    ]
    cursor.executemany("INSERT INTO categories (name, img) VALUES (?, ?)", categories)
    
    products = [
        ("Масло Beurre d'Isigny", 2500, "Изысканное французское сливочное масло с защищённым наименованием происхождения.", "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80"),
        ("Печенье Савоярди", 750, "Итальянское бисквитное печенье вытянутой плоской формы.", "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80"),
        ("Кантуччини с клюквой", 1200, "Традиционное итальянское сухое печенье с добавлением клюквы.", "https://images.unsplash.com/photo-1590080874088-eec64895e423?auto=format&fit=crop&w=400&q=80"),
        ("Таралли с чесноком", 650, "Итальянские сушки с чесноком и оливковым маслом.", "https://images.unsplash.com/photo-1600980489953-b452814b62db?auto=format&fit=crop&w=400&q=80")
    ]
    cursor.executemany("INSERT INTO products (title, price, desc, img) VALUES (?, ?, ?, ?)", products)

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

if __name__ == '__main__':
    init_db()
