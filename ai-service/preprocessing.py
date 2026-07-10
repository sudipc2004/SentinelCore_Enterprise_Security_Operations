import numpy as np

# Map categorical protocols to integers
PROTOCOL_MAP = {"TCP": 0, "UDP": 1, "ICMP": 2, "HTTP": 3, "HTTPS": 4}

# Simple categorical mapping for countries
COUNTRY_MAP = {
    "india": 0, "united states": 1, "china": 2, "germany": 3, "russia": 4, 
    "brazil": 5, "united kingdom": 6, "canada": 7, "france": 8, "australia": 9
}

def extract_features(log_data):
    """
    Converts a single log dict or a list of log dicts into a numpy feature array.
    Features: [protocol_num, port, log(bytes + 1), failedLoginCount, requestFrequency, country_num]
    """
    if isinstance(log_data, dict):
        log_data = [log_data]
        
    features_list = []
    for log in log_data:
        # Protocol
        protocol = str(log.get("protocol", "TCP")).upper()
        proto_val = PROTOCOL_MAP.get(protocol, 0)
        
        # Port
        port = int(log.get("port", 80))
        
        # Bytes
        bytes_val = float(log.get("bytes", 0))
        bytes_log = np.log1p(bytes_val) # log transform to handle large variance
        
        # Failed Logins
        failed_logins = int(log.get("failedLoginCount", 0))
        
        # Request Frequency
        req_freq = int(log.get("requestFrequency", 0))
        
        # Country
        country = str(log.get("country", "Unknown")).lower()
        country_val = COUNTRY_MAP.get(country, -1) # -1 for unknown
        
        features_list.append([proto_val, port, bytes_log, failed_logins, req_freq, country_val])
        
    return np.array(features_list)
