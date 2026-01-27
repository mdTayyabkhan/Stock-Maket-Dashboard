from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import os
import logging

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_PATH, "data", "StockMarket.csv")

DATAFRAME = None
CACHE = {}

def load_data():
    global DATAFRAME
    if DATAFRAME is None:
        df = pd.read_csv(DATA_PATH)
        df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
        df = df.dropna(subset=['Date'])
        df['Risk'] = pd.cut(df['Beta'], [-np.inf, 0.8, 1.2, np.inf], labels=['Low', 'Medium', 'High'])
        df['Return'] = ((df['Close'] - df['Open']) / df['Open']) * 100
        DATAFRAME = df
    return DATAFRAME

def aggregate_data(df, freq):
    grouped = (
        df.groupby(pd.Grouper(key='Date', freq=freq))
        .agg({
            'Return': 'mean',
            'Volume': 'mean',
            'Beta': 'mean',
            'Close': 'mean',
            'MarketCap': 'mean'
        })
        .reset_index()
        .dropna()
    )
    grouped['Volatility'] = grouped['Close'].pct_change().rolling(10).std().fillna(0) * 100
    grouped['Date'] = grouped['Date'].dt.strftime('%Y-%m-%d')
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
    return df.replace([np.inf, -np.inf], 0).fillna(0).to_dict(orient='records')

@app.route("/api/dashboard1")
def dashboard1():
    sector = request.args.get("sector")
    risk = request.args.get("risk")
    period = request.args.get("period", "Y")

    cache_key = (sector, risk, period)
    if cache_key in CACHE:
        return jsonify(CACHE[cache_key])

    df = load_data()
    if sector:
        df = df[df["Sector"] == sector]
    if risk:
        df = df[df["Risk"] == risk]

    agg = aggregate_data(df, period)
    kpi = make_kpis(df)

    data = {
        "kpi": kpi,
        "area": safe_json(agg[['Date', 'Return']].rename(columns={'Return': 'value'})),
        "bar": safe_json(agg[['Date', 'Volume']].rename(columns={'Volume': 'value'}))
    }

    CACHE[cache_key] = data
    return jsonify(data)

@app.route("/")
def home():
    return jsonify({"message": "Flask Backend Running Successfully 🚀"})

if __name__ == "__main__":
    app.run(debug=False, port=5000)
