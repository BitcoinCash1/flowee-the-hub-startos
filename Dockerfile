FROM ubuntu:24.04

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive \
    apt-get install -y --no-install-recommends \
    ca-certificates libevent-2.1-7t64 libevent-pthreads-2.1-7t64 libminiupnpc17 \
    libboost-filesystem1.83.0 libboost-thread1.83.0 \
    libboost-chrono1.83.0 libboost-program-options1.83.0 \
    libboost-iostreams1.83.0 \
    libssl3t64 curl jq netcat-openbsd e2fsprogs \
    libqt6core6t64 libqt6network6t64 libqt6sql6t64 libqt6dbus6t64 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/bitcoincash1/flowee-hub:latest /build/thehub/build/hub/hub /usr/local/bin/
COPY --from=ghcr.io/bitcoincash1/flowee-hub:latest /build/thehub/build/hub/hub-cli /usr/local/bin/
COPY --from=ghcr.io/bitcoincash1/flowee-hub:latest /build/thehub/build/indexer/indexer /usr/local/bin/

RUN mkdir -p /data
VOLUME /data
EXPOSE 8332 8333 1235

ENTRYPOINT ["hub"]
