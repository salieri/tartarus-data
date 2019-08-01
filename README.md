# Tartarus Dataset Fetch and Cleanup Scripts

Various scripts for downloading and building datasets.

## Usage

```bash
# Download Gutenberg Library and catalogue
td fetch gutenberg --output /my/download/path

# Download English Wikimedia dump (Wikipedia, Wikiquote, etc.)
td fetch wikimedia --output /my/download/path --lang en --include wiki,wikiquote
```

## Prerequisites

Requires `node` and `wget`.

(Tested on MacOS with `node==10.14.2` and `wget==1.20.3`.)

