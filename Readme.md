# Node-CF-DDNS

This is a script to change Cloudflare DNS records automatically with your current IP address<br><br>
![](https://img.shields.io/badge/IPv6-Supported-flat.svg?style=flat-square)
![](https://img.shields.io/github/license/Yuameshi/nodejs-cloudflare-ddns-script?style=flat-square)

# Installation

```cmd
npm install nodejs-cloudflare-ddns-script --save
```

## Usage

### Notice: `updateSync` is no longer available.

```js
const cfddns = require('nodejs-cloudflare-ddns-script');
const options = {
	"wanIPv4Site": "https://ipv4.icanhazip.com",
		// The website which used to get your current public IPv4 address.
		// Default: https://ipv4.icanhazip.com
	"autoSwitch": false,
		//If you don't have any public IPv6 address
		//program will use IPv4 automaticly or it will throw an exception.
		//Default: false.
	"cfKey": "EXAMPLEEXAMPLEEXAMPLEEXAMPLEEXAMPLEEX",
		//Your Cloudflare API key
	"email": "someone@example.com",
		//Your Cloudflare email
	"zoneName": "example.com",
		//Your Cloudflare zone name
	"recordType": "A",
		//The type of record you want to update.
		//Default: A
	"recordName": "ddns",
		//The name of the record you want to update.
	"TTL": 60
		//The TTL of the record you want to update.
		//Default: 60
}
cfddns.update(options);
	.then((ret) => {
	  console.log(ret);	//true | false
	})
	.catch((err) => {
	  console.error(err);
	});
```

Or create `config.json` under your project folder with the content of parameter `options`.

# If there is a better code solution, please open a `Pull Request` or `Issue` to me

Thanks.

:D
