export const short = {
  en_US: 'Fast, fully validating Bitcoin Cash node with a built-in indexer',
  es_ES: 'Nodo Bitcoin Cash rápido y validador completo, con indexador',
  de_DE: 'Schneller, voll validierender Bitcoin-Cash-Knoten mit Indexer',
  pl_PL: 'Szybki, w pełni walidujący węzeł Bitcoin Cash z indekserem',
  fr_FR: 'Nœud Bitcoin Cash rapide et validant, avec indexeur intégré',
}

export const long = {
  en_US:
    "Flowee the Hub is a headless Bitcoin Cash full node derived from the original Satoshi codebase, tuned for speed and for far larger blocks than its peers. It relays blocks using thin-block compression, serves a JSON-RPC API for wallets, explorers and mining pools, and speaks Flowee's own compact binary protocol. A bundled indexer builds a transaction lookup database on top of the chain, so clients can query history without scanning blocks themselves.",
  es_ES:
    'Flowee the Hub es un nodo completo de Bitcoin Cash sin interfaz gráfica, derivado del código original de Satoshi y optimizado para la velocidad y para bloques mucho más grandes que los de sus competidores. Retransmite bloques con compresión thin-block, ofrece una API JSON-RPC para monederos, exploradores y pools de minería, y habla el protocolo binario compacto propio de Flowee. Un indexador integrado construye una base de datos de transacciones sobre la cadena, para que los clientes consulten el historial sin recorrer los bloques.',
  de_DE:
    'Flowee the Hub ist ein Bitcoin-Cash-Full-Node ohne grafische Oberfläche, abgeleitet vom ursprünglichen Satoshi-Code und auf Geschwindigkeit sowie auf deutlich größere Blöcke als vergleichbare Software ausgelegt. Er leitet Blöcke mit Thin-Block-Kompression weiter, stellt eine JSON-RPC-Schnittstelle für Wallets, Explorer und Mining-Pools bereit und spricht Flowees eigenes kompaktes Binärprotokoll. Ein mitgelieferter Indexer baut auf der Blockchain eine Transaktions-Suchdatenbank auf, sodass Clients den Verlauf abfragen können, ohne selbst Blöcke zu durchsuchen.',
  pl_PL:
    'Flowee the Hub to pełny węzeł Bitcoin Cash bez interfejsu graficznego, wywodzący się z pierwotnego kodu Satoshiego i zoptymalizowany pod kątem szybkości oraz obsługi znacznie większych bloków niż konkurencyjne implementacje. Przekazuje bloki z kompresją thin-block, udostępnia API JSON-RPC dla portfeli, eksploratorów i kopalni oraz obsługuje własny, zwarty protokół binarny Flowee. Wbudowany indekser buduje na łańcuchu bazę wyszukiwania transakcji, dzięki czemu klienci mogą przeglądać historię bez skanowania bloków.',
  fr_FR:
    "Flowee the Hub est un nœud complet Bitcoin Cash sans interface graphique, dérivé du code original de Satoshi et optimisé pour la vitesse et pour des blocs bien plus grands que ceux de ses concurrents. Il relaie les blocs avec la compression thin-block, expose une API JSON-RPC pour les portefeuilles, les explorateurs et les pools de minage, et parle le protocole binaire compact propre à Flowee. Un indexeur intégré construit une base de recherche de transactions au-dessus de la chaîne, afin que les clients consultent l'historique sans parcourir les blocs.",
}

export const torDescription = {
  en_US:
    'Required to reach .onion peers, and whenever Tor is the only allowed network or all peer traffic is routed through it.',
  es_ES:
    'Necesario para conectar con pares .onion, y siempre que Tor sea la única red permitida o todo el tráfico de pares se enrute a través de él.',
  de_DE:
    'Erforderlich, um .onion-Peers zu erreichen, sowie immer dann, wenn Tor das einzige erlaubte Netzwerk ist oder der gesamte Peer-Verkehr darüber läuft.',
  pl_PL:
    'Wymagany do łączenia się z peerami .onion oraz zawsze, gdy Tor jest jedyną dozwoloną siecią lub cały ruch do peerów jest przez niego kierowany.',
  fr_FR:
    'Requis pour joindre les pairs .onion, ainsi que lorsque Tor est le seul réseau autorisé ou que tout le trafic entre pairs passe par lui.',
}
