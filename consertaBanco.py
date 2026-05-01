import sqlite3

def adicionar_coluna():
    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE usuarios ADD COLUMN inventario TEXT DEFAULT '[]';")
        conn.commit()
        print("Coluna 'inventario' forjada com sucesso!")
    except sqlite3.OperationalError:
        print("A coluna já existe ou o arquivo não foi encontrado.")
    finally:
        conn.close()

if __name__ == "__main__":
    adicionar_coluna()