# 📊 Stats & Compliance — LegalShuffleCam

## 1) Logged data
- **Connections** → `/var/log/legalshufflecam/connections.log`  
  One line per event (CSV-safe):

    ISO8601,"EVENT","IP","SOCKET_ID",{"ua":"...","country":"FR"}

- `EVENT` = CONNECT / DISCONNECT

## 2) Basic metrics *(if enabled)*
- **Metrics log** → `/var/log/legalshufflecam/metrics.log`  
  Format:

    ISO8601 | active=12 | pairs=4 | joins=132

## 3) Legal notice (France)
- IP & country storage required for legal compliance (LCEN, Code pénal).
- Data retention: 1 year minimum.
