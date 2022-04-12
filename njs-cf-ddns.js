const iis = require('is-in-subnet');
const fetch = require('node-fetch');
exports.getV6 = () => {
	return new Promise((resolve) => {
		const netInterfaces = require('os').networkInterfaces();
		const ipv6AddrArray = new Array();
		const ipv6Regexp =
			/^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
		for (const interface in netInterfaces) {
			const currentInterface = netInterfaces[interface];
			currentInterface.forEach((addr) => {
				if (
					ipv6Regexp.test(addr.address) &&
					iis.isPrivate(addr.address) == false &&
					addr.address != '::1'
				) {
					ipv6AddrArray.push(addr.address);
				}
			});
		}
		resolve(ipv6AddrArray);
	});
};
exports.getV4 = (wanIPSite) => {
	return new Promise((resolve) => {
		fetch(wanIPSite || 'https://ipv4.icanhazip.com')
			.then((res) => res.text())
			.then((text) => {
				resolve(text.toString().replace(/[\r\n]/g, ''));
			});
	});
};
exports.update = async (option) => {
	let config = option;
	if (config == undefined) {
		try {
			config = require('./config.json');
		} catch (error) {
			throw new Error('Cannot read configuration!', error);
		}
	}
	let IP;
	if (config.recordType == 'AAAA') {
		IP = (await this.getV6())[0];
	}
	if (
		config.recordType == 'A' ||
		config.recordType == undefined ||
		(config.autoSwitch == true && IP == undefined)
	) {
		IP = await this.getV4(config['wanIPv4Site']);
	}
	if (!IP) {
		throw new Error('Unsupported Record/Cannot get IP!');
	}
	const cfZoneIdJSON = await (
		await fetch(
			`https://api.cloudflare.com/client/v4/zones?name=${config.zoneName}`,
			{
				method: 'GET',
				headers: {
					'X-Auth-Email': config.email,
					'X-Auth-Key': config.cfKey,
				},
			}
		)
	).json();
	if (cfZoneIdJSON.success == false) {
		throw new Error(cfZoneIdJSON.errors[0].message);
	}
	if (!cfZoneIdJSON.result[0]) {
		throw new Error('No such zone!');
	}
	const cfZoneId = cfZoneIdJSON.result[0].id;
	const cfRecordIdJSON = await (
		await fetch(
			`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records?name=${config.recordName
				.concat('.')
				.concat(config.zoneName)}`,
			{
				method: 'GET',
				headers: {
					'X-Auth-Email': config.email,
					'X-Auth-Key': config.cfKey,
				},
			}
		)
	).json();
	if (cfRecordIdJSON.success == false) {
		throw new Error(cfZoneIdJSON.errors[0].message);
	}
	if (!cfRecordIdJSON.result[0]) {
		throw new Error('No such record!');
	}
	const cfRecordId = cfRecordIdJSON.result[0].id;
	const cfDdnsResult = await (
		await fetch(
			`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records/${cfRecordId}`,
			{
				method: 'PUT',
				headers: {
					'X-Auth-Email': config.email,
					'X-Auth-Key': config.cfKey,
					'content-type': 'application/json',
				},
				body: JSON.stringify({
					id: cfZoneId,
					type: config.recordType || 'A',
					name: config.recordName.concat('.').concat(config.zoneName),
					content: IP,
					ttl: config.TTL || 60,
				}),
			}
		)
	).json();
	if (!cfDdnsResult.success) {
		throw new Error('Cannot update DDNS!', cfDdnsResult);
	}
	return cfDdnsResult.success;
};
