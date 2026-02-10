import { useState, useEffect, useRef, useCallback } from "react";
import { fetchIndicatorInfo } from "../services/api";
import type { IndicatorDetail } from "../types/indicator";
import type { APIError } from "../types/stock";

interface UseIndicatorInfoResult {
    data: IndicatorDetail | null;
    loading: boolean;
    error: APIError | null;
    refetch: () => Promise<void>;
}

