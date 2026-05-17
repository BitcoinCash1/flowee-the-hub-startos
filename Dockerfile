# ── Build Flowee the Hub from source ────────────────────────────────
FROM ubuntu:24.04 AS build

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    build-essential cmake git ca-certificates \
    libssl-dev libboost-all-dev libevent-dev libminiupnpc-dev \
    pkg-config qt6-tools-dev-tools qt6-tools-dev && \
    rm -rf /var/lib/apt/lists/*

ARG FLOWEE_VERSION=2026.05.0
WORKDIR /build
RUN git clone --depth 1 --branch ${FLOWEE_VERSION} \
    https://codeberg.org/Flowee/thehub.git

WORKDIR /build/thehub/build
RUN cmake -Dbuild_apps=ON CMakeLists.txt .. && \
    make -j"$(nproc)" hub hub-cli indexer

# ── Runtime ─────────────────────────────────────────────────────────
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

COPY --from=build /build/thehub/build/hub/hub /usr/local/bin/
COPY --from=build /build/thehub/build/hub/hub-cli /usr/local/bin/
COPY --from=build /build/thehub/build/indexer/indexer /usr/local/bin/
COPY --from=build /usr/lib/x86_64-linux-gnu/libboost_*.so.1.83.0 /usr/lib/x86_64-linux-gnu/

RUN mkdir -p /data
VOLUME /data
EXPOSE 8332 8333 1235

ENTRYPOINT ["hub"]
