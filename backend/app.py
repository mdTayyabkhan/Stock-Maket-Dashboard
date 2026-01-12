from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import os
import logging

# -----------------------------------------------------------------------------
# Flask Configuration
# -----------------------------------------------------------------------------
app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')

# -----------------------------------------------------------------------------
# Load and Prepare Data
# -----------------------------------------------------------------------------
BASE_PATH = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_PATH, "data", "StockMarket.csv")

def load_data():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Missing dataset: {DATA_PATH}")

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

    return df

# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------
def aggregate_data(df, freq='Y'):
    """Aggregate data by given frequency: 'M' = monthly, 'Q' = quarterly, 'Y' = yearly"""
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
    grouped['Volatility'] = df['Close'].pct_change().rolling(10).std().fillna(0) * 100
    grouped['Sharpe_Ratio'] = grouped['Return'] / (grouped['Volatility'] + 1e-6)
    grouped['Date'] = pd.to_datetime(grouped['Date']).dt.strftime('%Y-%m-%d')
    return grouped

def make_kpis(df):
    """Compute KPIs"""
    return {
        "Avg Return (%)": round(df['Return'].mean(), 2),
        "Volatility (%)": round(df['Return'].std(), 2),
        "Sharpe Ratio": round((df['Return'].mean() / (df['Return'].std() + 1e-6)), 2),
        "Avg Volume (M)": round(df['Volume'].mean() / 1_000_000, 2),
        "Beta": round(df['Beta'].mean(), 2)
    }

def safe_json(df):
    """Ensure numeric data is JSON serializable"""
    df = df.replace([np.inf, -np.inf], np.nan).fillna(0)
    return df.to_dict(orient='records')

# -----------------------------------------------------------------------------
# ROUTE: Dashboard 1 - Market Summary
# -----------------------------------------------------------------------------
@app.route("/api/dashboard1")
def dashboard1():
    try:
        df = load_data()

        # Filters
        sector = request.args.get("sector")
        risk = request.args.get("risk")
        period = request.args.get("period", "Y")

        if sector:
            df = df[df["Sector"] == sector]
        if risk:
            df = df[df["Risk"] == risk]

        agg = aggregate_data(df, freq=period)
        kpi = make_kpis(df)

        data = {
            "kpi": kpi,
            "area": safe_json(agg[['Date', 'Return']].rename(columns={'Return': 'value'})),
            "bar": safe_json(agg[['Date', 'Volume']].rename(columns={'Volume': 'value'})),
            "line": safe_json(agg[['Date', 'Volatility']].rename(columns={'Volatility': 'value'})),
            "scatter": safe_json(agg[['Return', 'Volume']])
        }
        return jsonify(data)
    except Exception as e:
        logging.exception(e)
        return jsonify({"error": str(e)}), 500

# -----------------------------------------------------------------------------
# ROUTE: Dashboard 2 - Sector & Risk Analytics
# -----------------------------------------------------------------------------
@app.route("/api/dashboard2")
def dashboard2():
    try:
        df = load_data()

        # Filters
        sector = request.args.get("sector")
        risk = request.args.get("risk")
        period = request.args.get("period", "Q")

        if sector:
            df = df[df["Sector"] == sector]
        if risk:
            df = df[df["Risk"] == risk]

        agg = aggregate_data(df, freq=period)
        kpi = make_kpis(df)

        # Heatmap: sector vs avg return
        heatmap = (
            df.groupby("Sector")["Return"]
            .mean()
            .reset_index()
            .rename(columns={"Return": "perf"})
        )

        # Radar: normalized risk-return profile
        radar = pd.DataFrame({
            "metric": ["Volatility", "Sharpe", "Beta", "Return", "Liquidity"],
            "value": [
                round(df["Return"].std() / 100, 2),
                round((df["Return"].mean() / (df["Return"].std() + 1e-6)), 2),
                round(df["Beta"].mean(), 2),
                round(df["Return"].mean() / 100, 2),
                round(df["Volume"].mean() / df["Volume"].max(), 2),
            ],
        })

        data = {
            "kpi": kpi,
            "heatmap": safe_json(heatmap),
            "radar": safe_json(radar),
            "bubble": safe_json(df.groupby("Sector")[["MarketCap", "Beta"]].mean().reset_index()),
            "donut": safe_json(df["Sector"].value_counts(normalize=True).mul(100).reset_index().rename(columns={"index": "sector", "Sector": "share"}))
        }
        return jsonify(data)
    except Exception as e:
        logging.exception(e)
        return jsonify({"error": str(e)}), 500

# -----------------------------------------------------------------------------
# ROUTE: Dashboard 3 - Financial Deep Dive
# -----------------------------------------------------------------------------
@app.route("/api/dashboard3")
def dashboard3():
    try:
        df = load_data()

        # Filters
        sector = request.args.get("sector")
        risk = request.args.get("risk")
        period = request.args.get("period", "Q")

        if sector:
            df = df[df["Sector"] == sector]
        if risk:
            df = df[df["Risk"] == risk]

        agg = aggregate_data(df, freq=period)
        kpi = make_kpis(df)

        # Treemap-style data
        treemap = safe_json(
            df.groupby("Industry")[["MarketCap", "Beta"]].mean().reset_index()
        )

        # Waterfall-style EPS vs Dividend
        eps_vs_div = safe_json(
            agg[['Date', 'EPS', 'DividendYield']].fillna(0)
        )

        # Gauge-like data
        gauge = {"Volatility": round(df["Return"].std(), 2), "Sharpe": round(kpi["Sharpe Ratio"], 2)}

        data = {
            "kpi": kpi,
            "treemap": treemap,
            "waterfall": eps_vs_div,
            "gauge": gauge
        }
        return jsonify(data)
    except Exception as e:
        logging.exception(e)
        return jsonify({"error": str(e)}), 500

# -----------------------------------------------------------------------------
# Root Route
# -----------------------------------------------------------------------------
@app.route("/")
def home():
    return jsonify({"message": "Flask Backend Running Successfully 🚀"})

# -----------------------------------------------------------------------------
# Run App
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    app.run(debug=True, port=5000)
