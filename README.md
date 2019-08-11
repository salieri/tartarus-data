# Tartarus Dataset Fetch and Cleanup Scripts

Various scripts for downloading and building datasets.

## TL;DR

```bash
# Download English Wikimedia dumps
npx -p @tartarus/data td fetch wikimedia --output /tmp/
```


## Prerequisites

Requires `node` and `wget`.

(Tested on MacOS with `node==10.14.2` and `wget==1.20.3`.)



## Usage

```bash
# Download Project Gutenberg library and catalogue
td fetch gutenberg --output /my/download/path

# Download Wikimedia dumps for English and Spanish language Wikipedia and Wikiquote 
td fetch wikimedia --output /my/download/path \
  --language en \
  --language es \
  --site wiki \
  --site wikiquote
  
# Crawl an API endpoint
td spider --output /my/download/path -- site /my/site/config/file.ts  
```

## Spiders & Crawling

`td spider` collects sequential data from APIs. Both iterative counters (e.g. page number) and
extractable URLs ('next page') are supported.


### `SpiderSiteConfig`

A spider requires a JS/TS configuration file to customize its use.

```ts
import { SpiderJsonData, SpiderHttpNavigator, SpiderStore, SpiderHandle } from '@tartarus/data' 

export default {
  name: 'myexamplesite',
  
  // Determine how the received data will be parsed
  // Supported: SpiderJsonData, SpiderYamlData, SpiderXmlData, SpiderCsvData, SpiderHtmlData, SpiderTextData
  data: new SpiderJsonData(),
  
  // Determine what to query (required)
  navigator: new SpiderHttpNavigator(
    {
      // Base URL
      baseTarget: 'https://api.domain.ext/v1/list',
      
      // Determine how URLs are formed (return null to stop spidering)
      target: (h: SpiderHandle): string | null => `${h.getBaseTarget()}&page=${h.getIteration()}`,
      
      // Optional callback to test whether spidering should be ceased
      isDone: (h: SpiderHandle): boolean => false
    }
  ),
  
  // Determine how responses are stored
  store: new SpiderStore(
    {
      // Number of sub-directories to be used 
      subDirectoryDepth: 3,
      
      // Filename to be used; return null to stop spidering
      filename: (h: SpiderHandle) => `${h.getIteration()}.json`,
    }
  ),
  
  // Request decorator
  request: {
    headers: {
      'User-Agent': 'Tartarus-Data-Spider/1.0 (me@email.ext)'
    },
    
    method: 'get',
    responseEncoding: 'utf8'
  },
  
  // Spider behavior
  behavior: {
    delay: 1500, // Delay between requests in milliseconds
    retryDelay: 15000, // Delay before retrying failed requests
    maxRetries: 15, // Number of times to retry a failed request 
  }
}
``` 


### `SpiderHandle`

The spider interface exposes information of its current status and the latest downloaded page by passing an instance of
`SpiderHandle` class to the callback functions.


#### `SpiderHandle.getResponseData(): SpiderParsedData`

Returns an object that describes the data received in response to a successful query.
The `data` element contains a parsed (JSON) object of the response.
The `raw` element contains a string representation of the response data. 

```ts
interface SpiderParsedData {
  raw: string;
  data: any;
}
```


#### `SpiderHandle.getResponse(): SpiderNavigatorFetchResponse | null`

Returns an object that contains a descriptor of a successful query (`rawResponse`) and the raw data received (`rawData`).
The contents of the `rawResponse` element are dependent on the type of `SpiderNavigator` in use -- for `SpiderHttpNavigator`
it will be an `AxiosResponse<any>`; for `SpiderFileNavigator` it will be set to `null`.  

```ts
interface SpiderNavigatorFetchResponse {
  rawData: string;
  rawResponse: any;
}
```

#### `SpiderHandle.getBaseTarget(): string`

Returns the value passed in `baseTarget` element to the `SpiderNavigator` instance. Typically an URL.

#### `SpiderHandle.getIteration(): number`

Returns the current iteration.

#### `SpiderHandle.getPath(relativeFilename: string): string`

Returns an absolute path to `relativeFilename` in the output directory.

#### `SpiderHandle.getSiteConfig()`: `SpiderSiteConfig`

Returns the contents of the site configuration as described above.

#### `SpiderHandle.getSpider(): SpiderTask`

Returns the `Task` instance of the spider. 


