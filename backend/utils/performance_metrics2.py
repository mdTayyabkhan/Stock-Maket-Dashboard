import pandas as pd
import os

def calculate_dashboard2():
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_path = os.path.join(base_path, 'data', 'StockMarket.csv')
    df = pd.read_csv(csv_path)

    # Core performance & risk KPIs
    avg_52whigh = df['52W_High'].mean()
    avg_52wlow = df['52W_Low'].mean()
    avg_ownership = df['InstitutionOwnership'].mean()
    avg_float = df['FloatShares'].mean() / 1_000_000
    avg_beta = df['Beta'].mean()

    # Derived ratios
    high_low_ratio = (avg_52whigh / avg_52wlow) if avg_52wlow != 0 else None
    risk_score = round((avg_beta * (1 - avg_ownership / 100)) * 100, 2)

    return {
        "Avg 52W High": round(avg_52whigh, 2),
        "Avg 52W Low": round(avg_52wlow, 2),
        "Avg Institutional Ownership (%)": round(avg_ownership, 2),
        "Avg Float Shares (Millions)": round(avg_float, 2),
        "Avg Beta": round(avg_beta, 2),
        "High/Low Ratio": round(high_low_ratio, 2),
        "Risk Score": risk_score
    }
