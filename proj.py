from flask import Flask, request, jsonify, send_file,Response
from flask_cors import CORS
import pandas as pd
import numpy as np
import io
from datetime import datetime
from pymongo import MongoClient
import uuid
import re
import base64
from bson import ObjectId
# from pdf_export import generate_pdf_report
import plotly.graph_objects as go
import plotly.express as px
import plotly.io as pio

app = Flask(__name__)
CORS(app)
client = MongoClient("mongodb://localhost:27017/")
db = client['heavy_metal_db']
samples_collection = db['samples']

METAL_KEYWORDS = {
    'Mercury': ['hg', 'mercury', 'hg_conc', 'mercury_conc', 'merc'],
    'Lead': ['pb', 'lead', 'pb_conc', 'lead_conc'],
    'Cadmium': ['cd', 'cadmium', 'cd_conc'],
    'Arsenic': ['as', 'arsenic', 'as_conc'],
    'Chromium': ['cr', 'chromium', 'cr_conc'],
    'Nickel': ['ni', 'nickel', 'ni_conc'],
    'Copper': ['cu', 'copper', 'cu_conc'],
    'Zinc': ['zn', 'zinc', 'zn_conc'],
    'Iron': ['fe', 'iron', 'fe_conc'],
    'Manganese': ['mn', 'manganese', 'mn_conc']
    }

def allowed_file(filename):
    return filename.lower().endswith(('.csv','.xls','.xlsx'))

def detect_metal_columns(df):
    metal_cols = {}
    for metal, keywords in METAL_KEYWORDS.items():
        found_cols = []
        for col in df.columns:
            col_clean = re.sub(r'[^a-z0-9]', '', col.lower())
            if any(re.sub(r'[^a-z0-9]', '', kw.lower()) in col_clean for kw in keywords):
                found_cols.append(col)
        if found_cols:
            metal_cols[metal] = found_cols
    return metal_cols

def merge_metal_columns(df, metal_cols):
    merged_df = df.copy()
    merged_cols = {}
    for metal, cols in metal_cols.items():
        if not cols:
            continue
        
        if len(cols) > 1:
            merged_df[metal] = merged_df[cols].sum(axis=1)
        else:
            merged_df[metal] = merged_df[cols[0]]
        merged_cols[metal] = metal 
    return merged_df, merged_cols


def validate_geo_columns(df):
    geo_cols = {}
    for col in ['Location', 'Latitude', 'Longitude']:
        matches = [c for c in df.columns if col.lower() in c.lower()]
        geo_cols[col] = matches[0] if matches else None
    return geo_cols

def handle_missing_values(df, metal_cols, strategy='half', detection_limits=None):
    df_clean = df.copy()
    for metal in metal_cols:
        if metal not in df_clean.columns:
            continue
        if strategy=='half':
            fill_val = 0.5*df_clean[metal].min() if detection_limits is None else 0.5*detection_limits.get(metal,0)
            df_clean[metal] = df_clean[metal].fillna(fill_val)

        elif strategy=='zero':
            df_clean[metal].fillna(0, inplace=True)
        elif strategy=='mean':
            df_clean[metal].fillna(df_clean[metal].mean(), inplace=True)
        elif strategy=='median':
            df_clean[metal].fillna(df_clean[metal].median(), inplace=True)
        elif strategy=='none':
            df_clean[metal] = df_clean[metal].astype(float)
    return df_clean

STANDARD_LIMITS = {
    "Mercury": 0.001,
    "Lead": 0.01,
    "Cadmium": 0.003,
    "Arsenic": 0.01,
    "Chromium": 0.05,
    "Nickel": 0.02,
    "Copper": 2.0,
    "Zinc": 3.0,
    "Iron": 0.3,
    "Manganese": 0.1
}
def compute_hmpi_vectorized(df, metal_cols):
    """
    Compute HMPI for a dataframe with metal concentrations.
    Uranium is included in HMPI calculation only if present in DataFrame.
    """
    df_hmpi = df.copy()

    
    valid_metals = {metal: col for metal, col in metal_cols.items() if metal in STANDARD_LIMITS and col in df_hmpi.columns}

    if not valid_metals:
        df_hmpi["HMPI"] = np.nan
        return df_hmpi

    Wi_total = sum(1 / STANDARD_LIMITS[metal] for metal in valid_metals)

    for metal, col in valid_metals.items():
        Si = STANDARD_LIMITS[metal]
        Ci = df_hmpi[col].copy()

        # Convert μg/L → mg/L if Ci is much higher than standard (heuristic)
        if (Ci > 100 * Si).any():
            Ci = Ci / 1000

        Qi = (Ci / Si) * 100
        Wi = (1 / Si) / Wi_total

        df_hmpi[f"{metal}_Qi"] = Qi
        df_hmpi[f"{metal}_Wi"] = Wi
        df_hmpi[f"{metal}_SIi"] = Qi * Wi

    # HMPI = sum of weighted indices (metals detected in dataset)
    si_columns = [f"{metal}_SIi" for metal in valid_metals]
    df_hmpi["HMPI"] = df_hmpi[si_columns].sum(axis=1)
    df_hmpi = df_hmpi.round(4)
    return df_hmpi

