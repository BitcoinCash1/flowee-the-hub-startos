# Build stage: compile the Hub, hub-cli and the indexer from upstream source.
#
# Upstream publishes no release binaries and no official image, so the package
# builds them. Codeberg serves a tarball per commit, so COMMIT — not the tag —
# is what actually pins the source; VERSION is the human-readable tag it came
# from. Both are set in startos/manifest/index.ts; see UPDATING.md.
FROM ubuntu:24.04 AS builder

ARG VERSION
ARG COMMIT

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive \
    apt-get install -y --no-install-recommends \
    build-essential cmake pkg-config ca-certificates curl \
    libssl-dev libevent-dev libminiupnpc-dev \
    libboost-chrono-dev libboost-filesystem-dev libboost-iostreams-dev \
    libboost-program-options-dev libboost-thread-dev \
    qt6-base-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src
RUN curl -fsSL "https://codeberg.org/Flowee/thehub/archive/${COMMIT}.tar.gz" \
    | tar xz --strip-components=1

# build_apps=ON is what pulls in the Hub, hub-cli and the indexer; the default
# build is the Flowee libraries alone.
RUN cmake -S . -B build -Dbuild_apps=ON -DCMAKE_BUILD_TYPE=RelWithDebInfo && \
    cmake --build build --target hub hub-cli indexer -j"$(nproc)" && \
    strip build/hub/hub build/hub/hub-cli build/indexer/indexer

FROM ubuntu:24.04

# e2fsprogs supplies chattr, used to mark the data directory NoCOW on btrfs.
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive \
    apt-get install -y --no-install-recommends \
    ca-certificates e2fsprogs \
    libevent-2.1-7t64 libevent-pthreads-2.1-7t64 libminiupnpc17 libssl3t64 \
    libboost-chrono1.83.0 libboost-filesystem1.83.0 libboost-iostreams1.83.0 \
    libboost-program-options1.83.0 libboost-thread1.83.0 \
    libqt6core6t64 libqt6network6t64 libqt6sql6t64 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /src/build/hub/hub /src/build/hub/hub-cli /usr/local/bin/
COPY --from=builder /src/build/indexer/indexer /usr/local/bin/

ENTRYPOINT ["hub"]
