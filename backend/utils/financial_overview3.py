import pandas as pd
import os

def calculate_dashboard3():
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_path = os.path.join(base_path, 'data', 'StockMarket.csv')
    df = pd.read_csv(csv_path)

    df['MarketCap_Bn'] = df['MarketCap'] / 1_000_000_000
    df['PE_to_EPS'] = df['PE_Ratio'] / df['EPS']

    total_marketcap = df['MarketCap_Bn'].sum()
    avg_div_yield = df['DividendYield'].mean()
    median_pe = df['PE_Ratio'].median()
    median_eps = df['EPS'].median()
    avg_ratio = df['PE_to_EPS'].mean()

    return {
        "Total MarketCap (Bn)": round(total_marketcap, 2),
        "Median PE Ratio": round(median_pe, 2),
        "Median EPS": round(median_eps, 2),
        "Avg Dividend Yield (%)": round(avg_div_yield, 2),
        "Avg PE/EPS Ratio": round(avg_ratio, 2)
    }
