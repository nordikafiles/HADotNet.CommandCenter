# ASP.NET Core 3.x Runtime
FROM mcr.microsoft.com/dotnet/core/aspnet:3.1.1-buster-slim-arm32v7 AS dotnet

ARG TAG

ENV HACC_VERSION $TAG
ENV ASPNETCORE_URLS http://*:8095
ENV ASPNETCORE_ENVIRONMENT Production
ENV LANG C.UTF-8

EXPOSE 8095

WORKDIR /

RUN apt-get update -yq && apt-get install -yq wget

RUN mkdir /app \
    && cd /app \
    && wget -qO app.tar.gz https://github.com/qJake/HADotNet.CommandCenter/releases/download/v$TAG/HADotNet.CommandCenter-armhf.tar.gz \
    && tar xzf app.tar.gz \
    && rm -rf app.tar.gz

WORKDIR /app

CMD ["dotnet", "HADotNet.CommandCenter.dll"]

# Labels
LABEL \
    io.hass.name="HACC" \
    io.hass.description="Wall-mountable tablet interface for Home Assistant." \
    io.hass.arch="armhf" \
    io.hass.type="addon" \
    io.hass.version=${HACC_VERSION} \
    maintainer="qJake <https://github.com/qJake/>" \
    org.label-schema.description="Wall-mountable tablet interface for Home Assistant." \
    org.label-schema.name="HACC" \
    org.label-schema.schema-version="1.0" \    
    org.label-schema.url="https://github.com/qJake/HADotNet.CommandCenter/" \
    org.label-schema.usage="https://github.com/qJake/HADotNet.CommandCenter/README.md" \
    org.label-schema.vcs-url="https://github.com/qJake/HADotNet.CommandCenter/" \
    org.label-schema.vendor="qJake"
