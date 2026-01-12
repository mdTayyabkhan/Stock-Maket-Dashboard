import pandas as pd
import os

def calculate_dashboard3():
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_path = os.path.join(base_path, 'data', 'StockMarket.csv')
    df = pd.read_csv(csv_path)

    df['MarketCap_Bn'] = df['MarketCap'] / 1_000_000_000

    total_marketcap = df['MarketCap_Bn'].sum()
    median_pe = df['PE_Ratio'].median()
    median_eps = df['EPS'].median()
    avg_div_yield = df['DividendYield'].mean()
    avg_volume = df['Volume'].mean() / 1_000_000

    return {
        "Total MarketCap (Bn)": round(total_marketcap, 2),
        "Median PE Ratio": round(median_pe, 2),
        "Median EPS": round(median_eps, 2),
        "Avg Dividend Yield (%)": round(avg_div_yield, 2),
        "Avg Volume (Millions)": round(avg_volume, 2)
    }
