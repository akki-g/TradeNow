import json 
from pathlib import Path
from typing import List, Optional
from dataclasses import dataclass

@dataclass
class SearchResult:
    """single search res with simalarity score"""
    ticker: str
    name: str
    exchange: Optional[str] = None
    sector: Optional[str] = None
    distance: int = 0
    match_type: str = "ticker"


def levenshtein_distance(s1: str, s2: str):
    
    s1, s2 = s1.lower(), s2.lower() 
    len1, len2 = len(s1), len(s2)

    matrix = [[0] * (len2+1) for _ in range(len1+1)]
    
    for i in range(len1+1):
        matrix[i][0] = i
    for j in range(len2+1):
        matrix[0][j] = j

    for i in range(1, len1+1):
        for j in range(1, len2+1):
            cost = 0 if s1[i-1] == s2[j-1] else 1

            matrix[i][j] = min(
                matrix[i-1][j] + 1,
                matrix[i][j-1] + 1,
                matrix[i-1][j-1] + cost
            )


    return matrix[len1][len2]


class StockSearchService:
    """
    Fuzzy search for tickers and company names
    uses levenshtein dist for res rankings
    """

    MAX_DIST = 5

    def __init__(self, stocks_file: Optional[Path] = None):
        
        if stocks_file is None:
            stocks_file = Path(__file__).parent.parent / "data" / "popular_stocks.json"

        self.stocks = self._load_stocks(stocks_file)

    
    def _load_stocks(self, file_path: Path) -> List[dict]:
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: Stock file not found at {file_path}")
            return []
        except json.JSONDecodeError as e:
            print(f"Error parsing stock json: {e}")
            return []
        
    def _calculate_ticker_distance(self, query: str, ticker: str) -> int:

        query_lower = query.lower()
        ticker_lower = ticker.lower()

        if query_lower == ticker_lower:
            return 0
        
        if ticker_lower.startswith(query_lower):
            return 0
        
        return levenshtein_distance(query, ticker)
    
    def _calculate_name_distance(self, query: str, name: str) -> int:
        
        query_lower = query.lower()
        name_lower = name.lower()

        if name_lower == query_lower:
            return 0
        
        if query_lower in name_lower:
            return name_lower.index(query_lower)
        
        words = name_lower.split()

        for word in words:
            if word.startswith(query_lower):
                return 0 
            

        min_dist = levenshtein_distance(query, name)

        for word in words:
            word_dist = levenshtein_distance(query, word)
            min_dist = min(word_dist, min_dist)


        return min_dist
    
    def search(self, query:str, limit: int = 10) -> List[SearchResult]:
        
        if not query or len(query.strip()) < 1:
            return []
        
        query = query.strip()
        res = []

        for stock in self.stocks:
            ticker = stock['ticker']
            name = stock['name']

            ticker_dist = self._calculate_ticker_distance(query, ticker)
            name_dist = self._calculate_name_distance(query, name)

            if ticker_dist <= name_dist:
                dist = ticker_dist
                match_type = "ticker"   
            else:
                dist = name_dist
                match_type = "name"

            if dist <= self.MAX_DIST:
                res.append(SearchResult(
                    ticker=ticker,
                    name=name,
                    exchange=stock.get('exchange'),
                    sector=stock.get('sector'),
                    distance=dist,
                    match_type=match_type
                ))

        res.sort(key=lambda x: (x.distance, x.ticker))

        return res[:limit]