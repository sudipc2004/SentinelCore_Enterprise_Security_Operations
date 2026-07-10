import random
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest
from preprocessing import extract_features

def generate_synthetic_data(num_samples=1000):
    data = []
    
    # 90% Normal logs
    num_normal = int(num_samples * 0.90)
    for _ in range(num_normal):
        log = {
            "protocol": random.choice(["TCP", "HTTPS", "HTTP"]),
            "port": random.choice([80, 443, 22, 8080]),
            "bytes": random.randint(100, 20000),
            "failedLoginCount": random.choices([0, 1, 2], weights=[85, 12, 3])[0],
            "requestFrequency": random.randint(1, 15),
            "country": random.choice(["India", "United States", "Germany", "United Kingdom", "Canada"])
        }
        data.append(log)
        
    # 10% Anomalous logs
    num_anom = num_samples - num_normal
    for _ in range(num_anom):
        anomaly_type = random.choice(["brute_force", "port_scan", "exfiltration", "unknown_origin"])
        if anomaly_type == "brute_force":
            log = {
                "protocol": "TCP",
                "port": random.choice([22, 3389]),
                "bytes": random.randint(100, 1500),
                "failedLoginCount": random.randint(5, 20),
                "requestFrequency": random.randint(5, 30),
                "country": random.choice(["Russia", "China", "Brazil"])
            }
        elif anomaly_type == "port_scan":
            log = {
                "protocol": "TCP",
                "port": random.randint(1000, 60000),
                "bytes": random.randint(0, 500),
                "failedLoginCount": 0,
                "requestFrequency": random.randint(100, 500),
                "country": random.choice(["China", "Russia", "Germany"])
            }
        elif anomaly_type == "exfiltration":
            log = {
                "protocol": "HTTPS",
                "port": 443,
                "bytes": random.randint(5000000, 50000000), # 5MB to 50MB
                "failedLoginCount": 0,
                "requestFrequency": random.randint(5, 20),
                "country": random.choice(["Russia", "China", "United States"])
            }
        else: # unknown_origin
            log = {
                "protocol": "ICMP",
                "port": 0,
                "bytes": random.randint(50, 100),
                "failedLoginCount": random.randint(3, 8),
                "requestFrequency": random.randint(120, 200),
                "country": "Unknown"
            }
        data.append(log)
        
    return data

def main():
    print("Generating synthetic security logs...")
    raw_logs = generate_synthetic_data(1200)
    
    print("Preprocessing logs into features...")
    X = extract_features(raw_logs)
    
    print("Training Isolation Forest model...")
    # contamination=0.1 means we expect 10% anomalies
    model = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
    model.fit(X)
    
    print("Saving trained model to model.pkl...")
    joblib.dump(model, "model.pkl")
    print("Model training completed successfully!")

if __name__ == "__main__":
    main()
