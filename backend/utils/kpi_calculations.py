import pandas as pd
import numpy as np
import os


def calculate_kpi1():
    """
    Reads StockMarket.csv and calculates key KPIs for Dashboard 1.
    """

    # Get the absolute path to the CSV file
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_path = os.path.join(base_path, 'data', 'StockMarket.csv')

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV file not found at: {csv_path}")

    # Load the dataset
    df = pd.read_csv(csv_path)

    # Ensure all required columns exist
    required_cols = ['Open', 'Close', 'PE_Ratio', 'EPS', 'DividendYield', 'Volume', 'Beta']
    for col in required_cols:
        if col not in df.columns:
            raise KeyError(f"Missing required column '{col}' in StockMarket.csv")

    # Convert numeric columns safely
    for col in required_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')

    # Calculate Daily Percentage Change
    df['Daily_Change_%'] = ((df['Close'] - df['Open']) / df['Open']) * 100

    # Compute KPIs
    avg_beta = df['Beta'].mean()
    avg_daily_change = df['Daily_Change_%'].mean()
    avg_div_yield = df['DividendYield'].mean()
    avg_eps = df['EPS'].mean()
    avg_pe = df['PE_Ratio'].mean()
    avg_volume_m = df['Volume'].mean() / 1_000_000

    # Return final KPI dictionary
    return {
        "Average Beta": round(avg_beta, 2),
        "Avg Daily Change (%)": round(avg_daily_change, 2),
        "Avg Dividend Yield (%)": round(avg_div_yield, 2),
        "Avg EPS": round(avg_eps, 2),
        "Avg PE Ratio": round(avg_pe, 2),
        "Avg Volume (Millions)": round(avg_volume_m, 2)
    }
