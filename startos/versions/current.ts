import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2026.5.2:13',
  releaseNotes: {
    en_US: `- Still upstream Flowee the Hub 2026.05.2 (Codeberg has no 2026.05.3). This is packaging revision :13 after 2026.5.2:12.
- Restores BCHN-order RPC/P2P ports per network (chipnet 48332/48333). 2026.5.2:12 pinned every chain to 8332/8333, so Fulcrum, Explorer and mining pools on chipnet could not reach the node.
- Dependents can again read rpcUser/rpcPassword from store.json. Hashed rpcauth and Generate RPC Credential are unchanged.
- Blockchain Sync no longer flickers at the tip: a brief dip in verificationprogress no longer restarts the indexer.
- Fixes the transaction indexer rebuilding its database from scratch on every restart — it was writing outside the service's data volume.
- The node authenticates its own commands with a cookie. Generate RPC Credential still stores hashed rpcauth; store.json also keeps plaintext rpcUser/rpcPassword so dependents that read the volume can autoconfig.
- Tor is now an outbound proxy only, and off by default. The Hub predates v3 onion addresses, so onion inbound and onion-only peering are gone rather than left as settings that could never work.
- Backups no longer copy the block files, the UTXO database or the transaction index; a restore rebuilds them.
- Adds Spanish, German, Polish and French translations.
- Internal updates (start-sdk 2.0).`,
    es_ES: `- Corrige que el indexador de transacciones reconstruyera su base de datos desde cero en cada reinicio: escribía fuera del volumen de datos del servicio.
- El nodo autentica sus propios comandos con una cookie y las credenciales RPC para otras aplicaciones se almacenan cifradas en lugar de en texto plano. Ahora funcionan todas las credenciales que crees; antes solo funcionaba la primera.
- Tor pasa a ser únicamente un proxy de salida y está desactivado por defecto. El Hub es anterior a las direcciones onion v3, así que se han eliminado la entrada por onion y el modo solo-onion en lugar de dejarlos como opciones que nunca podrían funcionar.
- Las copias de seguridad ya no incluyen los archivos de bloques, la base de datos UTXO ni el índice de transacciones; al restaurar se reconstruyen.
- Añade traducciones al español, alemán, polaco y francés.
- Actualizaciones internas (start-sdk 2.0).`,
    de_DE: `- Behebt, dass der Transaktions-Indexer seine Datenbank bei jedem Neustart von Grund auf neu aufbaute — er schrieb außerhalb des Daten-Volumes des Dienstes.
- Der Knoten authentifiziert seine eigenen Befehle über ein Cookie, und RPC-Zugangsdaten für andere Anwendungen werden nun gehasht statt im Klartext gespeichert. Alle angelegten Zugangsdaten funktionieren; zuvor nur die erste.
- Tor dient jetzt ausschließlich als ausgehender Proxy und ist standardmäßig deaktiviert. Der Hub stammt aus der Zeit vor v3-Onion-Adressen, daher entfallen eingehende Onion-Verbindungen und der Nur-Onion-Modus, statt als Einstellungen zu bleiben, die nie funktionieren könnten.
- Sicherungen enthalten weder Blockdateien noch UTXO-Datenbank oder Transaktionsindex; beim Wiederherstellen werden sie neu aufgebaut.
- Ergänzt spanische, deutsche, polnische und französische Übersetzungen.
- Interne Aktualisierungen (start-sdk 2.0).`,
    pl_PL: `- Naprawia odbudowywanie bazy indeksera transakcji od zera przy każdym restarcie — zapisywał ją poza wolumenem danych usługi.
- Węzeł uwierzytelnia własne polecenia plikiem cookie, a dane logowania RPC dla innych aplikacji są przechowywane w postaci skrótu zamiast jawnego tekstu. Działają wszystkie utworzone poświadczenia; wcześniej tylko pierwsze.
- Tor służy teraz wyłącznie jako serwer proxy dla ruchu wychodzącego i jest domyślnie wyłączony. Hub powstał przed adresami onion v3, więc połączenia przychodzące przez onion i tryb tylko-onion zostały usunięte, zamiast pozostawać ustawieniami, które nigdy nie mogłyby działać.
- Kopie zapasowe nie obejmują już plików bloków, bazy UTXO ani indeksu transakcji; przywracanie odbudowuje je.
- Dodaje tłumaczenia na hiszpański, niemiecki, polski i francuski.
- Aktualizacje wewnętrzne (start-sdk 2.0).`,
    fr_FR: `- Corrige la reconstruction complète de la base de l'indexeur de transactions à chaque redémarrage : elle était écrite hors du volume de données du service.
- Le nœud authentifie ses propres commandes par un cookie, et les identifiants RPC destinés à d'autres applications sont désormais stockés hachés plutôt qu'en clair. Tous les identifiants créés fonctionnent ; auparavant, seul le premier fonctionnait.
- Tor n'est plus qu'un proxy sortant, désactivé par défaut. Le Hub est antérieur aux adresses onion v3 : les connexions entrantes par onion et le mode onion uniquement ont donc été retirés plutôt que laissés comme des réglages inopérants.
- Les sauvegardes n'incluent plus les fichiers de blocs, la base UTXO ni l'index des transactions ; une restauration les reconstruit.
- Ajoute les traductions espagnole, allemande, polonaise et française.
- Mises à jour internes (start-sdk 2.0).`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
