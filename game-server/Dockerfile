FROM steamcmd/steamcmd:ubuntu-24

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    screen \
    && rm -rf /var/lib/apt/lists/*

# Create steam user if not exists
RUN id -u steam &>/dev/null || useradd -m -s /bin/bash steam

# Create required directories
RUN mkdir -p /home/steam/Zomboid /home/steam/pzserver \
    && chown -R steam:steam /home/steam

COPY entrypoint.sh /home/steam/entrypoint.sh
COPY configure-server.sh /home/steam/configure-server.sh
RUN chmod +x /home/steam/entrypoint.sh /home/steam/configure-server.sh

EXPOSE 16261/udp 16262/udp

ENTRYPOINT ["/home/steam/entrypoint.sh"]
