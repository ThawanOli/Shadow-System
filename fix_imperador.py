import sqlite3
import json

def restaurar_monarca():
    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()
    
    # Seus dados reais recuperados das imagens anteriores
    dados = {
        "username": "Thawan Oliveira",
        "nivel": 10,
        "xp": 425,
        "ouro": 828,
        "forca": 24,
        "agilidade": 28,
        "inteligencia": 22,
        "vitalidade": 37,
        "data_ultima_diaria": "2024-01-01", # Gatilho para a Centopeia
        "status_punicao": 1
    }

    try:
        # 1. Limpa qualquer lixo ou linha com nome vazio que esteja bugando o banco
        cursor.execute("DELETE FROM usuarios WHERE username IS NULL OR username = '' OR username = 'Thawan Oliveira'")
        
        # 2. Insere você novamente com os poderes corrigidos
        cursor.execute('''
            INSERT INTO usuarios (username, senha, nivel, xp, ouro, forca, agilidade, inteligencia, vitalidade, data_ultima_diaria, status_punicao, inventario)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            dados["username"], "senha123", dados["nivel"], dados["xp"], dados["ouro"],
            dados["forca"], dados["agilidade"], dados["inteligencia"], dados["vitalidade"],
            dados["data_ultima_diaria"], dados["status_punicao"], '[]'
        ))
        
        conn.commit()
        print(f"✅ [SISTEMA] Nível {dados['nivel']} restaurado para {dados['username']}!")
        print("👾 Data setada para 2024. A Centopeia será invocada no próximo login.")
        
    except sqlite3.Error as e:
        print(f"❌ Erro no Monólito: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    restaurar_monarca()