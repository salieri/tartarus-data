#!/usr/bin/env bash -e


function requireBin() {
    BIN_PATH=`which "${1}"`

    if [ -z "${BIN_PATH}" ]
    then
        panic "Could not locate '${1}'"
    fi
}


function requireEnv() {
    if [ -z "${!1}" ]
    then
        panic "Missing environment variable '${1}'"
    fi
}


function panic() {
    echo ""
    echo $1
    echo ""

    exit 1
}


function init() {
    if [ -z "${DOWNLOAD_PATH}" ]
    then
        DOWNLOAD_PATH="~/tartarus-downloads"

        export DOWNLOAD_PATH
    fi

    mkdir -p "${DOWNLOAD_PATH}"

    echo "Downloading ${1} to ${DOWNLOAD_PATH}..."
}