def load_file(file):
    """Reads CSV or Excel into pandas DataFrame"""
    if file.filename.lower().endswith('.csv'):
        return pd.read_csv(file)
    elif file.filename.lower().endswith(('.xls', '.xlsx')):
        return pd.read_excel(file)
    else:
        raise ValueError("Unsupported file format")

def preprocess_dataframe(df):
    metal_cols = detect_metal_columns(df)      
    df_merged, merged_cols = merge_metal_columns(df, metal_cols)  
    
    if 'Uranium' in merged_cols and 'Uranium' not in df_merged.columns:
        merged_cols.pop('Uranium')
    
    df_clean = handle_missing_values(df_merged, merged_cols, strategy="half")  
    geo_cols = validate_geo_columns(df_clean)  
    return df_clean, merged_cols



def prepare_geojson(df, geo_cols):
    if geo_cols.get('Latitude') and geo_cols.get('Longitude'):
        df_geo = df.copy()
        df_geo['geometry'] = df_geo.apply(
            lambda row: {"type": "Point", "coordinates": [row[geo_cols['Longitude']], row[geo_cols['Latitude']]]}
            if pd.notna(row[geo_cols['Longitude']]) and pd.notna(row[geo_cols['Latitude']])
            else None, axis=1)
        return df_geo
    return None


@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["file"]

    try:
        
        df = load_file(file)

        
        df_clean, merged_cols = preprocess_dataframe(df)
        df_hmpi = compute_hmpi_vectorized(df_clean, merged_cols)

       
        valid_metals_for_geo = [m for m in merged_cols if m in df_hmpi.columns]

        # Build GeoJSON features
        sample_counter = 1  
        features = []
        for _, row in df_hmpi.iterrows():
            metal_conc = {m: row[m] for m in valid_metals_for_geo if pd.notna(row[m])}
            latlon_flag = pd.notna(row.get("Latitude")) and pd.notna(row.get("Longitude"))

            # If no Sample_ID present in row, assign sequential ID like S1, S2...
            sample_id = row.get("Sample_ID")
            if pd.isna(sample_id) or sample_id == "":
                sample_id = f"S{sample_counter}"
                sample_counter += 1

            features.append({
                "Sample_ID": sample_id,
                "no_of_metals": len(metal_conc),
                "all_metal_conc": metal_conc,
                "geometry": {
                    "type": "Point",
                    "coordinates": [row.get("Longitude"), row.get("Latitude")]
                },
                "latitudeandlongitudepresent": latlon_flag,
                "HMPI": row.get("HMPI", None)
            })
        # Insert into uploads collection
        upload_doc = {
            "file_name": file.filename,
            "created_at": datetime.utcnow(),
            "GeoJSON": features
        }
        db.uploads.insert_one(upload_doc)

        return jsonify({"msg": "Upload saved successfully", "file_name": file.filename, "GeoJSON": features}), 201

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/history/<user_id>", methods=["GET"])
def user_history(user_id):
    pipeline = [
        {"$match": {"user_id": ObjectId(user_id)}},
        {"$lookup": {
            "from": "users",              
            "localField": "user_id",      # field in uploads
            "foreignField": "_id",        # field in users
            "as": "user_info"
        }},
        {"$unwind": "$user_info"}  # flatten array so user_info is a dict
    ]

    uploads = list(db.uploads.aggregate(pipeline))
    # convert ObjectId to string for JSON
    for u in uploads:
        u["_id"] = str(u["_id"])
        u["user_id"] = str(u["user_id"])
        u["user_info"]["_id"] = str(u["user_info"]["_id"])

    return jsonify(uploads)


@app.route("/register", methods=["POST"])
def register_user():
    name = request.json["name"]
    email = request.json["email"]

    user_doc = {"name": name, "email": email}
    result = db.users.insert_one(user_doc)

    return jsonify({"msg": "User registered", "user_id": str(result.inserted_id)}), 201

