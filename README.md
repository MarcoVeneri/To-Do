# To Do

PWA personale e responsive per note rapide da fare, sincronizzate tra iPhone, iPad e PC.

## Funzioni

- nota libera
- urgenza opzionale con solo pallino rosso
- tap sul cerchio a destra per completare
- sezione **Completate**
- ripristino di una nota completata
- **Elimina completate** con conferma
- sincronizzazione Supabase
- cache locale per visualizzazione offline
- installabile come PWA

## Sicurezza

Il frontend usa una chiave Supabase publishable, che è pubblica per definizione. I dati To Do sono salvati nello schema privato `todo_private` e sono protetti da RLS.

Le funzioni RPC richiedono il token privato personale già utilizzato dalla PWA Lista Spesa. Il token non è salvato nel repository: resta nel `localStorage` del dispositivo.

URL previsto: `https://marcoveneri.github.io/To-Do/`
