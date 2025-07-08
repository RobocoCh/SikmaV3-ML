import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
import pymysql.cursors

# --- Konfigurasi Database ---
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': '',
    'database': 'sikma_dbv3',
    'cursorclass': pymysql.cursors.DictCursor
}

app = Flask(__name__)
CORS(app)

def get_db_connection():
    try:
        conn = pymysql.connect(**DB_CONFIG)
        return conn
    except pymysql.MySQLError as e:
        print(f"!!! GAGAL KONEKSI KE DATABASE: {e} !!!")
        return None

# --- Fungsi Helper Baru ---
def get_structured_companies_data(conn):
    """
    Mengambil data perusahaan dengan kolom-kolom baru yang sudah terstruktur.
    """
    if conn is None:
        return []
    try:
        query = """
            SELECT
                c.id, c.name, c.description_short, c.logo_url, c.banner_image_url,
                cat.name AS category,
                ct.name AS type,
                c.required_programming_skills,
                c.required_frameworks,
                c.required_tools,
                c.relevant_education_majors
            FROM companies c
            LEFT JOIN company_categories cat ON c.category_id = cat.id
            LEFT JOIN company_types ct ON c.type_id = ct.id
            WHERE c.is_active = 1
        """
        with conn.cursor() as cur:
            cur.execute(query)
            results = cur.fetchall()
            # Decode kolom JSON
            for row in results:
                row['required_programming_skills'] = json.loads(row['required_programming_skills'] or '[]')
                row['required_frameworks'] = json.loads(row['required_frameworks'] or '[]')
                row['required_tools'] = json.loads(row['required_tools'] or '[]')
                row['relevant_education_majors'] = json.loads(row['relevant_education_majors'] or '[]')
            return results
    except Exception as e:
        print(f"Error getting structured company data: {e}")
        return []


# --- Endpoint Rekomendasi BARU ---
@app.route('/recommendations', methods=['POST'])
def get_recommendations():
    user_profile = request.json
    if not user_profile:
        return jsonify({'status': 'error', 'message': 'User profile tidak ada.'}), 400

    # Ekstrak data dari struktur profil yang sekarang lengkap
    user_industry = [item.get('industry_name') for item in user_profile.get('industryPreference', [])]
    user_education = user_profile.get('education', [])
    user_prog_skills = [item.get('skill_name') for item in user_profile.get('programmingSkill', [])]
    user_frameworks = [item.get('framework_name') for item in user_profile.get('framework', [])]
    user_tools = [item.get('tool_name') for item in user_profile.get('tool', [])]

    # Bobot Skor
    WEIGHTS = {
        'industry': 15,
        'education': 15,
        'prog_skill': 10,
        'framework': 10,
        'tool': 5
    }

    # 1. Hitung Skor Maksimal Mungkin User
    max_score = (len(user_industry) * WEIGHTS['industry']) + \
                (1 * WEIGHTS['education'] if user_education else 0) + \
                (len(user_prog_skills) * WEIGHTS['prog_skill']) + \
                (len(user_frameworks) * WEIGHTS['framework']) + \
                (len(user_tools) * WEIGHTS['tool'])

    if max_score == 0:
        return jsonify({'status': 'success', 'data': [], 'message': 'Profil user kosong, tidak ada rekomendasi.'})

    # 2. Ambil data perusahaan terstruktur
    conn = get_db_connection()
    all_companies = get_structured_companies_data(conn)
    if conn: conn.close()
    
    if not all_companies:
        return jsonify({'status': 'error', 'message': 'Tidak bisa mengambil data perusahaan.'})

    recommendations = []
    # 3. Looping & Hitung Skor Aktual untuk setiap perusahaan
    for company in all_companies:
        actual_score = 0
        
        # Pilar 1: Industri
        if user_industry and company.get('category') in user_industry:
            actual_score += WEIGHTS['industry']

        # Pilar 2: Pendidikan
        if user_education and company.get('relevant_education_majors'):
            # Ambil hanya pendidikan pertama dari user untuk pencocokan
            user_edu_first = user_education[0]
            user_edu_string = f"{user_edu_first.get('degree', '')} - {user_edu_first.get('field_of_study', '')}".strip(" -")
            
            for edu_req in company['relevant_education_majors']:
                if user_edu_first.get('field_of_study','').lower() in edu_req.lower() or user_edu_string.lower() in edu_req.lower():
                    actual_score += WEIGHTS['education']
                    break 

        # Pilar 3: Bahasa Pemrograman
        company_skills_set = set(s.lower() for s in company.get('required_programming_skills', []))
        for skill in user_prog_skills:
            if skill.lower() in company_skills_set:
                actual_score += WEIGHTS['prog_skill']

        # Pilar 4: Framework
        company_frameworks_set = set(f.lower() for f in company.get('required_frameworks', []))
        for framework in user_frameworks:
            if framework.lower() in company_frameworks_set:
                actual_score += WEIGHTS['framework']

        # Pilar 5: Tools
        company_tools_set = set(t.lower() for t in company.get('required_tools', []))
        for tool in user_tools:
            if tool.lower() in company_tools_set:
                actual_score += WEIGHTS['tool']
        
        if actual_score > 0:
            percentage = round((actual_score / max_score) * 100)
            if percentage > 100: percentage = 100
            
            recommendations.append({
                'id': company['id'],
                'name': company['name'],
                'category': company['category'],
                'type': company['type'],
                'description_short': company['description_short'],
                'logo_url': company['logo_url'],
                'banner_image_url': company['banner_image_url'],
                'match_percentage': percentage
            })

    # 4. Urutkan dan kirim hasil
    sorted_recommendations = sorted(recommendations, key=lambda x: x['match_percentage'], reverse=True)[:5]
    
    return jsonify({'status': 'success', 'data': sorted_recommendations})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)