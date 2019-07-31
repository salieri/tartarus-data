#!/usr/bin/env bash -e

. ../util.sh

init 'Gutenberg Library'
requireBin 'wget'
requireEnv 'DOWNLOAD_PATH'

INDEX_URL='https://www.gutenberg.org/dirs/'

wget -e robots=off --mirror --convert-links --adjust-extension --page-requisites -I /dirs,/files --reject htm,txt --directory-prefix "${DOWNLOAD_PATH}" "${INDEX_URL}"

