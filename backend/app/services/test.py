import yfinance as yf


ticker = 'AAPL'

info = yf.Ticker(ticker).info

for k,v in info:
    print(k) 