@app.route("/user/<user_id>", methods=["GET"])
def get_user(user_id):
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    user["_id"] = str(user["_id"])
    return jsonify(user)

@app.route("/process", methods=["POST"])
def process_file():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    try:
        # Load file
        df = load_file(file)

        # Run pipeline
        df_clean, merged_cols = preprocess_dataframe(df)
        df_hmpi = compute_hmpi_vectorized(df_clean, merged_cols)

        # Only consider metals actually present in the DataFrame
        valid_metals_for_geo = [m for m in merged_cols if m in df_hmpi.columns]

        # Build GeoJSON features
        features = []
        for _, row in df_hmpi.iterrows():
            metal_conc = {m: row[m] for m in valid_metals_for_geo if pd.notna(row[m])}
            latlon_flag = pd.notna(row.get("Latitude")) and pd.notna(row.get("Longitude"))

            features.append({
                "Sample_ID": row.get("Sample_ID", str(uuid.uuid4())),
                "no_of_metals": len(metal_conc),
                "all_metal_conc": metal_conc,
                "geometry": {
                    "type": "Point",
                    "coordinates": [row.get("Longitude"), row.get("Latitude")]
                },
                "latitudeandlongitudepresent": latlon_flag,
               "HMPI": round(row.get("HMPI", 0), 4) if pd.notna(row.get("HMPI")) else None

            })

        # Save to samples collection
        doc_id = str(uuid.uuid4())
        samples_collection.insert_one({
            "_id": doc_id,
            "GeoJSON": features,
            "created_at": datetime.utcnow()
        })

        return jsonify({"file_id": doc_id, "GeoJSON": features})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/geojson/<file_id>', methods=['GET'])
def get_geojson(file_id):
    doc = samples_collection.find_one({'_id': file_id})
    if not doc:
        return jsonify({'error': 'GeoJSON not found'}), 404
    return jsonify(doc['GeoJSON'])


@app.route('/download/<file_id>', methods=['GET'])
def download_file(file_id):
    doc = samples_collection.find_one({'_id': file_id})
    if not doc:
        return jsonify({'error': 'File not found'}), 404

    df = pd.DataFrame(doc['GeoJSON'])
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    return send_file(
        io.BytesIO(csv_buffer.getvalue().encode()),
        download_name='processed.csv',
        as_attachment=True
    )
@app.route("/export-pdf", methods=["POST"])
def export_pdf():
    data = request.json
    file_ids = data.get("file_ids", [])
    if not file_ids:
        return jsonify({"error": "No file_ids provided"}), 400


    docs = list(samples_collection.find({"_id": {"$in": file_ids}}))
    if not docs:
        return jsonify({"error": "No samples found"}), 404

    # pdf_buffer = generate_pdf_report(docs)

    return send_file(
        as_attachment=True,
        download_name="multi_sample_report.pdf",
        mimetype="application/pdf"
    )

@app.route("/hmpi-charts-csv", methods=["POST"])
def hmpi_charts_csv():
    try:
        data = request.json
        geojson_data = data.get("GeoJSON") or data.get("file_data")
        if not geojson_data:
            return jsonify({"error": "GeoJSON not provided"}), 400

        rows = []
        for sample in geojson_data:
            sample_id = sample.get("Sample_ID", "Unknown")
            conc = sample.get("all_metal_conc", {})
            limits = {metal: STANDARD_LIMITS.get(metal, 0) for metal in conc.keys()}

            row = {"Sample_ID": sample_id}

            # Bar/Radar chart data (rounding to 4 decimals)
            for metal, value in conc.items():
                row[f"{metal}_Actual"] = round(float(value), 4) if value is not None else None
                row[f"{metal}_Limit"] = round(float(limits.get(metal, 0)), 4)

            # Pie chart data (just actuals, rounded)
            row["Pie_Values"] = ",".join([f"{float(v):.4f}" for v in conc.values() if v is not None])

            # Heatmap (round correlations too)
            if len(conc) > 1:
                df = pd.DataFrame([conc])
                corr = df.corr().round(4)  # round correlations to 4 decimals
                row["Heatmap"] = corr.to_csv(index=True, float_format="%.4f")
            else:
                row["Heatmap"] = "1.0000"

            rows.append(row)

        # Convert all rows to DataFrame
        csv_df = pd.DataFrame(rows)

        # Write CSV with 4 decimal places
        csv_buffer = io.StringIO()
        csv_df.to_csv(csv_buffer, index=False, float_format="%.4f")

        return Response(
            csv_buffer.getvalue(),
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment; filename=hmpi_charts.csv"}
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True, port=5000)
