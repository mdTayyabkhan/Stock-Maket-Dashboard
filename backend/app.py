from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import os
import logging

# 🔹 ADD: Flask-Caching import
from flask_caching import Cache

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')

# 🔹 ADD: Flask-Caching setup (15 minutes)
cache = Cache(app, config={
    "CACHE_TYPE": "SimpleCache",
    "CACHE_DEFAULT_TIMEOUT": 900
})

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_PATH, "data", "StockMarket.csv")

DATAFRAME = None
CACHE = {}

# ✅ Modern pandas frequencies
FREQ_MAP = {
    "Y": "YE",
    "Q": "QE-DEC",
    "M": "ME"
}

def load_data():
    global DATAFRAME
    if DATAFRAME is None:
        df = pd.read_csv(DATA_PATH)
        df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
        df = df.dropna(subset=['Date'])

        df['Risk'] = pd.cut(
            df['Beta'],
            bins=[-np.inf, 0.8, 1.2, np.inf],
            labels=['Low', 'Medium', 'High']
        )

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
            'PE_Ratio': 'mean',
            'EPS': 'mean',
            'DividendYield': 'mean',
            'Close': 'mean',
            'MarketCap': 'mean'
        })
        .reset_index()
        .dropna()
    )

    grouped['Volatility'] = (
        df['Close']
        .pct_change()
        .rolling(10)
        .std()
        .fillna(0) * 100
    )

    grouped['Sharpe_Ratio'] = grouped['Return'] / (grouped['Volatility'] + 1e-6)
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
    df = df.replace([np.inf, -np.inf], np.nan).fillna(0)
    return df.to_dict(orient='records')

# ---------------- DASHBOARD 1 ----------------
@app.route("/api/dashboard1")
@cache.cached(timeout=900)
def dashboard1():
    sector = request.args.get("sector")
    risk = request.args.get("risk")
    period = request.args.get("period", "Y")

    cache_key = ("d1", sector, risk, period)
    if cache_key in CACHE:
        return jsonify(CACHE[cache_key])

    df = load_data()
    if sector:
        df = df[df["Sector"] == sector]
    if risk:
        df = df[df["Risk"] == risk]

    freq = FREQ_MAP.get(period, "YE")
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

# ---------------- DASHBOARD 2 ----------------
@app.route("/api/dashboard2")
@cache.cached(timeout=900)
def dashboard2():
    sector = request.args.get("sector")
    risk = request.args.get("risk")
    period = request.args.get("period", "Q")

    cache_key = ("d2", sector, risk, period)
    if cache_key in CACHE:
        return jsonify(CACHE[cache_key])

    df = load_data()
    if sector:
        df = df[df["Sector"] == sector]
    if risk:
        df = df[df["Risk"] == risk]

    freq = FREQ_MAP.get(period, "QE-DEC")
    agg = aggregate_data(df, freq)
    kpi = make_kpis(df)

    heatmap = (
        df.groupby("Sector")["Return"]
        .mean()
        .reset_index()
        .rename(columns={"Return": "perf"})
    )

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
        "donut": safe_json(
            df["Sector"]
            .value_counts(normalize=True)
            .mul(100)
            .reset_index()
            .rename(columns={"index": "sector", "Sector": "share"})
        )
    }

    CACHE[cache_key] = data
    return jsonify(data)

# ---------------- DASHBOARD 3 ----------------
@app.route("/api/dashboard3")
@cache.cached(timeout=900)
def dashboard3():
    sector = request.args.get("sector")
    risk = request.args.get("risk")
    period = request.args.get("period", "Q")

    cache_key = ("d3", sector, risk, period)
    if cache_key in CACHE:
        return jsonify(CACHE[cache_key])

    df = load_data()
    if sector:
        df = df[df["Sector"] == sector]
    if risk:
        df = df[df["Risk"] == risk]

    freq = FREQ_MAP.get(period, "QE-DEC")
    agg = aggregate_data(df, freq)
    kpi = make_kpis(df)

    treemap = safe_json(
        df.groupby("Industry")[["MarketCap", "Beta"]]
        .mean()
        .reset_index()
    )

    eps_vs_div = safe_json(
        agg[['Date', 'EPS', 'DividendYield']].fillna(0)
    )

    gauge = {
        "Volatility": round(df["Return"].std(), 2),
        "Sharpe": round(kpi["Sharpe Ratio"], 2)
    }

    data = {
        "kpi": kpi,
        "treemap": treemap,
        "waterfall": eps_vs_div,
        "gauge": gauge
    }

    CACHE[cache_key] = data
    return jsonify(data)



# ---------------- COMBINED DASHBOARD API (OPTIMIZED) ----------------
@app.route("/api/dashboard-all")
def dashboard_all():
    sector = request.args.get("sector")
    risk = request.args.get("risk")
    period = request.args.get("period", "Y")

    cache_key = ("ALL", sector, risk, period)
    if cache_key in CACHE:
        return jsonify(CACHE[cache_key])

    # ✅ LOAD DATA ONCE
    df = load_data()

    if sector:
        df = df[df["Sector"] == sector]
    if risk:
        df = df[df["Risk"] == risk]

    freq = FREQ_MAP.get(period, "YE")
    agg = aggregate_data(df, freq)
    kpi = make_kpis(df)

    response = {
        "dashboard1": {
            "kpi": kpi,
            "area": safe_json(agg[['Date', 'Return']].rename(columns={'Return': 'value'})),
            "bar": safe_json(agg[['Date', 'Volume']].rename(columns={'Volume': 'value'})),
            "line": safe_json(agg[['Date', 'Volatility']].rename(columns={'Volatility': 'value'})),
            "scatter": safe_json(agg[['Return', 'Volume']]),
        },

        "dashboard2": {
            "kpi": kpi,
            "heatmap": safe_json(
                df.groupby("Sector")["Return"]
                .mean()
                .reset_index()
                .rename(columns={"Return": "perf"})
            ),
            "radar": safe_json(pd.DataFrame({
                "metric": ["Volatility", "Sharpe", "Beta", "Return", "Liquidity"],
                "value": [
                    round(df["Return"].std() / 100, 2),
                    round(df["Return"].mean() / (df["Return"].std() + 1e-6), 2),
                    round(df["Beta"].mean(), 2),
                    round(df["Return"].mean() / 100, 2),
                    round(df["Volume"].mean() / df["Volume"].max(), 2),
                ],
            })),
            "bubble": safe_json(
                df.groupby("Sector")[["MarketCap", "Beta"]].mean().reset_index()
            ),
            "donut": safe_json(
                df["Sector"]
                .value_counts(normalize=True)
                .mul(100)
                .reset_index()
                .rename(columns={"index": "sector", "Sector": "share"})
            ),
        },

        "dashboard3": {
            "kpi": kpi,
            "treemap": safe_json(
                df.groupby("Industry")[["MarketCap", "Beta"]].mean().reset_index()
            ),
            "waterfall": safe_json(
                agg[['Date', 'EPS', 'DividendYield']].fillna(0)
            ),
            "gauge": {
                "Volatility": round(df["Return"].std(), 2),
                "Sharpe": round(kpi["Sharpe Ratio"], 2),
            },
        },
    }

    CACHE[cache_key] = response
    return jsonify(response)


if __name__ == "__main__":
    app.run(debug=False, port=5000)
