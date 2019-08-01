# Tartarus Dataset Fetch and Cleanup Scripts

Various scripts for downloading and building datasets.

## TL;DR

```bash
# Download English Wikimedia dumps
npx -p @tartarus/data td fetch wikimedia --output /tmp/
```

## Usage

```bash
# Download Project Gutenberg Library and catalogue
td fetch gutenberg --output /my/download/path

# Download Wikimedia dumps for English and Spanish language Wikipedia and Wikiquote 
td fetch wikimedia --output /my/download/path \
  --language en \
  --language es \
  --site wiki \
  --site wikiquote
```

## Prerequisites

Requires `node` and `wget`.

(Tested on MacOS with `node==10.14.2` and `wget==1.20.3`.)

