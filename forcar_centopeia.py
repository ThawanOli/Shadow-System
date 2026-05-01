import sqlite3

def ativar_punicao_direta():
    database = 'shadow_system.db'
    conn = sqlite3.connect(database)
    cursor = conn.cursor()

    # Data antiga e ativação do status de punição
    data_antiga = "2024-01-01"

    try:
        print("⚡ Forçando estado de punição no Monólito...")
        
        # 1. Alteramos a data_ultima_diaria
        # 2. Definimos status_punicao como 1 (Ativado)
        cursor.execute("""
            UPDATE usuarios 
            SET data_ultima_diaria = ?, 
                status_punicao = 1 
        """, (data_antiga,))
        
        conn.commit()
        print("✅ Status de punição: ATIVADO.")
        print("👾 Reinicie o servidor e abra o sistema.")
        
    except sqlite3.Error as e:
        print(f"❌ Erro: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    ativar_punicao_direta()