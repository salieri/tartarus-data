#!/usr/bin/env bash -e

# Env: DOWNLOAD_PATH

. ../util.sh

init 'Gutenberg Catalog Files'
requireBin 'wget'
requireEnv 'DOWNLOAD_PATH'

CATALOG_URL='http://www.gutenberg.org/cache/epub/feeds/rdf-files.tar.bz2'

wget -O "${DOWNLOAD_PATH}/gutenberg-catalog-rdf.tar.bz2"


