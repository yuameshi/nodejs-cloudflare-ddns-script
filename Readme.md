# Node-CF-DDNS
This is a script to change Cloudflare DNS records automatically with your current IP address<br><br>
![](https://img.shields.io/badge/IPv6-Supported-flat.svg?style=flat-square)
![](https://img.shields.io/github/license/Yuameshi/nodejs-cloudflare-ddns-script?style=flat-square)
# Screenshots
## Verbose mode:
![](./screenshot-verbose.jpg)
## Normal output
![](./screenshot-normal.jpg)
## Quiet Output
![](./screenshot-quiet.jpg)
# Installation
```cmd
npm install
```
## Configuration

Make a copy of `config.sample.json`, and edit it with following rules.

```json
{
	"cfKey": "Your Clouflare API Key, get it at https://dash.cloudflare.com/profile/api-tokens",
	"email": "Email you uesd to login to Cloudflare",
	"zoneName": "ZoneName",
	"recordType": "A or AAAA",
	"recordName": "Record Name",
	"TTL": 120
}
```
Then rename it to `config.json`.
## To run it directly
```cmd
npm start
```
## To use it in your project
```javascript
const ddns=require('nodejs-cloudflare-ddns-script');
ddns.updateSync(option); //through sync function
ddns.update(option)
	.then(res => console.log(res)); //through async function
```
The parameter `option` is *optional*.<br>
Parameter `option` is like the followings:
```javascript
option={
	"wanIPv4Site":"https://ipv4.icanhazip.com",	//Refers to the website which used to get your current IPv4 address. Default: https://ipv4.icanhazip.com
												//If you're using IPv6 mode , then this is optional.
	"mode": "verbose|normal|quiet",				//Output mode. Default: "normal"
				 								//if there's multiple IPv6 address, quiet mode will choose the first one automaticly.
	"autoSwitch": true|false,					//If IPv6 mode cannot use , use IPv4 automaticly or it will throw out an exception. Default: false.
	"config.json":{ 							//With this parameter the program will not read file 'config.json'
		"cfKEY": "EXAMPLEEXAMPLEEXAMPLEEXAMPLEEXAMPLEEX",
		"email": "someone@example.com",
		"zoneName": "example.com",
		"recordType": "A",
		"recordName": "ddns.example.com",
		"TTL": 120
	}
}
```
# If there is a better code solution, please send a `Pull Request` or `Issue` to me
Thanks.<br>
:D
