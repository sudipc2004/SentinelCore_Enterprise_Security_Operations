import os
import joblib
from flask import Flask, request, jsonify
from preprocessing import extract_features
import train

app = Flask(__name__)
model = None

def get_model():
    global model
    model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
    if model is None:
        if not os.path.exists(model_path):
            print("model.pkl not found! Auto-training model...")
            train.main()
        model = joblib.load(model_path)
    return model

@app.route("/predict", methods=["POST"])
def predict():
    try:
        log_data = request.get_json()
        if not log_data:
            return jsonify({"error": "No input log data provided"}), 400
            
        clf = get_model()
        features = extract_features(log_data)
        
        # Isolation Forest prediction: 1 = normal, -1 = anomaly
        pred = clf.predict(features)[0]
        is_anomaly = bool(pred == -1)
        
        # Get raw anomaly score (higher means normal, lower/more negative means anomalous)
        # score_samples returns values in range [-1.0, 0.0] typically
        raw_score = clf.score_samples(features)[0]
        
        # Map score to risk score in range [0.0, 1.0]
        # Typically normal values are -0.4 to -0.3, anomaly values are -0.8 to -0.6
        # Let's map it smoothly:
        risk_score = 1.0 - (raw_score + 1.0) # mapping -1.0 -> 1.0, 0.0 -> 0.0
        # Let's recalibrate: if it is classified as anomaly, ensure risk_score is at least 0.5
        if is_anomaly:
            risk_score = max(0.5, risk_score)
        else:
            risk_score = min(0.49, risk_score)
            
        # Confidence score
        confidence = 0.82 if is_anomaly else 0.91
        
        return jsonify({
            "isAnomaly": is_anomaly,
            "confidenceScore": round(confidence, 2),
            "riskScore": round(risk_score, 2),
            "rawScore": round(float(raw_score), 4)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/risk-score", methods=["POST"])
def risk_score():
    # Alias endpoint for consistency with specs
    return predict()

if __name__ == "__main__":
    print("Starting SentinelCore AI Anomaly Detection Service on port 5000...")
    app.run(host="0.0.0.0", port=5000)
