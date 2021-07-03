const request = require("sync-request");
const iis = require("is-in-subnet");
/**********************************************/
exports.getV6 = (option) => {
	if (option["mode"].match("normal") || option["mode"].match("quiet")) {
		console.log = () => {};
	}
	var netInterfaces = require("os").networkInterfaces();
	var IPs = new Array();
	console.log(
		Object.keys(netInterfaces).length +
			" network adapters found : " +
			Object.keys(netInterfaces).toString()
	);
	for (let i in Object.keys(netInterfaces)) {
		var temp = netInterfaces[Object.keys(netInterfaces)[i]];
		console.log(
			"	Checking network adapter " + Object.keys(netInterfaces)[i]
		);
		console.log(
			"	Found " +
				Object.keys(temp).length +
				" IP on " +
				Object.keys(netInterfaces)[i]
		);
		for (let j in Object.keys(temp)) {
			console.log(
				"		Checking IP " +
					temp[j].address +
					" of " +
					Object.keys(netInterfaces)[j]
			);
			if (
				iis.isIPv6(temp[j].address) &&
				iis.isPrivate(temp[j].address) == false &&
				temp[j].address != "::1"
			) {
				IPs.push(temp[j].address);
			} else {
				console.log(
					"		IP " +
						temp[j].address +
						" is NOT an IPv6 address or a public address"
				);
			}
		}
	}
	if (IPs.length < 1) {
		console.log("Error: cannot find any public IPv6 address!");
		if (option["autoSwitch"]) {
			IP = request("GET", "https://ipv4.icanhazip.com")
				.getBody("UTF-8")
				.replace("\n", "");
		} else {
			if (
				require("readline-sync").question("Use IPv4 Mode?[y/N]") == "y"
			) {
			}
		}
	}
	if (IPs.length > 1) {
		if (option["mode"].match("quiet")) {
			i = 0;
		} else {
			console.warn(IPs);
			i = require("readline-sync").question(
				"There are multiple public IPs found, which one to choose:"
			);
		}
		IP = IPs[i - 1];
	}
	return IP;
};
/**********************************************/
exports.getV4 = () => {
	return request("GET", "https://ipv4.icanhazip.com")
		.getBody("UTF-8")
		.replace("\n", "");
};

/**********************************************/
exports.update = (option) => {
	if (!option["mode"] == "verbose") {
		console.log = () => {};
	}
	if (option["mode"] == "quiet") {
		console.warn = () => {};
	}
	if (!option["config.json"]) {
		console.log("Reading configuration file.");
		config = JSON.parse(require("fs-extra").readFileSync("./config.json"));
	} else {
		console.log("Parameter 'config.json' is existed.");
		config = option["config.json"];
	}
	if (option["wanIPv4Addr"]) {
		wanIPv4Site = option["wanIPv4Addr"];
	} else {
		wanIPv4Site = "https://ipv4.icanhazip.com";
	}
	if (config.recordType == "A") {
		IP = this.getV4();
	}
	if (config.recordType == "AAAA") {
		IP = this.getV6(option);
	}
	console.warn("Current IP:" + IP);
	if (!IP) {
		console.log("Unsupported Record/Cannot get IP!");
		throw "Unsupported Record/Cannot get IP!";
	}
	console.log("Updating zone identifier.");
	cfZoneID = JSON.parse(
		request(
			"GET",
			`https://api.cloudflare.com/client/v4/zones?name=${config.zoneName}`,
			{
				headers: {
					"X-Auth-Key": config.cfKey,
					"X-Auth-Email": config.email,
				},
				retry: true,
			}
		).getBody("UTF-8")
	).result[0].id;
	console.log("Zone Identifier:" + cfZoneID);
	console.log("Updating record identifier.");
	cfRecordId = JSON.parse(
		request(
			"GET",
			`https://api.cloudflare.com/client/v4/zones/${cfZoneID}/dns_records?name=${config.recordName}`,
			{
				headers: {
					"X-Auth-Key": config.cfKey,
					"X-Auth-Email": config.email,
				},
				retry: true,
			}
		).getBody("UTF-8")
	).result[0].id;
	console.log("Record Identifier:" + cfRecordId);
	console.warn("Updating DNS Record to " + IP);

	cfDdnsResult = JSON.parse(
		request(
			"PUT",
			`https://api.cloudflare.com/client/v4/zones/${cfZoneID}/dns_records/${cfRecordId}`,
			{
				headers: {
					"X-Auth-Key": config.cfKey,
					"X-Auth-Email": config.email,
				},
				body: `{   
        "id":"${cfZoneID}",
        "type":"${config.recordType}",
        "name":"${config.recordName}",
        "content":"${IP}",
        "ttl":${config.TTL}
        }`,
				retry: true,
			}
		).getBody("UTF-8")
	).success;
	if (cfDdnsResult) {
		console.warn("Updated Successfully");
	}
	return cfDdnsResult;
};
