import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import pickle


# =====================================
# MODEL DEFINITION
# =====================================

class Net(nn.Module):
    def __init__(self, input_dim):
        super(Net, self).__init__()
        self.model = nn.Sequential(
            nn.Linear(input_dim, 12),
            nn.ReLU(),
            nn.Linear(12, 8),
            nn.ReLU(),
            nn.Linear(8, 1)
        )

    def forward(self, x):
        return self.model(x)


# =====================================
# LOAD ARTIFACTS ONCE (FAST)
# =====================================

scaler = pickle.load(open("scaler.pkl", "rb"))
columns = pickle.load(open("columns.pkl", "rb"))

input_dim = len(columns)

model = Net(input_dim)
model.load_state_dict(torch.load("best_model.pth"))
model.eval()


# =====================================
# WALKING FEATURE INTEGRATION
# =====================================

def integrate_walking(user_dict):
    data = user_dict.copy()
    kms = data.pop("kms_walked_daily", None)

    if kms is not None:
        # Calculate daily walking minutes (assuming 6 km/h pace, scaled by intensity factor 3)
        walking_minutes_daily = ((kms / 6.0) * 60.0) / 3.0

        if "exercise_minutes_per_day" in data:
            data["exercise_minutes_per_day"] += walking_minutes_daily
        else:
            data["exercise_minutes_per_day"] = walking_minutes_daily

    return data


# =====================================
# PREPROCESS INPUT
# =====================================

def preprocess_input(user_dict):
    user_dict = integrate_walking(user_dict)
    df = pd.DataFrame([user_dict])
    df = pd.get_dummies(df)

    # add missing columns
    for col in columns:
        if col not in df:
            df[col] = np.nan

    df = df[columns]
    numeric_cols = scaler.feature_names_in_

    # mean imputation for numeric
    for col in numeric_cols:
        if df[col].isna().any():
            df[col] = df[col].fillna(df[col].mean())

    # dummy columns → 0
    df = df.fillna(0)

    # scale numeric
    df[numeric_cols] = scaler.transform(df[numeric_cols])

    return df


# =====================================
# PREDICTION FUNCTION
# =====================================

def predict_wellness(user_dict):
    processed = preprocess_input(user_dict)
    X = torch.tensor(processed.to_numpy(dtype=np.float32))

    with torch.no_grad():
        prediction = model(X)

    score = prediction.numpy().flatten()[0]

    # clamp to valid range
    score = max(0, min(100, score))
    return score


# =====================================
# DEBUG FUNCTION
# =====================================

def get_processed_features(user_dict):
    return preprocess_input(user_dict)


# =====================================
# MAIN TEST
# =====================================

def main():
    user_data = {
        "age": 25,
        "gender": "Male",
        "occupation": "Student",
        "work_mode": "Remote",

        "screen_time_hours": 7,
        "work_screen_hours": 4,
        "leisure_screen_hours": 3,

        "sleep_hours": 7.5,
        "sleep_quality_1_5": 4,

        "stress_level_0_10": 5,
        "productivity_0_100": 70,

        # Updated to daily metrics for the test payload
        "exercise_minutes_per_day": 20.0, 
        "social_hours_per_day": 1.5,      

        "kms_walked_daily": 4
    }

    score = predict_wellness(user_data)

    print("\nPredicted Mental Wellness Score:", score)
    print("\nProcessed Features:\n")
    print(get_processed_features(user_data))


if __name__ == "__main__":
    main()