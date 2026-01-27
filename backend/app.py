from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import os
import logging

# ---------------------------------------------------------------------
# Flask Configuration
# ---------------------------------------------------------------------
app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')

# ---------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------
BASE_PATH = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_PATH, "data", "StockMarket.csv")

# ---------------------------------------------------------------------
# Global Cache & Data
# ---------------------------------------------------------------------
DATAFRAME = None
CACHE = {}

# ✅ FIX 1: Period → Pandas Frequency mapping
FREQ_MAP = {
    "Y": "Y",
    "Q": "Q-DEC",
    "M": "M"
}

# ---------------------------------------------------------------------
# Load CSV ONCE
# ---------------------------------------------------------------------
def load_data():
    global DATAFRAME
    if DATAFRAME is None:
        df = pd.read_csv(DATA_PATH)
        df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
        df = df.dropna(subset=['Date'])

        # Derive Risk level from Beta
        df['Risk'] = pd.cut(
            df['Beta'],
            bins=[-np.inf, 0.8, 1.2, np.inf],
            labels=['Low', 'Medium', 'High']
        )

        # Add Return (%)
        df['Return'] = ((df['Close'] - df['Open']) / df['Open']) * 100

        DATAFRAME = df

    return DATAFRAME

# ---------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------
def aggregate_data(df, freq):
    grouped = (
        df.groupby(pd.Grouper(key='Date', freq=freq))
        .agg({
            'Return': 'mean',
            'Volume': 'mean',
            'Beta': 'mean',
            'PE_Ratio': 'mean',
            'EPS': 'mean',
            'DividendYield': 'mean',
            'Close': 'mean',
            'MarketCap': 'mean'
        })
        .reset_index()
        .dropna()
    )

    # ✅ FIX 2: Restore ORIGINAL volatility logic (uses df, not grouped)
    grouped['Volatility'] = (
        df['Close']
        .pct_change()
        .rolling(10)
        .std()
        .fillna(0) * 100
    )

    grouped['Sharpe_Ratio'] = grouped['Return'] / (grouped['Volatility'] + 1e-6)
    grouped['Date'] = pd.to_datetime(grouped['Date']).dt.strftime('%Y-%m-%d')

    return grouped

def make_kpis(df):
    return {
        "Avg Return (%)": round(df['Return'].mean(), 2),
        "Volatility (%)": round(df['Return'].std(), 2),
        "Sharpe Ratio": round(df['Return'].mean() / (df['Return'].std() + 1e-6), 2),
        "Avg Volume (M)": round(df['Volume'].mean() / 1_000_000, 2),
        "Beta": round(df['Beta'].mean(), 2)
    }

def safe_json(df):
    df = df.replace([np.inf, -np.inf], np.nan).fillna(0)
    return df.to_dict(orient='records')

# ---------------------------------------------------------------------
# ROUTE: Dashboard 1
# ---------------------------------------------------------------------
@app.route("/api/dashboard1")
def dashboard1():
    try:
        sector = request.args.get("sector")
        risk = request.args.get("risk")
        period = request.args.get("period", "Y")

        app.logger.info(f"Dashboard1 hit with filters: {sector}, {risk}, {period}")

        # Cache key
        cache_key = (sector, risk, period)
        if cache_key in CACHE:
            return jsonify(CACHE[cache_key])

        df = load_data()

        if sector:
            df = df[df["Sector"] == sector]
        if risk:
            df = df[df["Risk"] == risk]

        # ✅ FIX 1 applied here
        freq = FREQ_MAP.get(period, "Y")
        agg = aggregate_data(df, freq)

        kpi = make_kpis(df)

        data = {
            "kpi": kpi,
            "area": safe_json(agg[['Date', 'Return']].rename(columns={'Return': 'value'})),
            "bar": safe_json(agg[['Date', 'Volume']].rename(columns={'Volume': 'value'})),
            "line": safe_json(agg[['Date', 'Volatility']].rename(columns={'Volatility': 'value'})),
            "scatter": safe_json(agg[['Return', 'Volume']])
        }

        CACHE[cache_key] = data
        return jsonify(data)

    except Exception as e:
        logging.exception(e)
        return jsonify({"error": str(e)}), 500

# ---------------------------------------------------------------------
# Root Route
# ---------------------------------------------------------------------
@app.route("/")
def home():
    return jsonify({"message": "Flask Backend Running Successfully 🚀"})

# ---------------------------------------------------------------------
# Run App
# ---------------------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=False, port=5000)
