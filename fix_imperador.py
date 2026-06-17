import sqlite3

def expurgar_pocoes_velhas():
    # Conecta ao Monólito
    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()

    # Deleta APENAS as poções que usam "HP" ou "MP" (as versões antigas)
    cursor.execute("DELETE FROM loja WHERE tipo = 'pocao' AND (descricao LIKE '%HP%' OR descricao LIKE '%MP%')")

    # Conta quantas foram destruídas
    linhas_apagadas = cursor.rowcount
    
    # Salva e fecha
    conn.commit()
    conn.close()

    print(f"\n Expurgo concluído! {linhas_apagadas} poções obsoletas foram vaporizadas das Sombras.")

if __name__ == '__main__':
    expurgar_pocoes_velhas()