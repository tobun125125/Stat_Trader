export type DailyTradingStat = {
  user_id: string;
  trade_date: string;
  daily_profit: number;
  total_trades: number;
  win_trades: number;
  win_rate_percent: number;
};

export type MonthlyTradingStat = {
  user_id: string;
  trade_month: string; // Format: YYYY-MM
  monthly_profit: number;
  total_trades: number;
  win_trades: number;
  win_rate_percent: number;
};

export type TradingDeal = {
  user_id: string;
  ticket: number;
  symbol: string;
  trade_type: number;
  volume: number;
  commission: number;
  swap: number;
  profit: number;
  net_profit: number;
  close_time: string;
};
